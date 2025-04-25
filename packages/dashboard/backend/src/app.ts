import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { config, healthCheck } from './config';
import { errorHandler, AppError } from './middleware/errorHandler';

// Import routes from the index file
import { 
  authRoutes, 
  resourceRoutes, 
  costRoutes, 
  securityRoutes 
} from './routes';

// Create Express application
const app = express();

// Connect to MongoDB
mongoose
  .connect(config.databaseUrl)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err: unknown) => {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('MongoDB connection error:', errorMessage);
    process.exit(1);
  });

// Apply middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));
app.use(helmet());
app.use(compression());
app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/costs', costRoutes);
app.use('/api/security', securityRoutes);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json(healthCheck.getStatus());
});

// API documentation
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'SpearPoint API',
    version: config.version,
    documentation: '/api-docs'
  });
});

// Handle undefined routes
app.all('*', (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler
app.use(errorHandler);

// Start server
const PORT = config.port || 3001;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${config.env} mode`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: unknown) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err instanceof Error ? err.name : 'Error', err instanceof Error ? err.message : String(err));
  
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM signal
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('💥 Process terminated!');
  });
});

export default app;