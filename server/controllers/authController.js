const dotenv = require('dotenv');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

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

}

/**
 * @route   POST /api/auth/reset-password
 * @desc    Скидання паролю
 * @access  Public
 */

const resetPassword = async (req, res) => {

}


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