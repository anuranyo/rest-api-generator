const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'Відсутній токен авторизації' })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        req.user = decoded;
        next();
    } catch (err) {
        console.error('Помилка при верифікації токена:', err.message);
        res.status(401).json({ message: 'Токен недійсний' });
    }
};