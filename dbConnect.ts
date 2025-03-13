import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';
import { logger } from './src/app/utils/logger';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

let isConnected = false;
let cachedClient: MongoClient | null = null;
let isConnecting = false;
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;

async function connectWithRetry(retries = MAX_RETRIES): Promise<MongoClient> {
  try {
    if (cachedClient) {
      return cachedClient;
    }

    if (isConnecting) {
      logger.debug('Connection already in progress, waiting...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return connectWithRetry(retries);
    }

    isConnecting = true;
    logger.info('Connecting to MongoDB...');
    
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    await client.db().command({ ping: 1 });
    
    cachedClient = client;
    isConnecting = false;
    logger.info('Successfully connected to MongoDB');
    
    client.on('close', () => {
      logger.warn('MongoDB connection closed');
      cachedClient = null;
    });
    
    client.on('error', (error: Error) => {
      logger.error('MongoDB connection error', { error: error.message });
      cachedClient = null;
    });

    return client;

  } catch (error: unknown) {
    isConnecting = false;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('MongoDB connection failed', { 
      error: errorMessage, 
      retriesLeft: retries 
    });

    if (retries > 0) {
      logger.info(`Retrying connection in ${RETRY_DELAY}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return connectWithRetry(retries - 1);
    }

    throw new Error(`Failed to connect to MongoDB after ${MAX_RETRIES} attempts`);
  }
}

export async function connectToDatabase(): Promise<MongoClient> {
  try {
    const client = await connectWithRetry();
    return client;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to establish database connection', { error: errorMessage });
    throw error;
  }
}

export function clientPromise(): Promise<MongoClient> {
  if (!clientPromiseInstance) {
    clientPromiseInstance = MongoClient.connect(MONGODB_URI);
  }
  return clientPromiseInstance;
}

let clientPromiseInstance: Promise<MongoClient>;

process.on('SIGINT', async () => {
  if (cachedClient) {
    await cachedClient.close();
    await mongoose.connection.close();
    process.exit(0);
  }
});

export default connectToDatabase;