import { Typography, Button } from "antd";
import styled from "styled-components";
import PropTypes from "prop-types";

const { Text } = Typography;

const CustomButton = styled(Button)`
  border-radius: 25px;
  border: 2px solid #b0b3b8;
  font-weight: bold;
  color: grey;

  &:hover,
  &:focus {
    border-color: #868e96;
    background: #f5f7ff;
  }
`;

const BrandsSection = ({ brands }) => {
  return (
    <div
      style={{
        width: "100%",
        textAlign: "center",
        background: "#F5F7FF",
        paddingTop: 16,
        paddingBottom: 1,
      }}
    >
      {/* Title */}
      <Text strong style={{ fontSize: 20, display: "block" }}>
        Brands
      </Text>

      <br></br>

      <CustomButton
        type="default"
        style={{
          width: "90%",
          height: 40,
          fontSize: 16,
          display: "block",
          margin: "0 auto",
        }}
        onClick={() => (window.location.href = "/laptops/all")}
      >
        All brands
      </CustomButton>

      <br></br>

      {/* Grid Container */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 1,
          height: "auto",
          padding: "0px 1px",
        }}
      >
        {brands.map((brand, index) => (
          <div
            key={index}
            onClick={() => (window.location.href = brand.link)}
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              background: "white",
              height: 75,
              padding: 15,
              cursor: "pointer",
            }}
          >
            <img
              src={brand.logo}
              alt={brand.name}
              style={{ maxWidth: "100%", filter: "grayscale(100%)" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
BrandsSection.propTypes = {
  brands: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      logo: PropTypes.string.isRequired,
      link: PropTypes.string.isRequired,
    }),
  ).isRequired,
};

export default BrandsSection;
