import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/health';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/health', healthRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.path,
  });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
