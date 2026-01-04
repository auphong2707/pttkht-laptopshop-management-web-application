import { useState, useEffect } from "react";
import { Flex, Typography, Layout, Space, Menu, Dropdown, Avatar, Input, Modal } from "antd";
import { useNavigate, Link } from "react-router-dom";
import {
  FacebookFilled,
  InstagramFilled,
  ShoppingCartOutlined,
  UserOutlined,
} from "@ant-design/icons";

import { useUser } from "../utils/UserContext";
import { logout } from "../utils/authService";

import logo from "/vite.svg";

const { Text } = Typography;
const { Header } = Layout;

const { Search } = Input; 

const headerStyle = {
  borderBottom: "1px solid #f0f0f0",
  height: "100px",
  display: "flex",
  flexDirection: "column",
  padding: "0px",
  margin: "0px",
  backgroundColor: "white",
};

const AccountMenu = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, clearUser } = useUser();

  const handleMenuClick = (e) => {
    setOpen(false);
    if (e.key === "logout") {
      logout();
      clearUser();
      navigate("/customer/login");
    } else if (e.key === "account") {
      // navigate("/my-account"); // Route to the user's account page
    }
  };

  const menu = (
    <Menu onClick={handleMenuClick} style={{ minWidth: "165px" }}>
      {user ? (
        <>
          {user.role === "admin" ? (
            <>
            <Menu.Item key="dashboard" style={{ fontWeight: "bold" }}>
              <Link to="/admin/dashboard">Dashboard</Link>
            </Menu.Item>
            <Menu.Item key="inventory" style={{ fontWeight: "bold" }}>
              <Link to="/admin/inventory/all">Inventory</Link>
            </Menu.Item>
            <Menu.Item key="addProduct" style={{ fontWeight: "bold" }}>
              <Link to="/admin/detail">Add Product</Link>
            </Menu.Item>

            <Menu.Item key="refund" style={{ fontWeight: "bold" }}>
              <Link to="/admin/refund">Refund Requests</Link>
            </Menu.Item>
            <Menu.Item key="orders" style={{ fontWeight: "bold" }}>
              <Link to="/admin/orders">Orders</Link>
            </Menu.Item>
            </>
          ) : (
            <>
              <Menu.Item key="account" style={{ fontWeight: "bold" }}>
                <Link to="/customer/accountInformation">Account Information</Link>
              </Menu.Item>
              <Menu.Item key="orders" style={{ fontWeight: "bold" }}>
                <Link to="/customer/orders">My Orders</Link>
              </Menu.Item>
              <Menu.Item key="productReviews" style={{ fontWeight: "bold" }}>
                <Link to="/customer/productReviews">Product Reviews</Link>
              </Menu.Item>
            </>
          )}

          <Menu.Divider />
          <Menu.Item key="logout" style={{ fontWeight: "bold", color: "red" }}>
            Logout
          </Menu.Item>
        </>
      ) : (
        <>
          <Menu.Item
            key="signup"
            style={{ fontWeight: "bold" }}
            onClick={() => navigate("/register")}
          >
            Create an Account
          </Menu.Item>
          <Menu.Item
            key="signin"
            style={{ fontWeight: "bold" }}
            onClick={() => navigate("/customer/login")}
          >
            Sign In
          </Menu.Item>
        </>
      )}
    </Menu>
  );

  return (
    <Dropdown
      overlay={menu}
      trigger={["click"]}
      open={open}
      onOpenChange={setOpen}
      placement="bottom"
      overlayStyle={{ paddingRight: "145px" }}
    >
      <Avatar
        icon={<UserOutlined />}
        style={{ cursor: "pointer" }}
      />
    </Dropdown>
  );
};

const WebsiteHeader = () => {
  const { user } = useUser();
  const navigate = useNavigate(); 

  const handleSearch = (value) => {
    const keyword = value.trim();
    if (!keyword) return;

    navigate(
      `/search?query=${encodeURIComponent(keyword)}`
    );
  };

  return (
    <Header style={headerStyle}>
      {/* Top Bar */}
      <Flex
        style={{ backgroundColor: "black", height: "35px" }}
        justify="space-between"
        align="center"
        className="responsive-padding"
      >
        <div>
          <Text strong style={{ color: "grey" }}>
            Mon-Thu:{" "}
          </Text>
          <Text strong style={{ color: "white" }}>
            9:00 AM - 5:30 PM
          </Text>
        </div>

        <div style={{ display: "flex", flexDirection: "row", gap: "5px" }}>
          <Text strong style={{ color: "grey" }}>
            Visit our showroom in 1234 Street Address City Address, 1234
          </Text>
          <Typography.Link
            strong
            underline
            style={{ color: "white" }}
            href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            target="_blank"
            rel="noopener noreferrer"
          >
            Contact Us
          </Typography.Link>
        </div>

        <Space>
          <Text strong style={{ color: "white" }}>
            Call Us: (00) 1234 5678
          </Text>
          <FacebookFilled style={{ color: "white" }} />
          <InstagramFilled style={{ color: "white" }} />
        </Space>
      </Flex>

      {/* Bottom Bar */}
      <Flex
        style={{ backgroundColor: "white", height: "60px" }}
        align="center"
        justify="space-between"
        className="responsive-padding"
      >
        <Flex align="center" gap="large">
          <Link to="/">
            <img
              src={logo}
              alt="Shop Logo"
              className="shop-logo"
              align="center"
              style={{ cursor: "pointer" }}
            />
          </Link>

          <Flex align="center" gap="middle">
            <Typography.Link strong style={{ color: "black" }} href="/laptops/all?usageType=Gaming">
              Gaming Laptops
            </Typography.Link>
            <Typography.Link strong style={{ color: "black" }} href="/laptops/all?usageType=Business">
              Business Laptops
            </Typography.Link>
            <Typography.Link strong style={{ color: "black" }} href="/laptops/all?usageType=Workstation">
              Workstations
            </Typography.Link>
            <Typography.Link strong style={{ color: "black" }} href="/laptops/all?usageType=Ultrabook">
              Ultrabooks
            </Typography.Link>
          </Flex>
        </Flex>

        <Flex align="center" gap="middle">
          <Search
            placeholder="Search laptops…"
            allowClear
            size="medium"
            style={{ width: 280 }}
            onSearch={handleSearch}
          />
          {user?.role !== "admin" && (
            <ShoppingCartOutlined
              style={{ fontSize: "21px", color: "black", cursor: "pointer" }}
              onClick={() => {
                if (user?.role === "customer") {
                  navigate("/shopping-cart");
                } else {
                  Modal.confirm({
                    title: "Login Required",
                    content: "You must be logged in to access the shopping cart.",
                    okText: "Go to Login",
                    cancelText: "Cancel",
                    onOk() {
                      navigate("/customer/login");
                    },
                    onCancel() {
                      // Do nothing — just close the modal
                    },
                  });
                }
              }}
            />
          )}
          <AccountMenu />
        </Flex>
      </Flex>
    </Header>
  );
};

export default WebsiteHeader;
