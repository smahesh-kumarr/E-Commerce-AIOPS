const mongoose = require('mongoose');
const logger = require('../observability/logger');
const metrics = require('../observability/metrics');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    logger.info('MongoDB Connected', {
      host: conn.connection.host,
      database: conn.connection.name
    });

    metrics.databaseConnectionStatus.set(1);

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB Disconnected');
      metrics.databaseConnectionStatus.set(0);
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB Connection Error', {
        message: err.message,
        stack: err.stack
      });
      metrics.databaseConnectionStatus.set(0);
    });

    return conn;
  } catch (error) {
    logger.error('MongoDB Connection Failed', {
      message: error.message,
      stack: error.stack
    });
    metrics.databaseConnectionStatus.set(0);
    process.exit(1);
  }
};

module.exports = connectDB;
