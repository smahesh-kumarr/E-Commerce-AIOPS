const express = require('express');
const os = require('os');
const metrics = require('../observability/metrics');
const logger = require('../observability/logger');

const router = express.Router();

router.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', metrics.register.contentType);
    res.end(await metrics.register.metrics());
  } catch (error) {
    logger.error('Metrics endpoint error', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).end(error);
  }
});

router.get('/health', (req, res) => {
  try {
    const healthcheck = {
      uptime: process.uptime(),
      timestamp: Date.now(),
      status: 'OK',
      environment: process.env.NODE_ENV || 'development',
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      },
      cpu: {
        cores: os.cpus().length,
        loadAverage: os.loadavg()
      }
    };

    logger.info('Health check', { status: 'OK' });
    res.status(200).json(healthcheck);
  } catch (error) {
    logger.error('Health endpoint error', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
});

router.get('/ready', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const isConnected = mongoose.connection.readyState === 1;

    if (!isConnected) {
      logger.warn('Readiness check - Database not connected');
      return res.status(503).json({
        ready: false,
        message: 'Database not connected'
      });
    }

    logger.info('Readiness check - OK');
    res.status(200).json({
      ready: true,
      message: 'Service is ready',
      database: 'connected'
    });
  } catch (error) {
    logger.error('Readiness endpoint error', {
      message: error.message,
      stack: error.stack
    });
    res.status(503).json({
      ready: false,
      message: error.message
    });
  }
});

module.exports = router;
