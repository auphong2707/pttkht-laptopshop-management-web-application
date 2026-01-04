import React from "react";
import { Layout, Typography, Image, Button } from "antd";
import { Link } from "react-router-dom";
import axios from "axios";

import V_BaseView from "@components/V_BaseView";
import WebsiteHeader from "@components/V_WebsiteHeader";
import ImageGallery from "@components/homepage/V_ImageGallery";
import ProductSlider from "@components/homepage/V_ProductSlider";
import TabProductSlider from "@components/homepage/V_TabProductSlider";
import WebsiteFooter from "@components/V_WebsiteFooter";
import { transformLaptopData } from "@utils/transformData";

const { Content } = Layout;
const { Text } = Typography;

const imageSources = [
  "/homepage-image/homepage_advertisement/homepage_advertisement_1.png",
  "/homepage-image/homepage_advertisement/homepage_advertisement_2.png",
  "/homepage-image/homepage_advertisement/homepage_advertisement_3.png",
  "/homepage-image/homepage_advertisement/homepage_advertisement_4.png",
  "/homepage-image/homepage_advertisement/homepage_advertisement_5.png",
];

const brandsImg = [
  { name: "asus", logo: "/brand-logo/asus-logo.png" },
  { name: "lenovo", logo: "/brand-logo/lenovo-logo.png" },
  { name: "acer", logo: "/brand-logo/acer-logo.png" },
  { name: "dell", logo: "/brand-logo/dell-logo.png" },
  { name: "hp", logo: "/brand-logo/hp-logo.png" },
  { name: "msi", logo: "/brand-logo/msi-logo.png" },
];

