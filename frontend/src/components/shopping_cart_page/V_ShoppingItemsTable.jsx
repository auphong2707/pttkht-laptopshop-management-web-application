import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { Modal, Typography, Image, InputNumber, Button } from "antd";
import { DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import axios from "axios";
import { getToken } from "../../utils/authService";

const { Text } = Typography;

const formatPrice = (price) => {
  return price.toLocaleString("vi-VN") + "đ";
};

const Items = ({ product, index, onSubtotalChange, onRemove }) => {
  const [quantity, setQuantity] = useState(product.quantity || 0);
  const rawSubtotal = formatPrice(product.sale_price * quantity);

  const handleQuantityChange = async (value) => {
    if (!isNaN(value) && value >= 0) {
      setQuantity(value);
      onSubtotalChange(product.sale_price * value, index);

      try {
        const token = getToken();
        if (!token) throw new Error("User not authenticated");

        await axios.put(
          "http://localhost:8000/cart/update",
          {
            laptop_id: product.id,
            new_quantity: value,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
      } catch (err) {
        console.error("Error updating quantity in cart:", err);
      }
    }
  };

  useEffect(() => {
    onSubtotalChange(product.sale_price * quantity, index);
  }, [quantity, product.sale_price, index, onSubtotalChange]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.25fr 2fr 1fr 1fr 1fr 0.5fr",
        alignItems: "center",
        gap: "15px",
        padding: "25px 0",
        borderBottom: "1px solid #eee",
      }}
    >
      {/* Product Image */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Image
          src={product.imageUrl}
          width={80}
          height={80}
          style={{ objectFit: "contain", borderRadius: "5px" }}
          preview={false}
        />
      </div>

      {/* Product Name */}
      <Text style={{ fontSize: "14px", fontWeight: "bold" }}>
        {product.name.toUpperCase()}
      </Text>

      {/* Product Price */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Text style={{ fontSize: "16px", fontWeight: "bold" }}>
          {formatPrice(product.sale_price)}
        </Text>
      </div>
      {/* Bộ chọn số lượng */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <InputNumber
          min={1}
          value={quantity}
          onChange={handleQuantityChange}
          style={{
            width: "60px",
            textAlign: "center",
            justifyContent: "center",
          }}
        />
      </div>
      {/* Total price for products */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Text style={{ fontSize: "16px", fontWeight: "bold" }}>
          {rawSubtotal}
        </Text>
      </div>
      {/* Nút thao tác */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2px",
          paddingRight: "14px",
        }}
      >
        <Button type="text" icon={<EyeOutlined />} style={{ color: "#888" }} />
        <Button
          type="text"
          icon={<DeleteOutlined />}
          danger
          onClick={() => onRemove(product)}
        />
      </div>
    </div>
  );
};

const ShoppingItemsTable = ({ setTotalPrice, setCartItems: updateParentCartItems }) => {
  const [cartItems, setCartItems] = useState([]);
  const [subTotals, setSubTotals] = useState([]);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const token = getToken();
        if (!token) {
          console.warn("No user logged in");
          return;
        }

        // 1. Get cart
        const cartResponse = await axios.get(
          "http://localhost:8000/cart/view",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const cartData = cartResponse.data;

        // Handle the new cart response structure with items array
        if (!cartData.items || !Array.isArray(cartData.items) || cartData.items.length === 0) {
          setCartItems([]);
          setSubTotals([]);
          if (updateParentCartItems) {
            updateParentCartItems([]);
          }
          return;
        }

        // 2. Fetch product info for each cart item
        const productFetches = cartData.items.map((item) =>
          axios.get(`http://localhost:8000/laptops/id/${item.laptop_id}`)
        );

        const productResponses = await Promise.all(productFetches);

        // 3. Combine product info with cart item data
        const productsWithQty = productResponses.map((res, idx) => {
          const product = res.data;
          const cartItem = cartData.items[idx];
          
          // Handle product_images - it might be a string or already parsed array
          let imageUrls = [];
          if (typeof product.product_images === 'string') {
            try {
              imageUrls = JSON.parse(product.product_images || "[]").map(
                (url) => `http://localhost:8000${url}`
              );
            } catch (e) {
              imageUrls = [];
            }
          } else if (Array.isArray(product.product_images)) {
            imageUrls = product.product_images.map(
              (url) => `http://localhost:8000${url}`
            );
          }

          return {
            ...product,
            cartItemId: cartItem.id,
            quantity: cartItem.quantity,
            unitPrice: cartItem.unit_price,
            imageUrl:
              imageUrls.length > 0 ? imageUrls[0] : "/default-image.jpg",
          };
        });

        setCartItems(productsWithQty);
        if (updateParentCartItems) {
          updateParentCartItems(productsWithQty);
        }
        setSubTotals(
          productsWithQty.map((item) => item.sale_price * item.quantity),
        );
      } catch (err) {
        console.error("Error fetching cart:", err);
      }
    };

    fetchCart();
  }, []);

  const handleSubtotalChange = useCallback((newSubtotal, index) => {
    setSubTotals(prevSubTotals => {
      const newSubTotals = [...prevSubTotals];
      newSubTotals[index] = newSubtotal;
      return newSubTotals;
    });
  }, []);

  const handleRemoveItem = (product) => {
    Modal.confirm({
      title: `Do you want to delete the product "${product.name}" from the cart?`,
      okText: "Yes",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const token = getToken();
          if (!token) throw new Error("User not authenticated");

          // Use the laptop ID as expected by the backend endpoint
          await axios.delete(`http://localhost:8000/cart/remove/${product.id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          // Remove from UI
          const updatedItems = cartItems.filter((item) => item.id !== product.id);
          setCartItems(updatedItems);
          if (updateParentCartItems) {
            updateParentCartItems(updatedItems);
          }
          setSubTotals(updatedItems.map((item) => item.sale_price * item.quantity));

          // Show success message
          Modal.success({
            title: "Product deleted successfully",
            okText: "OK",
          });
        } catch (err) {
          console.error("Error removing item from cart:", err);
          Modal.error({
            title: "Failed to remove item",
            content: err.response?.data?.detail || err.message,
          });
        }
      },
    });
  };




  const handleClearCart = () => {
    Modal.confirm({
      title: "Are you sure you want to clear the entire cart?",
      okText: "Confirm",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const token = getToken();
          if (!token) throw new Error("User not authenticated");

          await axios.delete("http://localhost:8000/cart/clear", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          // Clear UI state
          setCartItems([]);
          setSubTotals([]);
          setTotalPrice(0);

          // Show success modal
          Modal.success({
            title: "Shopping cart has been cleared.",
            okText: "OK",
          });
        } catch (err) {
          console.error("Error clearing cart:", err);
        }
      },
    });
  };




  useEffect(() => {
    const sum = subTotals.reduce((acc, val) => acc + val, 0);
    setTotalPrice(sum);
  }, [subTotals]);

  return (
    <div style={{ padding: "20px", borderRadius: "8px" }}>
      {/* Header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.25fr 2fr 1fr 1fr 1fr 0.5fr",
          fontWeight: "bold",
          paddingBottom: "15px",
          borderBottom: "1.5px solid #ddd",
          gap: "15px",
        }}
      >
        <Text style={{ textAlign: "center" }}>Item</Text>
        <Text style={{ textAlign: "center" }}>Name</Text>
        <Text style={{ textAlign: "center" }}>Price</Text>
        <Text style={{ textAlign: "center" }}>Qty</Text>
        <Text style={{ textAlign: "center" }}>Subtotal</Text>
      </div>

      {/* Render cart items dynamically */}
      {cartItems.map((prod, index) => (
        <Items
          key={prod.id}
          product={prod}
          index={index}
          onSubtotalChange={handleSubtotalChange}
          onRemove={handleRemoveItem}
        />
      ))}

      {/* Total price */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.25fr 2fr 1fr 1fr 1fr 0.5fr",
          fontWeight: "bold",
          paddingTop: "15px",
          paddingBottom: "15px",
          borderBottom: "1px solid #ddd",
          gap: "15px",
        }}
      >
        <Text />
        <Text />
        <Text />
        <Text style={{ textAlign: "center", fontSize: "17px" }}>
          Total price:
        </Text>
        <Text style={{ textAlign: "center", fontSize: "17px" }}>
          {formatPrice(subTotals.reduce((acc, val) => acc + val, 0))}
        </Text>
      </div>

      {/* Buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          paddingTop: "20px",
        }}
      >
        <Button
          type="primary"
          style={{ borderRadius: "9999px", fontWeight: "bold" }}
          onClick={handleClearCart}
        >
          Clear Shopping Cart
        </Button>
        <Button
          type="primary"
          style={{ borderRadius: "9999px", fontWeight: "bold" }}
        >
          <Link to="/">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
};
Items.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    sale_price: PropTypes.number.isRequired,
    quantity: PropTypes.number,
    imageUrl: PropTypes.string,
  }).isRequired,
  index: PropTypes.number.isRequired,
  onSubtotalChange: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};

ShoppingItemsTable.propTypes = {
  setTotalPrice: PropTypes.func.isRequired,
};

export default ShoppingItemsTable;
