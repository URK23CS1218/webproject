import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Alert, Image } from 'react-bootstrap';

const AddProductModal = ({ show, onHide, onSubmit, product }) => {
  const [imagePreview, setImagePreview] = useState([]);
  const [formData, setFormData] = useState({
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
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (product) {
      // Editing existing product
      setFormData({
        title: product.title,
        description: product.description,
        category: product.category,
        pricePerUnit: product.pricePerUnit,
        measuringUnit: product.measuringUnit,
        minOrderQty: product.minOrderQty,
        shelfLifeDays: product.shelfLifeDays,
        quantityAvailable: product.quantityAvailable,
        deliveryRadiusKm: product.deliveryRadiusKm
      });
      setExistingImages(product.images || []);
    } else {
      // Adding new product
      setFormData({
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
      setExistingImages([]);
    }
    setImages([]);
    setErrors({});
  }, [product, show]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const handleImageChange = (e) => {
    try {
      const files = Array.from(e.target.files);
      
      // Validate number of images
      if (files.length + images.length > 5) {
        setErrors({ ...errors, images: 'Maximum 5 images allowed' });
        return;
      }

      // Validate file types and sizes
      const invalidFile = files.find(file => !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024);
      if (invalidFile) {
        setErrors({ ...errors, images: 'Only image files under 5MB are allowed' });
        return;
      }

      // Create preview URLs
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setImagePreview(prev => [...prev, ...newPreviews]);
      
      setImages(prev => [...prev, ...files]);
      setErrors({ ...errors, images: '' });
    } catch (error) {
      console.error('Error handling images:', error);
      setErrors({ ...errors, images: 'Error processing images' });
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Create FormData to handle file uploads
    const formDataToSubmit = new FormData();
    
            {/* Image Upload Section */}
            <Form.Group className="mb-4">
              <Form.Label>Product Images (Max 5)</Form.Label>
              <div className="mb-2">
                <Form.Control
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  isInvalid={!!errors.images}
                />
                <Form.Text className="text-muted">
                  Select up to 5 images (max 5MB each). Supported formats: JPG, PNG, GIF
                </Form.Text>
                <Form.Control.Feedback type="invalid">
                  {errors.images}
                </Form.Control.Feedback>
              </div>

              {/* Image Preview Section */}
              {(imagePreview.length > 0 || existingImages.length > 0) && (
                <Row className="mt-3">
                  {existingImages.map((url, index) => (
                    <Col key={`existing-${index}`} xs={6} md={4} lg={3} className="mb-3">
                      <div className="position-relative">
                        <img
                          src={url}
                          alt={`Product ${index + 1}`}
                          className="img-thumbnail w-100"
                          style={{ aspectRatio: '1/1', objectFit: 'cover' }}
                        />
                        <Button
                          variant="danger"
                          size="sm"
                          className="position-absolute top-0 end-0 m-1"
                          onClick={() => removeExistingImage(index)}
                        >
                          ×
                        </Button>
                      </div>
                    </Col>
                  ))}
                  {imagePreview.map((url, index) => (
                    <Col key={`preview-${index}`} xs={6} md={4} lg={3} className="mb-3">
                      <div className="position-relative">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="img-thumbnail w-100"
                          style={{ aspectRatio: '1/1', objectFit: 'cover' }}
                        />
                        <Button
                          variant="danger"
                          size="sm"
                          className="position-absolute top-0 end-0 m-1"
                          onClick={() => removeImage(index)}
                        >
                          ×
                        </Button>
                      </div>
                    </Col>
                  ))}
                </Row>
              )}
            </Form.Group>
    // Add all product data
    Object.keys(formData).forEach(key => {
      formDataToSubmit.append(key, formData[key]);
    });

    // Add new images
    images.forEach(image => {
      formDataToSubmit.append('images', image);
    });

    // Add existing images
    formDataToSubmit.append('existingImages', JSON.stringify(existingImages));

    const submitData = {
      ...formData,
      pricePerUnit: parseFloat(formData.pricePerUnit),
      minOrderQty: parseInt(formData.minOrderQty),
      shelfLifeDays: parseInt(formData.shelfLifeDays),
      quantityAvailable: parseInt(formData.quantityAvailable),
      images: formDataToSubmit,
      deliveryRadiusKm: parseInt(formData.deliveryRadiusKm),
      images: [...existingImages, ...images]
    };

    onSubmit(submitData);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (!formData.pricePerUnit || formData.pricePerUnit <= 0) errors.pricePerUnit = 'Valid price is required';
    if (!formData.minOrderQty || formData.minOrderQty < 1) errors.minOrderQty = 'Minimum order quantity must be at least 1';
    if (!formData.shelfLifeDays || formData.shelfLifeDays < 1) errors.shelfLifeDays = 'Shelf life must be at least 1 day';
    if (!formData.quantityAvailable || formData.quantityAvailable < 0) errors.quantityAvailable = 'Valid quantity is required';
    if (!formData.deliveryRadiusKm || formData.deliveryRadiusKm < 1) errors.deliveryRadiusKm = 'Delivery radius must be at least 1 km';

    return errors;
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {product ? 'Edit Product' : 'Add New Product'}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Product Title *</Form.Label>
                <Form.Control
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  isInvalid={!!errors.title}
                  placeholder="e.g., Organic Tomatoes"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.title}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Category *</Form.Label>
                <Form.Select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="Rice">Rice</option>
                  <option value="Vegetables">Vegetables</option>
                  <option value="Fruits">Fruits</option>
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
              name="description"
              value={formData.description}
              onChange={handleChange}
              isInvalid={!!errors.description}
              placeholder="Describe your product in detail..."
            />
            <Form.Control.Feedback type="invalid">
              {errors.description}
            </Form.Control.Feedback>
          </Form.Group>

          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Price Per Unit (₹) *</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  name="pricePerUnit"
                  value={formData.pricePerUnit}
                  onChange={handleChange}
                  isInvalid={!!errors.pricePerUnit}
                  placeholder="0.00"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.pricePerUnit}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Measuring Unit *</Form.Label>
                <Form.Select
                  name="measuringUnit"
                  value={formData.measuringUnit}
                  onChange={handleChange}
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
                  name="minOrderQty"
                  value={formData.minOrderQty}
                  onChange={handleChange}
                  isInvalid={!!errors.minOrderQty}
                  placeholder="1"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.minOrderQty}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Shelf Life (Days) *</Form.Label>
                <Form.Control
                  type="number"
                  name="shelfLifeDays"
                  value={formData.shelfLifeDays}
                  onChange={handleChange}
                  isInvalid={!!errors.shelfLifeDays}
                  placeholder="7"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.shelfLifeDays}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Quantity Available *</Form.Label>
                <Form.Control
                  type="number"
                  name="quantityAvailable"
                  value={formData.quantityAvailable}
                  onChange={handleChange}
                  isInvalid={!!errors.quantityAvailable}
                  placeholder="100"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.quantityAvailable}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Delivery Radius (km) *</Form.Label>
                <Form.Control
                  type="number"
                  name="deliveryRadiusKm"
                  value={formData.deliveryRadiusKm}
                  onChange={handleChange}
                  isInvalid={!!errors.deliveryRadiusKm}
                  placeholder="10"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.deliveryRadiusKm}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Product Images</Form.Label>
            <Form.Control
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              isInvalid={!!errors.images}
            />
            <Form.Text className="text-muted">
              You can upload up to 5 images. First image will be used as main display.
            </Form.Text>
            <Form.Control.Feedback type="invalid">
              {errors.images}
            </Form.Control.Feedback>
          </Form.Group>

          {/* Existing Images */}
          {existingImages.length > 0 && (
            <div className="mb-3">
              <Form.Label>Current Images</Form.Label>
              <div className="d-flex flex-wrap gap-2">
                {existingImages.map((image, index) => (
                  <div key={index} className="position-relative">
                    <Image
                      src={image}
                      alt={`Product ${index + 1}`}
                      style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                      className="rounded border"
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      className="position-absolute top-0 end-0"
                      style={{ transform: 'translate(50%, -50%)' }}
                      onClick={() => removeExistingImage(index)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Images Preview */}
          {images.length > 0 && (
            <div className="mb-3">
              <Form.Label>New Images to Upload</Form.Label>
              <div className="d-flex flex-wrap gap-2">
                {images.map((image, index) => (
                  <div key={index} className="position-relative">
                    <Image
                      src={URL.createObjectURL(image)}
                      alt={`New ${index + 1}`}
                      style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                      className="rounded border"
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      className="position-absolute top-0 end-0"
                      style={{ transform: 'translate(50%, -50%)' }}
                      onClick={() => removeImage(index)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {Object.keys(errors).length > 0 && (
            <Alert variant="danger">
              Please fix the errors above before submitting.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="success" type="submit">
            {product ? 'Update Product' : 'Add Product'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AddProductModal;