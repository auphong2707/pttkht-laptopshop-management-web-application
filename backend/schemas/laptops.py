from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List


class LaptopCreate(BaseModel):
    brand: str
    sub_brand: str
    name: str
    description: str
    usage_type: str
    cpu: str
    vga: str
    ram_amount: int = Field(..., gt=0)
    ram_type: str
    storage_amount: int = Field(..., gt=0)
    storage_type: str
    webcam_resolution: str
    screen_size: float = Field(..., gt=0)
    screen_resolution: str
    screen_refresh_rate: int = Field(..., gt=0)
    screen_brightness: int = Field(..., gt=0)
    battery_capacity: float = Field(..., gt=0)
    battery_cells: int = Field(..., gt=0)
    weight: float = Field(..., gt=0)
    default_os: str
    warranty: int = Field(..., ge=0)
    width: float = Field(..., gt=0)
    depth: float = Field(..., gt=0)
    height: float = Field(..., gt=0)
    number_usb_a_ports: int = Field(..., ge=0)
    number_usb_c_ports: int = Field(..., ge=0)
    number_hdmi_ports: int = Field(..., ge=0)
    number_ethernet_ports: int = Field(..., ge=0)
    number_audio_jacks: int = Field(..., ge=0)
    product_images: List[str]
    quantity: int = Field(..., ge=0)
    original_price: int = Field(..., gt=0)
    sale_price: int = Field(..., gt=0)


class LaptopUpdate(BaseModel):
    brand: Optional[str] = None
    sub_brand: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    usage_type: Optional[str] = None
    cpu: Optional[str] = None
    vga: Optional[str] = None
    ram_amount: Optional[int] = Field(None, gt=0)
    ram_type: Optional[str] = None
    storage_amount: Optional[int] = Field(None, gt=0)
    storage_type: Optional[str] = None
    webcam_resolution: Optional[str] = None
    screen_size: Optional[float] = Field(None, gt=0)
    screen_resolution: Optional[str] = None
    screen_refresh_rate: Optional[int] = Field(None, gt=0)
    screen_brightness: Optional[int] = Field(None, gt=0)
    battery_capacity: Optional[float] = Field(None, gt=0)
    battery_cells: Optional[int] = Field(None, gt=0)
    weight: Optional[float] = Field(None, gt=0)
    default_os: Optional[str] = None
    warranty: Optional[int] = Field(None, ge=0)
    width: Optional[float] = Field(None, gt=0)
    depth: Optional[float] = Field(None, gt=0)
    height: Optional[float] = Field(None, gt=0)
    number_usb_a_ports: Optional[int] = Field(None, ge=0)
    number_usb_c_ports: Optional[int] = Field(None, ge=0)
    number_hdmi_ports: Optional[int] = Field(None, ge=0)
    number_ethernet_ports: Optional[int] = Field(None, ge=0)
    number_audio_jacks: Optional[int] = Field(None, ge=0)
    product_images: List[str]
    quantity: Optional[int] = Field(None, ge=0)
    original_price: Optional[int] = Field(None, gt=0)
    sale_price: Optional[int] = Field(None, gt=0)


class LaptopResponse(LaptopCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)
