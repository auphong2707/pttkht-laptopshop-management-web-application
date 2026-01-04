import { useState } from "react";
import {
  Table,
  Tag,
  Descriptions,
  Button,
  Modal,
  Input,
  message,
} from "antd";
import dayjs from "dayjs";

const { TextArea } = Input;

/**
 * RefundTable component renders a list of refund requests with full order details
 * shown in an expandable row. Refund statuses: "pending", "approved", "rejected".
 *
 * Props:
 *  - data: Array of refund requests (each contains an "order" object).
 *  - onResolve: optional callback fired after the admin confirms resolution.
 */
const RefundTable = ({ data, onResolve }) => {
  // Local pagination state to allow page‑size changes
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    showSizeChanger: true,
    pageSizeOptions: ["10", "20", "50", "100"],
  });

  // Modal state for admin comments
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(null); // "approve" or "reject"
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [adminComments, setAdminComments] = useState("");

  // Tag color mapping for refund states
  const statusColors = {
    pending: "orange",
    approved: "green",
    rejected: "red",
  };

  /** Columns for the items list inside the expandable section */
  const itemColumns = [
    { title: "Product ID", dataIndex: "product_id", key: "product_id", width: 120 },
    { title: "Quantity", dataIndex: "quantity", key: "quantity", width: 100 },
    {
      title: "Price at Purchase",
      dataIndex: "price_at_purchase",
      key: "price_at_purchase",
      render: (v) => v.toLocaleString(),
    },
  ];

  /** Renders full order information when a row is expanded */
  const expandedRowRender = (record) => {
    const { order } = record;
    if (!order) return null;
    return (
      <>
        <Descriptions
          title={`Order #${order.id} Details`}
          bordered
          size="small"
          column={2}
          style={{ marginBottom: 16 }}
        >
          <Descriptions.Item label="User ID">{order.user_id}</Descriptions.Item>
          <Descriptions.Item label="Order Status">{order.status}</Descriptions.Item>
          <Descriptions.Item label="First Name">{order.first_name}</Descriptions.Item>
          <Descriptions.Item label="Last Name">{order.last_name}</Descriptions.Item>
          <Descriptions.Item label="User Name">{order.user_name}</Descriptions.Item>
          <Descriptions.Item label="User Email">{order.user_email}</Descriptions.Item>
          <Descriptions.Item label="Shipping Address" span={2}>
            {order.shipping_address}
          </Descriptions.Item>
          <Descriptions.Item label="Phone Number">{order.phone_number}</Descriptions.Item>
          <Descriptions.Item label="Company">{order.company}</Descriptions.Item>
          <Descriptions.Item label="Country">{order.country}</Descriptions.Item>
          <Descriptions.Item label="Zip Code">{order.zip_code}</Descriptions.Item>
          <Descriptions.Item label="Total Price">
            {order.total_price.toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Created At">
            {dayjs(order.created_at).format("YYYY-MM-DD HH:mm")}
          </Descriptions.Item>
          <Descriptions.Item label="Updated At">
            {dayjs(order.updated_at).format("YYYY-MM-DD HH:mm")}
          </Descriptions.Item>
        </Descriptions>

        {/* Items purchased in this order */}
        <Table
          dataSource={order.items.map((item, idx) => ({ key: idx, ...item }))}
          columns={itemColumns}
          pagination={false}
          size="small"
        />
      </>
    );
  };

  /** Handler for approving a ticket */
  const handleApprove = (record) => {
    setSelectedRecord(record);
    setModalType("approve");
    setAdminComments("");
    setModalVisible(true);
  };

  /** Handler for rejecting a ticket */
  const handleReject = (record) => {
    setSelectedRecord(record);
    setModalType("reject");
    setAdminComments("");
    setModalVisible(true);
  };

  /** Handler for confirming the action with comments */
  const handleModalOk = () => {
    if (!adminComments.trim()) {
      message.warning("Please enter admin comments before proceeding.");
      return;
    }

    if (typeof onResolve === "function") {
      const decision = modalType === "approve" ? "approved" : "rejected";
      onResolve(selectedRecord, decision, adminComments);
    }

    setModalVisible(false);
    setAdminComments("");
    setSelectedRecord(null);
    setModalType(null);
  };

  /** Handler for canceling the modal */
  const handleModalCancel = () => {
    setModalVisible(false);
    setAdminComments("");
    setSelectedRecord(null);
    setModalType(null);
  };

  /** Handler for marking a ticket as resolved */
  const handleResolve = (record) => {
    if (typeof onResolve === "function") {
      onResolve(record);
    } else {
      // demo feedback
      message.success(`Refund #${record.id} marked as resolved`);
    }
  };

  /** Top-level refund columns */
  const columns = [
    {
      title: "Refund ID",
      dataIndex: "id",
      key: "id",
      fixed: "left",
      width: 100,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: "Order ID",
      dataIndex: "order_id",
      key: "order_id",
      width: 120,
    },
    {
      title: "Customer Email",
      dataIndex: "email",
      key: "email",
      width: 220,
      ellipsis: true,
    },
    {
      title: "Phone Number",
      dataIndex: "phone_number",
      key: "phone_number",
      width: 150,
    },
    {
      title: "Reason",
      dataIndex: "reason",
      key: "reason",
      ellipsis: true,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      filters: [
        { text: "Pending", value: "pending" },
        { text: "Approved", value: "approved" },
        { text: "Rejected", value: "rejected" },
      ],
      onFilter: (value, record) => record.status === value,
      render: (text) => <Tag color={statusColors[text] || "default"}>{text}</Tag>,
    },
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: (value) => dayjs(value).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "Resolved At",
      dataIndex: "resolved_at",
      key: "resolved_at",
      width: 180,
      render: (value) => (value ? dayjs(value).format("YYYY-MM-DD HH:mm") : "-"),
    },
    {
      title: "Admin Comments",
      dataIndex: "admin_comments",
      key: "admin_comments",
      width: 200,
      ellipsis: true,
      render: (value) => value || "-",
    },
    {
      title: "Action",
      key: "action",
      width: 180,
      fixed: "right",
      render: (_, record) =>
        record.status === "pending" ? (
          <div style={{ display: "flex", gap: "8px" }}>
            <Button 
              type="primary" 
              size="small" 
              style={{ backgroundColor: "#52c41a" }}
              onClick={() => handleApprove(record)}
            >
              Approve
            </Button>
            <Button 
              danger 
              size="small"
              onClick={() => handleReject(record)}
            >
              Reject
            </Button>
          </div>
        ) : null,
    },
  ];

  /** Handle page or pageSize change */
  const handleTableChange = (pageInfo) => {
    setPagination((prev) => ({ ...prev, ...pageInfo }));
  };

  return (
    <>
      <Table
        dataSource={data.map((r) => ({ key: r.id, ...r }))}
        columns={columns}
        rowKey="id"
        expandable={{ expandedRowRender }}
        pagination={pagination}
        onChange={handleTableChange}
        scroll={{ x: 1500 }}
      />

      <Modal
        title={`${modalType === "approve" ? "Approve" : "Reject"} Refund Request`}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText="Confirm"
        cancelText="Cancel"
        okButtonProps={{ 
          danger: modalType === "reject",
          style: modalType === "approve" ? { backgroundColor: "#52c41a" } : undefined
        }}
      >
        <p>
          {modalType === "approve" 
            ? "Please provide a reason for approving this refund request:" 
            : "Please provide a reason for rejecting this refund request:"}
        </p>
        <TextArea
          rows={4}
          value={adminComments}
          onChange={(e) => setAdminComments(e.target.value)}
          placeholder="Enter admin comments..."
          maxLength={500}
          showCount
        />
      </Modal>
    </>
  );
};

export default RefundTable;
