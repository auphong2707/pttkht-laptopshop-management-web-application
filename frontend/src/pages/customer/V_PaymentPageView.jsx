import React from "react";
import { Layout, Form, Button, Modal, notification, Typography, Table, Spin, Input, Divider } from "antd";
import V_BaseView from "@components/V_BaseView";
import WebsiteHeader from "@components/V_WebsiteHeader";
import WebsiteFooter from "@components/V_WebsiteFooter";
import QRCode from "react-qr-code";
import { QRPay, BanksObject } from "vietnam-qr-pay";
import axios from "axios";

const { Content } = Layout;
const { Text, Title } = Typography;

/**
 * V_PaymentPageView
 * View component for order payment and checkout
 */
class V_PaymentPageView extends V_BaseView {
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      title: "Payment",
      orderDetails: null,
      isLoading: true,
      qrModalVisible: false,
      qrCodeUrl: "",
      confirmEbankingPayment: false,
      userProfileData: null,
      editedProfileData: null,
      isEditingProfile: false,
    };
    this.formRef = React.createRef();
  }

  /**
   * showPaymentForm(orderId)
   * Design method: Display payment form for order
   */
  async showPaymentForm() {
    await Promise.all([this.fetchCartOrder(), this.fetchUserProfile()]);
    this.show();
  }

  /**
   * submitPayment(paymentMethod)
   * Design method: Process payment with selected method
   */
  async submitPayment(paymentMethod) {
    try {
      const values = await this.formRef.current.validateFields();
      const authToken = localStorage.getItem("accessToken");

      if (!authToken) throw new Error("User not authenticated");

      // For e-banking, show QR code first and wait for payment before creating order
      if (paymentMethod === "e-banking") {
        // Store form data for later order creation
        this.pendingOrderData = {
          first_name: values.first_name,
          last_name: values.last_name,
          user_email: values.email,
          shipping_address: values.shipping_address,
          phone_number: values.phone_number,
          payment_method: paymentMethod,
        };
        
        // Get cart total for QR code
        const totalPrice = this.state.orderDetails.total_price;
        
        // Generate a temporary reference ID for this payment session
        const tempOrderId = `TEMP-${Date.now()}`;
        
        // Show QR code immediately (without creating order)
        this.generateQRCodeForPayment(tempOrderId, totalPrice);
        return;
      }

      // For COD, create order immediately
      const payload = {
        first_name: values.first_name,
        last_name: values.last_name,
        user_email: values.email,
        shipping_address: values.shipping_address,
        phone_number: values.phone_number,
        payment_method: paymentMethod,
      };

      await this.createOrder(payload, authToken);
    } catch (err) {
      this.displayError(err.message || "Failed to process payment");
      console.error("Payment error:", err);
    }
  }

  /**
   * createOrder(payload, authToken)
   * Create order in backend
   */
  async createOrder(payload, authToken) {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to create order.");
      }

      const order = await res.json();
      console.log("Order created:", order);
      
      // Create payment transaction record
      try {
        const paymentRes = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/payments/create`,
          {
            order_id: order.id,
            payment_method: payload.payment_method,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        const paymentTransaction = paymentRes.data;
        console.log("Payment transaction created:", paymentTransaction);

        notification.success({
          message: "Order Created",
          description: (
            <span>
              Your order has been placed. Transaction ID: {paymentTransaction.id}.
            </span>
          ),
          duration: 2,
        });
        
        // Redirect to orders page after 2 seconds
        setTimeout(() => {
          window.location.href = "/customer/orders";
        }, 2000);
      } catch (paymentErr) {
        console.error("Payment transaction error:", paymentErr);
        notification.warning({
          message: "Order Created",
          description: (
            <span>
              Your order has been placed but payment recording failed.
            </span>
          ),
          duration: 2,
        });
        
        // Redirect to orders page after 2 seconds
        setTimeout(() => {
          window.location.href = "/customer/orders";
        }, 2000);
      }
    } catch (err) {
      throw err;
    }
  }

  /**
   * generateQRCodeForPayment(tempOrderId, amount)
   * Generate QR code for e-banking payment (before order creation)
   */
  generateQRCodeForPayment(tempOrderId, amount) {
    const qrPay = QRPay.initVietQR({
      bankBin: BanksObject.vietcombank.bin,
      bankNumber: "0021000441310",
      amount: amount.toString(),
      purpose: `THANH TOAN ${tempOrderId}`,
    });

    this.setState({
      qrCodeUrl: qrPay.build(),
      qrModalVisible: true,
      confirmEbankingPayment: false,
    });

    // Note: QR payment verification is not implemented
    // In a real system, you would:
    // 1. Monitor bank API for incoming payment
    // 2. Verify payment matches the QR code
    // 3. Then call createOrder after payment confirmed
    
    notification.info({
      message: "QR Payment Demo",
      description: "QR code payment verification is not implemented. For demo purposes, please use Cash on Delivery option to complete orders.",
      duration: 10,
    });
  }

  /**
   * generateQRCode(orderId, amount)
   * Generate QR code for e-banking payment
   */
  generateQRCode(orderId, amount) {
    const qrPay = QRPay.initVietQR({
      bankBin: BanksObject.vietcombank.bin,
      bankNumber: "0021000441310",
      amount: amount.toString(),
      purpose: `THANH TOAN DON HANG ${orderId}`,
    });

    this.setState({
      qrCodeUrl: qrPay.build(),
      qrModalVisible: true,
      confirmEbankingPayment: false,
    });

    this.startPaymentPolling(orderId);
  }

  /**
   * startPaymentPolling(orderId)
   * Poll for payment status
   */
  startPaymentPolling(orderId) {
    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/orders/${orderId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data.status === "Processing") {
          clearInterval(interval);
          this.setState({ confirmEbankingPayment: true, qrModalVisible: false });
          notification.success({
            message: "Payment Successful",
            description: (
              <span>
                Thank you for your payment! Your order is being processed.{" "}
                <a href="/customer/orders" style={{ fontWeight: "bold" }}>
                  View your orders
                </a>
                .
              </span>
            ),
            placement: "topRight",
            duration: 5,
          });
        }
      } catch (error) {
        console.error("Error polling payment status:", error);
      }
    }, 5000);

    setTimeout(() => clearInterval(interval), 300000);
  }

  /**
   * fetchCartOrder()
   * Fetch cart items for order
   */
  async fetchCartOrder() {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("User not authenticated");

      const cartResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/cart/view`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const cartData = cartResponse.data;

      // Handle the new cart response structure with items array
      if (!cartData.items || !Array.isArray(cartData.items) || cartData.items.length === 0) {
        this.setState({ 
          orderDetails: {
            id: "N/A",
            total_price: 0,
            status: "Pending Payment",
            created_at: new Date().toISOString(),
            items: [],
          },
          isLoading: false 
        });
        return;
      }

      const productFetches = cartData.items.map((item) =>
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/laptops/id/${item.laptop_id}`)
      );
      const productResponses = await Promise.all(productFetches);

      const itemsWithDetails = productResponses.map((res, idx) => {
        const product = res.data;
        const cartItem = cartData.items[idx];
        
        // Handle product_images - it might be a string or already parsed array
        let imageUrls = [];
        if (typeof product.product_images === 'string') {
          try {
            imageUrls = JSON.parse(product.product_images || "[]");
          } catch (e) {
            imageUrls = [];
          }
        } else if (Array.isArray(product.product_images)) {
          imageUrls = product.product_images;
        }
        
        const image =
          imageUrls.length > 0
            ? `${import.meta.env.VITE_BACKEND_URL}${imageUrls[0]}`
            : "/default-image.jpg";
        const subtotal = cartItem.unit_price * cartItem.quantity;

        return {
          product_id: product.id,
          product_name: product.name,
          price_at_purchase: cartItem.unit_price,
          quantity: cartItem.quantity,
          image,
          subtotal,
        };
      });

      const totalPrice = itemsWithDetails.reduce((sum, item) => sum + item.subtotal, 0);

      const fakeOrder = {
        id: "N/A",
        total_price: totalPrice,
        status: "Pending Payment",
        created_at: new Date().toISOString(),
        items: itemsWithDetails,
      };

      this.setState({ orderDetails: fakeOrder, isLoading: false });
    } catch (err) {
      console.error("Error loading cart-based order:", err);
      this.setState({ isLoading: false });
    }
  }

  /**
   * fetchUserProfile()
   * Fetch user profile information
   */
  async fetchUserProfile() {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/accounts/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const profile = response.data;
      this.setState({
        userProfileData: profile,
        editedProfileData: profile,
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      notification.error({
        message: "Error",
        description: "Failed to load user profile. Please refresh the page.",
      });
    }
  }

  /**
   * formatPrice()
   * Format price for display
   */
  formatPrice(price) {
    return price.toLocaleString("vi-VN") + "đ";
  }

  componentDidMount() {
    this.showPaymentForm();
  }

  componentDidUpdate(prevProps, prevState) {
    // Update form values when profile data is loaded
    if (this.state.userProfileData && !prevState.userProfileData && this.formRef.current) {
      this.formRef.current.setFieldsValue({
        first_name: this.state.userProfileData.first_name,
        last_name: this.state.userProfileData.last_name,
        email: this.state.userProfileData.email,
        phone_number: this.state.userProfileData.phone_number,
        shipping_address: this.state.userProfileData.shipping_address || "",
      });
    }
  }

  render() {
    const { orderDetails, isLoading, qrModalVisible, qrCodeUrl, confirmEbankingPayment, userProfileData } = this.state;

    if (isLoading || !orderDetails) {
      return (
        <Layout>
          <WebsiteHeader />
          <Content style={{ padding: "50px", textAlign: "center" }}>
            <Spin size="large" />
          </Content>
          <WebsiteFooter />
        </Layout>
      );
    }

    // Prepare initial form values
    const initialValues = userProfileData ? {
      first_name: userProfileData.first_name,
      last_name: userProfileData.last_name,
      email: userProfileData.email,
      phone_number: userProfileData.phone_number,
      shipping_address: userProfileData.shipping_address || "",
    } : {};

    return (
      <Layout>
        <WebsiteHeader />
        <Content className="responsive-padding" style={{ backgroundColor: "#f5f5f5", padding: "24px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", backgroundColor: "#fff", padding: "2rem", borderRadius: "8px" }}>
          <Title level={2}>Place Order</Title>
          <Divider />

          <Form ref={this.formRef} layout="vertical" initialValues={initialValues}>
            <Form.Item
              label="First Name"
              name="first_name"
              rules={[{ required: true, message: "Please enter your first name" }]}
            >
              <Input size="large" />
            </Form.Item>

            <Form.Item
              label="Last Name"
              name="last_name"
              rules={[{ required: true, message: "Please enter your last name" }]}
            >
              <Input size="large" />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Please enter your email" },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input size="large" />
            </Form.Item>

            <Form.Item
              label="Phone Number"
              name="phone_number"
              rules={[{ required: true, message: "Please enter your phone number" }]}
            >
              <Input size="large" />
            </Form.Item>

            <Form.Item
              label="Shipping Address"
              name="shipping_address"
              rules={[{ required: true, message: "Please enter shipping address" }]}
            >
              <Input.TextArea rows={3} size="large" />
            </Form.Item>
          </Form>

          <Divider />
          <Title level={4}>Order Summary</Title>
          <Table
            dataSource={orderDetails.items}
            columns={[
              { title: "Product", dataIndex: "product_name", key: "product_name" },
              { title: "Price", dataIndex: "price_at_purchase", key: "price", render: (price) => this.formatPrice(price) },
              { title: "Quantity", dataIndex: "quantity", key: "quantity" },
              { title: "Subtotal", dataIndex: "subtotal", key: "subtotal", render: (subtotal) => this.formatPrice(subtotal) },
            ]}
            pagination={false}
          />

          <Divider />
          <Title level={3}>
            Total: <span style={{ float: "right" }}>{this.formatPrice(orderDetails.total_price)}</span>
          </Title>

          <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
            <Button
              type="primary"
              size="large"
              onClick={() => this.submitPayment("cash-on-delivery")}
            >
              Cash on Delivery
            </Button>
            <Button
              type="default"
              size="large"
              onClick={() => this.submitPayment("e-banking")}
            >
              E-Banking (QR Code)
            </Button>
          </div>

          <Modal
            title="Scan QR Code to Pay"
            open={qrModalVisible}
            onCancel={() => this.setState({ qrModalVisible: false })}
            footer={null}
            centered
          >
            <div style={{ textAlign: "center", padding: "20px" }}>
              <QRCode value={qrCodeUrl} size={256} />
              <p style={{ marginTop: "20px" }}>
                Please scan this QR code with your banking app to complete payment.
              </p>
            </div>
          </Modal>
          </div>
        </Content>
        <WebsiteFooter />
      </Layout>
    );
  }
}

export default V_PaymentPageView;
