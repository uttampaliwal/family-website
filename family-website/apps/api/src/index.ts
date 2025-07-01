import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import authRoutes from './routes/auth';
import calendarRoutes from './routes/calendar';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
console.log('MONGO_URI:', process.env.MONGO_URI);

const app = express();
const port = process.env.PORT || 3001;

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI as string, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      user: 'uttam',
      pass: 'uttam@123',
      authSource: 'admin' // Specify the authentication database
    });
    console.log('MongoDB Connected successfully!');
  } catch (err: any) {
    console.error('MongoDB connection error:', err.message);
    // Exit process with failure
    process.exit(1);
  }
};

connectDB();

app.use(cors());
app.use(express.json());

// Define Routes
app.use('/api/auth', authRoutes);
app.use('/api/calendar', calendarRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from the API!');
});

app.listen(port, (): void => {
  console.log(`API server listening on port ${port}`);
});
