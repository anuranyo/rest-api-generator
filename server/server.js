const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const schemaRoutes = require('./routes/schemaRoutes');
const generatorRoutes = require('./routes/generatorRoutes');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
//app.use('/api/projects', projectRoutes);
app.use('/api/schemas', schemaRoutes);
//app.use('/api/generator', generatorRoutes);

app.get('/', (req, res) =>{
   res.send('API Generator Server is running');  
});

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: 'RestApiGenerator',
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
            // useCreateIndex: true,
            // useFindAndModify: false
        })
        .then(() => console.log('MongoDB connected successfully!'))
        .catch(err => {
            console.error('Failed to connect to MongoDB:', err.message);
            console.error('Details:', err);
        });
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err.message);
        process.exit(1);
    }
};

connectDB();

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log(`Сервер запущено на порту ${PORT}`)
});