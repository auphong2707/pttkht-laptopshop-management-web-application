# routes/laptops.py

import json
import os
import shutil
from fastapi import APIRouter, Query, Depends, HTTPException
from sqlalchemy.orm import Session
from elasticsearch import Elasticsearch
from db.models import M_Laptop
from schemas.laptops import LaptopCreate, LaptopUpdate
from db.session import get_db
from controllers.C_InventoryController import C_InventoryController
from controllers.C_ProductController import C_ProductController
from fastapi import UploadFile, File
from PIL import Image, ImageDraw, ImageFont
from typing import List
import time


laptops_router = APIRouter(prefix="/laptops", tags=["laptops"])
es = Elasticsearch("http://elasticsearch:9200")

@laptops_router.post("/upload-temp/{folder_name}/{filename}")
async def upload_temp_file(file: UploadFile = File(...), folder_name: str = "temp", filename: str = "temp_file"):
    """
    Upload a file to a temporary folder and return the file path.
    
    Args:
        file: The uploaded file
        folder_name: The name of the folder within the temp directory
        filename: The name of the file to be saved

    Returns:
        JSON response with the temporary file path
    """
    try:
        # Create temp directory if it doesn't exist
        os.makedirs(f"static/temp/{folder_name}", exist_ok=True)

        # Generate a unique filename using timestamp and original filename
        filepath = os.path.join("static/temp", folder_name, filename)

        # Save the file using async operations
        content = await file.read()
        with open(filepath, "wb") as buffer:
            buffer.write(content)
        
        # Return the file path as a URL
        relative_path = f"/static/temp/{folder_name}/{filename}"

        return {
            "filename": filename,
            "filepath": relative_path
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

@laptops_router.post("/")
def insert_laptop(laptop: LaptopCreate, db: Session = Depends(get_db)):
    controller = C_InventoryController(db)
    
    # Process images
    for i, filepath in enumerate(laptop.product_images):
        # Move the image to the static folder
        if not filepath.startswith("/static/laptop_images/"):
            # Ensure the directory exists
            os.makedirs("static/laptop_images", exist_ok=True)
            # Generate a new filename
            filename = os.path.basename(filepath)
            # Move the file
            shutil.move("." + filepath, os.path.join("static/laptop_images", filename))
            # Update the filepath in the list
            laptop.product_images[i] = f"/static/laptop_images/{filename}"

    # Use controller to create laptop
    try:
        laptop_data = laptop.dict()
        laptop_id = controller.createNewLaptop(
            brand=laptop_data.get('brand', ''),
            modelName=laptop_data.get('name', laptop_data.get('model_name', '')),
            specSummary=laptop_data.get('description', ''),
            price=laptop_data.get('sale_price', 0),
            stockQty=laptop_data.get('quantity', 0),
            subBrand=laptop_data.get('sub_brand'),
            usageType=laptop_data.get('usage_type'),
            cpu=laptop_data.get('cpu'),
            vga=laptop_data.get('vga'),
            ramAmount=laptop_data.get('ram_amount'),
            ramType=laptop_data.get('ram_type'),
            storageAmount=laptop_data.get('storage_amount'),
            storageType=laptop_data.get('storage_type'),
            webcamResolution=laptop_data.get('webcam_resolution'),
            screenSize=laptop_data.get('screen_size'),
            screenResolution=laptop_data.get('screen_resolution'),
            screenRefreshRate=laptop_data.get('screen_refresh_rate'),
            screenBrightness=laptop_data.get('screen_brightness'),
            batteryCapacity=laptop_data.get('battery_capacity'),
            batteryCells=laptop_data.get('battery_cells'),
            weight=laptop_data.get('weight'),
            defaultOs=laptop_data.get('default_os'),
            warranty=laptop_data.get('warranty'),
            width=laptop_data.get('width'),
            depth=laptop_data.get('depth'),
            height=laptop_data.get('height'),
            numberUsbAPorts=laptop_data.get('number_usb_a_ports'),
            numberUsbCPorts=laptop_data.get('number_usb_c_ports'),
            numberHdmiPorts=laptop_data.get('number_hdmi_ports'),
            numberEthernetPorts=laptop_data.get('number_ethernet_ports'),
            numberAudioJacks=laptop_data.get('number_audio_jacks'),
            productImages=json.dumps(laptop.product_images),
            originalPrice=laptop_data.get('original_price')
        )
        new_laptop = db.query(M_Laptop).filter(M_Laptop.laptopId == laptop_id).first()
        return {"message": "Laptop added successfully", "laptop": new_laptop}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@laptops_router.delete("/{laptop_id}")
def delete_laptop(laptop_id: int, db: Session = Depends(get_db)):
    controller = C_InventoryController(db)
    try:
        # Check if laptop is referenced in any order items
        from db.models import M_OrderItem
        order_items_count = db.query(M_OrderItem).filter(M_OrderItem.laptopId == laptop_id).count()
        if order_items_count > 0:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot delete laptop: it is referenced in {order_items_count} order(s). Please remove these orders first or use a soft delete."
            )
        
        # Use controller to delete laptop (soft delete)
        controller.deleteLaptop(laptop_id)
        
        # Remove from Elasticsearch
        try:
            es.delete(index="laptops", id=laptop_id)
        except:
            pass
            
        return {"message": "Laptop deleted successfully"}
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to delete laptop: {str(e)}")


