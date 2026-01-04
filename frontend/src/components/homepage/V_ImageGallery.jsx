import { Image } from "antd";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/autoplay";
import PropTypes from "prop-types";

const ImageGallery = ({ imageSources, height }) => {
  return (
    <div>
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={50}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 5000 }}
        style={{ height: height || "300px", backgroundColor: "white" }}
      >
        {imageSources.map((img, index) => (
          <SwiperSlide key={index}>
            <Image
              src={img}
              height="auto%"
              width="100%"
              style={{ objectFit: "contain" }}
              preview={false}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

ImageGallery.propTypes = {
  imageSources: PropTypes.arrayOf(PropTypes.string),
  height: PropTypes.string,
};

export default ImageGallery;
