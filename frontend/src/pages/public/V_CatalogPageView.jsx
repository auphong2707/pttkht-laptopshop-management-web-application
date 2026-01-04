import React from "react";
import { Layout, Breadcrumb, Typography, Select, Pagination } from "antd";
import { Link } from "react-router-dom";
import V_BaseView from "@components/V_BaseView";
import WebsiteHeader from "@components/V_WebsiteHeader";
import WebsiteFooter from "@components/V_WebsiteFooter";
import BrandsSection from "@components/catalog_page/V_BrandsSection";
import FilterSection from "@components/catalog_page/V_FilterSection";
import ProductCard from "@components/V_ProductCard";
import { transformLaptopData } from "@utils/transformData";
import axios from "axios";
import styled from "styled-components";

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const CustomSelect = styled(Select)`
  .ant-select-selector {
    border-radius: 0 !important;
    border-width: 3px !important;
  }
`;

const brands = [
  { name: "asus", logo: "/brand-logo/asus-logo.png", link: "/laptops/asus" },
  { name: "lenovo", logo: "/brand-logo/lenovo-logo.png", link: "/laptops/lenovo" },
  { name: "acer", logo: "/brand-logo/acer-logo.png", link: "/laptops/acer" },
  { name: "dell", logo: "/brand-logo/dell-logo.png", link: "/laptops/dell" },
  { name: "hp", logo: "/brand-logo/hp-logo.png", link: "/laptops/hp" },
  { name: "msi", logo: "/brand-logo/msi-logo.png", link: "/laptops/msi" },
];

const subBrands = {
  asus: ["ROG", "TUF", "Zenbook", "Vivobook"],
  lenovo: ["Legion", "LoQ", "ThinkPad", "ThinkBook", "Yoga", "IdeaPad"],
  acer: ["Predator", "Nitro", "Swift", "Aspire"],
  dell: ["Alienware", "G Series", "XPS", "Inspiron", "Latitude", "Precision"],
  hp: ["OMEN", "Victus", "Spectre", "ENVY", "Pavilion", "EliteBook"],
  msi: ["Stealth", "Katana", "Creator", "Modern"],
  all: [
    "ASUS ROG", "ASUS TUF", "ASUS Zenbook", "ASUS Vivobook",
    "Lenovo Legion", "Lenovo LoQ", "Lenovo ThinkPad", "Lenovo ThinkBook", "Lenovo Yoga", "Lenovo IdeaPad",
    "Acer Predator", "Acer Nitro", "Acer Swift", "Acer Aspire",
    "Dell Alienware", "Dell G Series", "Dell XPS", "Dell Inspiron", "Dell Latitude", "Dell Precision",
    "HP OMEN", "HP Victus", "HP Spectre", "HP ENVY", "HP Pavilion", "HP EliteBook",
    "MSI Stealth", "MSI Katana", "MSI Creator", "MSI Modern",
  ],
};

/**
 * V_CatalogPageView
 * View component for product catalog with filtering and sorting
 */