@laptops_router.put("/{laptop_id}")
def update_laptop(
    laptop_id: int, laptop_update: LaptopUpdate, db: Session = Depends(get_db)
):
    controller = C_InventoryController(db)
    try:
        update_data = laptop_update.dict(exclude_unset=True)
        updates = {}
        
        # Get the laptop first for image processing
        laptop = db.query(M_Laptop).filter(M_Laptop.laptopId == laptop_id).first()
        if not laptop:
            raise HTTPException(status_code=404, detail="Laptop not found")
        
        # Map snake_case field names to camelCase model attributes
        field_mapping = {
            'brand': 'brand',
            'sub_brand': 'subBrand',
            'name': 'modelName',
            'description': 'specSummary',
            'usage_type': 'usageType',
            'cpu': 'cpu',
            'vga': 'vga',
            'ram_amount': 'ramAmount',
            'ram_type': 'ramType',
            'storage_amount': 'storageAmount',
            'storage_type': 'storageType',
            'webcam_resolution': 'webcamResolution',
            'screen_size': 'screenSize',
            'screen_resolution': 'screenResolution',
            'screen_refresh_rate': 'screenRefreshRate',
            'screen_brightness': 'screenBrightness',
            'battery_capacity': 'batteryCapacity',
            'battery_cells': 'batteryCells',
            'weight': 'weight',
            'default_os': 'defaultOs',
            'warranty': 'warranty',
            'width': 'width',
            'depth': 'depth',
            'height': 'height',
            'number_usb_a_ports': 'numberUsbAPorts',
            'number_usb_c_ports': 'numberUsbCPorts',
            'number_hdmi_ports': 'numberHdmiPorts',
            'number_ethernet_ports': 'numberEthernetPorts',
            'number_audio_jacks': 'numberAudioJacks',
            'product_images': 'productImages',
            'original_price': 'originalPrice',
            'sale_price': 'price',
            'quantity': 'stockQty',
            'model_name': 'modelName',
        }
        
        for key, value in update_data.items():
            if key == "product_images" and isinstance(value, list):
                try:
                    processed_images = []
                    # If the updated product_images have new paths, move them to the static folder
                    for filepath in value:
                        if not filepath.startswith("/static/laptop_images/"):
                            # Ensure the directory exists
                            os.makedirs("static/laptop_images", exist_ok=True)
                            # Generate a new filename
                            filename = os.path.basename(filepath)
                            # Move the file
                            shutil.move("." + filepath, os.path.join("static/laptop_images", filename))
                            # Update the filepath in the list
                            processed_images.append(f"/static/laptop_images/{filename}")
                        else:
                            processed_images.append(filepath)

                    # If the updated product_images removes some images, we need to handle that
                    if laptop.productImages:
                        try:
                            existing_images = json.loads(laptop.productImages) if isinstance(laptop.productImages, str) else laptop.productImages
                            for filepath in existing_images:
                                if filepath not in processed_images:
                                    try:
                                        os.remove("." + filepath)
                                    except FileNotFoundError:
                                        pass
                        except:
                            pass
                    
                    # Convert list to JSON string before setting to updates
                    updates["productImages"] = json.dumps(processed_images)
                except Exception as e:
                    db.rollback()
                    raise HTTPException(status_code=400, detail=f"Image processing failed: {str(e)}")
            elif value is not None:
                # Map the field name to the correct model attribute
                attr_name = field_mapping.get(key, key)
                updates[attr_name] = value

        # Use controller to modify product
        laptop = controller.modifyProduct(laptop_id, **updates)
        
        # Sync updated laptop data to Elasticsearch
        try:
            laptop_dict = {
                'id': laptop.laptopId,
                'brand': laptop.brand,
                'name': laptop.modelName,
                'description': laptop.specSummary,
                'product_images': json.loads(laptop.productImages) if isinstance(laptop.productImages, str) else laptop.productImages,
                'sale_price': laptop.price,
                'quantity': laptop.stockQty,
                'sub_brand': laptop.subBrand,
                'usage_type': laptop.usageType,
                'cpu': laptop.cpu,
                'vga': laptop.vga,
                'ram_amount': laptop.ramAmount,
                'ram_type': laptop.ramType,
                'storage_amount': laptop.storageAmount,
                'storage_type': laptop.storageType,
                'screen_size': laptop.screenSize,
                'screen_resolution': laptop.screenResolution,
                'screen_refresh_rate': laptop.screenRefreshRate,
                'screen_brightness': laptop.screenBrightness,
                'battery_capacity': laptop.batteryCapacity,
                'battery_cells': laptop.batteryCells,
                'weight': laptop.weight,
                'default_os': laptop.defaultOs,
                'warranty': laptop.warranty,
                'original_price': laptop.originalPrice,
                'rate': laptop.rate,
                'num_rate': laptop.numRate,
            }
            es.index(index="laptops", id=laptop.laptopId, body=laptop_dict)
        except Exception as es_error:
            print(f"Warning: Failed to update Elasticsearch: {str(es_error)}")
        
        # Return the laptop with properly formatted product_images
        response_data = {
            "message": "Laptop updated successfully",
            "laptop": {
                "laptopId": laptop.laptopId,
                "brand": laptop.brand,
                "name": laptop.modelName,
                "description": laptop.specSummary,
                "product_images": json.loads(laptop.productImages) if isinstance(laptop.productImages, str) else laptop.productImages,
                "sale_price": laptop.price,
                "quantity": laptop.stockQty,
            }
        }
        return response_data
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to update laptop: {str(e)}")


