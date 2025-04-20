const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middlewares
app.use(cors({
  origin: ['https://restapigenerator.space', 'https://www.restapigenerator.space', 'http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.options('*', cors());

// Health check route
app.get('/', (req, res) => {
  res.status(200).send('API Generator Server is running');
});

// Import routes with absolute paths
const authRoutes = require(path.join(__dirname, './routes/authRoutes'));
// const projectRoutes = require(path.join(__dirname, './routes/projectRoutes'));
// const schemaRoutes = require(path.join(__dirname, './routes/schemaRoutes'));
// const generatorRoutes = require(path.join(__dirname, './routes/generatorRoutes'));

// Apply routes
app.use('/api/auth', authRoutes);
// app.use('/api/projects', projectRoutes);
// app.use('/api/schemas', schemaRoutes);
// app.use('/api/generator', generatorRoutes);

// MongoDB connection state
let isConnected = false;

// MongoDB connection function
const connectDB = async () => {
  if (isConnected) return;
  
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: 'RestApiGenerator'
    });
    
    isConnected = true;
    console.log('MongoDB connected successfully!');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    isConnected = false;
  }
};

// Connect to MongoDB before handling requests
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

// Start server if not in production (serverless) environment
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    connectDB();
  });
}

// Export the Express app for serverless functions
module.exports = app;