import { useEffect, useState } from "react";
import { Rate, Select, List, Spin, Typography, Tag } from "antd";
import axios from "axios";

import { useUser } from "@utils/UserContext";

const { Option } = Select;
const { Title, Text } = Typography;

const CustomerProductReviewsTab = () => {
  const user = useUser();

  const [reviews, setReviews] = useState([]);
  const [selectedRating, setSelectedRating] = useState(0); // 0 = all ratings
  const [limit, setLimit] = useState(5);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const token = user.accessToken;

      const response = await axios.get(`http://localhost:8000/reviews/user`, {
        params: { skip: 0, limit },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setReviews(response.data);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (!user) return;

    fetchReviews();
  }, [user, selectedRating, limit]);


  return (
    <div>
      <Title level={3}>My Product Reviews</Title>

      <div style={{ marginBottom: "16px" }}>
        <Text>Number of Reviews:</Text>
        <Select
          value={limit}
          onChange={(value) => setLimit(value)}
          style={{ width: 120, marginLeft: 10 }}
        >
          {[5, 10, 20, 50].map((l) => (
            <Option key={l} value={l}>
              {l}
            </Option>
          ))}
        </Select>
      </div>

      {loading ? (
        <Spin tip="Loading reviews..." />
      ) : (
        <List
          bordered
          dataSource={reviews}
          renderItem={(item) => (
            <List.Item>
              <div style={{ width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Text strong>{item.user_name || "You"}</Text>
                  <Tag color="blue">{item.created_at?.split("T")[0]}</Tag>
                </div>
                <Rate disabled defaultValue={item.rating} />
                <p style={{ marginTop: 4 }}>
                  {item.review_text || <i>No review text provided.</i>}
                </p>
              </div>
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

export default CustomerProductReviewsTab;