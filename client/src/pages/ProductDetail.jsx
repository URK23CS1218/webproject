import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Badge, Spinner, Alert, Carousel } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [userLocation, setUserLocation] = useState(null);
  const [withinDeliveryRadius, setWithinDeliveryRadius] = useState(true);

  useEffect(() => {
    fetchProduct();
    getUserLocation();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/api/products/${id}`);
      setProduct(response.data);
      setQuantity(response.data.minOrderQty);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Product not found');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          console.log('Location access denied');
        }
      );
    }
  };

  const calculateDistance = (productCoords) => {
    if (!userLocation || !productCoords) return null;

    const [lng, lat] = productCoords;
    const R = 6371; // Earth's radius in km
    const dLat = (lat - userLocation.lat) * Math.PI / 180;
    const dLng = (lng - userLocation.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  useEffect(() => {
    if (product && userLocation) {
      const distance = calculateDistance(product.location?.coordinates);
      setWithinDeliveryRadius(distance <= product.deliveryRadiusKm);
    }
  }, [product, userLocation]);

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    if (!withinDeliveryRadius) {
      toast.error('This product is not available for delivery in your area');
      return;
    }

    addToCart(product, quantity);
    toast.success('Product added to cart successfully');
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      toast.error('Please login to purchase items');
      navigate('/login');
      return;
    }

    if (!withinDeliveryRadius) {
      toast.error('This product is not available for delivery in your area');
      return;
    }

    addToCart(product, quantity);
    navigate('/cart');
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger">Product not found</Alert>
      </Container>
    );
  }

  const distance = calculateDistance(product.location?.coordinates);

  return (
    <Container className="py-4">
      <Row>
        <Col lg={6}>
          {product.images && product.images.length > 0 ? (
            <Carousel>
              {product.images.map((image, index) => (
                <Carousel.Item key={index}>
                  <img
                    className="d-block w-100 rounded"
                    src={image}
                    alt={`${product.title} ${index + 1}`}
                    style={{ height: '400px', objectFit: 'cover' }}
                  />
                </Carousel.Item>
              ))}
            </Carousel>
          ) : (
            <Card>
              <Card.Img
                variant="top"
                src="/placeholder-image.jpg"
                style={{ height: '400px', objectFit: 'cover' }}
              />
            </Card>
          )}
        </Col>

        <Col lg={6}>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h2>{product.title}</h2>
                  <Badge bg="success" className="mb-2">
                    {product.category}
                  </Badge>
                </div>
                <h3 className="text-success">₹{product.pricePerUnit}/{product.measuringUnit}</h3>
              </div>

              <p className="text-muted">{product.description}</p>

              {distance && (
                <Alert 
                  variant={withinDeliveryRadius ? 'success' : 'warning'} 
                  className="d-flex align-items-center"
                >
                  <i className="fas fa-map-marker-alt me-2"></i>
                  {withinDeliveryRadius 
                    ? `Within delivery range (${distance.toFixed(1)} km away)`
                    : `Outside delivery range (${distance.toFixed(1)} km away, delivers within ${product.deliveryRadiusKm} km)`
                  }
                </Alert>
              )}

              <Row className="mb-3">
                <Col sm={6}>
                  <strong>Minimum Order:</strong> {product.minOrderQty} {product.measuringUnit}
                </Col>
                <Col sm={6}>
                  <strong>Available Quantity:</strong> {product.quantityAvailable} {product.measuringUnit}
                </Col>
              </Row>

              <Row className="mb-3">
                <Col sm={6}>
                  <strong>Shelf Life:</strong> {product.shelfLifeDays} days
                </Col>
                <Col sm={6}>
                  <strong>Delivery Radius:</strong> {product.deliveryRadiusKm} km
                </Col>
              </Row>

              {product.quantityAvailable === 0 ? (
                <Alert variant="danger" className="text-center">
                  <strong>Out of Stock</strong>
                </Alert>
              ) : (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <strong>Quantity ({product.measuringUnit})</strong>
                    </Form.Label>
                    <div className="d-flex align-items-center">
                      <Button
                        variant="outline-secondary"
                        onClick={() => setQuantity(Math.max(product.minOrderQty, quantity - 1))}
                        disabled={quantity <= product.minOrderQty}
                      >
                        -
                      </Button>
                      <Form.Control
                        type="number"
                        value={quantity}
                        onChange={(e) => {
                          const newQuantity = parseInt(e.target.value);
                          if (newQuantity >= product.minOrderQty && newQuantity <= product.quantityAvailable) {
                            setQuantity(newQuantity);
                          }
                        }}
                        min={product.minOrderQty}
                        max={product.quantityAvailable}
                        style={{ width: '100px', margin: '0 10px', textAlign: 'center' }}
                      />
                      <Button
                        variant="outline-secondary"
                        onClick={() => setQuantity(Math.min(product.quantityAvailable, quantity + 1))}
                        disabled={quantity >= product.quantityAvailable}
                      >
                        +
                      </Button>
                    </div>
                    <Form.Text className="text-muted">
                      Minimum order: {product.minOrderQty} {product.measuringUnit}
                    </Form.Text>
                  </Form.Group>

                  <div className="d-grid gap-2">
                    <Button
                      variant="success"
                      size="lg"
                      onClick={handleBuyNow}
                      disabled={!withinDeliveryRadius}
                    >
                      Buy Now - ₹{(product.pricePerUnit * quantity).toFixed(2)}
                    </Button>
                    <Button
                      variant="outline-primary"
                      size="lg"
                      onClick={handleAddToCart}
                      disabled={!withinDeliveryRadius}
                    >
                      Add to Cart
                    </Button>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>

          {/* Farmer Information */}
          <Card className="mt-4">
            <Card.Header>
              <h5 className="mb-0">Farmer Information</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="mb-1">{product.farmer?.name}</h6>
                  <p className="text-muted mb-1">
                    <i className="fas fa-envelope me-2"></i>
                    {product.farmer?.email}
                  </p>
                  {product.farmer?.phone && (
                    <p className="text-muted mb-1">
                      <i className="fas fa-phone me-2"></i>
                      {product.farmer.phone}
                    </p>
                  )}
                  {product.farmer?.address && (
                    <p className="text-muted mb-0">
                      <i className="fas fa-map-marker-alt me-2"></i>
                      {product.farmer.address}
                    </p>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProductDetail;