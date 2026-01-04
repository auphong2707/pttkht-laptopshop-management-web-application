import { Card, Col, Row, Statistic } from "antd";
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

export const compactNumber = (value) =>
  new Intl.NumberFormat("en", {
    notation: "compact",        // → 1.2K, 3.4M, 5.6B …
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value);

const Dashboard = ({
  totalRevenue,
  orderCount,
  salesByStatus,  // [{ type: 'delivered', value: 24 }, …]
  salesOverTime,  // [{ date: '2024-01', revenue: 1_200_000 }, …]
  ordersOverTime, // [{ date: '2024-01', count: 120 }, …]
}) => (
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

      {/* ==== KPIs + PIE ==================================================== */}
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
            {/* Responsive Pie */}
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

      {/* ==== LINE CHARTS ==================================================== */}
      <Row gutter={[24, 24]} style={{ marginTop: "2rem" }}>
        {/* Revenue over time */}
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
              <LineChart
                data={salesOverTime}
              >
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

        {/* Orders over time */}
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

export default Dashboard;
