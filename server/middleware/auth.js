import jwt from 'jsonwebtoken';

// Auth Middleware - verifies the JWT sent as "Authorization: Bearer <token>".
// On success the decoded payload ({ id, email }) is attached as req.user.
const protect = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Not authorized. Missing or malformed Authorization header.',
      status: 401
    });
  }

  const token = header.split(' ')[1];

  // jwt.verify() throws on an invalid, tampered or expired token,
  // so it is wrapped in try/catch to return 401 instead of crashing.
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError'
      ? 'Token expired. Please log in again.'
      : 'Not authorized. Invalid token.';

    return res.status(401).json({
      error: message,
      status: 401
    });
  }
};

export default protect;
