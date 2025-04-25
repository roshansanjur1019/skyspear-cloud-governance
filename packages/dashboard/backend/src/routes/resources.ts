// packages/dashboard/backend/src/routes/resources.ts
import express from 'express';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

// Create a model file if it doesn't exist
interface Resource {
  resourceId: string;
  name: string;
  type: string;
  platform: string;
  region?: string;
  tags?: Record<string, string>;
}

// Create router
const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all resources using RequestHandler type
router.get('/', async (req, res, next) => {
  try {
    const resources: Resource[] = []; // This would typically come from a database
    
    res.status(200).json({
      status: 'success',
      results: resources.length,
      data: resources
    });
  } catch (error) {
    next(error);
  }
});

export default router;