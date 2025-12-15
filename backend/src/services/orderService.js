const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const logger = require('../observability/logger');
const metrics = require('../observability/metrics');

const generateOrderNumber = () => {
  return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

const createOrder = async (userId, orderData) => {
  try {
    const { shippingAddress, billingAddress, paymentMethod } = orderData;

    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      metrics.orderFailedTotal.inc({ reason: 'empty_cart' });
      throw new Error('Cart is empty');
    }

    const items = [];
    let subtotal = 0;

    for (const cartItem of cart.items) {
      const product = await Product.findById(cartItem.productId._id);
      if (!product) {
        metrics.orderFailedTotal.inc({ reason: 'product_not_found' });
        throw new Error(`Product ${cartItem.productId._id} not found`);
      }

      if (product.stock < cartItem.quantity) {
        metrics.orderFailedTotal.inc({ reason: 'insufficient_stock' });
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      items.push({
        productId: product._id,
        quantity: cartItem.quantity,
        price: cartItem.price
      });

      subtotal += cartItem.price * cartItem.quantity;
      product.stock -= cartItem.quantity;
      await product.save();
    }

    const tax = subtotal * 0.1;
    const shippingCost = subtotal > 100 ? 0 : 10;
    const totalAmount = subtotal + tax + shippingCost;

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      userId,
      items,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      subtotal,
      tax,
      shippingCost,
      totalAmount,
      paymentMethod,
      status: 'pending',
      paymentStatus: 'pending'
    });

    await Cart.findOneAndUpdate(
      { userId },
      { items: [], totalItems: 0, totalPrice: 0 }
    );

    metrics.orderCreatedTotal.inc({ status: 'pending' });
    metrics.orderValueHistogram.observe(totalAmount);
    metrics.checkoutSuccessTotal.inc();

    logger.info('Order created', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      userId,
      totalAmount,
      itemCount: items.length
    });

    return {
      success: true,
      data: order
    };
  } catch (error) {
    metrics.orderFailedTotal.inc({ reason: 'creation_error' });
    logger.error('Create order error', {
      message: error.message,
      userId
    });
    throw error;
  }
};

const getOrderById = async (orderId, userId) => {
  try {
    const order = await Order.findById(orderId).populate('items.productId');

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.userId.toString() !== userId && userId !== 'admin') {
      throw new Error('Unauthorized');
    }

    logger.info('Order retrieved', {
      orderId,
      orderNumber: order.orderNumber
    });

    return {
      success: true,
      data: order
    };
  } catch (error) {
    logger.error('Get order by ID error', {
      message: error.message,
      orderId,
      userId
    });
    throw error;
  }
};

const getUserOrders = async (userId, pagination = {}) => {
  try {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ userId })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments({ userId });

    logger.info('User orders retrieved', {
      userId,
      count: orders.length,
      total
    });

    return {
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Get user orders error', {
      message: error.message,
      userId
    });
    throw error;
  }
};

const updateOrderStatus = async (orderId, status) => {
  try {
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid order status');
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true, runValidators: true }
    );

    if (!order) {
      throw new Error('Order not found');
    }

    metrics.adminActionTotal.inc({
      action: 'update_status',
      resource: 'order'
    });

    logger.info('Order status updated', {
      orderId,
      orderNumber: order.orderNumber,
      newStatus: status
    });

    return {
      success: true,
      data: order
    };
  } catch (error) {
    logger.error('Update order status error', {
      message: error.message,
      orderId
    });
    throw error;
  }
};

const getAllOrders = async (pagination = {}) => {
  try {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const orders = await Order.find()
      .populate('userId', 'firstName lastName email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments();

    logger.info('All orders retrieved', {
      count: orders.length,
      total
    });

    return {
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Get all orders error', {
      message: error.message
    });
    throw error;
  }
};

module.exports = {
  createOrder,
  getOrderById,
  getUserOrders,
  updateOrderStatus,
  getAllOrders
};
