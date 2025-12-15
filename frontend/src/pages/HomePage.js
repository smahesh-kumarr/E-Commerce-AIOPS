import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { productAPI } from '../utils/api';
import ProductCard from '../components/ProductCard';
import './HomePage.css';

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    category: searchParams.get('category') || ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const params = {
          page: searchParams.get('page') || 1,
          limit: 12,
          search: searchParams.get('search') || undefined,
          category: searchParams.get('category') || undefined,
          minPrice: searchParams.get('minPrice') || undefined,
          maxPrice: searchParams.get('maxPrice') || undefined
        };

        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

        const response = await productAPI.getAll(params);
        setProducts(response.data.data);
        setPagination(response.data.pagination);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch products');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters.category) params.append('category', filters.category);
    navigate(`?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="home-page">
        <div className="container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading amazing products...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Welcome to TechHub</h1>
          <p>Discover the latest electronics and gadgets at unbeatable prices</p>
          <button className="hero-btn" onClick={() => document.querySelector('.products-section').scrollIntoView({ behavior: 'smooth' })}>
            Shop Now
          </button>
        </div>
      </div>

      <div className="container">
        <div className="products-section">
          <div className="filters-sidebar">
            <h3>Filters</h3>
            
            <div className="filter-group">
              <label>Min Price ($)</label>
              <input
                type="number"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChange}
                placeholder="0"
                min="0"
              />
            </div>

            <div className="filter-group">
              <label>Max Price ($)</label>
              <input
                type="number"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                placeholder="5000"
                min="0"
              />
            </div>

            <button className="apply-filters-btn" onClick={applyFilters}>
              Apply Filters
            </button>
          </div>

          <div className="products-container">
            {error && <div className="error-message">{error}</div>}

            {products.length === 0 ? (
              <div className="no-products">
                <div className="no-products-icon">📦</div>
                <h2>No products found</h2>
                <p>Try adjusting your search or filters</p>
              </div>
            ) : (
              <>
                <div className="products-header">
                  <h2>Featured Products</h2>
                  <p className="product-count">Showing {products.length} of {pagination.total} products</p>
                </div>

                <div className="products-grid">
                  {products.map(product => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                {pagination.pages > 1 && (
                  <div className="pagination">
                    {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <a
                          key={page}
                          href={`?page=${page}${searchParams.get('search') ? `&search=${searchParams.get('search')}` : ''}${searchParams.get('minPrice') ? `&minPrice=${searchParams.get('minPrice')}` : ''}${searchParams.get('maxPrice') ? `&maxPrice=${searchParams.get('maxPrice')}` : ''}`}
                          className={`page-link ${pagination.page === page ? 'active' : ''}`}
                        >
                          {page}
                        </a>
                      );
                    })}
                    {pagination.pages > 5 && <span className="pagination-dots">...</span>}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
