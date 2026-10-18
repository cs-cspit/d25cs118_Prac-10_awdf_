import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import protect from '../middleware/auth.js';
import { validateRegister, validateLogin } from '../middleware/validation.js';

const router = express.Router();

const signToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt
});

// POST /api/auth/register - hash password, save user, return 201
router.post('/register', validateRegister, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        error: 'An account with this email already exists.',
        status: 409
      });
    }

    // bcrypt salts automatically; 10 = cost factor (salt rounds)
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    console.log(`User registered: ${user.email}`);

    res.status(201).json({
      message: 'User registered successfully',
      user: publicUser(user)
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login - verify password, sign JWT, return token
router.post('/login', validateLogin, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // password has select:false on the schema, so request it explicitly
    const user = await User.findOne({ email }).select('+password');

    // Same message for unknown email and wrong password,
    // so the API does not reveal which emails are registered.
    const isMatch = user ? await bcrypt.compare(password, user.password) : false;
    if (!isMatch) {
      return res.status(401).json({
        error: 'Invalid email or password.',
        status: 401
      });
    }

    const token = signToken(user);
    console.log(`User logged in: ${user.email}`);

    res.status(200).json({
      message: 'Login successful',
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      user: publicUser(user)
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me - current user from the decoded JWT
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        status: 404
      });
    }

    res.status(200).json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

export default router;
