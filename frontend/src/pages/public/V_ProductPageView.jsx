import React from "react";
import { Layout, Typography, Breadcrumb, Table, Image, Rate, Modal, notification, List } from "antd";
import { Link } from "react-router-dom";
import V_BaseView from "@components/V_BaseView";
import WebsiteHeader from "@components/V_WebsiteHeader";
import WebsiteFooter from "@components/V_WebsiteFooter";
import ProductImage from "@components/product_page/V_ProductImage";
import ProductTabs from "@components/product_page/V_ProductTabs";
import Purchase from "@components/product_page/V_Purchase";
import SupportSection from "@components/product_page/V_SupportSection";
import axios from "axios";
import { isAuthenticated, getToken } from "@utils/authService";

const { Content } = Layout;
const { Title, Text } = Typography;

/**
 * V_ProductPageView
 * View component for displaying product details and reviews
 */
class V_ProductPageView extends V_BaseView {
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      title: "Product Details",
      selectedProductId: props.productId || null,
      productDetails: {},
      reviewsList: [],
      userRatingInput: 0,
      userReviewText: "",
      isSubmittingReview: false,
    };
  }

  /**
   * renderProductDetails(productId)
   * Design method: Display product information and specifications
   */
  renderProductDetails(productId) {
    this.setState({ selectedProductId: productId }, () => {
      this.fetchProductData();
      this.fetchProductReviews();
    });
    this.show();
  }

  /**
   * submitReview(rating, reviewText)
   * Design method: Submit user review for product
   */
  async submitReview() {
    const { userRatingInput, userReviewText, selectedProductId } = this.state;

    // Check if user is authenticated
    if (!isAuthenticated()) {
      Modal.confirm({
        title: "Login Required",
        content: "You must be logged in to submit a review.",
        okText: "Go to Login",
        cancelText: "Cancel",
        onOk: () => {
          window.location.href = "/customer/login";
        },
      });
      return;
    }

    if (userRatingInput === 0 || userReviewText.trim() === "") {
      this.displayError("Please provide a rating and write a review before submitting.");
      return;
    }

    this.setState({ isSubmittingReview: true });

    try {
      const token = getToken();
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/reviews/`,
        {
          rating: userRatingInput,
          review_text: userReviewText,
          laptop_id: parseInt(selectedProductId),
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        this.displaySuccess("Review submitted successfully!");
        this.setState({
          userRatingInput: 0,
          userReviewText: "",
          isSubmittingReview: false,
        });
        this.fetchProductReviews();
      }
    } catch (error) {
      this.setState({ isSubmittingReview: false });
      const errorMsg = error.response?.data?.detail || "Unable to submit review. Please try again later.";
      this.displayError(errorMsg);
    }
  }

  /**
   * fetchProductData()
   * Fetch product details from API
   */
  async fetchProductData() {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/laptops/id/${this.state.selectedProductId}`
      );
      const transformedData = this.transformProductData(response.data);
      this.setState({ productDetails: transformedData });
    } catch (error) {
      this.displayError("Failed to load product details");
      console.error("Error fetching product:", error);
    }
  }

  /**
   * fetchProductReviews()
   * Fetch product reviews from API
   */
  async fetchProductReviews() {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/reviews/laptop/${this.state.selectedProductId}`
      );
      this.setState({ reviewsList: response.data });
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  }

  /**
   * transformProductData()
   * Transform product data for display
   */
  transformProductData(data) {
    // Ensure product_images is always an array
    let imageArray = [];
    if (data.product_images) {
      if (typeof data.product_images === 'string') {
        try {
          imageArray = JSON.parse(data.product_images);
          if (!Array.isArray(imageArray)) {
            imageArray = [];
          }
        } catch (e) {
          console.error('Error parsing product_images:', e);
          imageArray = [];
        }
      } else if (Array.isArray(data.product_images)) {
        imageArray = data.product_images;
      }
    }

    return {
      ...data,
      product_images: imageArray, // Ensure it's always an array
      name: data["name"] ? data["name"].toUpperCase() : "N/A",
      brand: data["brand"] ? data["brand"].toUpperCase() : "N/A",
      cpu: data["cpu"] ? data["cpu"].toUpperCase() : "N/A",
      ram_type: data["ram_type"] ? data["ram_type"].toUpperCase() : "N/A",
      storage_type: data["storage_type"] ? data["storage_type"].toUpperCase() : "N/A",
      vga: data["vga"] ? data["vga"].toUpperCase() : "N/A",
      default_os: data["default_os"]
        ? data["default_os"]
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(" ")
        : "N/A",
      webcam_resolution: data["webcam_resolution"]
        ? data["webcam_resolution"].toUpperCase()
        : "N/A",
    };
  }

  /**
   * renderProductHeader()
   * Render product header with breadcrumb
   */
  renderProductHeader(title, series) {
    return (
      <>
        <Breadcrumb separator=">" style={{ marginBottom: "1rem" }}>
          <Breadcrumb.Item>
            <Link to="/">Home</Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <Link to="/laptops/all">Laptops</Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <Link to={`/laptops/${series?.toLowerCase()}`}>{series}</Link>
          </Breadcrumb.Item>
        </Breadcrumb>
        <Title level={2} style={{ fontWeight: "bold" }}>
          {title}
        </Title>
        <Text type="secondary" style={{ color: "#0156ff", cursor: "pointer" }}>
          Be the first to review this product
        </Text>
      </>
    );
  }

  /**
   * renderAboutProduct()
   * Render About Product tab content
   */
  renderAboutProduct() {
    const { productDetails, selectedProductId } = this.state;
    return (
      <div style={{ maxWidth: "80%", paddingLeft: "5.5%", paddingRight: "0%" }}>
        {this.renderProductHeader(productDetails.name, productDetails.brand)}
        <p style={{ marginTop: "1rem", fontSize: "16px", lineHeight: "1.6" }}>
          {productDetails.description}
        </p>
        <div
          style={{
            marginTop: "2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            paddingBottom: "50px",
          }}
        >
          <Text style={{ fontWeight: "bold" }}>
            Have a Question?{" "}
            <Typography.Link href="#" style={{ textDecoration: "underline" }}>
              Contact Us
            </Typography.Link>
          </Text>
          <Text>VN-{selectedProductId}</Text>
        </div>
      </div>
    );
  }

  /**
   * renderSpecs()
   * Render Specs tab content
   */
  renderSpecs() {
    const { productDetails, selectedProductId } = this.state;
    return (
      <div style={{ maxWidth: "80%", paddingLeft: "5.5%", paddingRight: "0%" }}>
        {this.renderProductHeader(productDetails.name, productDetails.brand)}
        <Table
          columns={[
            { title: "Category", dataIndex: "category", key: "category" },
            { title: "Details", dataIndex: "details", key: "details" },
          ]}
          dataSource={[
            { key: "1", category: "CPU", details: productDetails.cpu },
            { key: "2", category: "RAM", details: `${productDetails.ram_amount}GB (${productDetails.ram_type})` },
            { key: "3", category: "Storage", details: `${productDetails.storage_amount}GB ${productDetails.storage_type}` },
            { key: "4", category: "Screen Size", details: `${productDetails.screen_size} inches` },
            { key: "5", category: "Screen Resolution", details: productDetails.screen_resolution },
            { key: "6", category: "Screen Refresh Rate", details: `${productDetails.screen_refresh_rate}Hz` },
            { key: "7", category: "Battery Capacity", details: `${productDetails.battery_capacity}Wh (${productDetails.battery_cells} cells)` },
            { key: "8", category: "Graphics Card (VGA)", details: productDetails.vga },
            { key: "9", category: "Operating System", details: productDetails.default_os },
            { key: "10", category: "Weight", details: `${productDetails.weight} kg` },
            { key: "11", category: "HDMI Ports", details: productDetails.number_hdmi_ports },
            { key: "12", category: "USB-C Ports", details: productDetails.number_usb_c_ports },
            { key: "13", category: "USB-A Ports", details: productDetails.number_usb_a_ports },
            { key: "14", category: "Ethernet Ports", details: productDetails.number_ethernet_ports },
            { key: "15", category: "Audio Jacks", details: productDetails.number_audio_jacks },
            { key: "16", category: "Webcam Resolution", details: productDetails.webcam_resolution },
            { key: "17", category: "Width", details: `${productDetails.width} cm` },
            { key: "18", category: "Depth", details: `${productDetails.depth} cm` },
            { key: "19", category: "Height", details: `${productDetails.height} cm` },
            { key: "20", category: "Warranty", details: `${productDetails.warranty} months` },
          ]}
          pagination={false}
          bordered
        />
        <div
          style={{
            marginTop: "2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            paddingBottom: "50px",
          }}
        >
          <Text style={{ fontWeight: "bold" }}>
            Have a Question?{" "}
            <Typography.Link href="#" style={{ textDecoration: "underline" }}>
              Contact Us
            </Typography.Link>
          </Text>
          <Text>VN-{selectedProductId}</Text>
        </div>
      </div>
    );
  }

  componentDidMount() {
    if (this.props.productId) {
      this.renderProductDetails(this.props.productId);
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.productId !== this.props.productId && this.props.productId) {
      this.renderProductDetails(this.props.productId);
    }
  }

  render() {
    const { productDetails, reviewsList, userRatingInput, userReviewText, selectedProductId } = this.state;

    // Get imageUrls - should be guaranteed as array from transformProductData
    const imageUrls = Array.isArray(productDetails.product_images) 
      ? productDetails.product_images 
      : [];

    const imageUrl = imageUrls.length > 0
      ? `${import.meta.env.VITE_BACKEND_URL}${imageUrls[0]}`
      : "/placeholder.png";

    return (
      <Layout>
        <WebsiteHeader />
        <Content
          className="responsive-padding"
          style={{
            backgroundColor: "#fff",
            padding: "0rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: "100%",
          }}
        >
          <Purchase price={productDetails.sale_price} laptopId={selectedProductId} />
          <div style={{ width: "70%", paddingLeft: "7%" }}>
            <ProductTabs
              tabLabels={["About Product", "Specs"]}
              tabContents={[this.renderAboutProduct(), this.renderSpecs()]}
            />
          </div>
          <ProductImage
            imageUrls={imageUrls.map(
              (url) => `${import.meta.env.VITE_BACKEND_URL}${url}`
            )}
          />
        </Content>

        <div style={{ padding: "2rem", width: "60%", alignSelf: "center" }}>
          <Title level={4} style={{ fontWeight: "bold", marginBottom: "1rem" }}>
            Customer Reviews
          </Title>
          <List
            itemLayout="vertical"
            dataSource={reviewsList}
            pagination={{ pageSize: 5, position: "bottom" }}
            renderItem={(review) => (
              <List.Item key={review.reviewId}>
                <List.Item.Meta
                  title={
                    <>
                      <Rate disabled defaultValue={review.rating} style={{ fontSize: "16px" }} />
                      <span style={{ marginLeft: "1rem" }}>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </>
                  }
                />
                <p>{review.comment}</p>
              </List.Item>
            )}
          />
        </div>

        <div style={{ backgroundColor: "#ffffff", justifyContent: "center", display: "flex" }}>
          <div style={{ padding: "2rem", width: "60%", alignSelf: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <Title level={4} style={{ fontWeight: "bold", margin: 0 }}>
                SUBMIT REVIEWS AND RATINGS
              </Title>
            </div>
            <hr style={{ marginTop: "25px", marginBottom: "1.5rem" }} />

            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "24px" }}>
              <Image
                src={imageUrl}
                alt="Product"
                width={80}
                height={60}
                style={{ borderRadius: "4px" }}
                preview={false}
              />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <Text
                  style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    marginBottom: "0.25rem",
                    lineHeight: "1.4",
                  }}
                >
                  {productDetails.name || "PRODUCT'S NAME"}
                </Text>
                <Rate
                  value={userRatingInput}
                  onChange={(value) => this.setState({ userRatingInput: value })}
                  style={{ fontSize: "24px" }}
                />
              </div>
            </div>

            <textarea
              value={userReviewText}
              onChange={(e) => this.setState({ userReviewText: e.target.value })}
              rows={4}
              placeholder="Write your review..."
              style={{
                width: "100%",
                padding: "1rem",
                marginBottom: "1rem",
                border: "1px solid #000",
                borderRadius: "4px",
                fontSize: "16px",
                fontFamily: "sans-serif",
              }}
            />

            <button
              onClick={() => this.submitReview()}
              style={{
                padding: "0.6rem 1.5rem",
                backgroundColor: "#4e6ef2",
                color: "#fff",
                border: "none",
                borderRadius: "20px",
                fontWeight: "bold",
                float: "right",
                cursor: "pointer",
                marginTop: "8px",
              }}
            >
              SUBMIT
            </button>
          </div>
        </div>

        <SupportSection />
        <WebsiteFooter />
      </Layout>
    );
  }
}

export default V_ProductPageView;
