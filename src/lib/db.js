import { MongoClient } from 'mongodb';
import { mongoUrl } from './config.js';

const clientPromise = (async () => {
    if (!mongoUrl) {
        throw new Error('Please add your MONGO_DB to .env or .env.local');
    }

    try {
        const client = new MongoClient(mongoUrl);
        await client.connect();
        console.log('✅ Connected to MongoDB successfully');
        return client;
    } catch (error) {
        console.error('❌ Failed to connect to MongoDB:', error.message);
        throw error;
    }
})();

export default clientPromise;