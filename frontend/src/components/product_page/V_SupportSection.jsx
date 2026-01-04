import { Button, Typography } from "antd";
import PropTypes from "prop-types";

const { Text } = Typography;

const SupportSection = () => {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "350px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#ffffff",
        padding: "0 10%",
      }}
    >
      {/* Left Section - Buttons */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "10px",
          marginLeft: "250px",
          marginRight: "-150px",
        }}
      >
        <SupportButton text="Product Support" />
        <SupportButton text="FAQ" />
        <SupportButton text="Our Buyer Guide" />
      </div>

      {/* Right Section - Image */}
      <div style={{ flex: 1, textAlign: "right" }}>
        <img
          src="/customer-support.png"
          alt="Customer Support"
          style={{
            height: "100%",
            maxHeight: "350px",
            width: "auto",
            border: "none",
            outline: "none",
            boxShadow: "none",
            zIndex: "-10",
            marginRight: "350px",
          }}
        />
      </div>
    </div>
  );
};

const SupportButton = ({ text }) => {
  return (
    <Button
      type="default"
      style={{
        width: "250px",
        height: "50px",
        fontSize: "16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 15px",
        borderRadius: "8px",
        border: "1px solid #ddd",
        background: "white",
        boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.1)",
      }}
    >
      <Text>{text}</Text>
      <span style={{ fontSize: "18px", fontWeight: "bold" }}>→</span>
    </Button>
  );
};
SupportButton.propTypes = {
  text: PropTypes.string.isRequired,
};

export default SupportSection;
