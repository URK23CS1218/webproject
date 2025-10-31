import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Home.css'; // We'll create this next

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <Container>
          <Row className="align-items-center min-vh-50">
            <Col lg={6} className="fade-in">
              <h1 className="display-4 fw-bold mb-4 text-white">
                🌱 Agro-Link
              </h1>
              <p className="lead mb-4 text-light">
                Connecting Farmers Directly with Consumers. 
                Fresh produce delivered to your doorstep. Support local agriculture 
                and get the best quality at fair prices.
              </p>
              <div className="d-flex flex-wrap gap-3">
                {!isAuthenticated ? (
                  <>
                    <Button as={Link} to="/signup" variant="light" size="lg" className="px-4 py-3">
                      🚀 Get Started
                    </Button>
                    <Button as={Link} to="/products" variant="outline-light" size="lg" className="px-4 py-3">
                      🛒 Browse Products
                    </Button>
                  </>
                ) : (
                  <Button as={Link} to="/products" variant="light" size="lg" className="px-4 py-3">
                    🛒 Browse Fresh Products
                  </Button>
                )}
              </div>
            </Col>
            <Col lg={6} className="text-center fade-in">
              <div className="hero-visual p-4">
                <div className="d-flex justify-content-center gap-4 mb-4">
                  <div className="visual-item">
                    <div className="visual-icon">👨‍🌾</div>
                    <small className="text-light">Farmers</small>
                  </div>
                  <div className="visual-item">
                    <div className="visual-icon">🛒</div>
                    <small className="text-light">Consumers</small>
                  </div>
                  <div className="visual-item">
                    <div className="visual-icon">🚚</div>
                    <small className="text-light">Delivery</small>
                  </div>
                </div>
                <div className="stats-container bg-light rounded p-3 shadow">
                  <Row className="text-dark">
                    <Col xs={4}>
                      <div className="stat-number text-success fw-bold">100+</div>
                      <div className="stat-label small">Farmers</div>
                    </Col>
                    <Col xs={4}>
                      <div className="stat-number text-success fw-bold">500+</div>
                      <div className="stat-label small">Products</div>
                    </Col>
                    <Col xs={4}>
                      <div className="stat-number text-success fw-bold">1K+</div>
                      <div className="stat-label small">Orders</div>
                    </Col>
                  </Row>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section className="features-section py-5 bg-light">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="fw-bold text-gradient">Why Choose Agro-Link?</h2>
              <p className="text-muted lead">Experience the future of farm-to-table shopping</p>
            </Col>
          </Row>
          
          <Row>
            <Col md={4} className="mb-4">
              <Card className="feature-card h-100 border-0 shadow-custom">
                <Card.Body className="text-center p-4">
                  <div className="feature-icon">👨‍🌾</div>
                  <Card.Title className="h5 mb-3">For Farmers</Card.Title>
                  <Card.Text className="text-muted">
                    Sell your fresh produce directly to consumers without middlemen. 
                    Get fair prices, build your brand, and grow your customer base 
                    with our easy-to-use platform.
                  </Card.Text>
                  {!isAuthenticated && (
                    <Button as={Link} to="/signup" variant="outline-success" className="mt-2">
                      Start Selling →
                    </Button>
                  )}
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={4} className="mb-4">
              <Card className="feature-card h-100 border-0 shadow-custom">
                <Card.Body className="text-center p-4">
                  <div className="feature-icon">🛒</div>
                  <Card.Title className="h5 mb-3">For Consumers</Card.Title>
                  <Card.Text className="text-muted">
                    Buy fresh, organic produce directly from local farmers. 
                    Support local agriculture, get the best quality, and enjoy 
                    farm-fresh delivery right to your doorstep.
                  </Card.Text>
                  {!isAuthenticated && (
                    <Button as={Link} to="/signup" variant="outline-success" className="mt-2">
                      Start Shopping →
                    </Button>
                  )}
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={4} className="mb-4">
              <Card className="feature-card h-100 border-0 shadow-0 shadow-custom">
                <Card.Body className="text-center p-4">
                  <div className="feature-icon">⚡</div>
                  <Card.Title className="h5 mb-3">Fast & Reliable</Card.Title>
                  <Card.Text className="text-muted">
                    Fresh produce delivered within hours of harvest. Real-time tracking, 
                    secure payments, and excellent customer support for the best 
                    farm-to-table experience.
                  </Card.Text>
                  <Button as={Link} to="/products" variant="outline-success" className="mt-2">
                    Explore Now →
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* How It Works */}
      <section className="how-it-works py-5">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="fw-bold text-success">How It Works</h2>
              <p className="text-muted">Simple steps to get started</p>
            </Col>
          </Row>
          <Row className="g-4">
            <Col md={3} className="text-center">
              <div className="step-number bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3">
                1
              </div>
              <h5>Sign Up</h5>
              <p className="text-muted small">Create your account as farmer or consumer</p>
            </Col>
            <Col md={3} className="text-center">
              <div className="step-number bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3">
                2
              </div>
              <h5>Browse & List</h5>
              <p className="text-muted small">Explore products or list your farm produce</p>
            </Col>
            <Col md={3} className="text-center">
              <div className="step-number bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3">
                3
              </div>
              <h5>Order & Confirm</h5>
              <p className="text-muted small">Place orders and get confirmation</p>
            </Col>
            <Col md={3} className="text-center">
              <div className="step-number bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3">
                4
              </div>
              <h5>Delivery</h5>
              <p className="text-muted small">Fresh produce delivered to your door</p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Call to Action */}
      {!isAuthenticated && (
        <section className="cta-section bg-success text-white py-5">
          <Container>
            <Row className="text-center">
              <Col>
                <h3 className="fw-bold mb-3">Ready to Join the Revolution?</h3>
                <p className="mb-4 opacity-90">
                  Join thousands of farmers and consumers already using Agro-Link
                </p>
                <Button as={Link} to="/signup" variant="light" size="lg" className="px-5 py-3 fw-bold">
                  Create Your Free Account
                </Button>
              </Col>
            </Row>
          </Container>
        </section>
      )}
    </div>
  );
};

export default Home;