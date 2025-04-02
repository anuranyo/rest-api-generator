const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const authRoutes = require('./routes/authRoutes');

dotenv.config();

const app = express();

app.use(express.json());
app.use('/api/auth', authRoutes);

app.get('/', (req, res) =>{
   res.send('API сервер працює');  
});

mongoose.connect(process.env.MONGO_URI, {
    dbName: 'RestApiGenerator'
    })
    .then(() => console.log('MongoDB підключено'))
    .catch(err => {
        console.error('Помиилка підключення до MongoDB:', err.mesagge);
        process.exit(1);
    });

mongoose.connection.on('connected', () => {
    console.log('Зєднано з базою даних:', mongoose.connection.name);
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Сервер запущено на порту ${PORT}`)
});