import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// User database connection
export const userDb = mongoose.createConnection(process.env.MONGO_URI, {
  useNewUrlParser: true,
  // useUnifiedTopology is deprecated, but harmless
});

// Product (TCG) database connection
export const productDb = mongoose.createConnection(process.env.MONGOTCG_URI, {
  useNewUrlParser: true,
  // useUnifiedTopology is deprecated, but harmless
});

// Optional: Log connection status
userDb.on('connected', () => console.log('User DB connected'));
userDb.on('error', (err) => console.error('User DB connection error:', err));

productDb.on('connected', () => console.log('Product DB connected'));
productDb.on('error', (err) => console.error('Product DB connection error:', err));

