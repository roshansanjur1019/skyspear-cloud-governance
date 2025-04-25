// packages/dashboard/backend/src/routes/auth.ts
import express, { Request, Response, NextFunction } from 'express';
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
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
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
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
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
router.post('/logout', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
});

// Get current user profile
router.get('/profile', authenticate, (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    user: req.user
  });
});

// Update user profile
router.put('/profile', authenticate, async (req: Request, res: Response, next: NextFunction) => {
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
router.put('/password', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
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