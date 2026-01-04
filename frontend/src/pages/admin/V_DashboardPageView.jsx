import React from "react";
import V_BaseView from "@components/V_BaseView";
import axios from "axios";
import Dashboard from "@components/administrator_page/V_Dashboard";
import {
  Card,
  Col,
  Row,
  Statistic,
} from "antd";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend as ReLegend,
  ResponsiveContainer,
} from "recharts";

const PIE_COLORS = ["#1677ff", "#52c41a", "#faad14", "#ff4d4f", "#722ed1", "#eb2f96"];

const compactNumber = (value) =>
  new Intl.NumberFormat("en", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value);

/**
 * V_DashboardPageView
 * View component for admin analytics dashboard
 */
class V_DashboardPageView extends V_BaseView {
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      title: "Dashboard",
      metrics: null,
      periodStart: null,
      periodEnd: null,
      salesByStatus: [],
      salesOverTime: [],
      totalRevenue: 0,
      orderCount: 0,
      ordersOverTime: [],
      isLoading: true,
    };
  }

  /**
   * renderCharts(metrics)
   * Design method: Renders KPI charts based on metrics returned by controller
   */
  renderCharts(metrics) {
    // Metrics are calculated from orders data
    this.setState({
      metrics,
      totalRevenue: metrics.totalRevenue || 0,
      orderCount: metrics.orderCount || 0,
      salesByStatus: metrics.salesByStatus || [],
      salesOverTime: metrics.salesOverTime || [],
      ordersOverTime: metrics.ordersOverTime || [],
      isLoading: false,
    });
  }

  /**
   * displayDashboardError(message)
   * Design method: Displays admin-level errors
   */
  displayDashboardError(message) {
    this.displayError(message);
    console.error("Dashboard error:", message);
    this.setState({ isLoading: false });
  }

  /**
   * fetchOrders()
   * Fetch all orders and calculate metrics
   */
  async fetchOrders() {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        this.displayDashboardError("Authentication required");
        return;
      }

      const res = await axios.get("http://localhost:8000/orders/admin/list/all", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const orders = res.data.orders || res.data;

      // 1. Total revenue
      const total = orders.reduce(
        (sum, order) => sum + (order.total_price || 0),
        0
      );

      // 2. Sales by status (pie chart)
      const statusCount = {};
      for (const order of orders) {
        const status = order.status || "unknown";
        statusCount[status] = (statusCount[status] || 0) + 1;
      }
      const pieData = Object.entries(statusCount).map(([type, value]) => ({
        type,
        value,
      }));

      // 3. Sales over time (line chart)
      const revenueByMonth = {};
      for (const order of orders) {
        const dateObj = new Date(order.created_at);
        const yearMonth = `${dateObj.getFullYear()}-${String(
          dateObj.getMonth() + 1
        ).padStart(2, "0")}`;
        revenueByMonth[yearMonth] =
          (revenueByMonth[yearMonth] || 0) + (order.total_price || 0);
      }

      const sortedMonths = Object.keys(revenueByMonth).sort();
      const salesOverTime = sortedMonths.map((month) => ({
        date: month,
        revenue: revenueByMonth[month],
      }));

      // 4. Order count over time
      const orderCountByMonth = {};
      for (const order of orders) {
        const dateObj = new Date(order.created_at);
        const yearMonth = `${dateObj.getFullYear()}-${String(
          dateObj.getMonth() + 1
        ).padStart(2, "0")}`;
        orderCountByMonth[yearMonth] = (orderCountByMonth[yearMonth] || 0) + 1;
      }

      const ordersOverTime = sortedMonths.map((month) => ({
        date: month,
        count: orderCountByMonth[month],
      }));

      // Render charts with calculated metrics
      this.renderCharts({
        totalRevenue: total,
        orderCount: orders.length,
        salesByStatus: pieData,
        salesOverTime: salesOverTime,
        ordersOverTime: ordersOverTime,
      });
    } catch (err) {
      this.displayDashboardError("Failed to fetch orders data");
      console.error("Error fetching orders:", err);
    }
  }

  componentDidMount() {
    this.fetchOrders();
    this.show();
  }

  render() {
    const {
      totalRevenue,
      orderCount,
      salesByStatus,
      salesOverTime,
      ordersOverTime,
      isLoading,
    } = this.state;

    if (isLoading) {
      return <div style={{ padding: "2rem" }}>Loading dashboard...</div>;
    }

    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          backgroundColor: "#ffffff",
          minHeight: "100vh",
        }}
      >
        <Card
          style={{
            width: "100%",
            background: "#fff",
            borderRadius: "16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            padding: "2rem",
          }}
        >
          <h2
            style={{
              fontSize: "50px",
              fontWeight: "700",
              marginTop: 0,
              marginBottom: "2rem",
              textAlign: "center",
            }}
          >
            Sales Performance Overview
          </h2>

          <Row gutter={[24, 24]} justify="center">
            <Col xs={24} md={12}>
              <Card
                bordered={false}
                style={{
                  height: 600,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Statistic
                  title={
                    <span
                      style={{ fontSize: 24, fontWeight: "bold", color: "#000" }}
                    >
                      Total Revenue This Month
                    </span>
                  }
                  value={totalRevenue}
                  prefix="₫"
                  valueStyle={{
                    color: "#1677ff",
                    fontSize: 48,
                    fontWeight: "bold",
                  }}
                />
                <div style={{ height: "1.5rem" }} />
                <Statistic
                  title={
                    <span
                      style={{ fontSize: 24, fontWeight: "bold", color: "#000" }}
                    >
                      Number of Orders
                    </span>
                  }
                  value={orderCount}
                  valueStyle={{
                    color: "#1677ff",
                    fontSize: 48,
                    fontWeight: "bold",
                  }}
                />
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card
                bordered={false}
                title={
                  <span
                    style={{ fontSize: 24, fontWeight: "bold", color: "#000" }}
                  >
                    Sales by Status
                  </span>
                }
                style={{ height: 600 }}
              >
                <ResponsiveContainer width="100%" height={500}>
                  <PieChart>
                    <Pie
                      data={salesByStatus}
                      dataKey="value"
                      nameKey="type"
                      innerRadius={100}
                      outerRadius={150}
                      paddingAngle={3}
                      label={({ type, percent }) =>
                        `${type} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {salesByStatus.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <ReTooltip
                      formatter={(val, _name, props) => [
                        val,
                        props.payload.type ?? "",
                      ]}
                    />
                    <ReLegend verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          <Row gutter={[24, 24]} style={{ marginTop: "2rem" }}>
            <Col span={24}>
              <Card
                bordered={false}
                title={
                  <span
                    style={{ fontSize: 24, fontWeight: "bold", color: "#000" }}
                  >
                    Sales Over Time
                  </span>
                }
              >
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(v) => `₫${compactNumber(v)}`} />
                    <ReTooltip formatter={(v) => `₫${compactNumber(v)}`} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#1677ff"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col span={24}>
              <Card
                bordered={false}
                title={
                  <span
                    style={{ fontSize: 24, fontWeight: "bold", color: "#000" }}
                  >
                    Number of Orders Over Time
                  </span>
                }
              >
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={ordersOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ReTooltip
                      formatter={(val) => `${val} orders`}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#1677ff"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </Card>
      </div>
    );
  }
}

export default V_DashboardPageView;
