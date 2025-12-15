const Cart = require('../models/Cart');
const Product = require('../models/Product');
const logger = require('../observability/logger');
const metrics = require('../observability/metrics');

const getCart = async (userId) => {
  try {
    let cart = await Cart.findOne({ userId }).populate('items.productId');

    if (!cart) {
      cart = await Cart.create({ userId, items: [], totalItems: 0, totalPrice: 0 });
    }

    logger.info('Cart retrieved', {
      userId,
      itemCount: cart.items.length
    });

    return {
      success: true,
      data: cart
    };
  } catch (error) {
    logger.error('Get cart error', {
      message: error.message,
      userId
    });
    throw error;
  }
};

const addToCart = async (userId, productId, quantity = 1) => {
  try {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    if (product.stock < quantity) {
      throw new Error('Insufficient stock');
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({ userId, items: [], totalItems: 0, totalPrice: 0 });
    }

    const existingItem = cart.items.find(item => item.productId.toString() === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        productId,
        quantity,
        price: product.price
      });
    }

    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.totalPrice = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    await cart.save();
    await cart.populate('items.productId');

    metrics.cartAddTotal.inc({ product_id: productId });
    metrics.cartSizeHistogram.observe(cart.totalItems);

    logger.info('Item added to cart', {
      userId,
      productId,
      quantity,
      cartTotal: cart.totalItems
    });

    return {
      success: true,
      data: cart
    };
  } catch (error) {
    logger.error('Add to cart error', {
      message: error.message,
      userId,
      productId
    });
    throw error;
  }
};

const removeFromCart = async (userId, productId) => {
  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      throw new Error('Cart not found');
    }

    cart.items = cart.items.filter(item => item.productId.toString() !== productId);
    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.totalPrice = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    await cart.save();
    await cart.populate('items.productId');

    metrics.cartRemoveTotal.inc({ product_id: productId });
    metrics.cartSizeHistogram.observe(cart.totalItems);

    logger.info('Item removed from cart', {
      userId,
      productId,
      cartTotal: cart.totalItems
    });

    return {
      success: true,
      data: cart
    };
  } catch (error) {
    logger.error('Remove from cart error', {
      message: error.message,
      userId,
      productId
    });
    throw error;
  }
};

const updateCartItem = async (userId, productId, quantity) => {
  try {
    if (quantity <= 0) {
      return removeFromCart(userId, productId);
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    if (product.stock < quantity) {
      throw new Error('Insufficient stock');
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      throw new Error('Cart not found');
    }

    const item = cart.items.find(item => item.productId.toString() === productId);
    if (!item) {
      throw new Error('Item not in cart');
    }

    item.quantity = quantity;
    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.totalPrice = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    await cart.save();
    await cart.populate('items.productId');

    metrics.cartSizeHistogram.observe(cart.totalItems);

    logger.info('Cart item updated', {
      userId,
      productId,
      quantity,
      cartTotal: cart.totalItems
    });

    return {
      success: true,
      data: cart
    };
  } catch (error) {
    logger.error('Update cart item error', {
      message: error.message,
      userId,
      productId,
      quantity
    });
    throw error;
  }
};

const clearCart = async (userId) => {
  try {
    const cart = await Cart.findOneAndUpdate(
      { userId },
      { items: [], totalItems: 0, totalPrice: 0 },
      { new: true }
    );

    logger.info('Cart cleared', { userId });

    return {
      success: true,
      data: cart
    };
  } catch (error) {
    logger.error('Clear cart error', {
      message: error.message,
      userId
    });
    throw error;
  }
};

module.exports = {
  getCart,
  addToCart,
  removeFromCart,
  updateCartItem,
  clearCart
};