class V_CatalogPageView extends V_BaseView {
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      title: "Catalog",
      brandFilter: props.brand || "all",
      currentPage: 1,
      productsPerPage: 35,
      sortCriteria: "latest",
      priceRangeFilter: [3000000, 180000000],
      weightRangeFilter: [0.5, 5],
      selectedFiltersMap: {
        usageType: [],
        subBrand: [],
        cpu: [],
        vga: [],
        ramAmount: [],
        storageAmount: [],
        screenSize: [],
      },
      pendingFiltersMap: {
        usageType: [],
        subBrand: [],
        cpu: [],
        vga: [],
        ramAmount: [],
        storageAmount: [],
        screenSize: [],
      },
      productsList: [],
      totalProductsCount: 0,
      collapseStateMap: {
        priceRange: 1,
        subBrand: 1,
        usageType: 1,
        cpu: 1,
        vga: 1,
        ramAmount: 1,
        storageAmount: 1,
        screenSize: 1,
        weightRange: 1,
      },
    };
  }

  /**
   * renderCatalogPage(products)
   * Design method: Display catalog with products
   */
  renderCatalogPage(products) {
    this.setState({ productsList: products });
    this.show();
  }

  /**
   * applyFilters()
   * Design method: Apply selected filters to product list
   */
  applyFilters() {
    this.setState(
      {
        selectedFiltersMap: { ...this.state.pendingFiltersMap },
        currentPage: 1,
      },
      () => {
        this.fetchProducts();
      }
    );
  }

  /**
   * clearFilters()
   * Design method: Reset all filters to default
   */
  clearFilters() {
    this.setState(
      {
        priceRangeFilter: [3000000, 180000000],
        weightRangeFilter: [0.5, 5],
        selectedFiltersMap: {
          usageType: [],
          subBrand: [],
          cpu: [],
          vga: [],
          ramAmount: [],
          storageAmount: [],
          screenSize: [],
        },
        pendingFiltersMap: {
          usageType: [],
          subBrand: [],
          cpu: [],
          vga: [],
          ramAmount: [],
          storageAmount: [],
          screenSize: [],
        },
        currentPage: 1,
      },
      () => {
        this.fetchProducts();
      }
    );
  }

  /**
   * changeSortingCriteria(criteria)
   * Design method: Change product sorting order
   */
  changeSortingCriteria(criteria) {
    this.setState(
      {
        sortCriteria: criteria,
        currentPage: 1,
      },
      () => {
        this.fetchProducts();
      }
    );
  }

  /**
   * selectProductPage(pageNumber)
   * Design method: Navigate to specific page
   */
  selectProductPage(pageNumber) {
    this.setState({ currentPage: pageNumber }, () => {
      this.fetchProducts();
    });
  }

  /**
   * fetchProducts()
   * Fetch products from API with current filters
   */
  async fetchProducts() {
    const query = this.buildQueryString();
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/laptops/filter${query}`
      );
      
      // Validate response structure
      if (!response.data) {
        throw new Error('No data received from server');
      }
      
      const results = response.data.results || [];
      const totalCount = response.data.total_count || 0;
      
      const transformedData = transformLaptopData(results);
      this.setState({
        productsList: transformedData,
        totalProductsCount: totalCount,
      });
    } catch (error) {
      this.displayError("Failed to load products");
      console.error("Error fetching products:", error);
      // Set empty state on error
      this.setState({
        productsList: [],
        totalProductsCount: 0,
      });
    }
  }

  /**
   * buildQueryString()
   * Build URL query string from current filters
   */
  buildQueryString() {
    const {
      brandFilter,
      currentPage,
      productsPerPage,
      sortCriteria,
      selectedFiltersMap,
      priceRangeFilter,
      weightRangeFilter,
    } = this.state;

    let query = `?page=${currentPage}&limit=${productsPerPage}&brand=${brandFilter}`;

    // Sort By
    if (sortCriteria === "latest") query += "&sort=latest";
    if (sortCriteria === "price-low") query += "&sort=price_asc";
    if (sortCriteria === "price-high") query += "&sort=price_desc";
    if (sortCriteria === "sale") query += "&sort=sale";

    // Apply selected filters
    Object.keys(selectedFiltersMap).forEach((filterKey) => {
      selectedFiltersMap[filterKey].forEach((value) => {
        const processedValue = this.processFilterValue(filterKey, value, brandFilter);
        query += `&${this.getFilterApiKey(filterKey)}=${processedValue}`;
      });
    });

    // Price Range
    query += `&price_min=${priceRangeFilter[0]}&price_max=${priceRangeFilter[1]}`;

    // Weight Range
    query += `&weight_min=${weightRangeFilter[0]}&weight_max=${weightRangeFilter[1]}`;

    return query;
  }

  /**
   * processFilterValue()
   * Process filter value for API
   */
  processFilterValue(filterKey, value, brand) {
    let processed = value;

    if (filterKey === "subBrand" && brand === "all") {
      processed = value.split(" ").slice(1).join(" ");
    }

    if (filterKey === "ramAmount") {
      processed = value.split(" ")[0];
    }

    if (filterKey === "storageAmount") {
      processed = value === "1 TB" ? 1024 : value.split(" ")[0];
    }

    if (filterKey === "screenSize") {
      processed = value.split(" ")[0];
    }

    if (filterKey === "cpu") {
      processed = value.startsWith("Apple")
        ? value.split(" ").pop()
        : value.split(" ").slice(-2).join(" ");
    }

    if (filterKey === "vga") {
      if (value.includes("NVIDIA MX")) processed = "mx";
      if (value.includes("NVIDIA GTX")) processed = "gtx";
      if (value.includes("NVIDIA RTX 20")) processed = "rtx+20";
      if (value.includes("NVIDIA RTX 30")) processed = "rtx+30";
      if (value.includes("NVIDIA RTX 40")) processed = "rtx+40";
      if (value.includes("NVIDIA Quadro")) processed = "quadro";
      if (value.includes("AMD Radeon RX 5000M")) processed = "rx+5";
      if (value.includes("AMD Radeon RX 6000M")) processed = "rx+6";
      if (value.includes("AMD Radeon RX 7000M")) processed = "rx+7";
      if (value.includes("AMD Radeon Pro")) processed = "rad+pro";
    }

    return processed.toLowerCase().replace(" ", "+");
  }

  /**
   * getFilterApiKey()
   * Map filter key to API parameter name
   */
  getFilterApiKey(filterKey) {
    const mapping = {
      usageType: "usage_type",
      subBrand: "sub_brand",
      cpu: "cpu",
      vga: "vga",
      ramAmount: "ram_amount",
      storageAmount: "storage_amount",
      screenSize: "screen_size",
    };
    return mapping[filterKey] || filterKey;
  }

  /**
   * formatBrand()
   * Format brand name for display
   */
  formatBrand(brand) {
    const brandMap = {
      all: "All",
      asus: "ASUS",
      lenovo: "Lenovo",
      acer: "Acer",
      dell: "DELL",
      hp: "HP",
      msi: "MSI",
    };
    return brandMap[brand] || brand;
  }

  componentDidMount() {
    this.fetchProducts();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.brand !== this.props.brand) {
      this.setState({ brandFilter: this.props.brand, currentPage: 1 }, () => {
        this.fetchProducts();
      });
    }
  }

  render() {
    const {
      brandFilter,
      productsList,
      totalProductsCount,
      currentPage,
      productsPerPage,
      sortCriteria,
      priceRangeFilter,
      weightRangeFilter,
      pendingFiltersMap,
      collapseStateMap,
    } = this.state;

    const formattedBrand = this.formatBrand(brandFilter);
    const from = (currentPage - 1) * productsPerPage + 1;
    const to = Math.min(currentPage * productsPerPage, totalProductsCount);

    if (!["all", "asus", "lenovo", "acer", "dell", "hp", "msi"].includes(brandFilter)) {
      return <div>Not Found</div>;
    }

    return (
      <Layout>
        <WebsiteHeader />
        <Content
          className="responsive-padding"
          style={{ color: "#fff", backgroundColor: "white", height: "100%" }}
        >
          <img
            src="/catalog_page_advertisement_1.png"
            style={{ width: "100%", height: "auto", display: "block" }}
            alt="Advertisement"
          />
          <br />

          <Breadcrumb separator=">" style={{ marginBottom: "1rem" }}>
            <Breadcrumb.Item>
              <Link to="/">Home</Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <Link to="/laptops/all">Laptops</Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>{formattedBrand}</Breadcrumb.Item>
          </Breadcrumb>

          <Title level={1}>{formattedBrand} Laptop</Title>
          <br />

          <div style={{ display: "flex", flexDirection: "row", gap: 10 }}>
            <div style={{ width: 260, backgroundColor: "white" }}>
              <BrandsSection brands={brands} />
              <br />
              <FilterSection
                brand={brandFilter}
                subBrands={subBrands}
                pendingFilters={{
                  priceRange: priceRangeFilter,
                  weightRange: weightRangeFilter,
                  selectedFilters: pendingFiltersMap,
                }}
                updatePendingFilters={(newFilters) => {
                  this.setState({
                    pendingFiltersMap: {
                      ...pendingFiltersMap,
                      ...newFilters.selectedFilters,
                    },
                    priceRangeFilter: newFilters.priceRange || priceRangeFilter,
                    weightRangeFilter: newFilters.weightRange || weightRangeFilter,
                  });
                }}
                clearFilters={() => this.clearFilters()}
                applyFilters={() => this.applyFilters()}
                collapseState={collapseStateMap}
                updateCollapseState={(key) => {
                  this.setState({
                    collapseStateMap: {
                      ...collapseStateMap,
                      [key]: !collapseStateMap[key],
                    },
                  });
                }}
              />
            </div>

            <div style={{ width: "100%", backgroundColor: "white" }}>
              <div
                style={{
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text type="secondary">
                  Items {from}-{to} of {totalProductsCount}
                </Text>

                <div style={{ display: "flex", gap: 10 }}>
                  <CustomSelect
                    value={sortCriteria}
                    onChange={(value) => this.changeSortingCriteria(value)}
                    style={{ width: 250, height: 50 }}
                  >
                    <Option value="latest">
                      <Text type="secondary" strong>Sort by: </Text>
                      <Text strong>Latest</Text>
                    </Option>
                    <Option value="price-low">
                      <Text type="secondary" strong>Sort by: </Text>
                      <Text strong>Price (Low to High)</Text>
                    </Option>
                    <Option value="price-high">
                      <Text type="secondary" strong>Sort by: </Text>
                      <Text strong>Price (High to Low)</Text>
                    </Option>
                  </CustomSelect>

                  <CustomSelect
                    value={productsPerPage}
                    style={{ width: 180, height: 50 }}
                    onChange={(value) => {
                      this.setState({ productsPerPage: value, currentPage: 1 }, () => {
                        this.fetchProducts();
                      });
                    }}
                  >
                    <Option value={15}>
                      <Text type="secondary" strong>Show: </Text>
                      <Text strong>15 per page</Text>
                    </Option>
                    <Option value={35}>
                      <Text type="secondary" strong>Show: </Text>
                      <Text strong>35 per page</Text>
                    </Option>
                  </CustomSelect>
                </div>
              </div>

              <div className="grid-division">
                {productsList.map((product, index) => (
                  <ProductCard key={index} {...product} />
                ))}
              </div>

              <br />

              <Pagination
                align="center"
                current={currentPage}
                onChange={(value) => this.selectProductPage(value)}
                total={totalProductsCount}
                pageSize={productsPerPage}
                showSizeChanger={false}
              />
            </div>
          </div>
        </Content>

        <WebsiteFooter />
      </Layout>
    );
  }
}

export default V_CatalogPageView;
