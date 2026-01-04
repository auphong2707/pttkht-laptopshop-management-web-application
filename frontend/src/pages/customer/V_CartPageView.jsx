import React from "react";
import { Layout, Row, Col, Typography, Button, Breadcrumb, Divider, notification } from "antd";
import { Link } from "react-router-dom";
import V_BaseView from "@components/V_BaseView";
import WebsiteHeader from "@components/V_WebsiteHeader";
import WebsiteFooter from "@components/V_WebsiteFooter";
import ShoppingItemsTable from "@components/shopping_cart_page/V_ShoppingItemsTable";
import axios from "axios";

const { Content } = Layout;
const { Text, Title } = Typography;

/**
 * V_CartPageView
 * View component for shopping cart management
 */
class V_CartPageView extends V_BaseView {
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      title: "Shopping Cart",
      cartItemsList: [],
      subtotalAmount: 0,
      shippingFeeAmount: 0,
      totalAmount: 0,
    };
  }

  /**
   * renderCartPage()
   * Design method: Display shopping cart with items
   */
  renderCartPage() {
    this.fetchCartItems();
    this.show();
  }

  /**
   * updateItemQuantity(itemId, newQuantity)
   * Design method: Update quantity of cart item
   */
  async updateItemQuantity(itemId, newQuantity) {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/cart/update`,
        {
          laptop_id: itemId,
          quantity: newQuantity,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      this.fetchCartItems();
    } catch (error) {
      this.displayError("Failed to update item quantity");
      console.error("Error updating quantity:", error);
    }
  }

  /**
   * removeCartItem(itemId)
   * Design method: Remove item from cart
   */
  async removeCartItem(itemId) {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/cart/remove/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      this.displaySuccess("Item removed from cart");
      this.fetchCartItems();
    } catch (error) {
      this.displayError("Failed to remove item");
      console.error("Error removing item:", error);
    }
  }

  /**
   * proceedToCheckout()
   * Design method: Navigate to checkout/payment page
   */
  proceedToCheckout() {
    if (this.state.cartItemsList.length === 0) {
      notification.error({
        message: "Cannot place order",
        description: "You must have at least one item in your cart to place an order.",
      });
    } else {
      window.location.href = "/customer/place-order/";
    }
  }

  /**
   * fetchCartItems()
   * Fetch cart items from API
   */
  async fetchCartItems() {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("User not signed in.");
        return;
      }

      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/cart/view`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const cartData = response.data;
      
      // Handle the new cart response structure with items array
      if (cartData.items && Array.isArray(cartData.items)) {
        const productDetails = await Promise.all(
          cartData.items.map(async (item) => {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/laptops/id/${item.laptop_id}`);
            return {
              ...res.data,
              cartItemId: item.id,
              quantity: item.quantity,
              unitPrice: item.unit_price,
            };
          })
        );

        this.setState({ 
          cartItemsList: productDetails,
          totalAmount: cartData.total_amount || 0
        });
        this.calculateTotals(productDetails);
      } else {
        // Empty cart
        this.setState({ 
          cartItemsList: [],
          totalAmount: 0,
          subtotalAmount: 0,
          shippingFeeAmount: 0
        });
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  }

  /**
   * calculateTotals()
   * Calculate cart totals
   */
  calculateTotals(items) {
    const subtotal = items.reduce((sum, item) => sum + item.sale_price * item.quantity, 0);
    const shipping = items.length > 0 ? 50000 : 0;
    const total = Math.round(subtotal + shipping);

    this.setState({
      subtotalAmount: subtotal,
      shippingFeeAmount: shipping,
      totalAmount: total,
    });
  }

  /**
   * formatPrice()
   * Format price for display
   */
  formatPrice(price) {
    return price.toLocaleString("vi-VN") + "đ";
  }

  componentDidMount() {
    this.renderCartPage();
  }

  render() {
    const { cartItemsList, subtotalAmount, shippingFeeAmount, totalAmount } = this.state;

    return (
      <Layout>
        <WebsiteHeader />
        <Content
          className="responsive-padding"
          style={{ backgroundColor: "#fff", padding: "2rem" }}
        >
          <Breadcrumb
            className="responsive-padding"
            separator=">"
            style={{ marginBottom: "1rem" }}
          >
            <Breadcrumb.Item>
              <Link to="/">Home</Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <Link to="/shopping-cart">Shopping Cart</Link>
            </Breadcrumb.Item>
          </Breadcrumb>

          <Title level={2} className="responsive-padding" style={{ marginBottom: "2rem" }}>
            Shopping Cart
          </Title>

          <div className="responsive-padding">
            <Divider style={{ borderWidth: 1 }} />
          </div>

          <Row gutter={[32, 32]} justify="center">
            <Col xs={24} md={12} style={{ paddingLeft: "23px", paddingRight: "4px" }}>
              <div style={{ padding: "0px 0" }}>
                <ShoppingItemsTable
                  setTotalPrice={(price) => this.setState({ subtotalAmount: price })}
                  setCartItems={(items) => this.setState({ cartItemsList: items })}
                  cartItems={cartItemsList}
                />
              </div>
            </Col>

            <Col xs={24} md={7} style={{ paddingLeft: "4px", paddingRight: "41px" }}>
              <div
                style={{
                  background: "#F5F7FF",
                  padding: "20px",
                  minHeight: "200px",
                }}
              >
                <Title level={3} style={{ margin: "0px 0" }}>
                  Summary
                </Title>

                {cartItemsList.length > 0 && (
                  <>
                    <Divider style={{ marginTop: "15px", marginBottom: "20px" }} />
                    <Text strong>Subtotal</Text>
                    <Text style={{ float: "right" }}>{this.formatPrice(subtotalAmount)}</Text>
                    <br />

                    <Text strong>Shipping</Text>
                    <Text style={{ float: "right" }}>{this.formatPrice(shippingFeeAmount)}</Text>
                    <br />
                    <br />
                  </>
                )}

                <Divider style={{ marginBottom: "18px" }} />
                <Title level={3} style={{ marginTop: "12px" }}>
                  Order Total:{" "}
                  <span style={{ float: "right" }}>{this.formatPrice(totalAmount)}</span>
                </Title>

                <Button
                  type="primary"
                  block
                  size="large"
                  style={{
                    marginTop: "10px",
                    fontWeight: "bold",
                    fontSize: "16px",
                    height: "50px",
                    borderRadius: "9999px",
                    backgroundColor: "#1890ff",
                  }}
                  onClick={() => this.proceedToCheckout()}
                >
                  Place Order
                </Button>
              </div>
            </Col>
          </Row>
        </Content>
        <WebsiteFooter />
      </Layout>
    );
  }
}

export default V_CartPageView;
