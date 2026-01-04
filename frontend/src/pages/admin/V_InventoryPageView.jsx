import React from "react";
import { Layout, Table, Button, Input, Tag, Space, Typography } from "antd";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import V_BaseView from "@components/V_BaseView";
import axios from "axios";

const { Title } = Typography;

/**
 * V_InventoryPageView
 * View component for admin inventory management
 */
class V_InventoryPageView extends V_BaseView {
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      title: "Inventory",
      productsList: [],
      filteredProductsList: [],
      searchKeyword: "",
      currentPageNumber: 1,
      productsPerPage: 20,
      totalProductsCount: 0,
      isLoading: true,
    };
  }

  /**
   * renderInventoryPage()
   * Design method: Display inventory list
   */
  renderInventoryPage() {
    this.fetchInventory();
    this.show();
  }

  /**
   * searchProducts(keyword)
   * Design method: Search products by keyword
   */
  searchProducts(keyword) {
    this.setState({ searchKeyword: keyword });

    if (!keyword) {
      this.setState({ filteredProductsList: this.state.productsList });
      return;
    }

    const filtered = this.state.productsList.filter(
      (product) =>
        product.name.toLowerCase().includes(keyword.toLowerCase()) ||
        product.brand.toLowerCase().includes(keyword.toLowerCase())
    );

    this.setState({ filteredProductsList: filtered });
  }

  /**
   * navigateToAddProduct()
   * Design method: Navigate to add product page
   */
  navigateToAddProduct() {
    window.location.href = "/admin/products/add";
  }

  /**
   * navigateToEditProduct(productId)
   * Design method: Navigate to edit product page
   */
  navigateToEditProduct(productId) {
    window.location.href = `/admin/products/edit/${productId}`;
  }

  /**
   * fetchInventory()
   * Fetch inventory from API
   */
  async fetchInventory() {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/laptops/filter?page=1&limit=1000`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      this.setState({
        productsList: response.data.results,
        filteredProductsList: response.data.results,
        totalProductsCount: response.data.total_count,
        isLoading: false,
      });
    } catch (error) {
      this.displayError("Failed to load inventory");
      console.error("Error fetching inventory:", error);
      this.setState({ isLoading: false });
    }
  }

  componentDidMount() {
    this.renderInventoryPage();
  }

  render() {
    const { filteredProductsList, searchKeyword, currentPageNumber, productsPerPage, isLoading } =
      this.state;

    const columns = [
      {
        title: "ID",
        dataIndex: "id",
        key: "id",
        width: 80,
      },
      {
        title: "Product Name",
        dataIndex: "name",
        key: "name",
        render: (text) => <span style={{ fontWeight: "bold" }}>{text}</span>,
      },
      {
        title: "Brand",
        dataIndex: "brand",
        key: "brand",
      },
      {
        title: "Price",
        dataIndex: "sale_price",
        key: "price",
        render: (price) => `${price.toLocaleString("vi-VN")}đ`,
      },
      {
        title: "Stock",
        dataIndex: "stock_quantity",
        key: "stock",
        render: (stock) => (
          <Tag color={stock > 10 ? "green" : stock > 0 ? "orange" : "red"}>
            {stock} units
          </Tag>
        ),
      },
      {
        title: "Status",
        dataIndex: "stock_quantity",
        key: "status",
        render: (stock) => (
          <Tag color={stock > 0 ? "success" : "error"}>
            {stock > 0 ? "In Stock" : "Out of Stock"}
          </Tag>
        ),
      },
      {
        title: "Actions",
        key: "actions",
        render: (_, record) => (
          <Space>
            <Button
              type="link"
              onClick={() => this.navigateToEditProduct(record.id)}
            >
              Edit
            </Button>
          </Space>
        ),
      },
    ];

    return (
      <div style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
          <Title level={2}>Inventory Management</Title>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => this.navigateToAddProduct()}
          >
            Add Product
          </Button>
        </div>

        <Input
          placeholder="Search products..."
          prefix={<SearchOutlined />}
          size="large"
          value={searchKeyword}
          onChange={(e) => this.searchProducts(e.target.value)}
          style={{ marginBottom: "16px", width: "400px" }}
        />

        <Table
          columns={columns}
          dataSource={filteredProductsList}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: currentPageNumber,
            pageSize: productsPerPage,
            total: filteredProductsList.length,
            onChange: (page) => this.setState({ currentPageNumber: page }),
          }}
        />
      </div>
    );
  }
}

export default V_InventoryPageView;
