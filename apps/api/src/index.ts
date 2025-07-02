import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
// Checkpoint: family-website-checkpoint.zip
import dotenv from 'dotenv'; // Import dotenv
import authMiddleware from './middleware/authMiddleware';
import authRoutes from './routes/auth'; // Import authentication routes

dotenv.config(); // Load environment variables from .env file

const app = express();
const port = process.env.PORT || 3001;
const mongoUri = process.env.MONGO_URI || 'mongodb://uttam:uttam%40123@localhost:27017/family-website?authSource=admin';

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // For parsing application/json

mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.get('/', (req, res) => {
  res.send('Hello from the API!');
});

app.use('/api/auth', authRoutes); // Use authentication routes

app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({ message: 'This is a protected route!', user: req.user });
});

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});