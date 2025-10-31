import React from 'react';
import { Container, Row, Col, Card, Button, Form, Table } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    updateQuantity(productId, newQuantity);
  };

  const handleRemoveItem = (productId) => {
    removeFromCart(productId);
    toast.success('Item removed from cart');
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    // Check if all items are from the same farmer
    const farmerIds = [...new Set(cartItems.map(item => item.product.farmer._id))];
    if (farmerIds.length > 1) {
      toast.error('All items in cart must be from the same farmer');
      return;
    }

    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <Container className="py-5 text-center">
        <h3>Your cart is empty</h3>
        <p>Add some fresh products to get started!</p>
        <Button as={Link} to="/products" variant="success" size="lg">
          Browse Products
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row>
        <Col lg={8}>
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="mb-0">Shopping Cart</h4>
                <Button variant="outline-danger" size="sm" onClick={clearCart}>
                  Clear Cart
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <Table responsive>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item) => (
                    <tr key={item.product._id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <img
                            src={item.product.images?.[0] || '/placeholder-image.jpg'}
                            alt={item.product.title}
                            style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                            className="rounded me-3"
                          />
                        <div>
                          <h6 className="mb-1">{item.product.title}</h6>
                          <small className="text-muted">
                            Farmer: {item.product.farmer?.name || 'Unknown Farmer'}
                          </small>
                            <br />
                            <small className="text-muted">
                              Min: {item.product.minOrderQty} {item.product.measuringUnit}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>₹{item.product.pricePerUnit}/{item.product.measuringUnit}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
                            disabled={item.quantity <= item.product.minOrderQty}
                          >
                            -
                          </Button>
                          <Form.Control
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.product._id, parseInt(e.target.value))}
                            min={item.product.minOrderQty}
                            style={{ width: '70px', margin: '0 8px' }}
                          />
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.quantityAvailable}
                          >
                            +
                          </Button>
                        </div>
                        <small className="text-muted">
                          Available: {item.product.quantityAvailable}
                        </small>
                      </td>
                      <td>₹{(item.product.pricePerUnit * item.quantity).toFixed(2)}</td>
                      <td>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleRemoveItem(item.product._id)}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Order Summary</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal:</span>
                <span>₹{getCartTotal().toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Delivery:</span>
                <span className="text-success">Free</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-3">
                <strong>Total:</strong>
                <strong>₹{getCartTotal().toFixed(2)}</strong>
              </div>

              <Button
                variant="success"
                size="lg"
                className="w-100"
                onClick={handleCheckout}
              >
                Proceed to Checkout
              </Button>

              <Button
                as={Link}
                to="/products"
                variant="outline-primary"
                className="w-100 mt-2"
              >
                Continue Shopping
              </Button>
            </Card.Body>
          </Card>

          <Card className="mt-3">
            <Card.Body>
              <h6>Delivery Information</h6>
              <small className="text-muted">
                All items will be delivered from: {cartItems[0]?.product.farmer.name}
                <br />
                Expected delivery: 2-3 business days
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Cart;