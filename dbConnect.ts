import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

let isConnected = false;
let cachedClient: MongoClient | null = null;
let connectionRetries = 0;
const MAX_RETRIES = 3;

export async function connectToDatabase() {
  if (cachedClient && isConnected) {
    return { client: cachedClient, db: cachedClient.db() };
  }

  try {
    if (connectionRetries >= MAX_RETRIES) {
      throw new Error('Max connection retries reached');
    }

    const client = await MongoClient.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    

    await client.db().command({ ping: 1 });
    
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    cachedClient = client;
    connectionRetries = 0;
    console.log('Connected to MongoDB');
    return { client, db: client.db() };
  } catch (error) {
    connectionRetries++;
    console.error(`MongoDB connection error (attempt ${connectionRetries}):`, error);
    if (cachedClient) {
      await cachedClient.close();
      cachedClient = null;
    }
    isConnected = false;
    throw error;
  }
}


let clientPromiseInstance: Promise<MongoClient>;

export function clientPromise() {
  if (!clientPromiseInstance) {
    clientPromiseInstance = MongoClient.connect(MONGODB_URI);
  }
  return clientPromiseInstance;
}


process.on('SIGINT', async () => {
  if (cachedClient) {
    await cachedClient.close();
    await mongoose.connection.close();
    process.exit(0);
  }
});

export default connectToDatabase;