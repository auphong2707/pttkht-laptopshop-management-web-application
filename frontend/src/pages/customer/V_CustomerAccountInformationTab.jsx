import { useState, useEffect } from "react";
import { Descriptions, Spin, Typography, Card, Alert } from "antd";
import axios from "axios";
import { useUser } from "@utils/UserContext.jsx";

const { Title } = Typography;

const CustomerAccountInformationTab = () => {
  const user = useUser();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const token = await user.accessToken;
      const response = await axios.get("http://localhost:8000/accounts/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProfile(response.data);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setError(err.response?.data?.detail || "Failed to load account information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchProfile();
    else setLoading(false);
  }, [user]);

  return (
    <>
      <Title level={3}>Account Information</Title>

      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

      {loading ? (
        <Spin tip="Loading account information..." />
      ) : profile ? (
        <Card>
          <Descriptions column={1} bordered size="middle">
            <Descriptions.Item label="First Name">{profile.first_name}</Descriptions.Item>
            <Descriptions.Item label="Last Name">{profile.last_name}</Descriptions.Item>
            <Descriptions.Item label="Email">{profile.email}</Descriptions.Item>
            <Descriptions.Item label="Phone Number">{profile.phone_number}</Descriptions.Item>
            <Descriptions.Item label="Address">{profile.address}</Descriptions.Item>
          </Descriptions>
        </Card>
      ) : (
        <p>No account information found.</p>
      )}
    </>
  );
};

export default CustomerAccountInformationTab;
