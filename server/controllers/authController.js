const dotenv = require('dotenv');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const crypto = require('crypto');
const { sendEmail } = require('../services/emailService');

dotenv.config();

const createToken = (user) => {
    return jwt.sign(
      { userId: user._id, email: user.email, subscription: user.subscription },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  };

/**
 * @route   POST /api/auth/register
 * @desc    Реєстрація нового користувача
 * @access  Public
 */
const registration = async (req, res) => {
    console.log('Registration started');
    console.log('Request body:', JSON.stringify(req.body));
    
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            console.log('Validation errors:', errors.array());
            return res.status(400).json({ errors: errors.array() });
        }
        
        const { email, password, nickname } = req.body;
        console.log('Extracted data:', { email, nickname, passwordLength: password?.length });

        console.log('Starting User.findOne query...');
        const startTime = Date.now();
        
        let user = await User.findOne({ email });
        
        console.log(`User.findOne completed in ${Date.now() - startTime}ms`);
        console.log('User found:', user ? 'Yes' : 'No');
        
        if (user) {
            return res.status(400).json({ message: 'Користувач з таким email вже існує' });
        }
    
        console.log('Creating password hash...');
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
    
        console.log('Creating new user...');
        user = new User({
            email,
            passwordHash,
            nickname,
            subscription: 'free' 
        });
    
        console.log('Saving user...');
        await user.save();
        console.log('User saved successfully');
    
        const token = createToken(user);
    
        res.status(201).json({
            message: 'Користувач успішно зареєстрований',
            token,
            user: {
                id: user._id,
                email: user.email,
                nickname: user.nickname,
                subscription: user.subscription
            },
        });
    } catch (error){
        console.error('Помилка реєстрації:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ message: 'Помилка сервера: ' + error.message });
    }
}
    

/**
 * @route   POST /api/auth/login
 * @desc    Авторизація користувача
 * @access  Public
 */
const login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
            
        const { email, password } = req.body;
    
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Невірні облікові дані'})
        }
    
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Невірні облікові дані'})
        }
    
        const token = createToken(user);
    
        res.json({
            message: 'Авторизація успішна',
            token,
            user: {
                id: user.id,
                email: user.email,
                nickname: user.nickname,
                subscription: user.subscription
            }
        });
    } catch (error){
        console.error('Помилка авторизації'), error;
        res.status(500).json({ message: 'Помилка сервера' + error});
    }
}

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Запит на відновлення паролю
 * @access  Public
 */
const forgotPassword = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { email } = req.body;
      
      const user = await User.findOne({ email });
      if (!user) {
        return res.json({ message: 'Якщо обліковий запис існує, інструкція з відновлення паролю була надіслана на email' });
      }
      
      const resetToken = crypto.randomBytes(20).toString('hex');
      const resetTokenHash = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
      
      user.resetPasswordToken = resetTokenHash;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 година
      await user.save();
      
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      
      try {
        await sendEmail({
          to: user.email,
          subject: 'Відновлення паролю',
          text: `Ви отримали цей лист, тому що ви (або хтось інший) запросили скидання паролю для вашого облікового запису.
  
  Будь ласка, перейдіть за наступним посиланням або вставте його у свій браузер для завершення процесу:
  
  ${resetUrl}
  
  Якщо ви не запитували це, проігноруйте цей лист, і ваш пароль залишиться незмінним.`,
          html: `
          <p>Ви отримали цей лист, тому що ви (або хтось інший) запросили скидання паролю для вашого облікового запису.</p>
          <p>Будь ласка, <a href="${resetUrl}">перейдіть за цим посиланням</a> для встановлення нового паролю.</p>
          <p>Якщо ви не запитували це, проігноруйте цей лист, і ваш пароль залишиться незмінним.</p>
          `
        });
        
        res.json({ message: 'Інструкція з відновлення паролю надіслана на ваш email' });
      } catch (error) {
        console.error('Помилка при відправці електронної пошти:', error);
        
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        
        res.status(500).json({ message: 'Не вдалося відправити електронний лист для відновлення паролю' });
      }
    } catch (error) {
      console.error('Помилка запиту на скидання паролю:', error);
      res.status(500).json({ message: 'Помилка сервера' });
    }
};
  
/**
 * @route   POST /api/auth/reset-password
 * @desc    Скидання паролю
 * @access  Public
 */
const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { token, password } = req.body;
    
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Токен для скидання паролю недійсний або закінчився' });
    }
    
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(password, salt);
    
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();
    
    try {
      await sendEmail({
        to: user.email,
        subject: 'Пароль змінено успішно',
        text: `Це підтвердження того, що пароль для вашого облікового запису ${user.email} був успішно змінений.`,
        html: `<p>Це підтвердження того, що пароль для вашого облікового запису ${user.email} був успішно змінений.</p>`
      });
    } catch (error) {
      console.error('Помилка при відправці електронної пошти підтвердження:', error);
    }
    
    res.json({ message: 'Пароль успішно змінено' });
  } catch (error) {
    console.error('Помилка скидання паролю:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};  

/**
 * @route   GET /api/auth/me
 * @desc    Отримання даних поточного користувача
 * @access  Private
 */
const getUser = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'Немає токену авторизації' });
        }
    
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
          
            const user = await User.findById(decoded.userId).select('-passwordHash -resetPasswordToken -resetPasswordExpires');
          
            if (!user) {
                return res.status(404).json({ message: 'Користувача не знайдено' });
            }
    
            res.json({ user });
        } catch (error) {
            return res.status(401).json({ message: 'Токен недійсний' });
        }
    } catch (error) {
        console.error('Помилка отримання даних користувача:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
}


module.exports = {
    registration,
    login,
    forgotPassword,
    resetPassword,
    getUser
};