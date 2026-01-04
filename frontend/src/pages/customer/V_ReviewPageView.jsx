import React from "react";
import { Layout, Rate, Image, Typography, Button, List, notification } from "antd";
import V_BaseView from "@components/V_BaseView";
import axios from "axios";

const { Text, Title } = Typography;

/**
 * V_ReviewPageView
 * View component for customer product reviews
 */
class V_ReviewPageView extends V_BaseView {
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      title: "My Reviews",
      reviewsList: [],
      isLoading: true,
    };
  }

  /**
   * renderReviewsPage()
   * Design method: Display customer reviews list
   */
  renderReviewsPage() {
    this.fetchUserReviews();
    this.show();
  }

  /**
   * editReview(reviewId, newText, newRating)
   * Design method: Update existing review
   */
  async editReview(reviewId, newText, newRating) {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/reviews/${reviewId}`,
        {
          review_text: newText,
          rating: newRating,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      this.displaySuccess("Review updated successfully");
      this.fetchUserReviews();
    } catch (error) {
      this.displayError("Failed to update review");
      console.error("Error updating review:", error);
    }
  }

  /**
   * deleteReview(reviewId)
   * Design method: Delete review
   */
  async deleteReview(reviewId) {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      this.displaySuccess("Review deleted successfully");
      this.fetchUserReviews();
    } catch (error) {
      this.displayError("Failed to delete review");
      console.error("Error deleting review:", error);
    }
  }

  /**
   * fetchUserReviews()
   * Fetch user reviews from API
   */
  async fetchUserReviews() {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/reviews/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      this.setState({
        reviewsList: response.data,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching reviews:", error);
      this.setState({ isLoading: false });
      this.displayError("Failed to load reviews");
    }
  }

  componentDidMount() {
    this.renderReviewsPage();
  }

  render() {
    const { reviewsList, isLoading } = this.state;

    return (
      <div style={{ padding: "24px" }}>
        <Title level={3}>My Product Reviews</Title>
        <List
          loading={isLoading}
          itemLayout="vertical"
          dataSource={reviewsList}
          pagination={{ pageSize: 10, position: "bottom" }}
          renderItem={(review) => (
            <List.Item
              key={review.id}
              actions={[
                <Button
                  key="edit"
                  type="link"
                  onClick={() => {
                    /* Add edit modal */
                  }}
                >
                  Edit
                </Button>,
                <Button
                  key="delete"
                  type="link"
                  danger
                  onClick={() => this.deleteReview(review.id)}
                >
                  Delete
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={
                  <>
                    <Rate disabled defaultValue={review.rating} style={{ fontSize: "16px" }} />
                    <span style={{ marginLeft: "1rem" }}>
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </>
                }
                description={review.laptop_name || `Product ID: ${review.laptop_id}`}
              />
              <p>{review.review_text}</p>
            </List.Item>
          )}
        />
      </div>
    );
  }
}

export default V_ReviewPageView;
