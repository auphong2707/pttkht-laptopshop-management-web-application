// Swiper core and required modules
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import PropTypes from "prop-types";

import ProductCard from "../V_ProductCard";

const ProductSlider = ({ productData, isAdmin }) => {
  return (
    <Swiper
      modules={[Navigation]} // Use the Navigation module
      navigation // Enable navigation arrows
      slidesPerView={4} // Show 4 slides at once by default
      spaceBetween={20} // Space between slides
      breakpoints={{
        320: { slidesPerView: 1, spaceBetween: 10 },
        640: { slidesPerView: 2, spaceBetween: 10 },
        1024: { slidesPerView: 3, spaceBetween: 15 },
        1280: { slidesPerView: 4, spaceBetween: 20 },
        1600: { slidesPerView: 5, spaceBetween: 20 },
      }}
      watchOverflow={true} // Prevent empty space when there are less slides
    >
      {productData.map((product, index) => (
        <SwiperSlide key={index}>
          <ProductCard {...product} isAdmin={isAdmin} />
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

ProductSlider.propTypes = {
  productData: PropTypes.arrayOf(PropTypes.object),
  isAdmin: PropTypes.bool.isRequired,
};

export default ProductSlider;
