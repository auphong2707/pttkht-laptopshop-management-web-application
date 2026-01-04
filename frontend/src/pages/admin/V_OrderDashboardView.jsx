import React from "react";
import { Form, Input, Button, Card, Row, Col, Select, DatePicker } from "antd";
import V_BaseView from "@components/V_BaseView";
import axios from "axios";
import OrderTable from "@components/administrator_page/V_OrderTable";

const { RangePicker } = DatePicker;

/**
 * V_OrderDashboardView
 * View component for admin order management
 */
class V_OrderDashboardView extends V_BaseView {
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      title: "Order Management",
      orders: [],
      selectedOrderId: null,
      selectedStatus: null,
      totalCount: 0,
      currentPage: 1,
      pageSize: 20,
      isLoading: true,
      filterValues: {},
    };
    this.formRef = React.createRef();
  }

  /**
   * fetchOrderList(orders)
   * Design method: Renders order list returned by controller
   */
  fetchOrderList(orders) {
    this.setState({
      orders: orders.orders || [],
      totalCount: orders.total_count || 0,
      isLoading: false,
    });
  }

  /**
   * clickUpdateStatus(orderId, newStatus)
   * Design method: Sends status update action to controller
   */
  async clickUpdateStatus(orderId, newStatus) {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.patch(
        `http://localhost:8000/orders/admin/${orderId}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      this.displaySuccess("Order status updated successfully");
      this.fetchOrders(this.state.currentPage, this.state.pageSize, this.state.filterValues);
    } catch (error) {
      this.displayError("Failed to update order status");
      console.error("Error updating order status:", error);
    }
  }

  /**
   * fetchOrders(page, limit, filterValues)
   * Fetch orders with pagination and filters
   */
  async fetchOrders(page = 1, limit = 20, filterValues = {}) {
    this.setState({ isLoading: true });

    try {
      const token = localStorage.getItem("accessToken");
      const params = { page, limit };

      if (filterValues.user_email) params.user_email = filterValues.user_email;
      if (filterValues.phone_number) params.phone_number = filterValues.phone_number;
      if (filterValues.payment_method) params.payment_method = filterValues.payment_method;
      if (filterValues.date_range) {
        const [start, end] = filterValues.date_range;
        if (start) params.start_date = start.toISOString();
        if (end) params.end_date = end.toISOString();
      }
      if (filterValues.status) params.status = filterValues.status;

      const response = await axios.get("http://localhost:8000/orders/admin/list", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      this.fetchOrderList({
        orders: response.data.orders,
        total_count: response.data.total_count,
      });
      this.setState({ currentPage: page, pageSize: limit, filterValues });
    } catch (error) {
      this.displayError("Failed to load orders");
      console.error("Error fetching orders:", error);
      this.setState({ isLoading: false });
    }
  }

  componentDidMount() {
    this.fetchOrders(1, 20, {});
    this.show();
  }

  handleTableChange = (pagination) => {
    const filters = this.formRef.current?.getFieldsValue() || {};
    this.fetchOrders(pagination.current, pagination.pageSize, filters);
  };

  handleFilterSubmit = (values) => {
    this.setState({ filterValues: values });
    this.fetchOrders(1, this.state.pageSize, values);
  };

  render() {
    const { orders, totalCount, currentPage, pageSize, isLoading } = this.state;

    if (isLoading && orders.length === 0) {
      return <div style={{ padding: "2rem" }}>Loading orders...</div>;
    }

    return (
      <div style={{ padding: "2rem" }}>
        <Card style={{ marginBottom: "1rem" }}>
          <Form
            ref={this.formRef}
            layout="vertical"
            onFinish={this.handleFilterSubmit}
            initialValues={{
              user_email: "",
              phone_number: "",
              payment_method: undefined,
              date_range: [],
              status: undefined,
            }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Customer Email" name="user_email">
                  <Input placeholder="Enter email" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Phone Number" name="phone_number">
                  <Input placeholder="Enter phone number" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="Payment Method" name="payment_method">
                  <Select placeholder="Select payment method">
                    <Select.Option value="e-banking">E-Banking</Select.Option>
                    <Select.Option value="delivery">Cash on Delivery</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Order Status" name="status">
                  <Select placeholder="Select status">
                    <Select.Option value="pending">Pending</Select.Option>
                    <Select.Option value="processing">Processing</Select.Option>
                    <Select.Option value="shipping">Shipping</Select.Option>
                    <Select.Option value="delivered">Delivered</Select.Option>
                    <Select.Option value="cancelled">Cancelled</Select.Option>
                    <Select.Option value="refunded">Refunded</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Date Range" name="date_range">
                  <RangePicker style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Apply Filters
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <OrderTable
          orders={orders}
          page={currentPage}
          limit={pageSize}
          total_count={totalCount}
          onTableChange={this.handleTableChange}
          accessToken={localStorage.getItem("accessToken")}
        />
      </div>
    );
  }
}

export default V_OrderDashboardView;