STOP_WORDS = {"laptop", "laptops"}

@laptops_router.get("/search")
def search_laptops(
    query: str = Query(...),
    limit: int = Query(10),
    page: int = Query(1),
    sort: str = Query("relevant")
):
    terms = query.lower().split()
    filtered_terms = [t for t in terms if t not in STOP_WORDS]
    filtered_query = " ".join(filtered_terms) or query

    search_query = {
        "bool": {
            "should": [
                # 1) Khớp liên tục (boost cao)
                {"match_phrase": {"name": {"query": query, "boost": 6}}},
                {"match_phrase": {"serial_number": {"query": query, "boost": 6}}},

                # 2) Khớp rải rác trong name (tất cả token phải có)
                {
                    "match": {
                        "name": {
                            "query": filtered_query,
                            "operator": "and",
                            "boost": 4
                        }
                    }
                },

                # 3) Cross-fields trên nhiều cột (bao gồm name & serial_number)
                {
                    "multi_match": {
                        "query": filtered_query,
                        "fields": [
                            "brand^3",
                            "sub_brand^3",
                            "name^2",
                            "serial_number^3",
                            "cpu^1",
                            "vga^1"
                        ],
                        "type": "cross_fields",
                        "operator": "and" if len(filtered_terms) > 1 else "or"
                    }
                }
            ],
            "minimum_should_match": 1,
            # Vẫn ép phải match ≥1 term có nghĩa trong name
            "must": {
                "bool": {
                    "should": [
                        {"match": {"name": term}} for term in filtered_terms
                    ],
                    "minimum_should_match": 1
                }
            }
        }
    }

    sort_options = {
        "relevant": [],
        "latest":  [{"inserted_at": {"order": "desc"}}],
        "price_asc":  [{"sale_price": {"order": "asc"}}],
        "price_desc": [{"sale_price": {"order": "desc"}}],
    }
    sorting = sort_options.get(sort, [])

    query_body = {
        "query": search_query,
        "size": limit,
        "from": (page - 1) * limit,
    }
    if sorting:
        query_body["sort"] = sorting

    results = es.search(index="laptops", body=query_body, track_total_hits=True)
    
    # Format results to ensure product_images is always an array
    formatted_results = []
    for hit in results["hits"]["hits"]:
        data = hit["_source"]
        # Ensure product_images is an array
        if isinstance(data.get("product_images"), str):
            try:
                data["product_images"] = json.loads(data["product_images"])
            except:
                data["product_images"] = []
        elif not isinstance(data.get("product_images"), list):
            data["product_images"] = []
        formatted_results.append(data)
    
    return {
        "page": page,
        "limit": limit,
        "total_count": results["hits"]["total"]["value"],
        "results": formatted_results,
    }


