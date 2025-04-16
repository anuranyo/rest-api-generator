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

// Enhanced CORS configuration for better cross-origin support
app.use(cors({
  origin: '*', // Allow all origins for testing
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/schemas', schemaRoutes);
app.use('/api/generator', generatorRoutes);

// Health check route
app.get('/', (req, res) => {
   res.send('API Generator Server is running');  
});

// Track connection state
let isConnected = false;

// MongoDB connection function
const connectDB = async () => {
    if (isConnected) return;
    
    try {
        const connection = await mongoose.connect(process.env.MONGO_URI, {
            dbName: 'RestApiGenerator'
        });
        
        isConnected = true;
        console.log('MongoDB connected successfully!');
        return connection;
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err.message);
        console.error('Details:', err);
        return null;
    }
};

// Connect to DB before each request in serverless environment
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

// Only start server if running locally (not in Vercel serverless)
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => {
        console.log(`Server started on port ${PORT}`);
        connectDB();
    });
}

// Export for serverless functions
module.exports = app;