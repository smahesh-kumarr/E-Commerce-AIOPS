const Product = require('../models/Product');
const Category = require('../models/Category');
const logger = require('../observability/logger');
const metrics = require('../observability/metrics');

const getAllProducts = async (filters = {}, pagination = {}) => {
  try {
    const { category, search, minPrice, maxPrice, rating } = filters;
    const { page = 1, limit = 20 } = pagination;

    let query = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search };
      metrics.searchQueryTotal.inc({ query: search });
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = minPrice;
      if (maxPrice) query.price.$lte = maxPrice;
    }

    if (rating) {
      query.rating = { $gte: rating };
    }

    const skip = (page - 1) * limit;
    const products = await Product.find(query)
      .populate('category', 'name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(query);

    logger.info('Products fetched', {
      count: products.length,
      total,
      page,
      limit
    });

    return {
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Get all products error', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

const getProductById = async (productId) => {
  try {
    const product = await Product.findByIdAndUpdate(
      productId,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).populate('category', 'name');

    if (!product) {
      throw new Error('Product not found');
    }

    metrics.productViewTotal.inc({
      product_id: productId,
      category: product.category?.name || 'unknown'
    });

    logger.info('Product viewed', {
      productId,
      productName: product.name
    });

    return {
      success: true,
      data: product
    };
  } catch (error) {
    logger.error('Get product by ID error', {
      message: error.message,
      productId
    });
    throw error;
  }
};

const createProduct = async (productData) => {
  try {
    const product = await Product.create(productData);
    await product.populate('category', 'name');

    metrics.adminActionTotal.inc({
      action: 'create',
      resource: 'product'
    });

    logger.info('Product created', {
      productId: product._id,
      productName: product.name
    });

    return {
      success: true,
      data: product
    };
  } catch (error) {
    logger.error('Create product error', {
      message: error.message,
      productName: productData.name
    });
    throw error;
  }
};

const updateProduct = async (productId, updateData) => {
  try {
    const product = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name');

    if (!product) {
      throw new Error('Product not found');
    }

    metrics.adminActionTotal.inc({
      action: 'update',
      resource: 'product'
    });

    logger.info('Product updated', {
      productId,
      productName: product.name
    });

    return {
      success: true,
      data: product
    };
  } catch (error) {
    logger.error('Update product error', {
      message: error.message,
      productId
    });
    throw error;
  }
};

const deleteProduct = async (productId) => {
  try {
    const product = await Product.findByIdAndUpdate(
      productId,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      throw new Error('Product not found');
    }

    metrics.adminActionTotal.inc({
      action: 'delete',
      resource: 'product'
    });

    logger.info('Product deleted', {
      productId,
      productName: product.name
    });

    return {
      success: true,
      message: 'Product deleted successfully'
    };
  } catch (error) {
    logger.error('Delete product error', {
      message: error.message,
      productId
    });
    throw error;
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
