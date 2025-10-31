import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    deliveryAddress: user?.address || '',
    phone: user?.phone || '',
    specialInstructions: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  if (cartItems.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.deliveryAddress.trim()) {
      errors.deliveryAddress = 'Delivery address is required';
    } else if (formData.deliveryAddress.trim().length < 10) {
      errors.deliveryAddress = 'Address must be at least 10 characters';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      errors.phone = 'Please enter a valid 10-digit phone number';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      toast.error('Your cart is empty');
      navigate('/cart');
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        items: cartItems.map(item => ({
          productId: item.product._id,
          quantity: item.quantity,
          price: item.product.price,
          farmerId: item.product.farmer
        })),
        deliveryAddress: formData.deliveryAddress.trim(),
        phone: formData.phone.trim(),
        specialInstructions: formData.specialInstructions || ''
      };

      const response = await api.post('/api/orders', orderData);

      toast.success('Order placed successfully!');
      clearCart();
      navigate('/consumer/dashboard', {
        state: {
          message: 'Order placed successfully!',
          orders: response.data.orders
        }
      });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to place order';
      toast.error(errorMessage);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  const cartTotal = getCartTotal();
  const farmer = cartItems[0]?.product.farmer;

  return (
    <Container className="py-4">
      <Row>
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header>
              <h4 className="mb-0">Delivery Information</h4>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Delivery Address *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="deliveryAddress"
                    value={formData.deliveryAddress}
                    onChange={handleChange}
                    isInvalid={!!errors.deliveryAddress}
                    placeholder="Enter complete delivery address with landmarks..."
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.deliveryAddress}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Please provide detailed address for smooth delivery
                  </Form.Text>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone Number *</Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        isInvalid={!!errors.phone}
                        placeholder="10-digit mobile number"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.phone}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        value={user?.email}
                        disabled
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Special Instructions (Optional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="specialInstructions"
                    value={formData.specialInstructions}
                    onChange={handleChange}
                    placeholder="Any special delivery instructions..."
                  />
                </Form.Group>

                <div className="d-grid">
                  <Button
                    variant="success"
                    size="lg"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Placing Order...' : `Place Order - ₹${cartTotal.toFixed(2)}`}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Order Summary</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <strong>Farmer:</strong> {farmer?.name}
                <br />
                <small className="text-muted">
                  {farmer?.address}
                </small>
              </div>

              <ListGroup variant="flush">
                {cartItems.map((item) => (
                  <ListGroup.Item key={item.product._id} className="px-0">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="mb-1">{item.product.title}</h6>
                        <small className="text-muted">
                          {item.quantity} {item.product.measuringUnit} × ₹{item.product.pricePerUnit}
                        </small>
                      </div>
                      <strong>₹{(item.quantity * item.product.pricePerUnit).toFixed(2)}</strong>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>

              <hr />
              <div className="d-flex justify-content-between">
                <strong>Subtotal:</strong>
                <strong>₹{cartTotal.toFixed(2)}</strong>
              </div>
              <div className="d-flex justify-content-between text-muted">
                <small>Delivery:</small>
                <small>FREE</small>
              </div>
              <hr />
              <div className="d-flex justify-content-between h5">
                <strong>Total:</strong>
                <strong className="text-success">₹{cartTotal.toFixed(2)}</strong>
              </div>
            </Card.Body>
          </Card>

          <Card className="mt-3">
            <Card.Body>
              <h6>Delivery Information</h6>
              <small className="text-muted">
                • Orders are typically delivered within 2-3 business days
                <br />
                • Farmer will contact you for delivery confirmation
                <br />
                • Free delivery within {cartItems[0]?.product.deliveryRadiusKm} km radius
                <br />
                • You can track order status in your dashboard
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Checkout;