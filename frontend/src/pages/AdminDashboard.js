import React, { useState, useEffect } from 'react';
import { orderAPI, productAPI } from '../utils/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (activeTab === 'orders') {
          const response = await orderAPI.getAllOrders({ page: 1, limit: 50 });
          setOrders(response.data.data);
        } else if (activeTab === 'products') {
          const response = await productAPI.getAll({ page: 1, limit: 50 });
          setProducts(response.data.data);
        }
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  const handleUpdateOrderStatus = async () => {
    if (!selectedOrder || !newStatus) {
      setError('Please select a status');
      return;
    }

    try {
      await orderAPI.updateOrderStatus(selectedOrder._id, newStatus);
      setOrders(orders.map(o => 
        o._id === selectedOrder._id ? { ...o, status: newStatus } : o
      ));
      setSelectedOrder(null);
      setNewStatus('');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#FFA500';
      case 'confirmed':
        return '#4169E1';
      case 'shipped':
        return '#1E90FF';
      case 'delivered':
        return '#28a745';
      case 'cancelled':
        return '#c41e3a';
      default:
        return '#666';
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="container">
        <h1>Admin Dashboard</h1>

        <div className="admin-tabs">
          <button
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            Orders Management
          </button>
          <button
            className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            Products Management
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        {loading ? (
          <div className="loading">Loading...</div>
        ) : activeTab === 'orders' ? (
          <div className="admin-section">
            <h2>Orders</h2>
            <div className="orders-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order._id}>
                      <td>{order.orderNumber}</td>
                      <td>{order.userId?.firstName} {order.userId?.lastName}</td>
                      <td>${order.totalAmount.toFixed(2)}</td>
                      <td>
                        <span
                          className="status-badge"
                          style={{ borderColor: getStatusColor(order.status) }}
                        >
                          <span style={{ color: getStatusColor(order.status) }}>
                            {order.status.toUpperCase()}
                          </span>
                        </span>
                      </td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="action-btn"
                          onClick={() => setSelectedOrder(order)}
                        >
                          Update
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedOrder && (
              <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h3>Update Order Status</h3>
                  <p>Order: {selectedOrder.orderNumber}</p>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="status-select"
                  >
                    <option value="">Select Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <div className="modal-actions">
                    <button
                      className="btn btn-primary"
                      onClick={handleUpdateOrderStatus}
                    >
                      Update
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setSelectedOrder(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="admin-section">
            <h2>Products</h2>
            <div className="products-grid">
              {products.map(product => (
                <div key={product._id} className="product-admin-card">
                  <div className="product-admin-image">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0].url}
                        alt={product.name}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                        }}
                      />
                    ) : (
                      <div className="placeholder">No Image</div>
                    )}
                  </div>
                  <div className="product-admin-info">
                    <h4>{product.name}</h4>
                    <p className="price">${product.price.toFixed(2)}</p>
                    <p className="stock">Stock: {product.stock}</p>
                    <div className="admin-actions">
                      <button className="btn btn-secondary">Edit</button>
                      <button className="btn btn-danger">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
