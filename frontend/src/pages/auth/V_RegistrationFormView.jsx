import React from "react";
import { Layout, Typography, Form, Input, Button, Divider, Row, Col } from "antd";
import { Link } from "react-router-dom";
import V_BaseView from "@components/V_BaseView";
import WebsiteHeader from "@components/V_WebsiteHeader";
import WebsiteFooter from "@components/V_WebsiteFooter";
import axios from "axios";

const { Content } = Layout;
const { Title } = Typography;
const { TextArea } = Input;

/**
 * V_RegistrationFormView
 * View component for user registration following MVC design pattern
 */
class V_RegistrationFormView extends V_BaseView {
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      title: "Registration",
      emailInput: "",
      passwordInput: "",
      confirmPasswordInput: "",
      firstNameInput: "",
      lastNameInput: "",
      phoneNumberInput: "",
      addressInput: "",
      roleSelection: "customer",
      validationErrors: {},
      isLoading: false,
      registrationComplete: false,
    };
    this.formRef = React.createRef();
  }

  /**
   * showRegistrationForm()
   * Design method: Display the registration form interface
   */
  showRegistrationForm() {
    this.setState({
      registrationComplete: false,
      emailInput: "",
      passwordInput: "",
      confirmPasswordInput: "",
      firstNameInput: "",
      lastNameInput: "",
      phoneNumberInput: "",
      addressInput: "",
      validationErrors: {},
    });
    this.show();
  }

  /**
   * submitForm(email, password, confirm, role)
   * Design method: Submit registration form data
   */
  async submitForm(values) {
    // Get all form field values including fields from all steps (even hidden ones)
    const allValues = this.formRef.current.getFieldsValue(true);
    const { email, password, confirmPassword, firstName, lastName, phoneNumber, address } = allValues;

    // Validate required fields
    if (!email || !password || !confirmPassword || !firstName || !lastName || !phoneNumber) {
      this.displayError("Please fill in all required fields");
      return;
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      this.displayError("Passwords do not match!");
      return;
    }

    this.setState({ isLoading: true });

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const response = await axios.post(
        `${backendUrl}/accounts`,
        {
          email: email,
          password: password,
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber,
          role: this.state.roleSelection,
          shipping_address: address || "",
        }
      );

      if (response.status === 201) {
        this.setState({
          registrationComplete: true,
          isLoading: false,
        });
        this.displaySuccess("Account created successfully!");
      }
    } catch (error) {
      this.setState({ isLoading: false });
      if (error.response) {
        let errorMsg = "Registration failed";
        
        // Handle Pydantic validation errors (array format in detail field)
        if (error.response.data.detail && Array.isArray(error.response.data.detail)) {
          const fieldErrors = error.response.data.detail.map(err => 
            `${err.loc[err.loc.length - 1]}: ${err.msg}`
          ).join("; ");
          errorMsg = fieldErrors || "Validation failed";
        } else if (error.response.data.detail) {
          // Handle HTTPException with detail message (string format)
          errorMsg = typeof error.response.data.detail === 'string' 
            ? error.response.data.detail 
            : "Validation failed";
        }
        
        this.displayError(errorMsg);
        this.setState({
          validationErrors: { form: errorMsg },
        });
      } else {
        this.displayError("Network error occurred");
      }
    }
  }

  componentDidMount() {
    this.showRegistrationForm();
  }

  render() {
    const { isLoading, registrationComplete } = this.state;

    return (
      <Layout style={{ minHeight: "100vh" }}>
        <WebsiteHeader />
        <Content style={{ padding: "40px 15px" }}>
          <Title
            level={1}
            className="responsive-padding"
            style={{ marginBottom: "2rem" }}
          >
            Sign up
          </Title>

          <div className="responsive-padding">
            <Divider style={{ borderWidth: 1 }} />
          </div>

          <Row gutter={32}>
            <Col
              xs={24}
              md={{ span: 16, offset: 4 }}
            >
              {!registrationComplete ? (
                <Form
                  layout="vertical"
                  ref={this.formRef}
                  onFinish={(values) => this.submitForm(values)}
                >
                  <Form.Item
                    label={
                      <span style={{ fontSize: "1.3rem" }}>
                        First Name <span style={{ color: "red" }}>*</span>
                      </span>
                    }
                    name="firstName"
                    rules={[
                      {
                        required: true,
                        message: "Please enter your first name.",
                      },
                    ]}
                    required={false}
                  >
                    <Input
                      size="large"
                      placeholder="Enter your first name"
                      autoComplete="given-name"
                      style={{ height: "50px", fontSize: "1.1rem" }}
                    />
                  </Form.Item>

                  <Form.Item
                    label={
                      <span style={{ fontSize: "1.3rem" }}>
                        Last Name <span style={{ color: "red" }}>*</span>
                      </span>
                    }
                    name="lastName"
                    rules={[
                      {
                        required: true,
                        message: "Please enter your last name.",
                      },
                    ]}
                    required={false}
                  >
                    <Input
                      size="large"
                      placeholder="Enter your last name"
                      autoComplete="family-name"
                      style={{ height: "50px", fontSize: "1.1rem" }}
                    />
                  </Form.Item>

                  <Form.Item
                    label={
                      <span style={{ fontSize: "1.3rem" }}>
                        Phone Number <span style={{ color: "red" }}>*</span>
                      </span>
                    }
                    name="phoneNumber"
                    rules={[
                      { required: true, message: "Please enter phone number" },
                      {
                        pattern: /^(\+84|0)[1-9][0-9]{8}$/,
                        message: "Invalid phone number",
                      },
                    ]}
                    required={false}
                  >
                    <Input
                      size="large"
                      placeholder="Enter your phone number"
                      autoComplete="tel"
                      style={{ height: "50px", fontSize: "1.1rem" }}
                    />
                  </Form.Item>

                  <Form.Item
                    label={
                      <span style={{ fontSize: "1.3rem" }}>
                        Email <span style={{ color: "red" }}>*</span>
                      </span>
                    }
                    name="email"
                    rules={[
                      { required: true, message: "Please enter your email." },
                      { type: "email", message: "Please enter a valid email." },
                    ]}
                    required={false}
                  >
                    <Input
                      size="large"
                      placeholder="Enter your email"
                      autoComplete="email"
                      style={{ height: "50px", fontSize: "1.1rem" }}
                    />
                  </Form.Item>

                  <Form.Item
                    label={<span style={{ fontSize: "1.3rem" }}>Shipping Address</span>}
                    name="address"
                  >
                    <TextArea
                      size="large"
                      placeholder="Enter your shipping address (optional)"
                      autoSize={{ minRows: 3, maxRows: 5 }}
                      style={{ fontSize: "1.1rem" }}
                    />
                  </Form.Item>

                  <Form.Item
                    label={
                      <span style={{ fontSize: "1.3rem" }}>
                        Password <span style={{ color: "red" }}>*</span>
                      </span>
                    }
                    name="password"
                    rules={[
                      {
                        required: true,
                        message: "Please enter your password.",
                      },
                      {
                        min: 8,
                        message: "Password must be at least 8 characters.",
                      },
                      {
                        max: 32,
                        message: "Password must be at most 32 characters.",
                      },
                      {
                        pattern: /^(?=.*[a-zA-Z])(?=.*\d)/,
                        message: "Password must contain at least one letter and one number.",
                      },
                    ]}
                    required={false}
                  >
                    <Input
                      size="large"
                      placeholder="Enter your password"
                      autoComplete="new-password"
                      type="password"
                      style={{ height: "50px", fontSize: "1.1rem" }}
                    />
                  </Form.Item>

                  <Form.Item
                    label={
                      <span style={{ fontSize: "1.3rem" }}>
                        Confirm Password <span style={{ color: "red" }}>*</span>
                      </span>
                    }
                    name="confirmPassword"
                    rules={[
                      {
                        required: true,
                        message: "Please confirm your password.",
                      },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue("password") === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(
                            new Error("Passwords do not match!"),
                          );
                        },
                      }),
                    ]}
                    required={false}
                  >
                    <Input
                      size="large"
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                      type="password"
                      style={{ height: "50px", fontSize: "1.1rem" }}
                    />
                  </Form.Item>

                  <Form.Item style={{ marginTop: "50px" }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={isLoading}
                      disabled={isLoading}
                      style={{
                        padding: "1rem 2rem",
                        borderRadius: "25px",
                        fontSize: "1rem",
                        fontWeight: "bold",
                      }}
                    >
                      {isLoading ? "Creating Account..." : "Create Account"}
                    </Button>
                  </Form.Item>
                </Form>
              ) : (
                <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
                  <Title level={2} style={{ color: "green" }}>
                    🎉 Account Created Successfully! 🎉
                  </Title>
                  <p style={{ fontSize: "1.2rem" }}>
                    Your account has been created. You can now sign in using
                    your credentials.
                  </p>
                  <Link to="/customer/login">
                    <Button
                      type="primary"
                      size="large"
                      style={{ marginTop: "1rem" }}
                    >
                      Go to Login
                    </Button>
                  </Link>
                </div>
              )}
            </Col>
          </Row>
        </Content>
        <WebsiteFooter />
      </Layout>
    );
  }
}

export default V_RegistrationFormView;
