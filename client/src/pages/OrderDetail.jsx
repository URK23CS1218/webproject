import React from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const OrderDetail = () => {
  return (
    <Container className="py-4">
      <Card>
        <Card.Header>
          <h3 className="mb-0">Order Details</h3>
        </Card.Header>
        <Card.Body>
          <div className="text-center py-5">
            <h4>Order Detail Page</h4>
            <p className="text-muted">Order details functionality will be implemented here</p>
            <Button as={Link} to="/" variant="success">
              Back to Home
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default OrderDetail;