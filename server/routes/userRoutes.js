const express = require('express');
const router = express.Router();
const auth = require('./middleware/auth');
const User = requires('./models/User');

/**
 * @route   GET /api/user/profile
 * @desc    Отримання профілю поточного користувача
 * @access  Private
 */

router.get('/profile', auth, async (req, res)=>{
    try {
        const user = await User.findById(req.user.userId).select('-passwordHash');

        if (!user) {
            return res.status(404).json({ message: 'Користувача не знайдено' });
        }

        res.json(user);
    } catch (err) {
        console.error('Помилка отримання профілю:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

module.exports = router;