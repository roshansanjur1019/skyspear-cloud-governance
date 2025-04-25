// packages/dashboard/backend/src/routes/auth.ts
import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Generate JWT token
const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });
};

// Login route
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Check if email and password are provided
    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }
    
    // Find user by email and include password in the result
    const user = await User.findOne({ email }).select('+password');
    
    // Check if user exists and password is correct
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Invalid email or password', 401));
    }
    
    // Generate JWT token
    const token = generateToken(user._id);
    
    // Remove password from user object
    user.password = undefined as any;
    
    // Send response
    res.status(200).json({
      status: 'success',
      token,
      user
    });
  } catch (error) {
    next(error);
  }
});

// Register route
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, company } = req.body;
    
    // Check if user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Email already in use', 400));
    }
    
    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      company
    });
    
    // Generate JWT token
    const token = generateToken(user._id);
    
    // Remove password from user object
    user.password = undefined as any;
    
    // Send response
    res.status(201).json({
      status: 'success',
      token,
      user
    });
  } catch (error) {
    next(error);
  }
});

// Logout route (just for API consistency - JWT tokens are stateless)
router.post('/logout', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
});

// Get current user profile
router.get('/profile', authenticate, (req, res) => {
  res.status(200).json({
    status: 'success',
    user: req.user
  });
});

// Update user profile
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const { name, email, company } = req.body;
    
    // Check if email is already taken
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return next(new AppError('Email already in use', 400));
      }
    }
    
    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { name, email, company },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      status: 'success',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
});

