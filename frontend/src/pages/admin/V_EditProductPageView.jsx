import React from "react";
import { Layout, Form, Input, InputNumber, Button, Typography, Select, Divider, Spin, Upload, Image, message, Modal } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import V_BaseView from "@components/V_BaseView";
import axios from "axios";

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

/**
 * V_EditProductPageView
 * View component for editing existing product
 */
class V_EditProductPageView extends V_BaseView {
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      title: "Edit Product",
      selectedProductId: props.productId || null,
      productDetails: {},
      isLoading: true,
      isSaving: false,
      fileList: [],
      previewOpen: false,
      previewImage: "",
    };
    this.formRef = React.createRef();
  }

  /**
   * showEditProductForm(productId)
   * Design method: Display edit product form
   */
  showEditProductForm(productId) {
    this.setState({ selectedProductId: productId }, () => {
      this.fetchProductDetails();
    });
    this.show();
  }

  /**
   * updateProductData(productData)
   * Design method: Update product information
   */
  async updateProductData() {
    Modal.confirm({
      title: "Update Product",
      content: "Are you sure you want to update this product?",
      okText: "Yes",
      cancelText: "No",
      onOk: async () => {
        try {
          this.setState({ isSaving: true });
          const values = await this.formRef.current.validateFields();
          const token = localStorage.getItem("accessToken");

          // Process images - extract filepaths from fileList
          const imageUrls = this.state.fileList.map((file) => {
            if (file.filepath) {
              return file.filepath; // Existing image
            } else if (file.response && file.response.filepath) {
              return file.response.filepath; // Newly uploaded image
            }
            return null;
          }).filter(Boolean);

          // Map form field names back to API field names
          const payload = {
            ...values,
            quantity: values.stock_quantity, // Map stock_quantity back to quantity
            product_images: imageUrls,
          };
          delete payload.stock_quantity; // Remove the form-specific field

          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
          await axios.put(
            `${backendUrl}/laptops/${this.state.selectedProductId}`,
            payload,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          this.displaySuccess("Product updated successfully");
          this.setState({ isSaving: false });
          window.location.href = "/admin/inventory";
        } catch (error) {
          this.setState({ isSaving: false });
          this.displayError("Failed to update product");
          console.error("Error updating product:", error);
        }
      },
      onCancel: () => {
        // Do nothing when cancelled
      },
    });
  }

  /**
   * deleteProduct()
   * Delete product from inventory
   */
  async deleteProduct() {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/laptops/${this.state.selectedProductId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      this.displaySuccess("Product deleted successfully");
      window.location.href = "/admin/inventory";
    } catch (error) {
      this.displayError("Failed to delete product");
      console.error("Error deleting product:", error);
    }
  }

  /**
   * handleImageChange()
   * Handle image upload changes
   */
  handleImageChange = ({ fileList: newFileList }) => {
    this.setState({ fileList: newFileList });
  };

  /**
   * handlePreview()
   * Handle image preview
   */
  handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await this.getBase64(file.originFileObj);
    }
    this.setState({
      previewImage: file.url || file.preview,
      previewOpen: true,
    });
  };

  /**
   * getBase64()
   * Convert file to base64 for preview
   */
  getBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  /**
   * customUpload()
   * Custom upload handler for images
   */
  customUpload = async ({ file, onSuccess, onError }) => {
    try {
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/laptops/upload-temp/${sessionId}/${file.name}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      onSuccess(response.data, file);
    } catch (error) {
      console.error("Upload error:", error);
      onError(error);
      message.error("Image upload failed");
    }
  };

  /**
   * fetchProductDetails()
   * Fetch product details from API
   */
  async fetchProductDetails() {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/laptops/id/${this.state.selectedProductId}`
      );
      const product = response.data;
      console.log('Fetched product data:', product);
      console.log('product_images:', product.product_images, 'Type:', typeof product.product_images);

      // Map API field names to form field names
      const formData = {
        ...product,
        stock_quantity: product.quantity, // Map quantity to stock_quantity
      };

      // Handle existing images
      let fileList = [];
      if (product.product_images) {
        try {
          let urls = [];
          
          // Ensure urls is an array
          if (typeof product.product_images === 'string') {
            // Try to parse as JSON
            try {
              urls = JSON.parse(product.product_images);
            } catch (parseErr) {
              console.error('Failed to parse product_images as JSON:', parseErr);
              urls = [];
            }
          } else if (Array.isArray(product.product_images)) {
            urls = product.product_images;
          }
          
          // Validate urls is an array
          if (!Array.isArray(urls)) {
            console.warn('product_images is not an array after parsing:', urls);
            urls = [];
          }
          
          // Convert to file list for upload component
          fileList = urls.map((url, index) => {
            // Handle both absolute and relative URLs
            const displayUrl = url.startsWith('http') 
              ? url 
              : `${import.meta.env.VITE_BACKEND_URL}${url}`;
            
            return {
              uid: `existing-${index}`,
              name: `image_${index + 1}.jpg`,
              status: "done",
              url: displayUrl,
              filepath: url,
            };
          });
        } catch (e) {
          console.error("Error parsing images:", e);
          fileList = [];
        }
      }

      this.setState({ fileList, productDetails: formData, isLoading: false });

      if (this.formRef.current) {
        this.formRef.current.setFieldsValue(formData);
      }
    } catch (error) {
      this.displayError("Failed to load product details");
      console.error("Error fetching product:", error);
      this.setState({ isLoading: false });
    }
  }

  componentDidMount() {
    if (this.props.productId) {
      this.showEditProductForm(this.props.productId);
    }
  }

  render() {
    const { isLoading, isSaving, fileList, previewOpen, previewImage } = this.state;

    if (isLoading) {
      return (
        <div style={{ padding: "50px", textAlign: "center" }}>
          <Spin size="large" />
        </div>
      );
    }

    const uploadButton = (
      <button
        style={{
          border: 0,
          background: "none",
        }}
        type="button"
      >
        <PlusOutlined />
        <div style={{ marginTop: 8 }}>Upload</div>
      </button>
    );

    return (
      <div style={{ padding: "24px", maxWidth: "800px" }}>
        <Title level={2}>Edit Product</Title>
        <Divider />

        <Form ref={this.formRef} layout="vertical">
          <Form.Item label="Product Name" name="name" rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>

          <Form.Item label="Brand" name="brand" rules={[{ required: true }]}>
            <Select size="large">
              <Option value="ASUS">ASUS</Option>
              <Option value="Lenovo">Lenovo</Option>
              <Option value="Acer">Acer</Option>
              <Option value="Dell">Dell</Option>
              <Option value="HP">HP</Option>
              <Option value="MSI">MSI</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Description" name="description" rules={[{ required: true }]}>
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item label="Product Images">
            <Upload
              listType="picture-card"
              fileList={fileList}
              onPreview={this.handlePreview}
              onChange={this.handleImageChange}
              customRequest={this.customUpload}
              accept="image/*"
            >
              {fileList.length >= 8 ? null : uploadButton}
            </Upload>
            {previewImage && (
              <Image
                wrapperStyle={{ display: "none" }}
                preview={{
                  visible: previewOpen,
                  onVisibleChange: (visible) => this.setState({ previewOpen: visible }),
                  afterOpenChange: (visible) => !visible && this.setState({ previewImage: "" }),
                }}
                src={previewImage}
              />
            )}
          </Form.Item>

          <Form.Item label="Price" name="sale_price" rules={[{ required: true }]}>
            <InputNumber
              size="large"
              style={{ width: "100%" }}
              min={0}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            />
          </Form.Item>

          <Form.Item label="Stock Quantity" name="stock_quantity" rules={[{ required: true }]}>
            <InputNumber size="large" style={{ width: "100%" }} min={0} />
          </Form.Item>

          <Form.Item label="CPU" name="cpu" rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>

          <Form.Item label="RAM Amount (GB)" name="ram_amount" rules={[{ required: true }]}>
            <InputNumber size="large" style={{ width: "100%" }} min={0} />
          </Form.Item>

          <Form.Item label="Storage Amount (GB)" name="storage_amount" rules={[{ required: true }]}>
            <InputNumber size="large" style={{ width: "100%" }} min={0} />
          </Form.Item>

          <Form.Item label="Screen Size (inches)" name="screen_size" rules={[{ required: true }]}>
            <InputNumber size="large" style={{ width: "100%" }} min={0} step={0.1} />
          </Form.Item>

          <Form.Item label="VGA" name="vga" rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              size="large"
              loading={isSaving}
              onClick={() => this.updateProductData()}
            >
              Update Product
            </Button>
            <Button
              size="large"
              style={{ marginLeft: "10px" }}
              onClick={() => (window.location.href = "/admin/inventory")}
            >
              Cancel
            </Button>
            <Button
              danger
              size="large"
              style={{ marginLeft: "10px" }}
              onClick={() => this.deleteProduct()}
            >
              Delete Product
            </Button>
          </Form.Item>
        </Form>
      </div>
    );
  }
}

export default V_EditProductPageView;