@laptops_router.get("/filter")
def filter_laptops(
    price_min: int = Query(None),
    price_max: int = Query(None),
    brand: list[str] = Query([]),
    sub_brand: list[str] = Query([]),
    cpu: list[str] = Query([]),
    vga: list[str] = Query([]),
    ram_amount: list[int] = Query([]),
    storage_amount: list[int] = Query([]),
    screen_size: list[int] = Query([]),
    weight_min: float = Query(None),
    weight_max: float = Query(None),
    usage_type: list[str] = Query([]),
    limit: int = Query(None),
    page: int = Query(1),
    sort: str = Query("latest"),
):
    print(cpu)
    filter_query = {"bool": {"filter": []}}
    should_query = {"bool": {"should": []}}

    if brand and "all" not in brand:
        filter_query["bool"]["filter"].append({"terms": {"brand.keyword": brand}})
    if sub_brand:
        filter_query["bool"]["filter"].append(
            {"terms": {"sub_brand.keyword": sub_brand}}
        )
    if ram_amount:
        filter_query["bool"]["filter"].append({"terms": {"ram_amount": ram_amount}})
    if storage_amount:
        filter_query["bool"]["filter"].append(
            {"terms": {"storage_amount": storage_amount}}
        )
    if cpu:
        cpu_conditions = []
        for cpu_value in cpu:
            cpu_conditions.append({"match_phrase": {"cpu": cpu_value}})
        filter_query["bool"]["filter"].append({
            "bool": {
                "should": cpu_conditions,
                "minimum_should_match": 1
            }
        })
    if vga:
        should_query["bool"]["should"].extend(
            [
                {"wildcard": {"vga.keyword": f"*{v.lower()}*"}}
                for v in vga
                if isinstance(v, str)
            ]
        )
    # Add filter for usage_type parameter
    if usage_type:
        filter_query["bool"]["filter"].append({"terms": {"usage_type.keyword": usage_type}})
    if screen_size:
        filter_query["bool"]["filter"].append(
            {
                "bool": {
                    "should": [
                        {"range": {"screen_size": {"gte": size, "lte": size + 0.6}}}
                        for size in screen_size
                    ],
                    "minimum_should_match": 1,
                }
            }
        )
    if weight_min is not None or weight_max is not None:
        weight_filter = {"range": {"weight": {}}}
        if weight_min is not None:
            weight_filter["range"]["weight"]["gte"] = weight_min
        if weight_max is not None:
            weight_filter["range"]["weight"]["lte"] = weight_max
        filter_query["bool"]["filter"].append(weight_filter)
    if price_min is not None or price_max is not None:
        price_filter = {"range": {"sale_price": {}}}
        if price_min is not None:
            price_filter["range"]["sale_price"]["gte"] = price_min
        if price_max is not None:
            price_filter["range"]["sale_price"]["lte"] = price_max
        filter_query["bool"]["filter"].append(price_filter)
    if should_query["bool"]["should"]:
        should_query["bool"]["minimum_should_match"] = 1
        filter_query["bool"]["filter"].append(should_query)

    sort_options = {
        "latest": [{"inserted_at": {"order": "desc"}}],
        "price_asc": [{"sale_price": {"order": "asc"}}],
        "price_desc": [{"sale_price": {"order": "desc"}}],
    }
    sorting = sort_options.get(sort, sort_options["latest"])

    query_body = {"query": filter_query, "sort": sorting}
    if limit is not None:
        query_body.update({"size": limit, "from": (page - 1) * limit})

    results = es.search(index="laptops", body=query_body, track_total_hits=True)
    total_count = results["hits"]["total"]["value"]

    # Format results to ensure product_images is always an array
    formatted_results = []
    for hit in results["hits"]["hits"]:
        data = hit["_source"]
        # Ensure product_images is an array
        if isinstance(data.get("product_images"), str):
            try:
                data["product_images"] = json.loads(data["product_images"])
            except:
                data["product_images"] = []
        elif not isinstance(data.get("product_images"), list):
            data["product_images"] = []
        formatted_results.append(data)

    return {
        "sort": sort,
        "page": page if limit is not None else None,
        "limit": limit,
        "total_count": total_count,
        "results": formatted_results,
    }


