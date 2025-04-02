const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const resetDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: 'RestApiGenerator',
        serverSelectionTimeoutMS: 30000,
        });
        console.log('Connected to database:', mongoose.connection.db.databaseName);

        const db = mongoose.connection;
        await db.dropDatabase();
        console.log('Database deleted successfully!');

        await mongoose.disconnect();
        console.log('MongoDB connection closed.');

    } catch (err) {

        console.error('Failed to reset database:', err.message);
        console.error('Error details:', err);

        if (err.name === 'MongoNetworkError') {
            console.error('Network-related error. Please check your network connection.');
        } else if (err.name === 'MongoParseError') {
            console.error('URI parsing error. Please check your MongoDB URI.');
        } else if (err.name === 'MongoTimeoutError') {
            console.error('Connection timeout. The server took too long to respond.');
        } else if (err.name === 'MongooseServerSelectionError') {
            console.error('Server selection error. Unable to find a primary server in the replica set.');
        } else {
            console.error('An unknown error occurred:', err);
        }

        process.exit(1);
    }
};

resetDatabase();