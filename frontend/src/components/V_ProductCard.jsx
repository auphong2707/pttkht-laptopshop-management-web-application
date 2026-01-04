import { useState } from "react";
import {
  Card,
  Typography,
  Rate,
  Tooltip,
  Image,
  Button,
  Modal,
  message,
} from "antd";
import {
  CheckCircleFilled,
  InfoCircleFilled,
  CloseOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import axios from "axios";

const { Title, Text, Paragraph } = Typography;

const formatPrice = (price) => {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const ProductCard = ({
  inStock,
  imgSource,
  rate,
  numRate,
  productName,
  originalPrice,
  salePrice,
  productId,
  isAdmin = false,
  showDeleteButton = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleDelete = async (productId) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`http://localhost:8000/laptops/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success("Product deleted successfully");
    } catch (error) {
      console.error("Error deleting product:", error);
      message.error("Failed to delete product");
    }
  };

  const showModal = () => {
    setModalVisible(true);
  };

  const handleOk = () => {
    handleDelete(productId);
    setModalVisible(false);
    window.location.reload();
  };

  const handleCancel = () => {
    setModalVisible(false);
    message.error("Product deletion cancelled");
  };

  return (
    <div style={{ padding: 3, position: "relative" }}>
      {showDeleteButton && (
        <Button
          size="small"
          shape="circle"
          icon={<CloseOutlined />}
          style={{
            position: "absolute",
            top: 5,
            right: -20,
            zIndex: 1,
            backgroundColor: "#fff",
            borderColor: "#ccc",
          }}
          onClick={showModal}
        />
      )}

      {/* Modal to confirm deletion */}
      <Modal
        title="Confirm Deletion"
        visible={modalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Yes, delete it"
        cancelText="Cancel"
        okType="danger"
      >
        <p>
          {
            "Are you sure you want to delete this product? This action cannot be undone."
          }
        </p>
      </Modal>

      <Link
        to={isAdmin ? `/admin/detail/${productId}` : `/product/${productId}`}
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <Card
          style={{
            width: 228,
            height: 345,
            borderRadius: 2,
            cursor: "pointer",
          }}
          hoverable
          variant="borderless"
        >
          {/* Availability Check */}
          {inStock ? (
            <div style={{ marginBottom: 10, color: "#78A962" }}>
              <CheckCircleFilled style={{ fontSize: 12 }} />
              <Text
                strong
                style={{ marginLeft: 7, color: "#78A962", fontSize: 12 }}
              >
                in stock
              </Text>
            </div>
          ) : (
            <div style={{ marginBottom: 10, color: "#C94D3F" }}>
              <InfoCircleFilled style={{ fontSize: 12 }} />
              <Text
                strong
                style={{ marginLeft: 7, color: "#C94D3F", fontSize: 12 }}
              >
                check availability
              </Text>
            </div>
          )}

          {/* Product Image */}
          <Image 
            src={imgSource || "/placeholder.png"} 
            height={120} 
            width="100%" 
            preview={false}
            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6ZAAAAFUlEQVR42mNkYPhfAQAFAwH/wkFQ/QAAFQQJ/wIAAwCEAAH/EgGJ4gAAAABJRU5ErkJggg=="
          />

          {/* Star Rating & Reviews */}
          <div style={{ marginTop: 2, width: "100%" }}>
            <Rate disabled value={rate} style={{ fontSize: 10 }} allowHalf />
            <Text
              style={{ marginLeft: 10, color: "#666", fontSize: 10 }}
              strong={false}
            >
              ({numRate} Reviews)
            </Text>
          </div>

          {/* Product Name */}
          <div style={{ marginTop: 5 }}>
            <Tooltip title={productName} placement="top">
              <Paragraph
                ellipsis={{ rows: 2, expandable: false }}
                style={{ cursor: "pointer", fontSize: 13 }}
                strong={false}
              >
                {productName}
              </Paragraph>
            </Tooltip>
          </div>

          {/* Price Section */}
          <div>
            <Text delete style={{ fontSize: 13, color: "#888" }} strong={false}>
              {formatPrice(originalPrice)}đ
            </Text>
            <Title level={4} style={{ margin: 0, color: "#000" }}>
              {formatPrice(salePrice)}đ
            </Title>
          </div>
        </Card>
      </Link>
    </div>
  );
};

ProductCard.propTypes = {
  inStock: PropTypes.bool,
  imgSource: PropTypes.string,
  rate: PropTypes.number,
  numRate: PropTypes.number,
  productName: PropTypes.string,
  originalPrice: PropTypes.number,
  salePrice: PropTypes.number,
  productId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  isAdmin: PropTypes.bool,
  showDeleteButton: PropTypes.bool,
};

const getRandomProductCardData = () => {
  const originalPrice = Math.random() * 1000;
  const salePrice = originalPrice - Math.random() * 100;

  return {
    inStock: Math.random() > 0.5,
    imgSource: null,
    rate: Math.random() * 5,
    numRate: Math.floor(Math.random() * 100),
    productName:
      `PRODUCT ${Math.floor(Math.random() * 100)}` +
      " (" +
      "LENGTH TEST ".repeat(5) +
      ")",
    originalPrice: originalPrice,
    salePrice: salePrice,
  };
};

export default ProductCard;
export { getRandomProductCardData };
