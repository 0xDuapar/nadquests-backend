import express from 'express';
import cors from 'cors';
import { connectDb, closeDb } from './db.js';  // Importing connectDb and closeDb from db.js
import userRoutes from './routes/users.js';
import cryptoRoutes from './routes/crypto.js';

const app = express();
const port = process.env.AUTH_PORT || 4000;  // Port from environment or default to 4000

app.use(express.json());

// Configure CORS (Cross-Origin Resource Sharing)
app.use(cors());  // Allows requests from any origin

// Define routes
app.use('/api', userRoutes);
app.use('/crypto', cryptoRoutes);

// Async function to start the server after DB connection
const startServer = async () => {
  try {
    // Connect to the database
    await connectDb();
    console.log('Connected to MySQL database');

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Error during database initialization:', err);
    process.exit(1); // Exit if DB connection fails
  }
};

// Start the server
startServer();

// Gracefully handle shutdown
process.on('SIGINT', async () => {
  try {
    // Close database connection
    await closeDb();
    console.log('Database connection closed');
    
    // Shutdown server
    console.log('Server shutting down...');
    process.exit(); // Exit after closing DB connection
  } catch (err) {
    console.error('Error during server shutdown:', err);
    process.exit(1); // Exit with error if shutting down fails
  }
});
