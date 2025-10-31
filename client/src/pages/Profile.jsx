import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Tab, Tabs } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Profile = () => {
  const { user, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Validate input data
    const errors = [];
    if (!profileData.name || profileData.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    }
    if (profileData.phone && !profileData.phone.match(/^\d{10,}$/)) {
      errors.push('Phone number must be at least 10 digits');
    }

    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      setLoading(false);
      return;
    }

    try {
      // Prepare data - trim all values
      const updatedData = {
        name: profileData.name.trim(),
        phone: profileData.phone?.trim() || '',
        address: profileData.address?.trim() || ''
      };

      const response = await api.put(`/api/users/${user.id}`, updatedData);
      
      toast.success('Profile updated successfully');
      setMessage('Profile updated successfully');
      
      // Update local user data if available
      if (response.data.user) {
        // Update the user context with new data
        // This assumes you have an updateUser function in your AuthContext
        // If not, you should implement it
        if (typeof user.updateUser === 'function') {
          user.updateUser(response.data.user);
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Failed to update profile';
      
      toast.error(errorMessage);
      
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => toast.error(err));
      }
      
      setMessage('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      toast.success('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setMessage('Password changed successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card>
            <Card.Header>
              <h3 className="mb-0">User Profile</h3>
            </Card.Header>
            <Card.Body>
              <Tabs
                activeKey={activeTab}
                onSelect={(tab) => setActiveTab(tab)}
                className="mb-3"
              >
                <Tab eventKey="profile" title="Profile Information">
                  {message && (
                    <Alert variant="success" dismissible onClose={() => setMessage('')}>
                      {message}
                    </Alert>
                  )}

                  <Form onSubmit={handleProfileUpdate}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Full Name</Form.Label>
                          <Form.Control
                            type="text"
                            name="name"
                            value={profileData.name}
                            onChange={handleProfileChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Email</Form.Label>
                          <Form.Control
                            type="email"
                            value={profileData.email}
                            disabled
                          />
                          <Form.Text className="text-muted">
                            Email cannot be changed
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Phone Number</Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleProfileChange}
                        placeholder="Enter your phone number"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Address</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="address"
                        value={profileData.address}
                        onChange={handleProfileChange}
                        placeholder="Enter your complete address"
                      />
                      <Form.Text className="text-muted">
                        This address will be used for delivery
                      </Form.Text>
                    </Form.Group>

                    <div className="d-grid">
                      <Button
                        variant="primary"
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? 'Updating...' : 'Update Profile'}
                      </Button>
                    </div>
                  </Form>
                </Tab>

                <Tab eventKey="password" title="Change Password">
                  {message && (
                    <Alert variant="success" dismissible onClose={() => setMessage('')}>
                      {message}
                    </Alert>
                  )}

                  <Form onSubmit={handlePasswordUpdate}>
                    <Form.Group className="mb-3">
                      <Form.Label>Current Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>New Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        required
                        minLength={8}
                      />
                      <Form.Text className="text-muted">
                        Password must be at least 8 characters with uppercase, lowercase, and number
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Confirm New Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </Form.Group>

                    <div className="d-grid">
                      <Button
                        variant="primary"
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? 'Changing Password...' : 'Change Password'}
                      </Button>
                    </div>
                  </Form>
                </Tab>

                <Tab eventKey="account" title="Account Information">
                  <div className="p-3">
                    <h5>Account Details</h5>
                    <hr />
                    <Row>
                      <Col sm={6}>
                        <strong>User ID:</strong>
                      </Col>
                      <Col sm={6}>
                        <span className="text-muted">{user?.id}</span>
                      </Col>
                    </Row>
                    <Row className="mt-2">
                      <Col sm={6}>
                        <strong>Role:</strong>
                      </Col>
                      <Col sm={6}>
                        <span className="text-capitalize">{user?.role}</span>
                      </Col>
                    </Row>
                    <Row className="mt-2">
                      <Col sm={6}>
                        <strong>Member Since:</strong>
                      </Col>
                      <Col sm={6}>
                        <span className="text-muted">
                          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </Col>
                    </Row>
                  </div>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;