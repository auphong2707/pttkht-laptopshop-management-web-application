import { Layout, Breadcrumb } from "antd";
import { Outlet, useLocation, Link } from "react-router-dom";
import WebsiteHeader from "../components/V_WebsiteHeader.jsx";
import WebsiteFooter from "../components/V_WebsiteFooter.jsx";

const { Content } = Layout;

const pathToName = {
  accountInformation: "Account Information",
  orders: "My Orders",
  productReviews: "Product Reviews",
};

export default function CustomerLayout() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);
  const current = segments[1] || "accountInformation"; // Default to accountInformation

  return (
    <Layout>
      <WebsiteHeader />

      <Content style={{ padding: "1.5rem 12%", background: "#fff" }}>
        <Breadcrumb separator=">" style={{ marginBottom: "1rem" }}>
          <Breadcrumb.Item>
            <Link to="/customer">Customer</Link>
          </Breadcrumb.Item>
          {pathToName[current] ? (
            <Breadcrumb.Item>
              <Link to={`/customer/${current}`}>{pathToName[current]}</Link>
            </Breadcrumb.Item>
          ) : (
            <Breadcrumb.Item>{current}</Breadcrumb.Item>
          )}
        </Breadcrumb>

        <Outlet />
      </Content>

      <WebsiteFooter />
    </Layout>
  );
}
