const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const dotenv = require('dotenv');
dotenv.config();
console.log('JWT_SECRET:', process.env.JWT_SECRET);

const createToken = (user) => {
    return jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
    );
};

/**
 * @route   POST /api/auth/register
 * @desc    Реєстрація нового користувача
 * @access  Public
 */

router.post('/register' ,async (req, res) =>{
    try {
        const { email, password, nickname } = req.body;

        const userExist = await User.findOne({ email });
        if (userExist) {
            return res.status(400).json({ message: 'Користувач з таким email вже існує'})
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = new User({
            email,
            nickname,
            passwordHash
        });

        await newUser.save();

        const token = createToken(newUser);

        res.status(201).json({
            message: 'Користувач успішно зареєстрований',
            token,
            user: {
                id: newUser._id,
                email: newUser.email,
                nickname: newUser.nickname
            },
        });
    } catch (error){
        console.error('Помилка реєстрації', error);
        res.status(500).json({ message: 'Помилка сервера при реєстрації'});
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    Авторизація користувача
 * @access  Public
 */

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Невірний email або пароль'})
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Невірний email або пароль'})
        }

        const token = createToken(user);

        res.json({
            message: 'Авторизація успішна',
            token,
            user: {
                id: user.id,
                email: user.email,
                nickname: user.nickname
            }
        });
    } catch (error){
        console.error('Помилка входу'), error;
        res.status(500).json({ message: 'Помилка сервера при авторизації'});
    }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Запит на відновлення паролю
 * @access  Public
 */

router.post('/forgot-password', async (req,res) => {
    try{
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Користувача з таким email не знайдено'})
        }

        res.json({
            mesagge: 'Інструкції з відновлення паролю надіслані на вашу електронну пошту',
            resetToken: 'test-reset-token'
        }); 
    } catch (error) {
        console.error('Помилка запиту відновлення паролю'), error;
        res.status(500).json({ message: 'Помилка сервера при запиті відновлення паролю'});
    }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Скидання паролю
 * @access  Public
 */

router.post('/reset-password', async (req, res) => {
    try {
        const { email, newPassword, resetToken } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Користувача з таким email не знайдено'})
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);

        user.passwordHash = passwordHash;
        await user.save();

        res.json({ mesagge: 'Пароль успішно змінено' })
    } catch (error) {
        console.error('Помилка скидання паролю'), error;
        res.status(500).json({ message: 'Помилка сервера при скиданні паролю'});
    }
});

module.exports = router;