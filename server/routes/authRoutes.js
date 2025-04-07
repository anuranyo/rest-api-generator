const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const crypto = require('crypto');
const { check, validationResult} = require('express-validator');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    }
})

const createToken = (user) => {
    return jwt.sign(
        { userId: user._id, email: user.email, subscription: user.subscription },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
};

const registerValidation = [
    check('email', 'Введіть коректний email').isEmail(),
    check('password', 'Пароль повинен містити мінімум 6 символів').isLength({ min: 6 })
  ];

const loginValidation = [
    check('email', 'Введіть коректний email').isEmail(),
    check('password', 'Пароль не може бути порожнім').exists()
  ];
  
  const resetRequestValidation = [
    check('email', 'Введіть коректний email').isEmail()
  ];
  
  const resetPasswordValidation = [
    check('token', 'Токен відновлення паролю обов\'язковий').exists(),
    check('password', 'Пароль повинен містити мінімум 6 символів').isLength({ min: 6 })
  ];

/**
 * @route   POST /api/auth/register
 * @desc    Реєстрація нового користувача
 * @access  Public
 */

router.post('/register', registerValidation, async (req, res) =>{
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const { email, password, nickname } = req.body;

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'Користувач з таким email вже існує' });
            }

            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            user = new User({
            email,
            passwordHash,
            nickname,
            subscription: 'free' 
            });

            await user.save();

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
        console.error('Помилка реєстрації', error);
        res.status(500).json({ message: 'Помилка сервера'});
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    Авторизація користувача
 * @access  Public
 */

router.post('/login', loginValidation, async (req, res) => {
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
        res.status(500).json({ message: 'Помилка сервера'});
    }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Запит на відновлення паролю
 * @access  Public
 */

router.post('/forgot-password', resetRequestValidation, async (req, res) => {
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
      user.resetPasswordExpires = Date.now() + 3600000; 
      await user.save();
  
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  
      const mailOptions = {
        to: user.email,
        from: process.env.EMAIL_FROM,
        subject: 'Відновлення паролю',
        text: `Ви отримали цей лист, тому що ви (або хтось інший) запросили скидання паролю для вашого облікового запису.\n\n
               Будь ласка, перейдіть за наступним посиланням або вставте його у свій браузер для завершення процесу:\n\n
               ${resetUrl}\n\n
               Якщо ви не запитували це, проігноруйте цей лист, і ваш пароль залишиться незмінним.\n`
      };
  
      try {
        await transporter.sendMail(mailOptions);
        res.json({ message: 'Інструкція з відновлення паролю надіслана на ваш email' });
      } catch (error) {
        console.error('Помилка при відправці електронної пошти:', error);
        res.status(500).json({ message: 'Не вдалося відправити електронний лист для відновлення паролю' });
      }
    } catch (error) {
      console.error('Помилка запиту на скидання паролю:', error);
      res.status(500).json({ message: 'Помилка сервера' });
    }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Скидання паролю
 * @access  Public
 */

router.post('/reset-password', resetPasswordValidation, async (req, res) => {
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
  
      const mailOptions = {
        to: user.email,
        from: process.env.EMAIL_FROM,
        subject: 'Пароль змінено успішно',
        text: `Це підтвердження того, що пароль для вашого облікового запису ${user.email} був успішно змінений.\n`
      };
  
      try {
        await transporter.sendMail(mailOptions);
      } catch (error) {
        console.error('Помилка при відправці електронної пошти підтвердження:', error);
      }
  
      res.json({ message: 'Пароль успішно змінено' });
    } catch (error) {
      console.error('Помилка скидання паролю:', error);
      res.status(500).json({ message: 'Помилка сервера' });
    }
  });

/**
 * @route   GET /api/auth/me
 * @desc    Отримання даних поточного користувача
 * @access  Private
 */
router.get('/me', async (req, res) => {
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
});
  
  module.exports = router;