const BrandLogoGallery = () => {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      {brandsImg.map((brand) => (
        <div
          key={brand.name}
          style={{
            width: "12%",
            height: "100px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Link to={`/laptops/${brand.name}`}>
            <Image
              src={brand.logo}
              preview={false}
              style={{
                filter: "grayscale(100%)",
                cursor: "pointer",
                transition: "transform 0.3s ease, filter 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "scale(1.1)";
                e.target.style.filter = "grayscale(0%)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "scale(1)";
                e.target.style.filter = "grayscale(100%)";
              }}
            />
          </Link>
        </div>
      ))}
    </div>
  );
};

const contentStyle = {
  color: "#fff",
  backgroundColor: "white",
};

/**
 * V_HomepageView - Homepage view component
 * Extends V_BaseView following MVC design specification
 */
class V_HomepageView extends V_BaseView {
  constructor(props) {
    super(props);
    
    // Design attributes: products, page, pageSize, selectedLaptopId
    this.state = {
      ...this.state,
      products: [],
      page: 1,
      pageSize: 20,
      selectedLaptopId: null,
      brandProductData: {
        asus: { rog: [], tuf: [], zenbook: [], vivobook: [] },
        lenovo: { legion: [], loq: [], thinkpad: [], thinkbook: [], yoga: [], ideapad: [] },
        acer: { predator: [], nitro: [], swift: [], aspire: [] },
        dell: { alienware: [], "g series": [], xps: [], inspiron: [], latitude: [], precision: [] },
        hp: { omen: [], victus: [], spectre: [], envy: [], pavilion: [], elitebook: [] },
        msi: { stealth: [], katana: [], creator: [], modern: [] },
      },
    };

    this.brands = {
      asus: ["rog", "tuf", "zenbook", "vivobook"],
      lenovo: ["legion", "loq", "thinkpad", "thinkbook", "yoga", "ideapad"],
      acer: ["predator", "nitro", "swift", "aspire"],
      dell: ["alienware", "g series", "xps", "inspiron", "latitude", "precision"],
      hp: ["omen", "victus", "spectre", "envy", "pavilion", "elitebook"],
      msi: ["stealth", "katana", "creator", "modern"],
    };
  }

  componentDidMount() {
    this.renderAllProductsPage();
  }

  /**
   * Design method: renderAllProductsPage
   * Fetch and render all products on the homepage
   */
  renderAllProductsPage(products = null) {
    if (products) {
      this.setState({ products });
      return;
    }

    // Fetch data if not provided
    this.fetchData();
  }

  /**
   * Design method: loadNextPage
   * Load next page of products
   */
  loadNextPage() {
    this.setState(
      (prevState) => ({ page: prevState.page + 1 }),
      () => this.fetchData()
    );
  }

  /**
   * Design method: selectLogin
   * Navigate to login page
   */
  selectLogin() {
    window.location.href = '/login';
  }

  async fetchData() {
    try {
      // Fetch general latest laptops
      const newProductRequest = axios
        .get(`http://localhost:8000/laptops/latest?limit=${this.state.pageSize}`)
        .then((response) => transformLaptopData(response.data["results"]));

      // Fetch brand-specific laptops
      const brandRequests = Object.entries(this.brands).flatMap(
        ([brand, subBrands]) =>
          subBrands.map((subBrand) =>
            axios
              .get(`http://localhost:8000/laptops/latest?brand=${brand}&subbrand=${subBrand}`)
              .then((response) => ({
                brand,
                subBrand,
                data: transformLaptopData(response.data["results"]),
              })),
          ),
      );

      // Await all requests together
      const [newProductData, ...brandResults] = await Promise.all([
        newProductRequest,
        ...brandRequests,
      ]);

      // Update state
      this.setState({ products: newProductData });
      
      const newBrandData = { ...this.state.brandProductData };
      brandResults.forEach(({ brand, subBrand, data }) => {
        newBrandData[brand] = {
          ...newBrandData[brand],
          [subBrand]: data,
        };
      });
      this.setState({ brandProductData: newBrandData });

    } catch (error) {
      this.displayError("Error loading homepage data: " + error.message);
      console.error("Error fetching data:", error);
    }
  }

  render() {
    if (!this.state.isVisible) {
      return null;
    }

    const { products, brandProductData } = this.state;
    const userRole = this.props.user?.role;
    const isAdmin = userRole === "admin";

    return (
      <Layout>
        <WebsiteHeader />

        <Content className="responsive-padding" style={contentStyle}>
          <ImageGallery imageSources={imageSources} />
          <br /><br />

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignContent: "center" }}>
              <Text strong style={{ fontSize: 25, color: "#333" }}>
                New Products
              </Text>
              <Button 
                type="primary" 
                onClick={() => window.location.href = '/laptops/all'} 
                style={{ borderRadius: '20px', fontWeight: 'bold', height: '40px' }}
              >
                See All Products
              </Button>
            </div>
            <br />
            <ProductSlider productData={products} isAdmin={isAdmin} />
          </div>

          <br />
          <Image
            src="/homepage-image/homepage_second_banner.png"
            width={"100%"}
            style={{ width: "100%", height: "40px" }}
            preview={false}
          />
          <br /><br /><br />

          <TabProductSlider
            tabLabels={["ASUS ROG", "ASUS TUF", "ASUS Zenbook", "ASUS Vivobook"]}
            tabBanners={[
              "/tab-banners/asus/asus_rog_banner.png",
              "/tab-banners/asus/asus_tuf_banner.png",
              "/tab-banners/asus/asus_zenbook_banner.png",
              "/tab-banners/asus/asus_vivobook_banner.png",
            ]}
            tabProductData={Object.values(brandProductData["asus"])}
            isAdmin={isAdmin}
          />
          <br /><br />

          <TabProductSlider
            tabLabels={["Lenovo Legion", "Lenovo LoQ", "Lenovo ThinkPad", "Lenovo ThinkBook", "Lenovo Yoga", "Lenovo ideaPad"]}
            tabBanners={[
              "/tab-banners/lenovo/lenovo_legion_banner.png",
              "/tab-banners/lenovo/lenovo_loq_banner.png",
              "/tab-banners/lenovo/lenovo_thinkpad_banner.png",
              "/tab-banners/lenovo/lenovo_thinkbook_banner.png",
              "/tab-banners/lenovo/lenovo_yoga_banner.png",
              "/tab-banners/lenovo/lenovo_ideapad_banner.png",
            ]}
            tabProductData={Object.values(brandProductData["lenovo"])}
            isAdmin={isAdmin}
          />
          <br /><br />

          <TabProductSlider
            tabLabels={["Acer Predator", "Acer Nitro", "Acer Swift", "Acer Aspire"]}
            tabBanners={[
              "/tab-banners/acer/acer_predator_banner.png",
              "/tab-banners/acer/acer_nitro_banner.png",
              "/tab-banners/acer/acer_swift_banner.png",
              "/tab-banners/acer/acer_aspire_banner.png",
            ]}
            tabProductData={Object.values(brandProductData["acer"])}
            isAdmin={isAdmin}
          />
          <br /><br />

          <TabProductSlider
            tabLabels={["Dell Alienware", "Dell G Series", "Dell XPS", "Dell Inspiron", "Dell Latitude", "Dell Precision"]}
            tabBanners={[
              "/tab-banners/dell/dell_alienware_banner.png",
              "/tab-banners/dell/dell_g_series_banner.png",
              "/tab-banners/dell/dell_xps_banner.png",
              "/tab-banners/dell/dell_inspiron_banner.png",
              "/tab-banners/dell/dell_latitude_banner.png",
              "/tab-banners/dell/dell_precision_banner.png",
            ]}
            tabProductData={Object.values(brandProductData["dell"])}
            isAdmin={isAdmin}
          />
          <br /><br />

          <TabProductSlider
            tabLabels={["HP OMEN", "HP Victus", "HP Spectre", "HP ENVY", "HP Pavilion", "HP EliteBook"]}
            tabBanners={[
              "/tab-banners/HP/hp_omen_banner.png",
              "/tab-banners/HP/hp_victus_banner.png",
              "/tab-banners/HP/hp_spectre_banner.png",
              "/tab-banners/HP/hp_envy_banner.png",
              "/tab-banners/HP/hp_pavilion_banner.png",
              "/tab-banners/HP/hp_elitebook_banner.png",
            ]}
            tabProductData={Object.values(brandProductData["hp"])}
            isAdmin={isAdmin}
          />
          <br /><br />

          <TabProductSlider
            tabLabels={["MSI Stealth", "MSI Katana", "MSI Creator", "MSI Modern"]}
            tabBanners={[
              "/tab-banners/msi/msi_stealth_banner.png",
              "/tab-banners/msi/msi_katana_banner.png",
              "/tab-banners/msi/msi_creator_banner.png",
              "/tab-banners/msi/msi_modern_banner.png",
            ]}
            tabProductData={Object.values(brandProductData["msi"])}
            isAdmin={isAdmin}
          />
          <br /><br />

          <BrandLogoGallery />
          <br /><br />
        </Content>

        <WebsiteFooter />
      </Layout>
    );
  }
}

export default V_HomepageView;
