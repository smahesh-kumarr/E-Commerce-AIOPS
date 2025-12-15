const winston = require('winston');
const os = require('os');
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist and we have permissions
const logsDir = path.join(process.cwd(), 'logs');
const canCreateLogs = (() => {
  try {
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    return true;
  } catch (err) {
    console.warn('Warning: Cannot create logs directory, file logging disabled:', err.message);
    return false;
  }
})();

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ level, message, timestamp, ...meta }) => {
        return `${timestamp} [${level}] ${message} ${JSON.stringify(meta)}`;
      })
    )
  })
];

// Only add file transports if we can create the logs directory
if (canCreateLogs) {
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: winston.format.json(),
      maxsize: 5242880,
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: winston.format.json(),
      maxsize: 5242880,
      maxFiles: 5
    })
  );
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'ecommerce-api',
    environment: process.env.NODE_ENV || 'development',
    hostname: os.hostname(),
    version: '1.0.0'
  },
  transports
});

module.exports = logger;