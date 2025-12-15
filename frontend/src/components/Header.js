import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { FaShoppingCart, FaUser, FaSearch, FaBars, FaTimes } from 'react-icons/fa';
import './Header.css';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-top">
        <div className="container">
          <div className="header-top-content">
            <Link to="/" className="logo">
              <span className="logo-text">eCommerce</span>
            </Link>

            <form className="search-form" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-btn">
                <FaSearch />
              </button>
            </form>

            <div className="header-actions">
              {isAuthenticated ? (
                <>
                  <Link to="/cart" className="cart-link">
                    <FaShoppingCart />
                    {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
                  </Link>
                  <div className="user-menu">
                    <button className="user-btn">
                      <FaUser /> {user?.firstName}
                    </button>
                    <div className="dropdown">
                      {user?.role === 'admin' && (
                        <Link to="/admin" className="dropdown-item">Admin Dashboard</Link>
                      )}
                      <Link to="/orders" className="dropdown-item">My Orders</Link>
                      <button onClick={handleLogout} className="dropdown-item logout-btn">
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="auth-links">
                  <Link to="/login" className="btn-secondary">Login</Link>
                  <Link to="/signup" className="btn-primary">Sign Up</Link>
                </div>
              )}
            </div>

            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="mobile-menu">
          <div className="container">
            {isAuthenticated ? (
              <>
                <Link to="/cart" className="mobile-menu-item">Cart ({cartCount})</Link>
                <Link to="/orders" className="mobile-menu-item">My Orders</Link>
                {user?.role === 'admin' && (
                  <Link to="/admin" className="mobile-menu-item">Admin Dashboard</Link>
                )}
                <button onClick={handleLogout} className="mobile-menu-item logout-btn">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="mobile-menu-item">Login</Link>
                <Link to="/signup" className="mobile-menu-item">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
