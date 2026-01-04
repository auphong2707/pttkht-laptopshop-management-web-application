import { Layout, Breadcrumb } from "antd";
import { Outlet, useLocation, Link } from "react-router-dom";
import WebsiteHeader from "../components/V_WebsiteHeader.jsx";
import WebsiteFooter from "../components/V_WebsiteFooter.jsx";

const { Content } = Layout;

const pathToName = {
  dashboard: "Dashboard",
  inventory: "Inventory",
  detail: "Product Detail",
  refund: "Refund Requests",
  "stock-alerts": "Stock Alerts",
  orders: "Orders",
};

export default function AdministratorLayout() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean); // e.g., ['admin', 'detail', '123']
  const current = segments[1] || "dashboard";

  // Handle extra info like ID or Add mode
  const extra =
    current === "detail" && segments[2]
      ? `: ${segments[2]}`
      : current === "detail"
      ? " (Add Product)"
      : "";

  return (
    <Layout>
      <WebsiteHeader />

      <Content style={{ padding: "1.5rem 12%", background: "#fff" }}>
        <Breadcrumb separator=">" style={{ marginBottom: "1rem" }}>
          <Breadcrumb.Item>
            <Link to="/admin">Admin</Link>
          </Breadcrumb.Item>
          {pathToName[current] ? (
            <Breadcrumb.Item>
              <Link to={`/admin/${current}`}>
                {pathToName[current]}
              </Link>
              {extra && <span>{extra}</span>}
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
