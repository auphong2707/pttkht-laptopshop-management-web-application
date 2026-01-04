import { useState, useEffect } from "react";
import { Table, Spin, Typography, Button, Tag, Modal, notification } from "antd";
import axios from "axios";
import { useUser } from "@utils/UserContext.jsx";
import CustomerOrderTable from "@components/customer_page/V_CustomerOrderTable";
import dayjs from "dayjs";

const { Text } = Typography;

const formatPrice = (price) => {
  return price.toLocaleString("vi-VN") + "đ";
};

const CustomerOrderTab = () => {
  const { user } = useUser();

  const [ordersData, setOrdersData] = useState({
    orders: [],
    total_count: 0,
    page: 1,
    limit: 20,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProductDetails = async (productId) => {
    try {
      const response = await axios.get(`http://localhost:8000/laptops/id/${productId}`);
      const product = response.data;
      
      // Handle product_images - it might be a string or already parsed array
      let imageUrls = [];
      if (typeof product.product_images === 'string') {
        try {
          imageUrls = JSON.parse(product.product_images || "[]");
        } catch (e) {
          imageUrls = [];
        }
      } else if (Array.isArray(product.product_images)) {
        imageUrls = product.product_images;
      }
      
      return {
        product_name: product.name,
        image: imageUrls.length > 0 ? `http://localhost:8000${imageUrls[0]}` : "/default-image.jpg",
      };
    } catch (err) {
      console.error("Error fetching product details:", err);
      return { product_name: "Unknown", image: "/default-image.jpg" };
    }
  };

  const fetchOrders = async (page = 1, limit = 20) => {
    if (!user) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');

      const params = { page, limit };
      const response = await axios.get("http://localhost:8000/orders", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      const ordersWithProductInfo = await Promise.all(
        response.data.orders.map(async (order) => {
          const itemsWithDetails = await Promise.all(
            order.items.map(async (item) => {
              const productDetails = await fetchProductDetails(item.product_id);
              return {
                ...item,
                product_name: productDetails.product_name,
                image: productDetails.image,
                subtotal: item.price_at_purchase * item.quantity,
              };
            })
          );

          return { ...order, items: itemsWithDetails };
        })
      );

      setOrdersData({
        orders: ordersWithProductInfo,
        total_count: response.data.total_count,
        page,
        limit,
      });
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const postTicket = async ({ orderId, reason }) => {
    // Always get fresh user data from localStorage to ensure we have the latest profile
    const userProfile = JSON.parse(localStorage.getItem('user_profile') || '{}');
    
    console.log("User profile from localStorage:", userProfile);
    console.log("User context:", user);
    
    if (!userProfile.email || !userProfile.phone_number) {
      notification.error({
        message: 'User Profile Error',
        description: 'Unable to load your profile information. Please refresh and try again.',
      });
      return Promise.reject();
    }
    
    const token = localStorage.getItem('accessToken');
    const refundData = {
      email: userProfile.email,
      phoneNumber: userProfile.phone_number,
      orderId: orderId,
      reason,
      status: "pending"
    };

    try {
      await axios.post("http://localhost:8000/refund-tickets/", refundData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      notification.success({
        message: 'Refund Request Submitted',
        description: `Your refund request for order ${orderId} has been submitted successfully.`,
      });
      
      // Refresh orders to show updated refund status
      fetchOrders(ordersData.page, ordersData.limit);
    } catch (error) {
      console.error("Error creating refund ticket:", error);
      console.error("Request data:", refundData);
      notification.error({
        message: 'Refund Request Failed',
        description: error.response?.data?.detail || 'Failed to submit refund request.',
      });
      return Promise.reject();
    }
  };

  const handleRefundRequest = (orderId) => {
    Modal.confirm({
      title: 'Request Refund',
      width: 700,
      centered: true,
      content: (
        <div>
          <p>Please enter the reason for your refund request:</p>
          <textarea
            id="refundReason"
            placeholder="Enter reason for refund..."
            style={{
              width: '95%',
              minHeight: '100px',
              padding: '8px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              resize: 'vertical'
            }}
          />
        </div>
      ),
      okText: 'Submit',
      cancelText: 'Cancel',
      onOk() {
        const reason = document.getElementById('refundReason').value.trim();
        if (!reason) {
          Modal.error({
            title: 'Error',
            content: 'Please enter a reason for the refund request.',
          });
          return Promise.reject();
        }

        return new Promise((resolve, reject) => {
          Modal.confirm({
            title: 'Confirm Refund Request',
            content: `Are you sure you want to request a refund for order ${orderId}?`,
            okText: 'Yes',
            cancelText: 'No',
            width: 500,
            onOk() {
              postTicket({ orderId, reason })
                .then(resolve)
                .catch(reject);
            },
            onCancel: reject,
          });
        });
      },
    });
  };

  useEffect(() => {
    if (user) {
      fetchOrders(ordersData.page, ordersData.limit);
    } else {
      setLoading(false);
    }
  }, [user]);

  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'id',
      key: 'id',
      fixed: 'left',
    },
    {
      title: 'User Name',
      key: 'user_name',
      render: (_, record) => `${record.first_name} ${record.last_name}`,
    },
    {
      title: 'Email',
      dataIndex: 'user_email',
      key: 'user_email',
    },
    {
      title: 'Phone',
      dataIndex: 'phone_number',
      key: 'phone_number',
    },
    {
      title: 'Shipping Address',
      dataIndex: 'shipping_address',
      key: 'shipping_address',
    },
    {
      title: 'Payment Method',
      dataIndex: 'payment_method',
      key: 'payment_method',
      align: 'center',
      render: (method) => {
        const methodLabels = {
          'e-banking': 'E-Banking',
          'delivery': 'Cash on Delivery',
        };
        const methodColors = {
          'e-banking': 'green',
          'delivery': 'blue',
        };
        return <Tag color={methodColors[method] || 'default'}>{methodLabels[method] || method}</Tag>;
      },
    },
    {
      title: 'Total Price',
      dataIndex: 'total_price',
      key: 'total_price',
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (val) => dayjs(val).format('DD-MM-YYYY HH:mm'),
    },
    {
      title: "Action",
      key: "actions",
      align: "center",
      render: (_, record) => (
        <Button 
          type="primary" 
          onClick={() => handleRefundRequest(record.id)} 
          disabled={record.status !== 'delivered'}
        >
          Refund
        </Button>
      ),
    },
  ];

  const expandedRowRender = (order) => {
    const itemColumns = [
      {
        title: "Image",
        dataIndex: "image",
        key: "image",
        render: (image) => (
          <img
            src={image}
            alt="Product"
            width={60}
            height={60}
            style={{ objectFit: "contain", borderRadius: "5px" }}
          />
        ),
        align: "center",
      },
      {
        title: "Product Name",
        dataIndex: "product_name",
        key: "product_name",
        render: (name) => <div style={{ maxWidth: 550 }}>{name}</div>,
      },
      {
        title: "Quantity",
        dataIndex: "quantity",
        key: "quantity",
        align: "center",
      },
      {
        title: "Price at Purchase",
        dataIndex: "price_at_purchase",
        key: "price_at_purchase",
        render: (price) => <Text>{formatPrice(price)}</Text>,
        align: "center",
      },
      {
        title: "Total",
        dataIndex: "subtotal",
        key: "subtotal",
        render: (subtotal) => <Text>{formatPrice(subtotal)}</Text>,
        align: "center",
      },
    ];

    return (
      <Table
        columns={itemColumns}
        dataSource={order.items}
        rowKey={(item) => `${order.id}-${item.product_id}`}
        pagination={false}
      />
    );
  };

  const handleTableChange = (pagination) => {
    fetchOrders(pagination.current, ordersData.limit);
  };

  return (
    <>
      <Typography.Title level={3}>My Orders</Typography.Title>

      {error && <Text type="danger">{error}</Text>}

      {loading ? (
        <Spin tip="Loading orders..." />
      ) : (
        <CustomerOrderTable
          ordersData={ordersData}
          onTableChange={handleTableChange}
          handleRefundRequest={handleRefundRequest}
        />
      )}
    </>
  );
};

export default CustomerOrderTab;
