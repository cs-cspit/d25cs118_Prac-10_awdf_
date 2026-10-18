// Content-Type Middleware - Rejects POST/PUT requests that are not JSON
const contentType = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    const header = req.headers['content-type'];

    if (!header || !header.toLowerCase().includes('application/json')) {
      return res.status(415).json({
        error: 'Unsupported Media Type. Content-Type must be application/json.',
        status: 415
      });
    }
  }

  next();
};

export default contentType;
