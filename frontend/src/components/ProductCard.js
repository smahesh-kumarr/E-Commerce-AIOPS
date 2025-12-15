import React from 'react';
import { Link } from 'react-router-dom';
import { FaStar, FaShoppingCart } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [loading, setLoading] = React.useState(false);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await addToCart(product._id, 1);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <Link to={`/products/${product._id}`} className="product-card">
      <div className="product-image-container">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0].url}
            alt={product.name}
            className="product-image"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/200?text=No+Image';
            }}
          />
        ) : (
          <div className="product-image placeholder">
            <span>No Image</span>
          </div>
        )}
        {discount > 0 && <div className="discount-badge">{discount}% OFF</div>}
        {product.stock === 0 && <div className="out-of-stock">Out of Stock</div>}
      </div>

      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>

        <div className="product-rating">
          <div className="stars">
            {[...Array(5)].map((_, i) => (
              <FaStar
                key={i}
                className={i < Math.floor(product.rating) ? 'star filled' : 'star'}
              />
            ))}
          </div>
          <span className="rating-value">({product.rating.toFixed(1)})</span>
        </div>

        <div className="product-price">
          <span className="current-price">${product.price.toFixed(2)}</span>
          {product.originalPrice && (
            <span className="original-price">${product.originalPrice.toFixed(2)}</span>
          )}
        </div>

        <button
          className="add-to-cart-btn"
          onClick={handleAddToCart}
          disabled={loading || product.stock === 0}
        >
          <FaShoppingCart /> {loading ? 'Adding...' : 'Add to Cart'}
        </button>
      </div>
    </Link>
  );
};

export default ProductCard;
