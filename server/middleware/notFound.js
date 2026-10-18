// Not Found Middleware - Handles undefined routes with a structured JSON response
const notFound = (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    status: 404,
    method: req.method,
    path: req.originalUrl
  });
};

export default notFound;
