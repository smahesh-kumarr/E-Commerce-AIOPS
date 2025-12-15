const logger = require('./logger');
const metrics = require('./metrics');

const requestLoggingMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const startHrTime = process.hrtime();

  res.on('finish', () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedTimeInMs = (elapsedHrTime[0] * 1000) + (elapsedHrTime[1] / 1e6);
    const elapsedTimeInSeconds = elapsedTimeInMs / 1000;

    const logData = {
      method: req.method,
      route: req.route?.path || req.path,
      statusCode: res.statusCode,
      responseTime: `${elapsedTimeInMs.toFixed(2)}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user?.id || 'anonymous'
    };

    if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.info('HTTP Request', logData);
    }

    metrics.httpRequestTotal.inc({
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode
    });

    metrics.httpRequestDuration.observe(
      {
        method: req.method,
        route: req.route?.path || req.path,
        status_code: res.statusCode
      },
      elapsedTimeInSeconds
    );
  });

  next();
};

const errorLoggingMiddleware = (err, req, res, next) => {
  logger.error('Unhandled Error', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    route: req.route?.path || req.path,
    statusCode: err.statusCode || 500,
    userId: req.user?.id || 'anonymous'
  });

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = {
  requestLoggingMiddleware,
  errorLoggingMiddleware
};
