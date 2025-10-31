import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Form, Spinner, Badge, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './Products.css';
import { toast } from 'react-toastify';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

// Debounce function
function debounce(func, wait) {
  let timeout;
  const debouncedFunction = function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
  debouncedFunction.cancel = () => clearTimeout(timeout);
  return debouncedFunction;
}

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: 'all',
    search: ''
  });

  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const debouncedFetch = useCallback(
    debounce((searchValue) => {
      fetchProducts(searchValue);
    }, 500),
    []
  );

  useEffect(() => {
    if (filters.search) {
      debouncedFetch(filters.search);
    } else {
      fetchProducts();
    }
    return () => debouncedFetch.cancel();
  }, [filters, debouncedFetch]);

  const fetchProducts = async (searchOverride) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      
      if (filters.category !== 'all') params.append('category', filters.category);
      if (searchOverride || filters.search) params.append('search', searchOverride || filters.search);

      console.log('🔍 Fetching products with params:', params.toString());
      
      const response = await api.get(`/api/products?${params}`);
      console.log('✅ Products response:', response.data);
      
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      setError('Failed to load products. Please try again.');
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }

    addToCart(product, product.minOrderQty);
    toast.success('Product added to cart successfully');
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading products...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="text-center">
          <h5>{error}</h5>
          <Button onClick={fetchProducts} variant="outline-danger" className="mt-2">
            Try Again
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h2>Fresh Products</h2>
          <p className="text-muted">Direct from local farmers to your doorstep</p>
        </Col>
      </Row>

      {/* Filters */}
      <Row className="mb-4">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Category</Form.Label>
            <Form.Select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="all">All Categories</option>
              <option value="Rice">Rice</option>
              <option value="Vegetables">Vegetables</option>
              <option value="Fruits">Fruits</option>
              <option value="Grains">Grains</option>
              <option value="Dairy">Dairy</option>
              <option value="Spices">Spices</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group>
            <Form.Label>Search Products</Form.Label>
            <Form.Control
              type="text"
              placeholder="Search by product name..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </Form.Group>
        </Col>
      </Row>

      {/* Products Grid */}
      <Row>
        {products.map((product) => (
          <Col key={product._id} lg={3} md={4} sm={6} className="mb-4">
            <Card className="h-100 product-card">
              <Card.Img
                variant="top"
                src={product.images?.[0] || '/placeholder-image.jpg'}
                style={{ height: '200px', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.src = '/placeholder-image.jpg';
                }}
              />
              <Card.Body className="d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <Card.Title className="h6" style={{ fontSize: '1rem' }}>
                    {product.title}
                  </Card.Title>
                  <Badge bg="success" className="ms-2">{product.category}</Badge>
                </div>
                
                <Card.Text className="text-muted small flex-grow-1">
                  {product.description && product.description.length > 80 
                    ? `${product.description.substring(0, 80)}...` 
                    : product.description || 'No description available'
                  }
                </Card.Text>

                <div className="mt-auto">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <strong className="text-success h5">
                      ₹{product.pricePerUnit}/{product.measuringUnit}
                    </strong>
                    <small className={`badge ${product.quantityAvailable > 0 ? 'bg-success' : 'bg-danger'}`}>
                      {product.quantityAvailable > 0 ? 'In Stock' : 'Out of Stock'}
                    </small>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <small className="text-muted">
                      Min: {product.minOrderQty} {product.measuringUnit}
                    </small>
                    <small className="text-muted">
                      Available: {product.quantityAvailable}
                    </small>
                  </div>

                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      as={Link}
                      to={`/products/${product._id}`}
                      className="flex-fill"
                    >
                      View Details
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleAddToCart(product)}
                      disabled={!isAuthenticated || product.quantityAvailable === 0}
                      className="flex-fill"
                    >
                      {!isAuthenticated ? 'Login to Buy' : 
                       product.quantityAvailable === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </Button>
                  </div>

                  <div className="mt-2 farmer-info">
                    <small className="text-muted d-block">
                      <i className="bi bi-person"></i> Farmer: {product.farmer?.name || 'Local Farmer'}
                    </small>
                    {product.farmer?.address?.city && (
                      <small className="text-muted d-block">
                        <i className="bi bi-geo-alt"></i> {product.farmer.address.city}
                      </small>
                    )}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {products.length === 0 && !loading && (
        <div className="text-center py-5">
          <h4>No products found</h4>
          <p className="text-muted">Try adjusting your filters or search terms</p>
          <Button 
            onClick={() => setFilters({ category: 'all', search: '' })}
            variant="outline-success"
          >
            Clear Filters
          </Button>
        </div>
      )}
    </Container>
  );
};

export default Products;