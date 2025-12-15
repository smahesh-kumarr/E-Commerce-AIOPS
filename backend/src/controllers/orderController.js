const orderService = require('../services/orderService');
const logger = require('../observability/logger');
const metrics = require('../observability/metrics');

const createOrder = async (req, res, next) => {
  try {
    const { shippingAddress, billingAddress, paymentMethod } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required'
      });
    }

    metrics.checkoutAttemptTotal.inc({ status: 'initiated' });

    const result = await orderService.createOrder(req.user.id, {
      shippingAddress,
      billingAddress,
      paymentMethod: paymentMethod || 'credit_card'
    });

    res.status(201).json(result);
  } catch (error) {
    logger.error('Create order controller error', {
      message: error.message,
      userId: req.user.id
    });
    metrics.checkoutAttemptTotal.inc({ status: 'failed' });
    res.status(error.message.includes('not found') ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await orderService.getOrderById(id, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Get order by ID controller error', {
      message: error.message,
      orderId: req.params.id,
      userId: req.user.id
    });
    res.status(error.message === 'Order not found' ? 404 : 403).json({
      success: false,
      message: error.message
    });
  }
};

const getUserOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await orderService.getUserOrders(req.user.id, { page, limit });
    res.status(200).json(result);
  } catch (error) {
    logger.error('Get user orders controller error', {
      message: error.message,
      userId: req.user.id
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching orders'
    });
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const result = await orderService.updateOrderStatus(id, status);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Update order status controller error', {
      message: error.message,
      orderId: req.params.id
    });
    res.status(error.message === 'Order not found' ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await orderService.getAllOrders({ page, limit });
    res.status(200).json(result);
  } catch (error) {
    logger.error('Get all orders controller error', {
      message: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching orders'
    });
  }
};

module.exports = {
  createOrder,
  getOrderById,
  getUserOrders,
  updateOrderStatus,
  getAllOrders
};
