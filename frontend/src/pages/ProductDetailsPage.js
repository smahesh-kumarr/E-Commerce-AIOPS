import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaStar, FaShoppingCart } from 'react-icons/fa';
import { productAPI } from '../utils/api';
import { useCart } from '../context/CartContext';
import './ProductDetailsPage.css';

const ProductDetailsPage = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await productAPI.getById(id);
        setProduct(response.data.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    try {
      setAddingToCart(true);
      await addToCart(product._id, quantity);
      setSuccessMessage('Added to cart successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setQuantity(1);
    } catch (error) {
      setError(error);
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return <div className="container loading">Loading product...</div>;
  }

  if (error) {
    return <div className="container error">{error}</div>;
  }

  if (!product) {
    return <div className="container error">Product not found</div>;
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="product-details-page">
      <div className="container">
        <div className="product-details-container">
          <div className="product-image-section">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[0].url}
                alt={product.name}
                className="product-image-large"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/400?text=No+Image';
                }}
              />
            ) : (
              <div className="product-image-large placeholder">
                <span>No Image Available</span>
              </div>
            )}
            {discount > 0 && <div className="discount-badge-large">{discount}% OFF</div>}
          </div>

          <div className="product-details-section">
            <h1 className="product-title">{product.name}</h1>

            <div className="product-rating-section">
              <div className="stars-large">
                {[...Array(5)].map((_, i) => (
                  <FaStar
                    key={i}
                    className={i < Math.floor(product.rating) ? 'star filled' : 'star'}
                  />
                ))}
              </div>
              <span className="rating-text">{product.rating.toFixed(1)} out of 5</span>
            </div>

            <div className="price-section">
              <span className="price-current">${product.price.toFixed(2)}</span>
              {product.originalPrice && (
                <span className="price-original">${product.originalPrice.toFixed(2)}</span>
              )}
            </div>

            <div className="stock-status">
              {product.stock > 0 ? (
                <span className="in-stock">In Stock ({product.stock} available)</span>
              ) : (
                <span className="out-of-stock">Out of Stock</span>
              )}
            </div>

            <div className="product-description">
              <h3>Description</h3>
              <p>{product.description}</p>
            </div>

            {successMessage && <div className="success">{successMessage}</div>}

            <div className="purchase-section">
              <div className="quantity-selector">
                <label>Quantity:</label>
                <div className="quantity-controls">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    max={product.stock}
                  />
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                className="add-to-cart-btn-large"
                onClick={handleAddToCart}
                disabled={addingToCart || product.stock === 0}
              >
                <FaShoppingCart /> {addingToCart ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>

            {product.tags && product.tags.length > 0 && (
              <div className="tags-section">
                <h4>Tags:</h4>
                <div className="tags">
                  {product.tags.map((tag, index) => (
                    <span key={index} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {product.reviews && product.reviews.length > 0 && (
          <div className="reviews-section">
            <h2>Customer Reviews</h2>
            <div className="reviews-list">
              {product.reviews.map((review, index) => (
                <div key={index} className="review-item">
                  <div className="review-header">
                    <div className="review-stars">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={i < review.rating ? 'star filled' : 'star'}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="review-comment">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailsPage;