@laptops_router.get("/latest")
def get_latest_laptops(
    brand: str = Query("all"), subbrand: str = Query("all"), limit: int = Query(35)
):
    filter_query = {"bool": {"filter": []}}
    if brand.lower() != "all":
        filter_query["bool"]["filter"].append({"term": {"brand.keyword": brand}})
    if subbrand.lower() != "all":
        filter_query["bool"]["filter"].append({"term": {"sub_brand.keyword": subbrand}})

    results = es.search(
        index="laptops",
        body={
            "query": filter_query,
            "sort": [{"inserted_at": {"order": "desc"}}],
            "size": limit,
        },
    )
    
    # Format results to ensure product_images is always an array
    formatted_results = []
    for hit in results["hits"]["hits"]:
        data = hit["_source"]
        # Ensure product_images is an array
        if isinstance(data.get("product_images"), str):
            try:
                data["product_images"] = json.loads(data["product_images"])
            except:
                data["product_images"] = []
        elif not isinstance(data.get("product_images"), list):
            data["product_images"] = []
        formatted_results.append(data)
    
    return {"results": formatted_results}


@laptops_router.get("/id/{laptop_id}")
def get_laptop(laptop_id: int, db: Session = Depends(get_db)):
    controller = C_ProductController(db)
    
    # Try to get from Elasticsearch first
    try:
        query = {"query": {"term": {"id": laptop_id}}}
        results = es.search(index="laptops", body=query)
        if results["hits"]["hits"]:
            es_data = results["hits"]["hits"][0]["_source"]
            # Ensure product_images is properly formatted
            if isinstance(es_data.get("product_images"), str):
                try:
                    es_data["product_images"] = json.loads(es_data["product_images"])
                except:
                    es_data["product_images"] = []
            return es_data
    except Exception as es_error:
        print(f"Elasticsearch query failed: {es_error}, falling back to database")
    
    # Fallback to database using controller
    laptop = controller.getLaptopDetails(laptop_id)
    if not laptop:
        raise HTTPException(status_code=404, detail="Laptop not found")
    
    # Convert laptop to dict with proper formatting
    laptop_dict = {
        'id': laptop.laptopId,
        'brand': laptop.brand,
        'name': laptop.modelName,
        'description': laptop.specSummary,
        'product_images': json.loads(laptop.productImages) if isinstance(laptop.productImages, str) else laptop.productImages or [],
        'sale_price': laptop.price,
        'quantity': laptop.stockQty,
        'sub_brand': laptop.subBrand,
        'usage_type': laptop.usageType,
        'cpu': laptop.cpu,
        'vga': laptop.vga,
        'ram_amount': laptop.ramAmount,
        'ram_type': laptop.ramType,
        'storage_amount': laptop.storageAmount,
        'storage_type': laptop.storageType,
        'screen_size': laptop.screenSize,
        'screen_resolution': laptop.screenResolution,
        'screen_refresh_rate': laptop.screenRefreshRate,
        'screen_brightness': laptop.screenBrightness,
        'battery_capacity': laptop.batteryCapacity,
        'battery_cells': laptop.batteryCells,
        'weight': laptop.weight,
        'default_os': laptop.defaultOs,
        'warranty': laptop.warranty,
        'width': laptop.width,
        'depth': laptop.depth,
        'height': laptop.height,
        'number_usb_a_ports': laptop.numberUsbAPorts,
        'number_usb_c_ports': laptop.numberUsbCPorts,
        'number_hdmi_ports': laptop.numberHdmiPorts,
        'number_ethernet_ports': laptop.numberEthernetPorts,
        'number_audio_jacks': laptop.numberAudioJacks,
        'original_price': laptop.originalPrice,
        'rate': laptop.rate,
        'num_rate': laptop.numRate,
    }
    return laptop_dict


