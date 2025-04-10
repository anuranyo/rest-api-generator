const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { check, validationResult } = require('express-validator');

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

router.post(
  '/register', 
  registerValidation, 
  authController.registration
);

/**
 * @route   POST /api/auth/login
 * @desc    Авторизація користувача
 * @access  Public
 */

router.post(
  '/login',
  loginValidation,
  authController.login
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Запит на відновлення паролю
 * @access  Public
 */

router.post(
  '/forgot-password', 
  resetRequestValidation, 
  authController.forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Скидання паролю
 * @access  Public
 */

router.post(
  '/reset-password', 
  resetPasswordValidation, 
  authController.resetPassword
);

/**
 * @route   GET /api/auth/me
 * @desc    Отримання даних поточного користувача
 * @access  Private
 */

router.get(
  '/me', 
  authController.getUser
);

module.exports = router;