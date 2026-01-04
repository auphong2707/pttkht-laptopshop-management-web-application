import React from "react";
import {
  Row,
  Col,
  Form,
  Typography,
  Input,
  Button,
  Layout,
  Breadcrumb,
  Alert,
} from "antd";
import { Link, useNavigate } from "react-router-dom";

import V_BaseView from "@components/V_BaseView";
import WebsiteHeader from "@components/V_WebsiteHeader";
import WebsiteFooter from "@components/V_WebsiteFooter";
import { login } from "@utils/authService";
import { useUser } from "@utils/UserContext";

const { Content } = Layout;
const { Text, Title } = Typography;

const contentStyle = {
  backgroundColor: "#fff",
  padding: "2rem",
};

/**
 * V_LoginPageView - Customer Login Page View
 * Extends V_BaseView to follow MVC design pattern
 * Handles customer authentication and registration navigation
 */
class V_LoginPageView extends V_BaseView {
  formRef = React.createRef();

  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      emailInput: "",
      passwordInput: "",
      loginErrorMessage: "",
      isLoading: false,
    };
  }

  /**
   * Display the login form with email and password fields
   */
  showLoginForm() {
    this.setState({ loginErrorMessage: "", isLoading: false });
    this.show();
  }

  /**
   * Submit user credentials for authentication
   * @param {Object} values - Form values containing email and password
   */
  async submitCredentials(values) {
    const { email, password } = values;

    try {
      this.setState({ loginErrorMessage: "", isLoading: true });

      // Authenticate user
      await login(email, password);

      // Refresh user context
      await this.props.refreshUser();

      // Navigate to home page
      this.props.navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      this.setState({
        loginErrorMessage: error.message || "Invalid email or password.",
        isLoading: false,
      });
    }
  }

  /**
   * Navigate to registration page
   */
  navigateToRegistration() {
    this.props.navigate("/register");
  }

  render() {
    const { loginErrorMessage, isLoading } = this.state;

    return (
      <Layout>
        {/* Header */}
        <WebsiteHeader />

        {/* Main Content */}
        <Content className="responsive-padding" style={contentStyle}>
          <Breadcrumb
            className="responsive-padding"
            separator=">"
            style={{ marginBottom: "1rem" }}
          >
            <Breadcrumb.Item>
              <Link to="/">Home</Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <Link to="/customer/login">Login</Link>
            </Breadcrumb.Item>
          </Breadcrumb>

          <Title
            level={2}
            className="responsive-padding"
            style={{ marginBottom: "2rem" }}
          >
            Customer Login
          </Title>

          <Row gutter={[32, 32]} justify="center">
            {/* Left Box: Registered Customers */}
            <Col xs={24} md={8}>
              <div
                style={{
                  background: "#F8F9FF",
                  padding: "0.5rem 2rem 2rem 2rem",
                  borderRadius: "8px",
                }}
              >
                <Title level={4}>Registered Customers</Title>
                <Text>
                  If you have an account, sign in with your email address.
                </Text>

                <Form
                  ref={this.formRef}
                  name="loginForm"
                  onFinish={(values) => this.submitCredentials(values)}
                  layout="vertical"
                  style={{ marginTop: "1rem" }}
                  requiredMark={false}
                >
                  <Form.Item
                    label={
                      <span style={{ fontWeight: "bold" }}>
                        Email <span style={{ color: "red" }}>*</span>
                      </span>
                    }
                    name="email"
                    rules={[
                      { required: true, message: "Please enter your email." },
                      { type: "email", message: "Please enter a valid email." },
                    ]}
                  >
                    <Input placeholder="Your Email" />
                  </Form.Item>

                  <Form.Item
                    label={
                      <span style={{ fontWeight: "bold" }}>
                        Password <span style={{ color: "red" }}>*</span>
                      </span>
                    }
                    name="password"
                    rules={[
                      { required: true, message: "Please enter your password." },
                    ]}
                  >
                    <Input.Password placeholder="Your Password" />
                  </Form.Item>

                  {loginErrorMessage && (
                    <Form.Item>
                      <Alert
                        message={loginErrorMessage}
                        type="error"
                        showIcon
                        style={{ marginBottom: "1rem", borderRadius: "8px" }}
                      />
                    </Form.Item>
                  )}

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={isLoading}
                      style={{
                        padding: "1rem 2rem",
                        borderRadius: "25px",
                        fontSize: "0.9rem",
                        fontWeight: "bold",
                      }}
                    >
                      Sign In
                    </Button>
                    <Link
                      href="#"
                      style={{ marginLeft: "1rem", fontSize: "0.9rem" }}
                    >
                      Forgot Your Password?
                    </Link>
                  </Form.Item>
                </Form>
              </div>
            </Col>

            {/* Right Box: New Customer */}
            <Col xs={24} md={8}>
              <div
                style={{
                  background: "#F8F9FF",
                  padding: "0.5rem 2rem 2rem 2rem",
                  borderRadius: "8px",
                  height: "100%",
                }}
              >
                <Title level={4}>New Customer?</Title>

                <Text>Creating an account has many benefits:</Text>

                <ul style={{ paddingInlineStart: "20px", margin: "1rem 0" }}>
                  <li>Check out faster</li>
                  <li>Keep more than one address</li>
                  <li>Track orders and more</li>
                </ul>

                <Button
                  type="primary"
                  style={{
                    padding: "1rem 2rem",
                    borderRadius: "25px",
                    fontSize: "0.9rem",
                    fontWeight: "bold",
                  }}
                  onClick={() => this.navigateToRegistration()}
                >
                  Create An Account
                </Button>
              </div>
            </Col>
          </Row>
        </Content>

        {/* Footer */}
        <WebsiteFooter />
      </Layout>
    );
  }
}

// HOC wrapper to inject React Router hooks
function V_LoginPageViewWrapper(props) {
  const { refreshUser } = useUser();
  const navigate = useNavigate();

  return (
    <V_LoginPageView 
      {...props} 
      navigate={navigate} 
      refreshUser={refreshUser} 
    />
  );
}

export default V_LoginPageViewWrapper;
