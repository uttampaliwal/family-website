import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
// Checkpoint: family-website-checkpoint.zip
import dotenv from 'dotenv'; // Import dotenv
import authMiddleware from './middleware/authMiddleware';
import authRoutes from './routes/auth'; // Import authentication routes
import errorHandler from './middleware/errorHandler'; // Import error handling middleware

dotenv.config(); // Load environment variables from .env file

const app = express();
const port = process.env.PORT || 3001;
const mongoUri = process.env.MONGO_URI;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // For parsing application/json

const connectDb = () => {
  mongoose.connect(mongoUri)
    .then(() => console.log('MongoDB connected'))
    .catch(err => {
      console.error('MongoDB connection error:', err);
      setTimeout(connectDb, 5000); // Attempt to reconnect after 5 seconds
    });
};

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
  setTimeout(connectDb, 5000); // Attempt to reconnect after 5 seconds
});

mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

connectDb();

// Routes
app.get('/', (req, res) => {
  res.send('Hello from the API!');
});

app.use('/api/auth', authRoutes); // Use authentication routes

app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({ message: 'This is a protected route!', user: req.user });
});

// Error handling middleware (should be last)
app.use(errorHandler);

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});