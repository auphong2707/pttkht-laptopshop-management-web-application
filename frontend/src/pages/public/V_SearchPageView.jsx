import React from "react";
import { Layout, Breadcrumb, Typography, Select, Input, Pagination } from "antd";
import styled from "styled-components";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

import V_BaseView from "@components/V_BaseView";
import WebsiteHeader from "@components/V_WebsiteHeader";
import WebsiteFooter from "@components/V_WebsiteFooter";
import ProductCard from "@components/V_ProductCard";
import { transformLaptopData } from "@utils/transformData";

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const contentStyle = {
  color: "#fff",
  backgroundColor: "white",
  minHeight: "100vh",
};

const CustomSelect = styled(Select)`
  .ant-select-selector {
    border-radius: 0 !important;
    border-width: 3px !important;
  }
`;

/**
 * V_SearchPageView - Search Results Page View
 * Extends V_BaseView to follow MVC design pattern
 * Handles product search with filtering, sorting, and pagination
 */
class V_SearchPageView extends V_BaseView {
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      products: [],
      totalProducts: 0,
      isLoading: false,
      keyword: this.props.searchParams.get("query") || "",
      limit: parseInt(this.props.searchParams.get("limit")) || 35,
      page: parseInt(this.props.searchParams.get("page")) || 1,
      sortKey: this.props.searchParams.get("sort") || "relevant",
    };
  }

  componentDidMount() {
    this.searchProducts();
  }

  componentDidUpdate(prevProps) {
    // React to URL param changes
    const prevQuery = prevProps.searchParams.get("query");
    const currQuery = this.props.searchParams.get("query");
    const prevPage = prevProps.searchParams.get("page");
    const currPage = this.props.searchParams.get("page");
    const prevSort = prevProps.searchParams.get("sort");
    const currSort = this.props.searchParams.get("sort");
    const prevLimit = prevProps.searchParams.get("limit");
    const currLimit = this.props.searchParams.get("limit");

    if (
      prevQuery !== currQuery ||
      prevPage !== currPage ||
      prevSort !== currSort ||
      prevLimit !== currLimit
    ) {
      this.setState(
        {
          keyword: currQuery || "",
          limit: parseInt(currLimit) || 35,
          page: parseInt(currPage) || 1,
          sortKey: currSort || "relevant",
        },
        () => this.searchProducts()
      );
    }
  }

  /**
   * Build query string for the search API
   * @param {string} query - Search keyword
   * @param {number} limit - Results per page
   * @param {number} page - Current page number
   * @param {string} sortKey - Sort criteria
   * @returns {string} Query string
   */
  buildQueryString(query, limit, page, sortKey) {
    let qs = `?query=${encodeURIComponent(query)}&limit=${limit}&page=${page}`;
    if (sortKey && sortKey !== "relevant") {
      qs += `&sort=${sortKey}`;
    }
    return qs;
  }

  /**
   * Search for products based on keyword and filters
   */
  async searchProducts() {
    const { keyword, limit, page, sortKey } = this.state;

    if (!keyword.trim()) {
      this.setState({ products: [], totalProducts: 0 });
      return;
    }

    this.setState({ isLoading: true });

    try {
      const queryString = this.buildQueryString(keyword, limit, page, sortKey);
      const response = await axios.get(
        `http://localhost:8000/laptops/search${queryString}`
      );

      const totalCount = response.data.total_count || 0;
      const results = response.data.results || [];
      const transformedProducts = await transformLaptopData(results);

      this.setState({
        products: transformedProducts,
        totalProducts: totalCount,
        isLoading: false,
      });
    } catch (error) {
      console.error("Search error:", error);
      this.displayError("Failed to load search results");
      this.setState({ isLoading: false });
    }
  }

  /**
   * Handle new search submission
   * @param {string} value - Search term entered by user
   */
  handleSearch(value) {
    const term = value.trim();
    if (!term) return;

    const { limit, sortKey } = this.state;
    this.props.navigate(
      `/search?query=${encodeURIComponent(term)}&limit=${limit}&page=1&sort=${sortKey}`
    );
  }

  /**
   * Update URL parameters
   * @param {Object} params - Parameters to update
   */
  updateParams(params) {
    const next = new URLSearchParams(this.props.searchParams);
    Object.entries(params).forEach(([k, v]) => next.set(k, v));
    this.props.setSearchParams(next);
  }

  /**
   * Render search results grid
   * @returns {JSX.Element} Product grid or loading message
   */
  renderSearchResults() {
    const { products, isLoading } = this.state;

    if (isLoading) {
      return <Text>Loading…</Text>;
    }

    return (
      <div className="grid-division">
        {products.map((product, index) => (
          <ProductCard key={index} {...product} />
        ))}
      </div>
    );
  }

  render() {
    const { keyword, limit, page, sortKey, totalProducts } = this.state;

    // Calculate range text
    const from = totalProducts === 0 ? 0 : (page - 1) * limit + 1;
    const to = Math.min(page * limit, totalProducts);

    return (
      <Layout>
        <WebsiteHeader
          extraSearch={
            <Input.Search
              size="large"
              allowClear
              placeholder="Search laptops…"
              defaultValue={keyword}
              onSearch={(value) => this.handleSearch(value)}
            />
          }
        />
        <Content className="responsive-padding" style={contentStyle}>
          <br />
          <Breadcrumb separator=">" style={{ marginBottom: 16 }}>
            <Breadcrumb.Item>
              <Link to="/">Home</Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>Search</Breadcrumb.Item>
          </Breadcrumb>

          <Title level={1} style={{ marginBottom: 24 }}>
            Results for "{keyword}" ({totalProducts} item
            {totalProducts === 1 ? "" : "s"})
          </Title>

          {/* Toolbar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <Text type="secondary">
              Showing {from}-{to} of {totalProducts}
            </Text>

            <div style={{ display: "flex", gap: 12 }}>
              <CustomSelect
                style={{ width: 260, height: 50 }}
                value={sortKey}
                onChange={(v) => this.updateParams({ sort: v, page: 1 })}
              >
                <Option value="relevant">
                  <Text type="secondary" strong>
                    Sort by:{" "}
                  </Text>
                  <Text strong>Most relevant</Text>
                </Option>
                <Option value="latest">
                  <Text type="secondary" strong>
                    Sort by:{" "}
                  </Text>
                  <Text strong>Latest arrivals</Text>
                </Option>
                <Option value="price_asc">
                  <Text type="secondary" strong>
                    Sort by:{" "}
                  </Text>
                  <Text strong>Price (Low → High)</Text>
                </Option>
                <Option value="price_desc">
                  <Text type="secondary" strong>
                    Sort by:{" "}
                  </Text>
                  <Text strong>Price (High → Low)</Text>
                </Option>
              </CustomSelect>

              <CustomSelect
                style={{ width: 180, height: 50 }}
                value={limit}
                onChange={(v) => this.updateParams({ limit: v, page: 1 })}
              >
                {[15, 35, 50].map((n) => (
                  <Option key={n} value={n}>
                    <Text type="secondary" strong>
                      Show:
                    </Text>{" "}
                    <Text strong>{n} per page</Text>
                  </Option>
                ))}
              </CustomSelect>
            </div>
          </div>

          {/* Results grid */}
          {this.renderSearchResults()}

          <br />

          {totalProducts > limit && (
            <Pagination
              align="center"
              current={page}
              total={totalProducts}
              pageSize={limit}
              showSizeChanger={false}
              onChange={(p) => this.updateParams({ page: p })}
            />
          )}
        </Content>
        <WebsiteFooter />
      </Layout>
    );
  }
}

// HOC wrapper to inject React Router hooks
function V_SearchPageViewWrapper(props) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <V_SearchPageView
      {...props}
      navigate={navigate}
      searchParams={searchParams}
      setSearchParams={setSearchParams}
    />
  );
}

export default V_SearchPageViewWrapper;
