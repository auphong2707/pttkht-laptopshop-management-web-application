import { useState } from "react";
import PropTypes from "prop-types";
import { Tabs } from "antd";

const ProductTabs = ({ tabLabels, tabContents }) => {
  const [activeTab, setActiveTab] = useState("0");

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "start",
        alignItems: "center",
        padding: "1rem 8.5%",
      }}
    >
      {/* Tabs Section */}
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key)}
        tabBarStyle={{ borderBottom: "none", paddingBottom: "1rem" }}
        style={{ width: "100%", minHeight: "600px" }}
      >
        {tabLabels.map((label, index) => (
          <Tabs.TabPane
            key={index.toString()}
            tab={
              <span
                style={{
                  fontWeight:
                    activeTab === index.toString() ? "bold" : "normal",
                }}
              >
                {label}
              </span>
            }
          >
            {tabContents[index]}
          </Tabs.TabPane>
        ))}
      </Tabs>

      <div
        style={{
          position: "absolute",
          top: "179px",
          left: "0",
          width: "100vw",
          height: "1px",
          backgroundColor: "#ddd",
          zIndex: "10",
        }}
      ></div>
    </div>
  );
};
ProductTabs.propTypes = {
  tabLabels: PropTypes.arrayOf(PropTypes.string).isRequired,
  tabContents: PropTypes.arrayOf(PropTypes.node).isRequired,
};

export default ProductTabs;
