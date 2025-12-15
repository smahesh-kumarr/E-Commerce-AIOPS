const productService = require('../services/productService');
const logger = require('../observability/logger');

const getAllProducts = async (req, res, next) => {
  try {
    const { category, search, minPrice, maxPrice, rating, page = 1, limit = 20 } = req.query;

    const filters = {};
    if (category) filters.category = category;
    if (search) filters.search = search;
    if (minPrice) filters.minPrice = parseFloat(minPrice);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
    if (rating) filters.rating = parseFloat(rating);

    const result = await productService.getAllProducts(filters, { page, limit });
    res.status(200).json(result);
  } catch (error) {
    logger.error('Get all products controller error', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching products'
    });
  }
};

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await productService.getProductById(id);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Get product by ID controller error', {
      message: error.message,
      productId: req.params.id
    });
    res.status(error.message === 'Product not found' ? 404 : 500).json({
      success: false,
      message: error.message
    });
  }
};

const createProduct = async (req, res, next) => {
  try {
    const result = await productService.createProduct(req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Create product controller error', {
      message: error.message,
      stack: error.stack
    });
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await productService.updateProduct(id, req.body);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Update product controller error', {
      message: error.message,
      productId: req.params.id
    });
    res.status(error.message === 'Product not found' ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await productService.deleteProduct(id);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Delete product controller error', {
      message: error.message,
      productId: req.params.id
    });
    res.status(error.message === 'Product not found' ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
