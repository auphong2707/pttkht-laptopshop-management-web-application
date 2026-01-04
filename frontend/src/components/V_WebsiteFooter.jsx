import { Row, Col, Typography, Layout } from "antd";
import {
  CustomerServiceOutlined,
  UserOutlined,
  TagOutlined,
  FacebookOutlined,
  InstagramOutlined,
} from "@ant-design/icons";
const { Title, Text, Paragraph, Link } = Typography;
const { Footer } = Layout;

const features = [
  {
    icon: <CustomerServiceOutlined style={{ fontSize: 30, color: "white" }} />,
    title: "Product Support",
    description:
      "Up to 3 years on-site warranty available for your peace of mind.",
  },
  {
    icon: <UserOutlined style={{ fontSize: 30, color: "white" }} />,
    title: "Personal Account",
    description:
      "With big discounts, free delivery and a dedicated support specialist.",
  },
  {
    icon: <TagOutlined style={{ fontSize: 30, color: "white" }} />,
    title: "Amazing Savings",
    description:
      "Up to 70% off new Products, you can be sure of the best price.",
  },
];

const footerStyle = {
  borderBottom: "1px solid #f0f0f0",
  height: "100px",
  display: "flex",
  flexDirection: "column",
  padding: "0px",
  margin: "0px",
  backgroundColor: "white",
};

const WebsiteFooter = () => {
  return (
    <Footer style={footerStyle}>
      <div
        style={{
          textAlign: "center",
          background: "#fff",
          paddingTop: 70,
          paddingBottom: 30,
          display: "flex",
          justifyContent: "space-evenly",
        }}
        className="responsive-padding"
      >
        {features.map((feature, index) => (
          <Col xs={24} sm={12} md={8} key={index}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 60,
                  background: "#0156FF",
                  borderRadius: "50%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {feature.icon}
              </div>
              <Title level={4}>{feature.title}</Title>
              <Paragraph style={{ width: "60%", fontSize: 16 }}>
                {feature.description}
              </Paragraph>
            </div>
          </Col>
        ))}
      </div>

      <div
        style={{
          background: "#000",
          color: "#fff",
          paddingTop: "15px",
          paddingBottom: "10px",
        }}
        className="responsive-padding"
      >
        {/* Footer Links */}
        <Row gutter={[40, 20]}>
          <Col xs={24} sm={12} md={6}>
            <Title level={5} style={{ color: "#fff" }}>
              Information
            </Title>
            <Text style={{ display: "block", color: "#bbb" }}>About Us</Text>
            <Text style={{ display: "block", color: "#bbb" }}>
              Privacy Policy
            </Text>
            <Text style={{ display: "block", color: "#bbb" }}>Contact Us</Text>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Title level={5} style={{ color: "#fff" }}>
              PC Parts
            </Title>
            <Text style={{ display: "block", color: "#bbb" }}>CPUs</Text>
            <Text style={{ display: "block", color: "#bbb" }}>
              Graphic Cards
            </Text>
            <Text style={{ display: "block", color: "#bbb" }}>
              RAM (Memory)
            </Text>
            <Text style={{ display: "block", color: "#bbb" }}>
              Motherboards
            </Text>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Title level={5} style={{ color: "#fff" }}>
              Laptops
            </Title>
            <Text style={{ display: "block", color: "#bbb" }}>
              Everyday Use Notebooks
            </Text>
            <Text style={{ display: "block", color: "#bbb" }}>
              Gaming Laptops
            </Text>
            <Text style={{ display: "block", color: "#bbb" }}>
              Workstation Laptops
            </Text>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Title level={5} style={{ color: "#fff" }}>
              Address
            </Title>
            <Text style={{ display: "block", color: "#bbb" }}>
              Address: 1234 Street Adress City, 1234
            </Text>
            <Text style={{ display: "block", color: "#bbb" }}>
              Phone: (00) 1234 5678
            </Text>
            <Text style={{ display: "block", color: "#bbb" }}>
              E-mail:{" "}
              <Link href="mailto:shop@email.com" style={{ color: "#007BFF" }}>
                shop@email.com
              </Link>
            </Text>
          </Col>
        </Row>

        <hr style={{ border: "0.5px solid #222", marginTop: 40 }} />

        {/* Social Media & Copyright */}
        <Row justify="space-between" align="middle" style={{ marginTop: 10 }}>
          <Col>
            <FacebookOutlined
              style={{ fontSize: "20px", color: "#fff", marginRight: "10px" }}
            />
            <InstagramOutlined style={{ fontSize: "20px", color: "#fff" }} />
          </Col>
          <Col>
            <Text style={{ color: "#bbb" }}>Copyright © 2025 Veil</Text>
          </Col>
        </Row>
      </div>
    </Footer>
  );
};

export default WebsiteFooter;