// Change password
router.put('/password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    
    // Check if current password is correct
    if (!(await user.comparePassword(currentPassword))) {
      return next(new AppError('Current password is incorrect', 401));
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    // Generate new token
    const token = generateToken(user._id);
    
    res.status(200).json({
      status: 'success',
      token,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;

// packages/dashboard/backend/src/routes/resources.ts
import express from 'express';
import { Resource } from '../models/resource';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all resources
router.get('/', async (req, res, next) => {
  try {
    const resources = await Resource.find();
    
    res.status(200).json({
      status: 'success',
      results: resources.length,
      data: resources
    });
  } catch (error) {
    next(error);
  }
});

// Get resources by platform
router.get('/platform/:platform', async (req, res, next) => {
  try {
    const { platform } = req.params;
    
    if (!['aws', 'azure', 'gcp'].includes(platform)) {
      return next(new AppError('Invalid platform', 400));
    }
    
    const resources = await Resource.find({ platform });
    
    res.status(200).json({
      status: 'success',
      results: resources.length,
      data: resources
    });
  } catch (error) {
    next(error);
  }
});

// Get resources by type
router.get('/type/:type', async (req, res, next) => {
  try {
    const { type } = req.params;
    
    const resources = await Resource.find({ type });
    
    res.status(200).json({
      status: 'success',
      results: resources.length,
      data: resources
    });
  } catch (error) {
    next(error);
  }
});

// Get resources by region
router.get('/region/:region', async (req, res, next) => {
  try {
    const { region } = req.params;
    
    const resources = await Resource.find({ region });
    
    res.status(200).json({
      status: 'success',
      results: resources.length,
      data: resources
    });
  } catch (error) {
    next(error);
  }
});

// Get resources by tag
router.get('/tags', async (req, res, next) => {
  try {
    const { key, value } = req.query;
    
    if (!key) {
      return next(new AppError('Tag key is required', 400));
    }
    
    // Define the query based on whether a value is provided
    const query = value 
      ? { [`tags.${key}`]: value } 
      : { [`tags.${key}`]: { $exists: true } };
    
    const resources = await Resource.find(query);
    
    res.status(200).json({
      status: 'success',
      results: resources.length,
      data: resources
    });
  } catch (error) {
    next(error);
  }
});

// Get a specific resource by ID
router.get('/:id', async (req, res, next) => {
  try {
    const resource = await Resource.findOne({ resourceId: req.params.id });
    
    if (!resource) {
      return next(new AppError('Resource not found', 404));
    }
    
    res.status(200).json({
      status: 'success',
      data: resource
    });
  } catch (error) {
    next(error);
  }
});

export default router;

// packages/dashboard/backend/src/routes/costs.ts
import express from 'express';
import { CostRecommendation } from '../models/costRecommendation';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all cost recommendations
router.get('/recommendations', async (req, res, next) => {
  try {
    const recommendations = await CostRecommendation.find({
      status: 'open' // Only return active recommendations
    });
    
    res.status(200).json({
      status: 'success',
      results: recommendations.length,
      data: recommendations
    });
  } catch (error) {
    next(error);
  }
});

// Get cost recommendations by impact
router.get('/recommendations/impact/:impact', async (req, res, next) => {
  try {
    const { impact } = req.params;
    
    if (!['high', 'medium', 'low'].includes(impact)) {
      return next(new AppError('Invalid impact level', 400));
    }
    
    const recommendations = await CostRecommendation.find({
      impact,
      status: 'open'
    });
    
    res.status(200).json({
      status: 'success',
      results: recommendations.length,
      data: recommendations
    });
  } catch (error) {
    next(error);
  }
});

// Get cost recommendations for a specific resource
router.get('/recommendations/resource/:resourceId', async (req, res, next) => {
  try {
    const { resourceId } = req.params;
    
    const recommendations = await CostRecommendation.find({
      resourceId,
      status: 'open'
    });
    
    res.status(200).json({
      status: 'success',
      results: recommendations.length,
      data: recommendations
    });
  } catch (error) {
    next(error);
  }
});

// Get cost recommendations by platform
router.get('/recommendations/platform/:platform', async (req, res, next) => {
  try {
    const { platform } = req.params;
    
    if (!['aws', 'azure', 'gcp'].includes(platform)) {
      return next(new AppError('Invalid platform', 400));
    }
    
    const recommendations = await CostRecommendation.find({
      platform,
      status: 'open'
    });
    
    res.status(200).json({
      status: 'success',
      results: recommendations.length,
      data: recommendations
    });
  } catch (error) {
    next(error);
  }
});

// Apply a cost recommendation
router.post('/recommendations/:id/apply', async (req, res, next) => {
  try {
    const recommendation = await CostRecommendation.findById(req.params.id);
    
    if (!recommendation) {
      return next(new AppError('Recommendation not found', 404));
    }
    
    if (recommendation.status !== 'open') {
      return next(new AppError('Recommendation has already been applied or dismissed', 400));
    }
    
    // Update recommendation status
    recommendation.status = 'applied';
    recommendation.appliedAt = new Date();
    await recommendation.save();
    
    // Here you would typically call cloud provider APIs to apply the change
    // This is a simplified example
    
    res.status(200).json({
      status: 'success',
      message: 'Recommendation applied successfully',
      data: recommendation
    });
  } catch (error) {
    next(error);
  }
});

// Dismiss a cost recommendation
router.post('/recommendations/:id/dismiss', async (req, res, next) => {
  try {
    const { reason } = req.body;
    
    const recommendation = await CostRecommendation.findById(req.params.id);
    
    if (!recommendation) {
      return next(new AppError('Recommendation not found', 404));
    }
    
    if (recommendation.status !== 'open') {
      return next(new AppError('Recommendation has already been applied or dismissed', 400));
    }
    
    // Update recommendation status
    recommendation.status = 'dismissed';
    recommendation.dismissReason = reason;
    recommendation.dismissedAt = new Date();
    await recommendation.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Recommendation dismissed',
      data: recommendation
    });
  } catch (error) {
    next(error);
  }
});

export default router;

// packages/dashboard/backend/src/routes/security.ts
import express from 'express';
import { SecurityIssue } from '../models/securityIssue';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all security issues
router.get('/issues', async (req, res, next) => {
  try {
    const issues = await SecurityIssue.find({
      status: 'open' // Only return active issues
    });
    
    res.status(200).json({
      status: 'success',
      results: issues.length,
      data: issues
    });
  } catch (error) {
    next(error);
  }
});

// Get security issues by severity
router.get('/issues/severity/:severity', async (req, res, next) => {
  try {
    const { severity } = req.params;
    
    if (!['critical', 'high', 'medium', 'low'].includes(severity)) {
      return next(new AppError('Invalid severity level', 400));
    }
    
    const issues = await SecurityIssue.find({
      severity,
      status: 'open'
    });
    
    res.status(200).json({
      status: 'success',
      results: issues.length,
      data: issues
    });
  } catch (error) {
    next(error);
  }
});

// Get security issues for a specific resource
router.get('/issues/resource/:resourceId', async (req, res, next) => {
  try {
    const { resourceId } = req.params;
    
    const issues = await SecurityIssue.find({
      resourceId,
      status: 'open'
    });
    
    res.status(200).json({
      status: 'success',
      results: issues.length,
      data: issues
    });
  } catch (error) {
    next(error);
  }
});

// Get security issues by platform
router.get('/issues/platform/:platform', async (req, res, next) => {
  try {
    const { platform } = req.params;
    
    if (!['aws', 'azure', 'gcp'].includes(platform)) {
      return next(new AppError('Invalid platform', 400));
    }
    
    const issues = await SecurityIssue.find({
      platform,
      status: 'open'
    });
    
    res.status(200).json({
      status: 'success',
      results: issues.length,
      data: issues
    });
  } catch (error) {
    next(error);
  }
});

// Get security issues by compliance framework
router.get('/issues/compliance/:framework', async (req, res, next) => {
  try {
    const { framework } = req.params;
    
    const issues = await SecurityIssue.find({
      compliance: framework,
      status: 'open'
    });
    
    res.status(200).json({
      status: 'success',
      results: issues.length,
      data: issues
    });
  } catch (error) {
    next(error);
  }
});

// Remediate a security issue
router.post('/issues/:id/remediate', async (req, res, next) => {
  try {
    const issue = await SecurityIssue.findById(req.params.id);
    
    if (!issue) {
      return next(new AppError('Security issue not found', 404));
    }
    
    if (issue.status !== 'open') {
      return next(new AppError('Security issue has already been remediated or dismissed', 400));
    }
    
    // Update issue status
    issue.status = 'remediated';
    issue.remediatedAt = new Date();
    await issue.save();
    
    // Here you would typically call cloud provider APIs to apply the remediation
    // This is a simplified example
    
    res.status(200).json({
      status: 'success',
      message: 'Security issue remediated successfully',
      data: issue
    });
  } catch (error) {
    next(error);
  }
});

// Dismiss a security issue
router.post('/issues/:id/dismiss', async (req, res, next) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      return next(new AppError('Reason for dismissal is required', 400));
    }
    
    const issue = await SecurityIssue.findById(req.params.id);
    
    if (!issue) {
      return next(new AppError('Security issue not found', 404));
    }
    
    if (issue.status !== 'open') {
      return next(new AppError('Security issue has already been remediated or dismissed', 400));
    }
    
    // Update issue status
    issue.status = 'dismissed';
    issue.dismissReason = reason;
    issue.dismissedAt = new Date();
    await issue.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Security issue dismissed',
      data: issue
    });
  } catch (error) {
    next(error);
  }
});

// Get compliance status
router.get('/compliance', async (req, res, next) => {
  try {
    const { framework } = req.query;
    
    // Calculate compliance statistics
    // This is a simplified example - in a real application you would:
    // 1. Query security issues filtered by compliance framework(s)
    // 2. Calculate the percentage of issues that are remediated vs. total
    
    let query = {};
    if (framework) {
      query = { compliance: framework };
    }
    
    const [allIssues, openIssues] = await Promise.all([
      SecurityIssue.countDocuments(query),
      SecurityIssue.countDocuments({ ...query, status: 'open' })
    ]);
    
    const compliancePercentage = allIssues === 0 
      ? 100 
      : Math.round(((allIssues - openIssues) / allIssues) * 100);
    
    res.status(200).json({
      status: 'success',
      data: {
        total: allIssues,
        open: openIssues,
        remediated: allIssues - openIssues,
        percentage: compliancePercentage
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;