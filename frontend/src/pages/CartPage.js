import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaTrash } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import './CartPage.css';

const CartPage = () => {
  const { cart, loading, fetchCart, removeFromCart, updateCartItem } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const handleRemove = async (productId) => {
    await removeFromCart(productId);
  };

  const handleQuantityChange = async (productId, quantity) => {
    if (quantity > 0) {
      await updateCartItem(productId, quantity);
    }
  };

  if (loading) {
    return <div className="container loading">Loading cart...</div>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="empty-cart">
            <h2>Your Cart is Empty</h2>
            <p>Start shopping to add items to your cart</p>
            <Link to="/" className="btn btn-primary">Continue Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <h1>Shopping Cart</h1>

        <div className="cart-container">
          <div className="cart-items-section">
            <div className="cart-items">
              {cart.items.map(item => (
                <div key={item.productId._id} className="cart-item">
                  <div className="item-image">
                    {item.productId.images && item.productId.images.length > 0 ? (
                      <img
                        src={item.productId.images[0].url}
                        alt={item.productId.name}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/100?text=No+Image';
                        }}
                      />
                    ) : (
                      <div className="placeholder">No Image</div>
                    )}
                  </div>

                  <div className="item-details">
                    <Link to={`/products/${item.productId._id}`} className="item-name">
                      {item.productId.name}
                    </Link>
                    <p className="item-price">${item.price.toFixed(2)}</p>
                  </div>

                  <div className="item-quantity">
                    <button
                      onClick={() => handleQuantityChange(item.productId._id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.productId._id, parseInt(e.target.value) || 1)}
                      min="1"
                    />
                    <button
                      onClick={() => handleQuantityChange(item.productId._id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>

                  <div className="item-total">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>

                  <button
                    className="remove-btn"
                    onClick={() => handleRemove(item.productId._id)}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="cart-summary">
            <h2>Order Summary</h2>
            <div className="summary-item">
              <span>Subtotal:</span>
              <span>${cart.totalPrice.toFixed(2)}</span>
            </div>
            <div className="summary-item">
              <span>Tax (10%):</span>
              <span>${(cart.totalPrice * 0.1).toFixed(2)}</span>
            </div>
            <div className="summary-item">
              <span>Shipping:</span>
              <span>{cart.totalPrice > 100 ? 'FREE' : '$10.00'}</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-total">
              <span>Total:</span>
              <span>
                ${(cart.totalPrice + (cart.totalPrice * 0.1) + (cart.totalPrice > 100 ? 0 : 10)).toFixed(2)}
              </span>
            </div>
            <button
              className="btn btn-primary checkout-btn"
              onClick={() => navigate('/checkout')}
            >
              Proceed to Checkout
            </button>
            <Link to="/" className="btn btn-secondary continue-shopping">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
