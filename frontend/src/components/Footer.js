import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-section">
              <h4>Get to Know Us</h4>
              <ul>
                <li><a href="#about">About Us</a></li>
                <li><a href="#careers">Careers</a></li>
                <li><a href="#press">Press Releases</a></li>
                <li><a href="#blog">Blog</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Make Money with Us</h4>
              <ul>
                <li><a href="#sell">Sell on eCommerce</a></li>
                <li><a href="#advertise">Advertise Your Products</a></li>
                <li><a href="#become-affiliate">Become an Affiliate</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>eCommerce Payment Products</h4>
              <ul>
                <li><a href="#business">eCommerce Business Card</a></li>
                <li><a href="#shop">Shop with Points</a></li>
                <li><a href="#reload">Reload Your Balance</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Let Us Help You</h4>
              <ul>
                <li><a href="#account">Your Account</a></li>
                <li><a href="#orders">Your Orders</a></li>
                <li><a href="#help">Help Center</a></li>
                <li><a href="#contact">Contact Us</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          <p>&copy; 2024 eCommerce Platform. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
