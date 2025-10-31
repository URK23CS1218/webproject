import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

const ConsumerDashboard = () => {
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecentProducts();
  }, []);

  const fetchRecentProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/api/products?limit=3');
      console.log('✅ Consumer dashboard products:', response.data);
      
      setRecentProducts(response.data.products.slice(0, 3) || []);
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      setError('Failed to load products');
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading dashboard...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h2>Consumer Dashboard</h2>
          <p className="text-muted">Welcome to your shopping dashboard!</p>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
          <Button 
            variant="outline-danger" 
            size="sm" 
            className="ms-3"
            onClick={fetchRecentProducts}
          >
            Try Again
          </Button>
        </Alert>
      )}

      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center h-100 shadow-sm">
            <Card.Body className="d-flex flex-column">
              <div className="feature-icon mb-3">🛒</div>
              <Card.Title>Browse Products</Card.Title>
              <Card.Text className="flex-grow-1">
                Shop fresh produce from local farmers
              </Card.Text>
              <Button as={Link} to="/products" variant="success" className="mt-auto">
                Shop Now
              </Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center h-100 shadow-sm">
            <Card.Body className="d-flex flex-column">
              <div className="feature-icon mb-3">📦</div>
              <Card.Title>Your Orders</Card.Title>
              <Card.Text className="flex-grow-1">
                View your order history and track deliveries
              </Card.Text>
              <Button variant="outline-primary" className="mt-auto" disabled>
                Coming Soon
              </Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center h-100 shadow-sm">
            <Card.Body className="d-flex flex-column">
              <div className="feature-icon mb-3">👤</div>
              <Card.Title>Profile</Card.Title>
              <Card.Text className="flex-grow-1">
                Manage your account and delivery preferences
              </Card.Text>
              <Button as={Link} to="/profile" variant="outline-primary" className="mt-auto">
                Edit Profile
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Products */}
      <Row>
        <Col>
          <Card className="shadow-sm">
            <Card.Header className="bg-light">
              <h5 className="mb-0">Recently Added Products</h5>
            </Card.Header>
            <Card.Body>
              {recentProducts.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted">No products available yet</p>
                  <Button as={Link} to="/products" variant="outline-success">
                    Browse All Products
                  </Button>
                </div>
              ) : (
                <Row>
                  {recentProducts.map((product) => (
                    <Col md={4} key={product._id} className="mb-3">
                      <Card className="h-100">
                        <Card.Body className="d-flex flex-column">
                          <Card.Title className="h6">{product.title}</Card.Title>
                          <Card.Text className="text-muted small flex-grow-1">
                            {product.category} • {product.farmer?.name || 'Local Farmer'}
                          </Card.Text>
                          <div className="mt-auto">
                            <p className="text-success fw-bold mb-2">
                              ₹{product.pricePerUnit}/{product.measuringUnit}
                            </p>
                            <Button 
                              as={Link} 
                              to={`/products/${product._id}`}
                              variant="outline-success" 
                              size="sm"
                              className="w-100"
                            >
                              View Details
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
              <div className="text-center mt-3">
                <Button as={Link} to="/products" variant="success">
                  View All Products
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ConsumerDashboard;