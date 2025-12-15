const cartService = require('../services/cartService');
const logger = require('../observability/logger');

const getCart = async (req, res, next) => {
  try {
    const result = await cartService.getCart(req.user.id);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Get cart controller error', {
      message: error.message,
      userId: req.user.id
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching cart'
    });
  }
};

const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    const result = await cartService.addToCart(req.user.id, productId, quantity);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Add to cart controller error', {
      message: error.message,
      userId: req.user.id
    });
    res.status(error.message.includes('not found') ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

const removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const result = await cartService.removeFromCart(req.user.id, productId);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Remove from cart controller error', {
      message: error.message,
      userId: req.user.id,
      productId: req.params.productId
    });
    res.status(error.message.includes('not found') ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Quantity is required'
      });
    }

    const result = await cartService.updateCartItem(req.user.id, productId, quantity);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Update cart item controller error', {
      message: error.message,
      userId: req.user.id,
      productId: req.params.productId
    });
    res.status(error.message.includes('not found') ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

const clearCart = async (req, res, next) => {
  try {
    const result = await cartService.clearCart(req.user.id);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Clear cart controller error', {
      message: error.message,
      userId: req.user.id
    });
    res.status(500).json({
      success: false,
      message: 'Error clearing cart'
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  removeFromCart,
  updateCartItem,
  clearCart
};
