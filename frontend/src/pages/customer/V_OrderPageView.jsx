import React from "react";
import { Layout, Table, Spin, Typography, Button, Tag, Modal, notification } from "antd";
import V_BaseView from "@components/V_BaseView";
import CustomerOrderTable from "@components/customer_page/V_CustomerOrderTable";
import axios from "axios";

const { Text } = Typography;

/**
 * V_OrderPageView  
 * View component for customer order management
 */
class V_OrderPageView extends V_BaseView {
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      title: "My Orders",
      ordersList: [],
      totalOrdersCount: 0,
      currentPageNumber: 1,
      ordersPerPage: 20,
      isLoading: true,
      errorMessage: null,
    };
  }

  /**
   * renderOrdersPage()
   * Design method: Display customer orders list
   */
  renderOrdersPage() {
    this.fetchOrders(1, 20);
    this.show();
  }

  /**
   * submitRefundRequest(orderId, reason)
   * Design method: Submit refund request for order
   */
  async submitRefundRequest(orderId, reason) {
    try {
      const token = localStorage.getItem("accessToken");
      const user = JSON.parse(localStorage.getItem("user_profile") || "{}");

      console.log("Refund request with user:", user);

      if (!user.email || !user.phone_number) {
        this.displayError("Unable to load your profile information. Please refresh and try again.");
        return Promise.reject();
      }

      const refundData = {
        email: user.email,
        phoneNumber: user.phone_number,
        orderId: orderId,
        reason,
        status: "pending",
      };

      console.log("Sending refund data:", refundData);

      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/refund-tickets/`, refundData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      this.displaySuccess(`Your refund request for order ${orderId} has been submitted successfully.`);
    } catch (error) {
      console.error("Error creating refund ticket:", error);
      console.error("Error response:", error.response?.data);
      this.displayError(error.response?.data?.detail || "Failed to submit refund request.");
      return Promise.reject();
    }
  }

  /**
   * handleRefundRequest(orderId)
   * Handle refund request with modal
   */
  handleRefundRequest(orderId) {
    Modal.confirm({
      title: "Request Refund",
      width: 700,
      centered: true,
      content: (
        <div>
          <p>Please enter the reason for your refund request:</p>
          <textarea
            id="refundReason"
            placeholder="Enter reason for refund..."
            style={{
              width: "95%",
              minHeight: "100px",
              padding: "8px",
              border: "1px solid #d9d9d9",
              borderRadius: "4px",
              resize: "vertical",
            }}
          />
        </div>
      ),
      okText: "Submit",
      cancelText: "Cancel",
      onOk: () => {
        const reason = document.getElementById("refundReason").value.trim();
        if (!reason) {
          Modal.error({
            title: "Error",
            content: "Please enter a reason for the refund request.",
          });
          return Promise.reject();
        }
        return this.submitRefundRequest(orderId, reason);
      },
    });
  }

  /**
   * fetchOrders()
   * Fetch orders from API
   */
  async fetchOrders(page = 1, limit = 20) {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    this.setState({ isLoading: true });
    try {
      const params = { page, limit };
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      const ordersWithProductInfo = await Promise.all(
        response.data.orders.map(async (order) => {
          const itemsWithDetails = await Promise.all(
            order.items.map(async (item) => {
              const productDetails = await this.fetchProductDetails(item.product_id);
              return {
                ...item,
                product_name: productDetails.product_name,
                image: productDetails.image,
                subtotal: item.price_at_purchase * item.quantity,
              };
            })
          );

          return { ...order, items: itemsWithDetails };
        })
      );

      this.setState({
        ordersList: ordersWithProductInfo,
        totalOrdersCount: response.data.total_count,
        currentPageNumber: page,
        ordersPerPage: limit,
        isLoading: false,
      });
    } catch (err) {
      this.setState({
        errorMessage: err.response?.data?.detail || err.message,
        isLoading: false,
      });
      this.displayError("Failed to load orders");
    }
  }

  /**
   * fetchProductDetails()
   * Fetch product details for order item
   */
  async fetchProductDetails(productId) {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/laptops/id/${productId}`);
      const product = response.data;
      
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
      
      return {
        product_name: product.name,
        image:
          imageUrls.length > 0
            ? `${import.meta.env.VITE_BACKEND_URL}${imageUrls[0]}`
            : "/default-image.jpg",
      };
    } catch (err) {
      console.error("Error fetching product details:", err);
      return { product_name: "Unknown", image: "/default-image.jpg" };
    }
  }

  componentDidMount() {
    this.renderOrdersPage();
  }

  render() {
    const { ordersList, totalOrdersCount, currentPageNumber, ordersPerPage, isLoading } = this.state;

    return (
      <div className="responsive-padding" style={{ padding: "0 24px 24px 24px" }}>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "50px" }}>
            <Spin size="large" />
          </div>
        ) : (
          <CustomerOrderTable
            ordersData={{
              orders: ordersList,
              total_count: totalOrdersCount,
              page: currentPageNumber,
              limit: ordersPerPage,
            }}
            onRefundRequest={(orderId) => this.handleRefundRequest(orderId)}
            onPageChange={(page, limit) => this.fetchOrders(page, limit)}
          />
        )}
      </div>
    );
  }
}

export default V_OrderPageView;
