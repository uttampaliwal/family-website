import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
// Checkpoint: family-website-checkpoint.zip
import authMiddleware from './middleware/authMiddleware';
import authRoutes from './routes/auth'; // Import authentication routes
import errorHandler from './middleware/errorHandler'; // Import error handling middleware
import { Request, Response, NextFunction } from 'express';

interface AuthRequest extends Request {
  user?: { id: string };
}

import path from 'path';

const app = express();
const port = process.env.PORT || 3001;
const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  throw new Error('MONGO_URI environment variable is not defined.');
}

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // For parsing application/json

const connectDb = () => {
  mongoose.connect(mongoUri)
    .then(() => console.log('MongoDB connected'))
    .catch(err => {
      console.error('MongoDB connection error:', err.message, err.stack);
      setTimeout(connectDb, 5000); // Attempt to reconnect after 5 seconds
    });
};

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
  setTimeout(connectDb, 5000); // Attempt to reconnect after 5 seconds
});

mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err.message, err.stack);
});

connectDb();

// Routes
app.get('/', (req, res) => {
  res.send('Hello from the API!');
});

app.use('/api/auth', authRoutes); // Use authentication routes

app.get('/api/protected', authMiddleware as (req: Request, res: Response, next: NextFunction) => void, (req: AuthRequest, res) => {
  res.json({ message: 'This is a protected route!', user: req.user });
});

// Error handling middleware (should be last)
app.use(errorHandler);

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});
