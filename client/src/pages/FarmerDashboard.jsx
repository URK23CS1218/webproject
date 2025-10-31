import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Modal, Form, Alert, Spinner, Nav, Tab, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

const FarmerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(true);
  const [images, setImages] = useState([]);
  const [imageErrors, setImageErrors] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    title: '',
    description: '',
    category: 'Vegetables',
    pricePerUnit: '',
    measuringUnit: 'kg',
    minOrderQty: '',
    shelfLifeDays: '',
    quantityAvailable: '',
    deliveryRadiusKm: '10'
  });

  // Load farmer's products and orders from API
  useEffect(() => {
    loadFarmerProducts();
    loadFarmerOrders();
  }, []);

  const loadFarmerOrders = async () => {
    try {
      setOrderLoading(true);
      const response = await api.get('/api/orders/farmer');
      setOrders(response.data);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setOrderLoading(false);
    }
  };

  const loadFarmerProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/products/farmer/my-products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate number of images
    if (files.length + images.length > 5) {
      setImageErrors('Maximum 5 images allowed');
      return;
    }

    // Validate file types and sizes
    const invalidFile = files.find(file => 
      !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024
    );
    
    if (invalidFile) {
      setImageErrors('Only image files under 5MB are allowed');
      return;
    }

    setImages([...images, ...files]);
    setImageErrors('');
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      // Validate images
      if (images.length === 0) {
        toast.error('Please upload at least one image');
        return;
      }

      // Validate all required fields
      const requiredFields = {
        title: 'Product title',
        description: 'Description',
        category: 'Category',
        pricePerUnit: 'Price per unit',
        measuringUnit: 'Unit',
        minOrderQty: 'Minimum order quantity',
        shelfLifeDays: 'Shelf life',
        quantityAvailable: 'Quantity available',
        deliveryRadiusKm: 'Delivery radius'
      };

      for (const [key, label] of Object.entries(requiredFields)) {
        if (!newProduct[key]) {
          toast.error(`${label} is required`);
          return;
        }
      }

      // Create form data
      const formData = new FormData();

      // Add product data with type conversion
      for (const [key, value] of Object.entries(newProduct)) {
        // Convert numeric fields
        if (['pricePerUnit', 'minOrderQty', 'shelfLifeDays', 'quantityAvailable', 'deliveryRadiusKm'].includes(key)) {
          formData.append(key, Number(value));
        } else {
          formData.append(key, value);
        }
      }

      // Add images
      images.forEach((image, index) => {
        formData.append('images', image);
      });

      console.log('Submitting product...');
      for (let [key, value] of formData.entries()) {
        if (key === 'images') {
          console.log(`Image ${value.name}:`, {
            type: value.type,
            size: value.size,
            lastModified: new Date(value.lastModified).toISOString()
          });
        } else {
          console.log(`${key}:`, value);
        }
      }

      // Submit the form
      const response = await api.post('/api/products', formData);
      
      console.log('✅ API Response:', response.data);
      
      // Add the new product to the list
      setProducts([...products, response.data.product]);
      setShowAddModal(false);
      
      // Reset form
      setNewProduct({
        title: '',
        description: '',
        category: 'Vegetables',
        pricePerUnit: '',
        measuringUnit: 'kg',
        minOrderQty: '',
        shelfLifeDays: '',
        quantityAvailable: '',
        deliveryRadiusKm: '10'
      });
      setImages([]);
      
      toast.success('Product added successfully!');
    } catch (error) {
      console.error('❌ Error adding product:', error);
      console.error('Error response:', error.response);
      toast.error(error.response?.data?.message || 'Failed to add product');
    }
  };

  const handleEditProduct = async () => {
    try {
      if (!selectedProduct) return;

      // Validate all required fields
      const requiredFields = {
        title: 'Product title',
        description: 'Description',
        category: 'Category',
        pricePerUnit: 'Price per unit',
        measuringUnit: 'Unit',
        minOrderQty: 'Minimum order quantity',
        shelfLifeDays: 'Shelf life',
        quantityAvailable: 'Quantity available',
        deliveryRadiusKm: 'Delivery radius'
      };

      for (const [key, label] of Object.entries(requiredFields)) {
        if (!selectedProduct[key]) {
          toast.error(`${label} is required`);
          return;
        }
      }

      // Validate at least one image
      if (selectedProduct.existingImages.length === 0 && images.length === 0) {
        toast.error('Please upload at least one image');
        return;
      }

      // Create form data
      const formData = new FormData();

      // Add text fields
      formData.append('title', selectedProduct.title);
      formData.append('description', selectedProduct.description);
      formData.append('category', selectedProduct.category);
      formData.append('measuringUnit', selectedProduct.measuringUnit);

      // Add numeric fields with explicit conversion
      formData.append('pricePerUnit', Number(selectedProduct.pricePerUnit).toString());
      formData.append('minOrderQty', Number(selectedProduct.minOrderQty).toString());
      formData.append('shelfLifeDays', Number(selectedProduct.shelfLifeDays).toString());
      formData.append('quantityAvailable', Number(selectedProduct.quantityAvailable).toString());
      formData.append('deliveryRadiusKm', Number(selectedProduct.deliveryRadiusKm).toString());

      // Add existing images as a JSON string
      formData.append('existingImages', JSON.stringify(selectedProduct.existingImages));

      // Add new images
      images.forEach((image) => {
        formData.append('images', image);
      });

      // Submit the form
      const response = await api.put(`/api/products/${selectedProduct._id}`, formData);
      
      // Update the products list with the edited product
      setProducts(products.map(p => 
        p._id === selectedProduct._id ? response.data.product : p
      ));
      
      setShowEditModal(false);
      toast.success('Product updated successfully!');
      
      // Reset form
      setSelectedProduct(null);
      setImages([]);
      
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error(error.response?.data?.message || 'Failed to update product');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/api/products/${productId}`);
        setProducts(products.filter(p => p._id !== productId));
        toast.success('Product deleted successfully!');
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Failed to delete product');
      }
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/api/orders/${orderId}/status`, { status: newStatus });
      toast.success('Order status updated successfully');
      // Refresh orders to show updated status
      loadFarmerOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error(error.response?.data?.message || 'Failed to update order status');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'placed': 'warning',
      'accepted': 'info',
      'packed': 'primary',
      'dispatched': 'info',
      'delivered': 'success',
      'cancelled': 'danger'
    };
    const labels = {
      'placed': 'New Order',
      'accepted': 'Accepted',
      'packed': 'Packed',
      'dispatched': 'Out for Delivery',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };
    return <Badge bg={variants[status] || 'secondary'}>{labels[status] || status}</Badge>;
  };

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h2>Farmer Dashboard</h2>
          <p className="text-muted">Manage your products and orders</p>
        </Col>
        <Col xs="auto">
          <Button variant="success" onClick={() => setShowAddModal(true)}>
            + Add New Product
          </Button>
        </Col>
      </Row>

      <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
        <Nav variant="tabs" className="mb-4">
          <Nav.Item>
            <Nav.Link eventKey="products">Products</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="orders">Orders</Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content>
          <Tab.Pane eventKey="products">
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="success" />
                <p className="mt-2">Loading your products...</p>
              </div>
            ) : (
              <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Your Products</h5>
                  <Badge bg="primary">{products.length} products</Badge>
                </Card.Header>
                <Card.Body>
                  {products.length === 0 ? (
                    <div className="text-center py-4">
                      <p>You haven't added any products yet.</p>
                      <Button variant="success" onClick={() => setShowAddModal(true)}>
                        Add Your First Product
                      </Button>
                    </div>
                  ) : (
                    <Table responsive hover>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Category</th>
                          <th>Price</th>
                          <th>Available</th>
                          <th>Min Order</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product) => (
                          <tr key={product._id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <img
                                  src={product.images?.[0] || '/placeholder-product.jpg'}
                                  alt={product.title}
                                  style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                  className="me-2 rounded"
                                />
                                <div>
                                  <strong>{product.title}</strong>
                                  <br />
                                  <small className="text-muted">
                                    {product.description.length > 50 
                                      ? `${product.description.substring(0, 50)}...` 
                                      : product.description
                                    }
                                  </small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <Badge bg="outline-success" text="dark">
                                {product.category}
                              </Badge>
                            </td>
                            <td>₹{product.pricePerUnit}/{product.measuringUnit}</td>
                            <td>{product.quantityAvailable} {product.measuringUnit}</td>
                            <td>{product.minOrderQty} {product.measuringUnit}</td>
                            <td>
                              <Badge bg={product.quantityAvailable > 0 ? 'success' : 'danger'}>
                                {product.quantityAvailable > 0 ? 'In Stock' : 'Out of Stock'}
                              </Badge>
                            </td>
                            <td>
                              <div className="d-flex gap-1">
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedProduct({
                                      ...product,
                                      existingImages: product.images || []
                                    });
                                    setImages([]);
                                    setShowEditModal(true);
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button 
                                  variant="outline-danger" 
                                  size="sm"
                                  onClick={() => handleDeleteProduct(product._id)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            )}
          </Tab.Pane>

          <Tab.Pane eventKey="orders">
            {orderLoading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="success" />
                <p className="mt-2">Loading orders...</p>
              </div>
            ) : (
              <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Orders</h5>
                  <Badge bg="primary">{orders.length} orders</Badge>
                </Card.Header>
                <Card.Body>
                  {orders.length === 0 ? (
                    <div className="text-center py-4">
                      <p>No orders received yet.</p>
                    </div>
                  ) : (
                    <Table responsive hover>
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Customer</th>
                          <th>Items</th>
                          <th>Total</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order._id}>
                            <td>
                              #{order._id.slice(-6)}
                              <br />
                              <small className="text-muted">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </small>
                            </td>
                            <td>
                              <div>
                                <strong>{order.consumer?.name}</strong>
                                <small className="text-muted d-block">{order.consumer?.email}</small>
                                <small className="text-muted d-block">{order.consumer?.phone}</small>
                              </div>
                            </td>
                            <td>
                              {order.items.map((item, idx) => (
                                <div key={idx} className="mb-1">
                                  <strong>{item.product?.title || item.title}</strong>
                                  <br />
                                  <small className="text-muted">
                                    {item.qty ?? item.quantity} {item.measuringUnit || item.product?.measuringUnit} × ₹{item.unitPrice ?? item.product?.pricePerUnit}
                                  </small>
                                </div>
                              ))}
                            </td>
                            <td>
                              <strong>₹{order.subtotal}</strong>
                              <div className="mt-1">
                                <small className="text-muted">Cash on Delivery</small>
                              </div>
                            </td>
                            <td>
                              {getStatusBadge(order.status)}
                              <div className="mt-2">
                                <Form.Select 
                                  size="sm" 
                                  value={order.status}
                                  onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                                >
                                  <option value="placed">Placed</option>
                                  <option value="accepted">Accepted</option>
                                  <option value="packed">Packed</option>
                                  <option value="dispatched">Dispatched</option>
                                  <option value="delivered">Delivered</option>
                                </Form.Select>
                              </div>
                            </td>
                            <td>
                              <div className="d-grid gap-2">
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  onClick={() => {
                                    window.open(`/orders/${order._id}`, '_blank');
                                  }}
                                >
                                  View Details
                                </Button>
                                {order.status === 'placed' && (
                                  <Button 
                                    variant="outline-success" 
                                    size="sm"
                                    onClick={() => handleUpdateOrderStatus(order._id, 'accepted')}
                                  >
                                    Accept Order
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            )}
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>

      {/* Add Product Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add New Product</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddProduct}>
          <Modal.Body>
            {/* Image Upload Section */}
            <Form.Group className="mb-3">
              <Form.Label>Product Images *</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                isInvalid={!!imageErrors}
              />
              <Form.Text className="text-muted">
                Select up to 5 images (JPG, PNG, GIF, max 5MB each)
              </Form.Text>
              <Form.Control.Feedback type="invalid">
                {imageErrors}
              </Form.Control.Feedback>
              
              {/* Image Previews */}
              <Row className="mt-2">
                {images.map((file, idx) => (
                  <Col key={idx} xs={6} md={4} lg={3} className="mb-2">
                    <div className="position-relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${idx + 1}`}
                        className="img-thumbnail w-100"
                        style={{ aspectRatio: '1/1', objectFit: 'cover' }}
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        className="position-absolute top-0 end-0 m-1"
                        onClick={() => removeImage(idx)}
                      >
                        ×
                      </Button>
                    </div>
                  </Col>
                ))}
              </Row>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Product Title *</Form.Label>
                  <Form.Control
                    type="text"
                    value={newProduct.title}
                    onChange={(e) => setNewProduct({...newProduct, title: e.target.value})}
                    required
                    placeholder="e.g., Organic Tomatoes"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category *</Form.Label>
                  <Form.Select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    required
                  >
                    <option value="Vegetables">Vegetables</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Rice">Rice</option>
                    <option value="Grains">Grains</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Spices">Spices</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newProduct.description}
                onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                required
                placeholder="Describe your product in detail..."
              />
            </Form.Group>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Price (₹) *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    value={newProduct.pricePerUnit}
                    onChange={(e) => setNewProduct({...newProduct, pricePerUnit: e.target.value})}
                    required
                    placeholder="0.00"
                  />
                  <Form.Text className="text-muted">
                    Price per unit
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Unit *</Form.Label>
                  <Form.Select
                    value={newProduct.measuringUnit}
                    onChange={(e) => setNewProduct({...newProduct, measuringUnit: e.target.value})}
                    required
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="packet">packet</option>
                    <option value="bunch">bunch</option>
                    <option value="piece">piece</option>
                    <option value="litre">litre</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Min Order Qty *</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={newProduct.minOrderQty}
                    onChange={(e) => setNewProduct({...newProduct, minOrderQty: e.target.value})}
                    required
                    placeholder="1"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Shelf Life (Days) *</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={newProduct.shelfLifeDays}
                    onChange={(e) => setNewProduct({...newProduct, shelfLifeDays: e.target.value})}
                    required
                    placeholder="7"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Quantity Available *</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={newProduct.quantityAvailable}
                    onChange={(e) => setNewProduct({...newProduct, quantityAvailable: e.target.value})}
                    required
                    placeholder="100"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Delivery Radius (km) *</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={newProduct.deliveryRadiusKm}
                    onChange={(e) => setNewProduct({...newProduct, deliveryRadiusKm: e.target.value})}
                    required
                    placeholder="10"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="success" type="submit">
              Add Product
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProduct && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Product Title</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedProduct.title}
                  onChange={(e) => setSelectedProduct({
                    ...selectedProduct,
                    title: e.target.value
                  })}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={selectedProduct.description}
                  onChange={(e) => setSelectedProduct({
                    ...selectedProduct,
                    description: e.target.value
                  })}
                />
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Category</Form.Label>
                    <Form.Select
                      value={selectedProduct.category}
                      onChange={(e) => setSelectedProduct({
                        ...selectedProduct,
                        category: e.target.value
                      })}
                    >
                      <option value="Vegetables">Vegetables</option>
                      <option value="Fruits">Fruits</option>
                      <option value="Grains">Grains</option>
                      <option value="Dairy">Dairy</option>
                      <option value="Others">Others</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Price per Unit (₹)</Form.Label>
                    <Form.Control
                      type="number"
                      value={selectedProduct.pricePerUnit}
                      onChange={(e) => setSelectedProduct({
                        ...selectedProduct,
                        pricePerUnit: e.target.value
                      })}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Unit</Form.Label>
                    <Form.Select
                      value={selectedProduct.measuringUnit}
                      onChange={(e) => setSelectedProduct({
                        ...selectedProduct,
                        measuringUnit: e.target.value
                      })}
                    >
                      <option value="kg">Kilogram (kg)</option>
                      <option value="g">Gram (g)</option>
                      <option value="l">Liter (l)</option>
                      <option value="ml">Milliliter (ml)</option>
                      <option value="piece">Piece</option>
                      <option value="dozen">Dozen</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Minimum Order Quantity</Form.Label>
                    <Form.Control
                      type="number"
                      value={selectedProduct.minOrderQty}
                      onChange={(e) => setSelectedProduct({
                        ...selectedProduct,
                        minOrderQty: e.target.value
                      })}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Available Quantity</Form.Label>
                    <Form.Control
                      type="number"
                      value={selectedProduct.quantityAvailable}
                      onChange={(e) => setSelectedProduct({
                        ...selectedProduct,
                        quantityAvailable: e.target.value
                      })}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Shelf Life (days)</Form.Label>
                    <Form.Control
                      type="number"
                      value={selectedProduct.shelfLifeDays}
                      onChange={(e) => setSelectedProduct({
                        ...selectedProduct,
                        shelfLifeDays: e.target.value
                      })}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Delivery Radius (km)</Form.Label>
                <Form.Control
                  type="number"
                  value={selectedProduct.deliveryRadiusKm}
                  onChange={(e) => setSelectedProduct({
                    ...selectedProduct,
                    deliveryRadiusKm: e.target.value
                  })}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Images</Form.Label>
                <div className="mb-2">
                  <small className="text-muted">Current images:</small>
                  <div className="d-flex gap-2 mb-2">
                    {selectedProduct.existingImages.map((image, index) => (
                      <div key={index} className="position-relative">
                        <img
                          src={image}
                          alt={`Product ${index + 1}`}
                          style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                          className="rounded"
                        />
                        <Button
                          variant="danger"
                          size="sm"
                          className="position-absolute top-0 end-0"
                          onClick={() => {
                            setSelectedProduct({
                              ...selectedProduct,
                              existingImages: selectedProduct.existingImages.filter((_, i) => i !== index)
                            });
                          }}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                <Form.Control
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {imageErrors && <Alert variant="danger" className="mt-2">{imageErrors}</Alert>}
                {images.length > 0 && (
                  <div className="mt-2">
                    <small className="text-muted">New images to upload:</small>
                    <div className="d-flex gap-2">
                      {images.map((image, index) => (
                        <div key={index} className="position-relative">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`New ${index + 1}`}
                            style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                            className="rounded"
                          />
                          <Button
                            variant="danger"
                            size="sm"
                            className="position-absolute top-0 end-0"
                            onClick={() => removeImage(index)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleEditProduct}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default FarmerDashboard;