@laptops_router.post("/{laptop_id}/upload_images")
def upload_images_to_laptop(
    laptop_id: int, files: list[UploadFile] = File(...), db: Session = Depends(get_db)
):
    """
    Upload new images for a laptop. If the laptop already has images,
    the new images are appended. For example, if there are already 3 images,
    the next file will be saved as id_img4.jpg and added to the URL list.
    """
    laptop = db.query(M_Laptop).filter(M_Laptop.laptopId == laptop_id).first()
    if not laptop:
        raise HTTPException(status_code=404, detail="Laptop not found")

    existing_urls = []
    if laptop.productImages:
        try:
            existing_urls = json.loads(laptop.productImages)
            if not isinstance(existing_urls, list):
                existing_urls = []
        except json.JSONDecodeError:
            existing_urls = []

    os.makedirs("static/laptop_images", exist_ok=True)

    try:
        font = ImageFont.truetype("arial.ttf", 150)
    except Exception:
        font = ImageFont.load_default()

    new_urls = []
    starting_index = len(existing_urls)
    for i, file in enumerate(files):
        new_index = starting_index + i + 1
        filename = f"{laptop_id}_img{new_index}.jpg"
        filepath = os.path.join("static/laptop_images", filename)

        # Save the uploaded file
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Reopen image to draw watermark
        with Image.open(filepath) as img:
            draw = ImageDraw.Draw(img)
            draw.text(
                (30, 30),
                f"ID: {laptop_id}",
                fill="black",
                stroke_fill="white",
                stroke_width=3,
                font=font,
            )
            img.save(filepath)

        new_urls.append(f"/static/laptop_images/{filename}")

    # Append new URLs to the existing list and update DB
    all_urls = existing_urls + new_urls
    laptop.productImages = json.dumps(all_urls)
    db.commit()

    return {"message": "Images uploaded successfully", "image_urls": all_urls}
