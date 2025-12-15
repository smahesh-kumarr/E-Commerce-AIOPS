const express = require('express');
const cartController = require('../controllers/cartController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.get('/', protect, cartController.getCart);
router.post('/add', protect, cartController.addToCart);
router.delete('/:productId', protect, cartController.removeFromCart);
router.put('/:productId', protect, cartController.updateCartItem);
router.delete('/', protect, cartController.clearCart);

module.exports = router;
