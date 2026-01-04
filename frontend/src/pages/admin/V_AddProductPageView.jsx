import React from "react";
import { Layout, Form, Input, InputNumber, Button, Typography, Select, Divider, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import V_BaseView from "@components/V_BaseView";
import axios from "axios";

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

/**
 * V_AddProductPageView
 * View component for adding new product to inventory
 */
class V_AddProductPageView extends V_BaseView {
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      title: "Add Product",
      isSaving: false,
      uploadedImages: [],
    };
    this.formRef = React.createRef();
  }

  /**
   * showAddProductForm()
   * Design method: Display add product form
   */
  showAddProductForm() {
    this.show();
  }

  /**
   * handleImageUpload(info)
   * Handle image upload
   */
  handleImageUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const timestamp = Date.now();
      const filename = `${timestamp}_${file.name}`;
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      
      const response = await axios.post(
        `${backendUrl}/laptops/upload-temp/products/${filename}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.filepath) {
        this.setState(prevState => ({
          uploadedImages: [...prevState.uploadedImages, response.data.filepath]
        }));
        message.success(`${file.name} uploaded successfully`);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      message.error("Failed to upload image");
    }
    return false; // Prevent default upload behavior
  };

  /**
   * submitProductData(productData)
   * Design method: Submit new product data
   */
  async submitProductData() {
    try {
      this.setState({ isSaving: true });
      const values = await this.formRef.current.validateFields();
      const token = localStorage.getItem("accessToken");

      // Add default values for required fields not in the form
      const productData = {
        ...values,
        sub_brand: values.brand, // Use brand as sub_brand
        usage_type: "General",
        ram_type: "DDR4",
        storage_type: "SSD",
        webcam_resolution: "HD",
        screen_resolution: "1920x1080",
        screen_refresh_rate: 60,
        screen_brightness: 300,
        battery_capacity: 50.0,
        battery_cells: 4,
        weight: 2.0,
        default_os: "Windows 11",
        warranty: 12,
        width: 35.0,
        depth: 24.0,
        height: 2.0,
        number_usb_a_ports: 2,
        number_usb_c_ports: 1,
        number_hdmi_ports: 1,
        number_ethernet_ports: 1,
        number_audio_jacks: 1,
        product_images: this.state.uploadedImages.length > 0 
          ? this.state.uploadedImages 
          : ["/static/laptop_images/default.jpg"],
        quantity: values.stock_quantity || 0,
        original_price: values.sale_price || 0,
      };

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      await axios.post(`${backendUrl}/laptops/`, productData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      this.displaySuccess("Product added successfully");
      this.setState({ isSaving: false });
      window.location.href = "/admin/inventory";
    } catch (error) {
      this.setState({ isSaving: false });
      this.displayError("Failed to add product");
      console.error("Error adding product:", error);
    }
  }

  componentDidMount() {
    this.showAddProductForm();
  }

  render() {
    const { isSaving } = this.state;

    return (
      <div style={{ padding: "24px", maxWidth: "800px" }}>
        <Title level={2}>Add New Product</Title>
        <Divider />

        <Form ref={this.formRef} layout="vertical">
          <Form.Item
            label="Product Name"
            name="name"
            rules={[{ required: true, message: "Please enter product name" }]}
          >
            <Input size="large" />
          </Form.Item>

          <Form.Item
            label="Brand"
            name="brand"
            rules={[{ required: true, message: "Please select brand" }]}
          >
            <Select size="large">
              <Option value="ASUS">ASUS</Option>
              <Option value="Lenovo">Lenovo</Option>
              <Option value="Acer">Acer</Option>
              <Option value="Dell">Dell</Option>
              <Option value="HP">HP</Option>
              <Option value="MSI">MSI</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: "Please enter description" }]}
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item
            label="Price"
            name="sale_price"
            rules={[{ required: true, message: "Please enter price" }]}
          >
            <InputNumber
              size="large"
              style={{ width: "100%" }}
              min={0}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            />
          </Form.Item>

          <Form.Item
            label="Stock Quantity"
            name="stock_quantity"
            rules={[{ required: true, message: "Please enter stock quantity" }]}
          >
            <InputNumber size="large" style={{ width: "100%" }} min={0} />
          </Form.Item>

          <Form.Item
            label="CPU"
            name="cpu"
            rules={[{ required: true, message: "Please enter CPU" }]}
          >
            <Input size="large" />
          </Form.Item>

          <Form.Item
            label="RAM Amount (GB)"
            name="ram_amount"
            rules={[{ required: true, message: "Please enter RAM amount" }]}
          >
            <InputNumber size="large" style={{ width: "100%" }} min={0} />
          </Form.Item>

          <Form.Item
            label="Storage Amount (GB)"
            name="storage_amount"
            rules={[{ required: true, message: "Please enter storage amount" }]}
          >
            <InputNumber size="large" style={{ width: "100%" }} min={0} />
          </Form.Item>

          <Form.Item
            label="Screen Size (inches)"
            name="screen_size"
            rules={[{ required: true, message: "Please enter screen size" }]}
          >
            <InputNumber size="large" style={{ width: "100%" }} min={0} step={0.1} />
          </Form.Item>

          <Form.Item
            label="VGA"
            name="vga"
            rules={[{ required: true, message: "Please enter VGA" }]}
          >
            <Input size="large" />
          </Form.Item>

          <Form.Item
            label="Product Images"
            name="product_images"
            extra="Upload product images (optional, default image will be used if not provided)"
          >
            <Upload
              beforeUpload={this.handleImageUpload}
              multiple
              listType="picture"
              accept="image/*"
            >
              <Button icon={<UploadOutlined />}>Click to Upload</Button>
            </Upload>
            {this.state.uploadedImages.length > 0 && (
              <div style={{ marginTop: 8 }}>
                Uploaded {this.state.uploadedImages.length} image(s)
              </div>
            )}
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              size="large"
              loading={isSaving}
              onClick={() => this.submitProductData()}
            >
              Add Product
            </Button>
            <Button
              size="large"
              style={{ marginLeft: "10px" }}
              onClick={() => (window.location.href = "/admin/inventory")}
            >
              Cancel
            </Button>
          </Form.Item>
        </Form>
      </div>
    );
  }
}

export default V_AddProductPageView;
