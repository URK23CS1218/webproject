import React from 'react';
import { Navbar, Nav, Container, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

const NavigationBar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <Navbar bg="success" variant="dark" expand="lg" sticky="top">
      <Container>
        <Navbar.Brand as={Link} to="/">
          🌱 Agro-Link
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            <Nav.Link as={Link} to="/products">Products</Nav.Link>
            
            {isAuthenticated && user?.role === 'consumer' && (
              <Nav.Link as={Link} to="/consumer/dashboard">Dashboard</Nav.Link>
            )}
            
            {isAuthenticated && user?.role === 'farmer' && (
              <Nav.Link as={Link} to="/farmer/dashboard">Dashboard</Nav.Link>
            )}
          </Nav>

          <Nav>
            {isAuthenticated ? (
              <>
                {user.role === 'consumer' && (
                  <Nav.Link as={Link} to="/cart" className="position-relative">
                    🛒 Cart
                    {cartItemCount > 0 && (
                      <Badge 
                        bg="danger" 
                        className="position-absolute top-0 start-100 translate-middle"
                        style={{ fontSize: '0.6rem' }}
                      >
                        {cartItemCount}
                      </Badge>
                    )}
                  </Nav.Link>
                )}
                
                <Navbar.Text className="mx-2">
                  Welcome, {user?.name} ({user?.role})
                </Navbar.Text>

                {/* Profile Link Added Here */}
                <Nav.Link as={Link} to="/profile">Profile</Nav.Link>
                
                <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                <Nav.Link as={Link} to="/signup">Sign Up</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;