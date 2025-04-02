const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ mesagge: 'Відсутній токен авторизації' })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret')

        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ mesagge: 'Токен недійсний' })
    }
};