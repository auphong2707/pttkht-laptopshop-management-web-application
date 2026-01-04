const transformLaptopData = (data) => {
  return data.map((item) => {
    // Handle product_images - it might be a string or already parsed array
    let imageUrls = [];
    if (typeof item.product_images === 'string') {
      try {
        imageUrls = JSON.parse(item.product_images || "[]");
      } catch (e) {
        console.error('Error parsing product_images for item', item.id, ':', e);
        imageUrls = [];
      }
    } else if (Array.isArray(item.product_images)) {
      imageUrls = item.product_images;
    } else if (item.product_images) {
      console.warn('Unexpected product_images format for item', item.id, ':', typeof item.product_images);
    }

    // Validate imageUrls is an array
    if (!Array.isArray(imageUrls)) {
      console.warn('imageUrls is not an array for item', item.id);
      imageUrls = [];
    }

    // Get the image source - use environment variable for backend URL
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    const imgSource = imageUrls.length > 0 
      ? `${backendUrl}${imageUrls[0]}`
      : '/placeholder.png'; // Use placeholder instead of null

    return {
      productName: item.name.toUpperCase(),
      numRate: item.num_rate,
      originalPrice: item.original_price,
      imgSource: imgSource,
      inStock: item.quantity > 0,
      rate: item.rate,
      salePrice: item.sale_price,
      productId: item.id,
    };
  });
};

export { transformLaptopData };
