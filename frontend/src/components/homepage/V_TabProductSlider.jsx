import { Tabs, Image, ConfigProvider } from "antd";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";

import ProductSlider from "./V_ProductSlider";

const { TabPane } = Tabs;

const TabProductSlider = ({
  tabLabels,
  tabBanners,
  tabProductData,
  isAdmin,
}) => {
  return (
    <ConfigProvider
      theme={{
        components: {
          Tabs: {
            itemHoverColor: "rgb(51, 51, 51)",
            itemSelectedColor: "black",
            itemActiveColor: "black",
            itemColor: "grey",
          },
        },
      }}
    >
      <Tabs>
        {tabLabels.map((tabName, index) => (
          <TabPane tab={tabName.toUpperCase()} key={index}>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Link to={`/laptops/all?subBrand=${tabName.replace(" ", "+")}`}>
                <Image
                  src={tabBanners[index]}
                  alt={tabName}
                  width="228px"
                  height="345px"
                  style={{ display: "block", width: "228px", height: "345px" }}
                  preview={false}
                />
              </Link>
              <div style={{ minWidth: "15px" }}></div>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <ProductSlider
                  productData={tabProductData[index]}
                  isAdmin={isAdmin}
                />
              </div>
            </div>
          </TabPane>
        ))}
      </Tabs>
    </ConfigProvider>
  );
};
TabProductSlider.propTypes = {
  tabLabels: PropTypes.arrayOf(PropTypes.string).isRequired,
  tabBanners: PropTypes.arrayOf(PropTypes.string).isRequired,
  tabProductData: PropTypes.arrayOf(PropTypes.array).isRequired,
  isAdmin: PropTypes.bool.isRequired,
};

export default TabProductSlider;

