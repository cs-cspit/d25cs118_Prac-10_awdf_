// Response-Time Middleware - measures how long the server spent on a request
// and exposes it as the X-Response-Time header (visible in Postman → Headers).
// This isolates server time from network time when comparing cached vs uncached.
const responseTime = (req, res, next) => {
  const start = process.hrtime.bigint();

  const originalWriteHead = res.writeHead;
  res.writeHead = function (...args) {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    res.setHeader('X-Response-Time', `${ms.toFixed(2)}ms`);
    return originalWriteHead.apply(this, args);
  };

  next();
};

export default responseTime;
