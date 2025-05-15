const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = ['https://restapigenerator.space', 'https://www.restapigenerator.space', 'http://localhost:3000', 'http://localhost:5174'];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.get('/', (req, res) =>{
   res.send('API Generator Server is running');  
});

app.get('/', (req, res) => {
  res.status(200).send('API Generator Server is running');
});

const authRoutes = require(path.join(__dirname, './routes/authRoutes'));
const projectRoutes = require(path.join(__dirname, './routes/projectRoutes'));
const schemaRoutes = require(path.join(__dirname, './routes/schemaRoutes'));
const generatorRoutes = require(path.join(__dirname, './routes/generatorRoutes'));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/schemas', schemaRoutes);
app.use('/api/generator', generatorRoutes);

app.options('*', (req, res) => {
  res.status(200).end();
});

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: 'RestApiGenerator',
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000, 
    });
    
    isConnected = true;
    console.log('MongoDB connected successfully!');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    isConnected = false;
  }
};

app.use(async (req, res, next) => {
  try {
    if (!isConnected) {
      await connectDB();
    }
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    connectDB();
  });
}

module.exports = app;