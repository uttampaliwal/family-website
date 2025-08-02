import express, { Express } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Assuming your routes and middleware are structured as per your documentation.
// Node.js ES Modules require the full file extension in relative imports.
import authRoutes from './routes/auth';
import feedRoutes from './routes/feed';
import healthRoutes from './routes/health';
import documentRoutes from './routes/documents'; // Import document routes
import { errorHandler } from './middleware/errorHandler';
import { generateCsrfToken, validateCsrfToken } from './middleware/csrf';

// --- 1. Environment Setup ---

// Validate that all required environment variables are present.
const { PORT, MONGO_URI, JWT_SECRET, REFRESH_TOKEN_SECRET, FRONTEND_URL } = process.env;

if (!PORT || !MONGO_URI || !JWT_SECRET || !REFRESH_TOKEN_SECRET || !FRONTEND_URL) {
  const errorLog = {
    level: 'FATAL',
    message: 'One or more required environment variables are missing',
    timestamp: new Date().toISOString(),
    missing: {
      PORT: !PORT,
      MONGO_URI: !MONGO_URI,
      JWT_SECRET: !JWT_SECRET,
      REFRESH_TOKEN_SECRET: !REFRESH_TOKEN_SECRET,
      FRONTEND_URL: !FRONTEND_URL
    }
  };
  console.error(JSON.stringify(errorLog));
  process.exit(1);
}

const portNumber = parseInt(PORT, 10);
if (isNaN(portNumber) || portNumber <= 0 || portNumber > 65535) {
  console.error(`FATAL ERROR: Invalid PORT environment variable. Expected a number between 1 and 65535, got "${PORT}".`);
  process.exit(1);
}

// --- 2. Database Connection ---
// This function establishes the initial connection to MongoDB.
const connectDb = async () => {
  try {
    // The definitive, application-level fix for the connection timeout issue in Docker.
    // This forces Mongoose to use the reliable IPv4 protocol.
    await mongoose.connect(MONGO_URI, {
      family: 4,
    });
  } catch (error) {
    console.error('Initial MongoDB connection failed:', error);
    // If we can't connect at startup, the application is not viable.
    process.exit(1);
  }
};

// Set up Mongoose event listeners for ongoing connection management.
// These will log events after the initial connection is established.
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected successfully.');
});

mongoose.connection.on('error', (err) => {
  // Sanitize error message to prevent log injection
  const sanitizedError = err instanceof Error ? 
    { name: err.name.replace(/[\n\r\t]/g, ''), message: err.message.replace(/[\n\r\t]/g, '') } : 
    { message: String(err).replace(/[\n\r\t]/g, '') };
  console.error('MongoDB connection error:', JSON.stringify(sanitizedError));
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Mongoose will attempt to reconnect.');
});

// --- 3. Express Application Setup ---
const app: Express = express();

// Enable CORS (Cross-Origin Resource Sharing) for requests from your frontend.
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

// Middleware to parse JSON request bodies.
app.use(express.json());
app.use(cookieParser());

app.use(generateCsrfToken);
app.use(validateCsrfToken);

// API routes.
app.use('/api/auth', authRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api', healthRoutes); // Mount the health check route
app.use('/api/documents', documentRoutes); // Mount the documents routes


// Central error handling middleware.
app.use(errorHandler);

// --- 4. Server Startup and Graceful Shutdown ---
const startServer = async () => {
  // First, ensure the database is connected.
  await connectDb();

  // Then, start the Express server.
  const server = app.listen(portNumber, () => {
    console.log(`API server listening on port ${portNumber}`);
  });

  // Implement graceful shutdown to properly close resources.
  const gracefulShutdown = (signal: string) => {
    const sanitizedSignal = String(signal).replace(/[\n\r\t\x00-\x1f\x7f-\x9f]/g, '');
    console.log(`\n${sanitizedSignal} received. Shutting down gracefully...`);
    server.close((err) => {
      if (err) {
        console.error('Error closing HTTP server:', err);
      } else {
        console.log('HTTP server closed.');
      }
      mongoose.connection.close(false).then(() => {
        console.log('MongoDB connection closed.');
        process.exit(0);
      }).catch((err) => {
        console.error('Error closing MongoDB connection:', err);
        process.exit(1);
      });
    });
  };

  // Listen for termination signals (e.g., from `docker compose down`).
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
};

// --- 5. Run the Application ---
startServer();
