import React from "react";
import { Layout, Form, Input, Button, Typography, Divider } from "antd";
import V_BaseView from "@components/V_BaseView";
import axios from "axios";

const { Title } = Typography;

/**
 * V_ProfilePageView
 * View component for customer profile management
 */
class V_ProfilePageView extends V_BaseView {
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      title: "Profile",
      firstNameInput: "",
      lastNameInput: "",
      emailInput: "",
      phoneNumberInput: "",
      addressInput: "",
      isEditingMode: false,
      isSaving: false,
    };
    this.formRef = React.createRef();
  }

  /**
   * renderProfilePage()
   * Design method: Display user profile information
   */
  renderProfilePage() {
    this.fetchProfile();
    this.show();
  }

  /**
   * updateProfile(profileData)
   * Design method: Update user profile information
   */
  async updateProfile() {
    try {
      this.setState({ isSaving: true });
      const values = await this.formRef.current.validateFields();
      const token = localStorage.getItem("accessToken");

      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/accounts/profile`,
        {
          first_name: values.first_name,
          last_name: values.last_name,
          phone_number: values.phone_number,
          address: values.address,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      this.displaySuccess("Profile updated successfully");
      this.setState({ isEditingMode: false, isSaving: false });
      this.fetchProfile();
    } catch (error) {
      this.setState({ isSaving: false });
      this.displayError("Failed to update profile");
      console.error("Error updating profile:", error);
    }
  }

  /**
   * fetchProfile()
   * Fetch user profile from API
   */
  async fetchProfile() {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/accounts/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const profile = response.data;
      this.setState({
        firstNameInput: profile.first_name,
        lastNameInput: profile.last_name,
        emailInput: profile.email,
        phoneNumberInput: profile.phone_number,
        addressInput: profile.address || "",
      });

      if (this.formRef.current) {
        this.formRef.current.setFieldsValue({
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email,
          phone_number: profile.phone_number,
          address: profile.address || "",
        });
      }
    } catch (error) {
      this.displayError("Failed to load profile");
      console.error("Error fetching profile:", error);
    }
  }

  componentDidMount() {
    this.renderProfilePage();
  }

  render() {
    const { isEditingMode, isSaving } = this.state;

    return (
      <div style={{ padding: "24px", maxWidth: "600px" }}>
        <Title level={3}>Account Information</Title>
        <Divider />

        <Form ref={this.formRef} layout="vertical">
          <Form.Item
            label="First Name"
            name="first_name"
            rules={[{ required: true, message: "Please enter your first name" }]}
          >
            <Input size="large" disabled={!isEditingMode} />
          </Form.Item>

          <Form.Item
            label="Last Name"
            name="last_name"
            rules={[{ required: true, message: "Please enter your last name" }]}
          >
            <Input size="large" disabled={!isEditingMode} />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, type: "email", message: "Please enter valid email" }]}
          >
            <Input size="large" disabled />
          </Form.Item>

          <Form.Item
            label="Phone Number"
            name="phone_number"
            rules={[{ required: true, message: "Please enter phone number" }]}
          >
            <Input size="large" disabled={!isEditingMode} />
          </Form.Item>

          <Form.Item label="Address" name="address">
            <Input.TextArea rows={3} disabled={!isEditingMode} />
          </Form.Item>

          {!isEditingMode ? (
            <Button
              type="primary"
              size="large"
              onClick={() => this.setState({ isEditingMode: true })}
            >
              Edit Profile
            </Button>
          ) : (
            <div style={{ display: "flex", gap: "10px" }}>
              <Button
                type="primary"
                size="large"
                loading={isSaving}
                onClick={() => this.updateProfile()}
              >
                Save Changes
              </Button>
              <Button
                size="large"
                onClick={() => {
                  this.setState({ isEditingMode: false });
                  this.fetchProfile();
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </Form>
      </div>
    );
  }
}

export default V_ProfilePageView;
