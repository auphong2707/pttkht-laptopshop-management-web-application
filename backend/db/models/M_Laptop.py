from sqlalchemy import (
    Column,
    Integer,
    String,
    DECIMAL,
    TIMESTAMP,
    func,
    Boolean,
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSON
from .base import Base


class M_Laptop(Base):
    __tablename__ = "laptops"

    # Map camelCase attributes to snake_case database columns
    laptopId = Column("id", Integer, primary_key=True, index=True)
    brand = Column("brand", String, nullable=False)
    price = Column("sale_price", Integer, nullable=False)
    stockQty = Column("quantity", Integer, nullable=False)
    modelName = Column("name", String, nullable=False)
    specSummary = Column("description", String, nullable=False)
    isActive = Column("is_active", Boolean, default=True, nullable=True)
    updatedAt = Column("inserted_at", TIMESTAMP, server_default=func.now())

    # Additional detailed specifications
    subBrand = Column("sub_brand", String)
    usageType = Column("usage_type", String, nullable=False)
    cpu = Column("cpu", String, nullable=False)
    vga = Column("vga", String)
    ramAmount = Column("ram_amount", Integer, nullable=False)
    ramType = Column("ram_type", String, nullable=False)
    storageAmount = Column("storage_amount", Integer, nullable=False)
    storageType = Column("storage_type", String, nullable=False)
    webcamResolution = Column("webcam_resolution", String)
    screenSize = Column("screen_size", DECIMAL(5, 2))
    screenResolution = Column("screen_resolution", String)
    screenRefreshRate = Column("screen_refresh_rate", Integer)
    screenBrightness = Column("screen_brightness", Integer)
    batteryCapacity = Column("battery_capacity", DECIMAL(5, 2))
    batteryCells = Column("battery_cells", Integer)
    weight = Column("weight", String)
    defaultOs = Column("default_os", String)
    warranty = Column("warranty", Integer)
    width = Column("width", DECIMAL(5, 2))
    depth = Column("depth", DECIMAL(5, 2))
    height = Column("height", DECIMAL(5, 2))
    numberUsbAPorts = Column("number_usb_a_ports", Integer)
    numberUsbCPorts = Column("number_usb_c_ports", Integer)
    numberHdmiPorts = Column("number_hdmi_ports", Integer)
    numberEthernetPorts = Column("number_ethernet_ports", Integer)
    numberAudioJacks = Column("number_audio_jacks", Integer)
    productImages = Column("product_images", JSON)
    originalPrice = Column("original_price", Integer, nullable=False)
    rate = Column("rate", DECIMAL(3, 2))
    numRate = Column("num_rate", Integer)

    # Relationships
    reviews = relationship("M_Review", back_populates="laptop", cascade="all, delete-orphan")
    cartItems = relationship("M_CartItem", back_populates="laptop", cascade="all, delete-orphan")
    orderItems = relationship("M_OrderItem", back_populates="laptop")

    def isInStock(self) -> bool:
        """Check if the laptop is in stock"""
        return self.stockQty > 0

    def adjustStock(self, delta: int) -> None:
        """Adjust stock quantity by delta (positive to add, negative to subtract)"""
        self.stockQty += delta
        if self.stockQty < 0:
            self.stockQty = 0

    def changePrice(self, newPrice: float) -> None:
        """Update the laptop price"""
        self.price = int(newPrice)
