const mongoose = require('mongoose');
const dotenv = require('dotenv');

const User = require('./models/User');
const SchemaFile = require('./models/SchemaFile');
const ApiInstance = require('./models/ApiInstance');
const MockData = require('./models/MockData');
const Export = require('./models/Export');
const Project = require('./models/Project')

dotenv.config();

const initializeDatabase = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: 'RestApiGenerator', 
            serverSelectionTimeoutMS: 5000,
        });
        console.log('MongoDB connected...');

        console.log('Initializing empty collections for RestApiGenerator...');
        await User.init();
        await SchemaFile.init();
        await ApiInstance.init();
        await MockData.init();
        await Export.init();
        await Project.init();
        console.log('Empty database structure for viyarSchedule created successfully!');

        await mongoose.disconnect();
        console.log('MongoDB connection closed.');
    } catch (err) {
        console.error('Failed to initialize database:', err.message);
        console.error('Error details:', err);
        if (err.name === 'MongoNetworkError') {
            console.error('Network-related error. Please check your network connection.');
        } else if (err.name === 'MongoParseError') {
            console.error('URI parsing error. Please check your MongoDB URI.');
        } else if (err.name === 'MongoTimeoutError') {
            console.error('Connection timeout. The server took too long to respond.');
        } else {
            console.error('An unknown error occurred:', err);
        }
        process.exit(1);
    }
};

initializeDatabase();