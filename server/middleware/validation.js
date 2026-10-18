import mongoose from 'mongoose';

// Validation Middleware

// Route-specific: validates the task ID format before reaching the route handler.
// Now validates MongoDB ObjectId format instead of simple integer IDs.
export const validateTaskId = (req, res, next) => {
  const { id } = req.params;

  // Check if ID is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: 'Invalid task ID format. ID must be a valid MongoDB ObjectId.',
      status: 400
    });
  }

  next();
};

// Route-specific: validates the request body for POST and PUT requests.
export const validateTaskBody = (req, res, next) => {
  const { title, description, completed, priority } = req.body;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({
      error: 'Title is required and must be a non-empty string.',
      status: 400
    });
  }

  if (description && typeof description !== 'string') {
    return res.status(400).json({
      error: 'Description must be a string.',
      status: 400
    });
  }

  if (completed !== undefined && typeof completed !== 'boolean') {
    return res.status(400).json({
      error: 'Completed must be a boolean.',
      status: 400
    });
  }

  if (priority !== undefined) {
    const allowed = ['low', 'medium', 'high'];
    if (!allowed.includes(priority)) {
      return res.status(400).json({
        error: `Priority must be one of: ${allowed.join(', ')}`,
        status: 400
      });
    }
  }

  if (title.trim().length > 100) {
    return res.status(400).json({
      error: 'Title must be at most 100 characters.',
      status: 400
    });
  }

  // Sanitize: strip surrounding whitespace before it reaches the DB
  req.body.title = title.trim();
  if (typeof description === 'string') req.body.description = description.trim();

  next();
};

// ---------- Auth validation ----------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

// Collects every failed rule so the client gets all problems in one response.
const sendValidationErrors = (res, details) =>
  res.status(400).json({
    error: 'Validation failed',
    status: 400,
    details
  });

const checkEmail = (email, details) => {
  if (!email || typeof email !== 'string' || email.trim() === '') {
    details.email = 'Email is required.';
  } else if (!EMAIL_REGEX.test(email.trim())) {
    details.email = 'Email must be a valid email address.';
  }
};

// POST /api/auth/register - name, email format, password length
export const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;
  const details = {};

  if (!name || typeof name !== 'string' || name.trim() === '') {
    details.name = 'Name is required.';
  } else if (name.trim().length < 2) {
    details.name = 'Name must be at least 2 characters.';
  }

  checkEmail(email, details);

  if (!password || typeof password !== 'string') {
    details.password = 'Password is required.';
  } else if (password.length < MIN_PASSWORD_LENGTH) {
    details.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  if (Object.keys(details).length > 0) {
    return sendValidationErrors(res, details);
  }

  // Sanitize
  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();

  next();
};

// POST /api/auth/login - email format, password present
export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const details = {};

  checkEmail(email, details);

  if (!password || typeof password !== 'string') {
    details.password = 'Password is required.';
  }

  if (Object.keys(details).length > 0) {
    return sendValidationErrors(res, details);
  }

  req.body.email = email.trim().toLowerCase();

  next();
};
