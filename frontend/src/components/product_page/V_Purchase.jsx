import { useState } from "react";
import PropTypes from "prop-types";
import { Button, InputNumber, Typography, Flex, notification, Modal } from "antd";
import axios from "axios";
import { getToken } from "../../utils/authService";

const { Text } = Typography;

const formatPrice = (price, quantity) => {
  if (isNaN(price) || price === null || price === undefined) {
    return "N/A";
  }
  price = price * quantity;
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const Purchase = ({ price, laptopId }) => {
  const [quantity, setQuantity] = useState(1);

  const handleQuantityChange = (value) => {
    setQuantity(value);
  };

  const handleAddToCart = async () => {
    const token = getToken();

    if (!token) {
      Modal.confirm({
        title: "Login Required",
        content: "You must be logged in to add items to the cart.",
        okText: "Go to Login",
        cancelText: "Cancel",
        onOk() {
          window.location.href = "/customer/login";
        },
      });
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:8000/cart/add",
        {
          laptop_id: laptopId,
          quantity: quantity,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      notification.success({
        message: (
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>
            Success
          </Text>
        ),
        description: (
          <Text style={{ fontSize: 20 }}>
            Product added to cart successfully!
          </Text>
        ),
        duration: 3,
        placement: "top",
        style: {
          fontSize: "16px",
          padding: "16px",
          width: "600px",
        },
      });

      setQuantity(1);
    } catch (error) {
      notification.error({
        message: (
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>
            Error
          </Text>
        ),
        description: (
          <Text style={{ fontSize: 20 }}>
            Unable to add laptop to cart. Please try again later.
          </Text>
        ),
        duration: 3,
        placement: "top",
        style: {
          fontSize: "16px",
          padding: "16px",
          width: "600px",
        },
      });
    }
  };


  const formattedPrice = formatPrice(price, quantity);

  return (
    <div
      style={{
        position: "absolute",
        top: "100px",
        right: "20px",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        width: "100%",
        maxWidth: "750px",
        padding: "16px 0",
        zIndex: "1000",
      }}
    >
      <Flex
        style={{ flexGrow: 1, justifyContent: "center", alignItems: "center" }}
        gap="16px"
      >
        <Text style={{ fontSize: "16px" }}>
          On Sale from <strong>{formattedPrice}₫</strong>
        </Text>

        <InputNumber
          min={1}
          max={100}
          value={quantity}
          onChange={handleQuantityChange}
          style={{ width: 60, textAlign: "center" }}
        />

        <Button
          type="primary"
          style={{
            background: "#0057ff",
            border: "none",
            borderRadius: "50px",
            padding: "12px 24px",
            fontWeight: "bold",
            fontSize: "14px",
            minWidth: "140px",
            minHeight: "45px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.3s ease, transform 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#0044cc")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#0057ff")}
          onClick={handleAddToCart}
        >
          Add to Cart
        </Button>
      </Flex>
    </div>
  );
};
Purchase.propTypes = {
  price: PropTypes.number.isRequired,
  laptopId: PropTypes.string.isRequired,
};

export default Purchase;
