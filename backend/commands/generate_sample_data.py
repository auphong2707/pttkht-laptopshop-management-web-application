import json
import random
import os
from datetime import datetime, timedelta
from PIL import Image, ImageDraw, ImageFont
from tqdm import tqdm
from concurrent.futures import ThreadPoolExecutor
from decimal import Decimal, ROUND_HALF_UP
import string
from passlib.context import CryptContext

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

NUM_LAPTOPS = 0
NUM_POSTS = 0


def get_sub_brand(brand, name):
    if brand == "asus":
        sub_brands = ["rog", "tuf", "zenbook", "vivobook"]
        for sub_brand in sub_brands:
            if sub_brand in name.lower():
                return sub_brand

    elif brand == "lenovo":
        sub_brands = ["legion", "loq", "thinkpad", "thinkbook", "yoga", "ideapad"]
        for sub_brand in sub_brands:
            if sub_brand in name.lower():
                return sub_brand

    elif brand == "acer":
        sub_brands = ["predator", "nitro", "swift", "aspire"]
        for sub_brand in sub_brands:
            if sub_brand in name.lower():
                return sub_brand

    elif brand == "dell":
        sub_brands = [
            "alienware",
            "gaming g",
            "xps",
            "inspiron",
            "latitude",
            "precision",
        ]
        for sub_brand in sub_brands:
            if sub_brand in name.lower():
                if sub_brand == "gaming g":
                    return "g series"
                return sub_brand

    elif brand == "hp":
        sub_brands = ["omen", "victus", "spectre", "envy", "pavilion", "elitebook"]
        for sub_brand in sub_brands:
            if sub_brand in name.lower():
                return sub_brand

    elif brand == "msi":
        sub_brands = ["stealth", "katana", "prestigate", "creator", "modern"]
        for sub_brand in sub_brands:
            if sub_brand in name.lower():
                return sub_brand

    return "n/a"

def get_laptop_usage_type(sub_brand):
    if sub_brand in ["rog", "tuf", "legion", "loq", "predator", "nitro", "alienware", "g series", "omen", "victus", "katana", "stealth"]:
        return "gaming"
    elif sub_brand in ["thinkpad", "thinkbook", "latitude", "elitebook", "probook", "modern"]:
        return "business"
    elif sub_brand in ["precision", "zbook", "creator", "workstation"]:
        return "workstation"
    elif sub_brand in ["zenbook", "vivobook", "swift", "xps", "spectre", "envy", "yoga", "prestigate"]:
        return "ultrabook"
    else:
        return "general"
    
def get_laptop_description(laptop):
    """Generate a descriptive marketing text for a laptop based on its features."""
    # Extract key specifications
    brand = laptop.get("brand", "").capitalize() if laptop.get("brand") else ""
    name = laptop.get("name", "")
    usage_type = get_laptop_usage_type(get_sub_brand(brand, name))
    cpu = laptop.get("cpu", "")
    vga = laptop.get("vga", "")
    ram_amount = str(laptop.get("ram_amount", ""))
    ram_type = laptop.get("ram_type", "")
    storage_amount = str(laptop.get("storage_amount", ""))
    storage_type = laptop.get("storage_type", "")
    screen_size = str(laptop.get("screen_size", ""))
    screen_resolution = laptop.get("screen_resolution", "")
    screen_refresh_rate = str(laptop.get("screen_refresh_rate", ""))
    weight = str(laptop.get("weight", ""))

    # Initialize description parts
    intro = ""
    performance = ""
    display = ""
    design = ""
    conclusion = ""
    
    # Create intro based on usage type
    if usage_type == "gaming":
        intro_templates = [
            f"Nâng tầm trải nghiệm gaming của bạn với {brand} {name}.",
            f"Khám phá sức mạnh gaming đỉnh cao với {brand} {name}.",
            f"Laptop gaming {brand} {name} - Chinh phục mọi tựa game đầy thách thức."
        ]
        intro = random.choice(intro_templates)
    elif usage_type == "business":
        intro_templates = [
            f"Đồng hành cùng doanh nhân thành đạt với {brand} {name}.",
            f"{brand} {name} - Giải pháp tối ưu cho công việc chuyên nghiệp.",
            f"Nâng cao hiệu suất công việc với laptop doanh nhân {brand} {name}."
        ]
        intro = random.choice(intro_templates)
    elif usage_type == "ultrabook":
        intro_templates = [
            f"Mỏng nhẹ, sang trọng và mạnh mẽ - {brand} {name} là lựa chọn hoàn hảo.",
            f"{brand} {name} - Ultrabook cao cấp cho người dùng năng động.",
            f"Trải nghiệm sự hoàn hảo trong một thiết kế mỏng nhẹ với {brand} {name}."
        ]
        intro = random.choice(intro_templates)
    elif usage_type == "workstation":
        intro_templates = [
            f"{brand} {name} - Sức mạnh vượt trội cho công việc sáng tạo chuyên nghiệp.",
            f"Chinh phục mọi dự án đồ họa phức tạp với {brand} {name}.",
            f"Workstation {brand} {name} - Đối tác đáng tin cậy của nhà sáng tạo nội dung."
        ]
        intro = random.choice(intro_templates)
    else:
        intro_templates = [
            f"{brand} {name} - Laptop đa năng cho mọi nhu cầu sử dụng.",
            f"Trải nghiệm công nghệ tiên tiến với {brand} {name}.",
            f"{brand} {name} - Sự lựa chọn hoàn hảo cho công việc và giải trí."
        ]
        intro = random.choice(intro_templates)
    
    # Create performance description
    if cpu and vga:
        performance_templates = [
            f"Được trang bị {cpu} và card đồ họa {vga}, kết hợp với {ram_amount} {ram_type} RAM và {storage_amount} {storage_type}, mang đến hiệu năng mạnh mẽ cho mọi tác vụ.",
            f"Sức mạnh đến từ bộ vi xử lý {cpu}, GPU {vga}, {ram_amount} RAM và {storage_amount} {storage_type}, đảm bảo mọi hoạt động diễn ra mượt mà.",
            f"Hiệu năng vượt trội với {cpu}, {vga}, {ram_amount} RAM và ổ cứng {storage_amount} {storage_type} cho khả năng xử lý đa nhiệm tuyệt vời."
        ]
        performance = random.choice(performance_templates)
    elif cpu:
        performance_templates = [
            f"Với bộ vi xử lý {cpu} cùng {ram_amount} RAM và {storage_amount} {storage_type}, máy đáp ứng tốt mọi nhu cầu sử dụng hàng ngày.",
            f"Hiệu năng ổn định đến từ {cpu}, {ram_amount} RAM và {storage_amount} {storage_type}, đủ sức cho các tác vụ thường ngày.",
            f"Trang bị {cpu}, {ram_amount} RAM và {storage_amount} {storage_type} cho trải nghiệm mượt mà trong công việc hàng ngày."
        ]
        performance = random.choice(performance_templates)
    
    # Create display description
    if screen_size and screen_resolution:
        display_templates = [
            f"Màn hình {screen_size} với độ phân giải {screen_resolution}{' và tần số quét ' + screen_refresh_rate if screen_refresh_rate else ''} mang đến trải nghiệm hình ảnh sắc nét và sống động.",
            f"Trải nghiệm hình ảnh tuyệt đẹp trên màn hình {screen_size} độ phân giải {screen_resolution}{', tần số quét ' + screen_refresh_rate if screen_refresh_rate else ''}.",
            f"Đắm chìm trong không gian hình ảnh rộng lớn với màn hình {screen_size}, độ phân giải {screen_resolution}{' và tần số ' + screen_refresh_rate if screen_refresh_rate else ''}."
        ]
        display = random.choice(display_templates)
    
    # Create design description
    if weight:
        try:
            weight_value = float(weight.replace("kg", "").strip())
            if weight_value < 2:
                design_templates = [
                    f"Thiết kế mỏng nhẹ chỉ {weight}, dễ dàng mang theo bên mình mọi lúc mọi nơi.",
                    f"Với trọng lượng chỉ {weight}, đây là người bạn đồng hành lý tưởng cho người thường xuyên di chuyển.",
                    f"Trọng lượng chỉ {weight} giúp bạn dễ dàng mang theo laptop đi bất cứ đâu."
                ]
            else:
                design_templates = [
                    f"Thiết kế bền bỉ với trọng lượng {weight}, cân bằng giữa hiệu năng và tính di động.",
                    f"Máy có trọng lượng {weight}, được thiết kế chắc chắn để đáp ứng nhu cầu sử dụng hàng ngày.",
                    f"Với trọng lượng {weight}, máy vẫn đảm bảo sự cân bằng giữa sức mạnh và khả năng di chuyển."
                ]
            design = random.choice(design_templates)
        except:
            pass
    
    # Create conclusion
    if usage_type == "gaming":
        conclusion_templates = [
            "Là lựa chọn hoàn hảo cho game thủ đam mê chinh phục mọi tựa game.",
            "Đáp ứng mọi nhu cầu gaming từ cơ bản đến chuyên nghiệp.",
            "Mang đến trải nghiệm chơi game mượt mà, không giật lag ở mức cấu hình cao."
        ]
    elif usage_type == "business":
        conclusion_templates = [
            "Là trợ thủ đắc lực cho doanh nhân trong mọi cuộc họp và dự án quan trọng.",
            "Đáp ứng hoàn hảo nhu cầu làm việc chuyên nghiệp với độ bền cao.",
            "Tối ưu hóa hiệu suất công việc với độ bảo mật và ổn định vượt trội."
        ]
    elif usage_type == "ultrabook":
        conclusion_templates = [
            "Là sự lựa chọn hoàn hảo cho người dùng yêu thích sự gọn nhẹ và thời trang.",
            "Kết hợp hoàn hảo giữa hiệu năng và tính di động cho người dùng năng động.",
            "Đáp ứng đầy đủ nhu cầu công việc và giải trí trong một thiết kế sang trọng."
        ]
    elif usage_type == "workstation":
        conclusion_templates = [
            "Là công cụ không thể thiếu cho các nhà sáng tạo nội dung chuyên nghiệp.",
            "Đáp ứng xuất sắc nhu cầu xử lý đồ họa, render video và các tác vụ nặng.",
            "Mang đến sức mạnh xử lý vượt trội cho các dự án đòi hỏi hiệu năng cao."
        ]
    else:
        conclusion_templates = [
            "Là lựa chọn đáng cân nhắc cho người dùng tìm kiếm sự cân bằng giữa hiệu năng và giá thành.",
            "Đáp ứng tốt nhu cầu học tập, làm việc và giải trí hàng ngày.",
            "Mang đến trải nghiệm sử dụng toàn diện với mức giá hợp lý."
        ]
    conclusion = random.choice(conclusion_templates)
    
    # Combine all parts
    description_parts = [part for part in [intro, performance, display, design, conclusion] if part]
    description = " ".join(description_parts)
    
    return description
    
def clear_old_commands():
    with open("./commands/insert_sample_data.sql", "w") as sql_file:
        sql_file.write("")
    print("Old commands cleared")


def generate_admin_account(sql_output_path="./commands/insert_sample_data.sql"):
    """
    Generate SQL insert for an admin account with credentials:
    Email: admin@admin.com
    Password: admin
    """
    # Hash the password using bcrypt
    hashed_password = pwd_context.hash("admin")
    
    # Prepare the SQL insert statement
    insert_query = f"""-- Admin Account --
INSERT INTO users (email, hashed_password, first_name, last_name, phone_number, shipping_address, role, is_active)
VALUES ('admin@admin.com', '{hashed_password}', 'Admin', 'User', '+84999999999', 'Admin Address', 'admin', true);

"""
    
    # Write to file
    with open(sql_output_path, "a") as sql_file:
        sql_file.write(insert_query)
    
    print("✓ Admin account seeded (email: admin@admin.com, password: admin)")


def generate_laptop_insert_queries(
    json_data_directory="./data/",
    sql_output_path="./commands/insert_sample_data.sql",
):
    """
    Generate insert queries from JSON data file AND store data for orders.
    Handles value formatting inline.
    """
    global NUM_LAPTOPS, LAPTOP_DATA_FOR_ORDERS
    NUM_LAPTOPS = 0
    LAPTOP_DATA_FOR_ORDERS = []

    insert_query_base = """INSERT INTO laptops (brand, sub_brand, name, description, usage_type, cpu, vga, ram_amount, ram_type, storage_amount,
        storage_type, webcam_resolution, screen_size, screen_resolution, screen_refresh_rate, screen_brightness,
        battery_capacity, battery_cells, weight, default_os, warranty, width, depth, height,
        number_usb_a_ports, number_usb_c_ports, number_hdmi_ports, number_ethernet_ports, number_audio_jacks, product_images, quantity, original_price, sale_price) VALUES """

    all_values = []

    try:
        # --- Load JSON data (keep as is) ---
        laptops = []
        json_file_paths = [
            os.path.join(json_data_directory, file)
            for file in os.listdir(json_data_directory)
            if file.endswith(".json")
        ]
        print(f"Found {len(json_file_paths)} JSON files for laptops.")
        for json_file_path in json_file_paths:
            with open(json_file_path, "r") as file:
                laptops.extend(json.load(file))
        print(f"Loaded {len(laptops)} potential laptop records.")

        temp_id_counter = 0
        for laptop_raw in laptops:
            # --- Price validation and calculation (keep as is) ---
            if not laptop_raw.get("price") or laptop_raw["price"] == "n/a":
                continue
            try:
                original_price_decimal = Decimal(laptop_raw["price"])
            except TypeError:
                print(f"Skipping invalid price: {laptop_raw.get('name')}")
                continue
            temp_id_counter += 1
            current_laptop_id = temp_id_counter
            sale_discount_percent = Decimal(random.randint(0, 20)) / Decimal(100)
            sale_price_decimal = (
                original_price_decimal * (Decimal(1) - sale_discount_percent)
            ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            LAPTOP_DATA_FOR_ORDERS.append(
                {
                    "id": current_laptop_id,
                    "original_price": original_price_decimal,
                    "generated_sale_price": sale_price_decimal,
                    "name": laptop_raw.get("name", "Unknown Laptop"),
                }
            )

            # --- Inline Formatting Helper ---
            def format_sql(value):
                if isinstance(value, str) and value.lower() == "n/a":
                    return "NULL"
                if value == "n/a" or value == "N/A":
                    return "NULL"
                if value is None:
                    return "NULL"
                if isinstance(value, str):
                    # --- Previous Fix Applied ---
                    escaped_value = value.replace("'", "''")
                    return f"'{escaped_value}'"
                if isinstance(value, (int, float, Decimal)):
                    return str(value)
                return "NULL"

            # --- FIX for JSON String Formatting ---
            image_paths_list = [
                f"/static/laptop_images/{current_laptop_id}_img{i}.jpg"
                for i in range(1, 4)
            ]
            image_paths_json = json.dumps(image_paths_list)
            escaped_image_paths_json = image_paths_json.replace("'", "''")
            image_paths_sql_string = f"'{escaped_image_paths_json}'"
            # --- END FIX ---

            # Prepare values tuple using inline formatting
            sub_brand = get_sub_brand(laptop_raw.get("brand"), laptop_raw.get("name"))
            laptop_usage_type = get_laptop_usage_type(sub_brand)
            description = get_laptop_description(laptop_raw)

            value_tuple = (
                format_sql(laptop_raw.get("brand")),
                format_sql(sub_brand),
                format_sql(laptop_raw.get("name")),
                format_sql(description),
                format_sql(laptop_usage_type),
                format_sql(laptop_raw.get("cpu")),
                format_sql(laptop_raw.get("vga")),
                format_sql(laptop_raw.get("ram_amount")),
                format_sql(laptop_raw.get("ram_type")),
                format_sql(laptop_raw.get("storage_amount")),
                format_sql(laptop_raw.get("storage_type")),
                format_sql(laptop_raw.get("webcam_resolution")),
                format_sql(laptop_raw.get("screen_size")),
                format_sql(laptop_raw.get("screen_resolution")),
                format_sql(laptop_raw.get("screen_refresh_rate")),
                format_sql(laptop_raw.get("screen_brightness")),
                format_sql(laptop_raw.get("battery_capacity")),
                format_sql(laptop_raw.get("battery_cells")),
                format_sql(laptop_raw.get("weight")),
                format_sql(laptop_raw.get("default_os")),
                format_sql(laptop_raw.get("warranty")),
                format_sql(laptop_raw.get("width")),
                format_sql(laptop_raw.get("depth")),
                format_sql(laptop_raw.get("height")),
                format_sql(laptop_raw.get("number_usb_a_ports")),
                format_sql(laptop_raw.get("number_usb_c_ports")),
                format_sql(laptop_raw.get("number_hdmi_ports")),
                format_sql(laptop_raw.get("number_ethernet_ports")),
                format_sql(laptop_raw.get("number_audio_jacks")),
                image_paths_sql_string,
                str(random.randint(5, 50)),
                str(int(original_price_decimal)),
                str(int(sale_price_decimal)),
            )
            all_values.append(f"({', '.join(value_tuple)})")

        NUM_LAPTOPS = temp_id_counter
        print(f"Processed {NUM_LAPTOPS} valid laptop records for insertion.")

        # --- Write SQL (keep as is) ---
        if all_values:
            chunk_size = 500
            with open(sql_output_path, "a") as sql_file:
                sql_file.write("-- Sample Laptop Data --\n")
                for i in range(0, len(all_values), chunk_size):
                    chunk = all_values[i : i + chunk_size]
                    insert_query = insert_query_base + ",\n".join(chunk) + ";\n"
                    sql_file.write(insert_query)
            print(f"INSERT laptop queries successfully written to {sql_output_path}")
        else:
            print("No valid laptop data found to generate SQL.")

    except FileNotFoundError:
        print(f"Error: JSON directory not found at {json_data_directory}")
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON format: {e}")
    except Exception as e:
        print(f"Error occurred during laptop generation: {str(e)}")
        import traceback

        traceback.print_exc()


def generate_reviews(
    sql_output_path="./commands/insert_sample_data.sql", num_reviews=10000
):
    global NUM_LAPTOPS
    laptop_ids = list(range(1, NUM_LAPTOPS + 1))
    # Using NULL for user_id since we're migrating from Firebase to local auth
    # New reviews will use actual integer user IDs from the users table
    user_ids = [None] * 17  # NULL values for legacy data


    ratings = [1, 2, 3, 4, 5]
    review_texts = [
        "Sản phẩm thực sự xuất sắc! Tôi đã sử dụng laptop này trong hơn một tháng và rất ấn tượng với hiệu năng mạnh mẽ, pin trâu và thiết kế tinh tế. Màn hình hiển thị sắc nét, bàn phím gõ rất êm, phù hợp cho cả công việc văn phòng lẫn chơi game nhẹ. Giao hàng nhanh, đóng gói cẩn thận, đáng giá từng đồng!",
        "Máy có hiệu năng khá tốt, đáp ứng được nhu cầu làm việc hàng ngày của tôi như lướt web, soạn thảo văn bản và xem video. Tuy nhiên, loa âm thanh hơi nhỏ, đôi lúc phải dùng tai nghe để trải nghiệm tốt hơn. Nhìn chung, với mức giá này thì đây là lựa chọn ổn, không có gì để phàn nàn quá nhiều.",
        "Sản phẩm ở mức trung bình. Tôi mua để làm việc từ xa, cấu hình đủ dùng nhưng tốc độ khởi động hơi chậm so với kỳ vọng. Màn hình màu sắc tạm ổn, không quá nổi bật. Điểm cộng là trọng lượng nhẹ, dễ mang theo, nhưng tôi mong nhà sản xuất cải thiện thêm về phần mềm đi kèm.",
        "Thành thật mà nói, tôi không hài lòng lắm. Máy chạy ổn trong tuần đầu, nhưng sau đó bắt đầu có hiện tượng giật lag khi mở nhiều ứng dụng cùng lúc. Pin tụt khá nhanh, chỉ dùng được khoảng 3-4 tiếng dù quảng cáo là 6 tiếng. Đóng gói giao hàng thì ổn, nhưng chất lượng sản phẩm cần được xem xét lại.",
        "Rất thất vọng với chiếc laptop này. Tôi mua để chỉnh sửa ảnh và video nhưng máy quá yếu, không thể xử lý các phần mềm nặng dù cấu hình quảng cáo là đủ dùng. Quạt tản nhiệt kêu to, nóng máy sau khoảng 1 tiếng sử dụng. Tôi đã liên hệ đổi trả nhưng chưa nhận được phản hồi thỏa đáng từ cửa hàng.",
        "Tuyệt vời! Đây là lần đầu tiên tôi mua laptop online mà hài lòng đến vậy. Máy chạy mượt mà, thiết kế sang trọng, phù hợp với công việc lập trình của tôi. Đặc biệt, pin dùng được hơn 8 tiếng liên tục, rất tiện khi phải di chuyển nhiều. Đội ngũ hỗ trợ khách hàng cũng rất nhiệt tình, cho 5 sao không suy nghĩ!",
        "Sản phẩm tốt trong tầm giá. Tôi dùng để học online và làm việc nhóm, máy đáp ứng ổn mọi nhu cầu cơ bản. Điểm trừ nhỏ là vỏ máy dễ bám vân tay, phải lau thường xuyên để giữ sạch sẽ. Giao hàng đúng hẹn, nhân viên tư vấn nhiệt tình, tôi khá hài lòng với trải nghiệm mua sắm lần này.",
        "Máy tạm ổn, không quá đặc biệt. Hiệu năng đủ để lướt web, xem phim và làm việc nhẹ, nhưng khi chạy đa nhiệm thì hơi đuối. Màn hình có góc nhìn hẹp, ngồi lệch một chút là màu sắc bị biến đổi. Với giá tiền này, tôi nghĩ có thể tìm được lựa chọn tốt hơn trên thị trường.",
    ]
    values = []
    for _ in range(num_reviews):
        laptop_id = random.choice(laptop_ids)
        # Use NULL for user_id (legacy sample data)
        rating = random.choice(ratings)
        review_text = random.choice(review_texts)

        values.append(f"(NULL, {laptop_id}, {rating}, '{review_text}')")

    # Create and write the INSERT query
    insert_query = (
        "INSERT INTO reviews (user_id, laptop_id, rating, review_text) VALUES "
    )
    insert_query += ", ".join(values) + ";"

    with open(sql_output_path, "a") as sql_file:
        sql_file.write(insert_query + "\n")

    print(f"INSERT review queries successfully written to {sql_output_path}")


def generate_subscriptions(
    sql_output_path="./commands/insert_sample_data.sql", num_subs=20
):
    names = [
        "NguyenVanAn",
        "TranThiBinh",
        "LeMinhChi",
        "PhamDucDuy",
        "HoangThiEm",
        "VuQuangPhat",
        "BuiTuanGa",
        "DoanHuyenHa",
    ]
    domains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"]
    values = []
    used_emails = set()
    while len(values) < num_subs:
        name = random.choice(names)
        domain = random.choice(domains)
        email = f"{name.lower()}@{domain}"
        if email not in used_emails:
            used_emails.add(email)
            values.append(f"('{email}')")

    insert_query = "INSERT INTO newsletter_subscriptions (email) VALUES "
    insert_query += ", ".join(values) + ";"

    with open(sql_output_path, "a") as sql_file:
        sql_file.write(insert_query + "\n")

    print(f"INSERT subscription queries successfully written to {sql_output_path}")


def generate_posts(
    sql_output_path="./commands/insert_sample_data.sql", num_posts=20
):
    global NUM_POSTS
    NUM_POSTS = num_posts  # store for image generation

    descriptions = [
        "Khám phá những chiếc laptop chơi game mới nhất!",
        "Nâng cấp góc làm việc của bạn với những phụ kiện tuyệt vời.",
        "Tìm hiểu về những chiếc laptop giá rẻ đáng mua nhất.",
        "Dòng ultrabook mới vừa ra mắt!",
        "Tương lai của máy tính đang ở đây!",
        "10 mẹo giúp bạn làm việc hiệu quả hơn với laptop.",
        "Tối ưu thời lượng pin với những bước đơn giản.",
        "Chơi game di động: Những laptop gaming tốt nhất để mang theo.",
    ]

    links = [
        "https://example.com/bai-viet-1",
        "https://example.com/bai-viet-2",
        "https://example.com/bai-viet-3",
        "https://example.com/bai-viet-4",
    ]

    values = []

    for i in tqdm(range(1, num_posts + 1), desc="Generating post SQL"):
        description = random.choice(descriptions)
        link = random.choice(links)

        # Use generated image path
        image_url = f"/static/post_images/post_{i}.jpg"

        # Random created_at
        days_ago = random.randint(0, 365)
        created_at = (datetime.now() - timedelta(days=days_ago)).date()

        values.append(f"('{image_url}', '{description}', '{link}', '{created_at}')")

    insert_query = (
        "INSERT INTO posts (image_url, description, link, created_at) VALUES "
    )
    insert_query += ", ".join(values) + ";"

    with open(sql_output_path, "a") as sql_file:
        sql_file.write(insert_query + "\n")

    print(f"INSERT post queries written for {num_posts} posts to {sql_output_path}")


def generate_laptop_images(
    template_dir="./static/templates",
    output_dir="./static/laptop_images",
):
    global NUM_LAPTOPS

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    try:
        font = ImageFont.truetype("arial.ttf", 150)
    except:
        font = ImageFont.load_default()

    def generate_image(laptop_id, i):
        src_path = os.path.join(template_dir, f"laptop{i}.jpg")
        dest_path = os.path.join(output_dir, f"{laptop_id}_img{i}.jpg")

        if not os.path.exists(src_path):
            print(f"[WARN] Template image {src_path} not found, skipping")
            return

        with Image.open(src_path) as img:
            draw = ImageDraw.Draw(img)
            draw.text(
                (30, 30),
                f"ID: {laptop_id}",
                font=font,
                fill="black",
                stroke_fill="white",
                stroke_width=3,
            )
            img.save(dest_path)

    with ThreadPoolExecutor() as executor:
        tasks = [
            executor.submit(generate_image, laptop_id, i)
            for laptop_id in range(1, NUM_LAPTOPS + 1)
            for i in range(1, 4)  # 3 images per laptop
        ]
        for task in tqdm(tasks, desc="Generating laptop images"):
            task.result()

    print(f"Generated mock images for {NUM_LAPTOPS} laptops.")


def generate_post_images(
    num_posts=20,
    template_path="./static/templates/posts.jpg",
    output_dir="./static/post_images",
):

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    try:
        font = ImageFont.truetype("arial.ttf", size=100)
    except:
        font = ImageFont.load_default()

    for i in tqdm(range(1, num_posts + 1), desc="Generating post images"):
        if not os.path.exists(template_path):
            print(f"[WARN] Template image not found at: {template_path}")
            break

        with Image.open(template_path) as img:
            draw = ImageDraw.Draw(img)
            text = f"Post #{i}"
            draw.text(
                (50, 50),
                text,
                font=font,
                fill="black",
                stroke_width=4,
                stroke_fill="white",
            )

            output_path = os.path.join(output_dir, f"post_{i}.jpg")
            img.save(output_path)

    print(f"Generated {num_posts} post images in '{output_dir}'")


def generate_orders(
    sql_output_path="./commands/insert_sample_data.sql",
    num_orders=50,
    max_items_per_order=5,
    max_quantity_per_item=3,
):
    """Generates sample orders and order items SQL using inline formatting."""
    global NUM_LAPTOPS, LAPTOP_DATA_FOR_ORDERS
    print(f"\nStarting order generation for {num_orders} orders...")
    if NUM_LAPTOPS == 0 or not LAPTOP_DATA_FOR_ORDERS:
        print("Skipping order generation: No valid laptop data.")
        return

    # --- Generate Fake User Data (keep as before) ---
    fake_users = []
    # ... (user generation lists and logic) ...
    first_names = ["An", "Binh", "Chi", "Duy", "Em", "Phat", "Ga", "Ha", "Khoa", "Lan"]
    last_names = [
        "Nguyen",
        "Tran",
        "Le",
        "Pham",
        "Hoang",
        "Vu",
        "Bui",
        "Doan",
        "Dang",
        "Ngo",
    ]
    domains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com"]
    statuses = [
        "pending",
        "processing",
        "shipping",
        "delivered",
        "cancelled",
        "refunded",
    ]
    payment_methods = [
        "delivery",
        "e-banking"
    ]

    # Legacy sample data - use NULL for user_id
    # New orders will use actual integer user IDs from the users table
    for i in range(num_orders):
        first = random.choice(first_names)
        last = random.choice(last_names)
        email = f"{first.lower()}.{last.lower()}{random.randint(1,99)}@{random.choice(domains)}"
        fake_users.append(
            {
                "user_id": None,  # NULL for legacy data
                "first_name": first,
                "last_name": last,
                "user_email": email,
                "shipping_address": f"{random.randint(1, 100)} {random.choice(['Main St', 'High St', 'Elm St'])}, {random.choice(['Hanoi', 'HCMC', 'Danang'])}",
                "phone_number": f"+84{random.randint(900000000, 999999999)}"
            }
        )

    # --- Prepare SQL Statements (keep as before) ---
    order_inserts = []
    order_item_inserts = []
    current_order_id = 0
    laptop_price_map = {laptop["id"]: laptop for laptop in LAPTOP_DATA_FOR_ORDERS}

    # --- Proactive Fix for Inline Formatting Helper within this function ---
    def format_sql_local(value):
        if isinstance(value, str) and value.lower() == "n/a":
            return "NULL"
        if value == "n/a" or value == "N/A":
            return "NULL"
        if value is None:
            return "NULL"
        if isinstance(value, str):
            # --- Apply same fix as above ---
            escaped_value = value.replace("'", "''")
            return f"'{escaped_value}'"
        if isinstance(value, datetime):
            return f"'{value.strftime('%Y-%m-%d %H:%M:%S')}'"
        if isinstance(value, Decimal):
            return f"'{value.quantize(Decimal('0.01'))}'"
        if isinstance(value, (int, float)):
            return str(value)
        return "NULL"

    # --- End Proactive Fix ---

    for i in tqdm(range(num_orders), desc="Generating order SQL"):
        # --- Order and Item Generation Logic (keep as before) ---
        current_order_id += 1
        user_data = random.choice(fake_users)
        num_items = random.randint(1, max_items_per_order)
        order_total_price = Decimal("0.00")
        order_status = random.choice(statuses)
        payment_method = random.choice(payment_methods)
        days_ago = random.randint(1, 365)
        created_at_dt = datetime.now() - timedelta(days=days_ago)
        current_order_items = []
        laptops_in_this_order = set()
        for _ in range(num_items):
            available_laptop_ids = list(
                set(laptop_price_map.keys()) - laptops_in_this_order
            )
            if not available_laptop_ids:
                break
            laptop_id = random.choice(available_laptop_ids)
            laptops_in_this_order.add(laptop_id)
            laptop_info = laptop_price_map.get(laptop_id)
            if not laptop_info:
                continue
            quantity = random.randint(1, max_quantity_per_item)
            price_at_purchase = laptop_info["generated_sale_price"]
            order_total_price += price_at_purchase * quantity
            current_order_items.append((laptop_id, quantity, price_at_purchase))

        # Generate ORDER INSERT using the fixed inline helper
        order_values = (
            format_sql_local(user_data["user_id"]),
            format_sql_local(user_data["first_name"]),
            format_sql_local(user_data["last_name"]),
            format_sql_local(user_data["user_email"]),
            format_sql_local(user_data["shipping_address"]),
            format_sql_local(user_data["phone_number"]),
            format_sql_local(payment_method),
            format_sql_local(order_total_price),
            format_sql_local(order_status),
            format_sql_local(created_at_dt),
            format_sql_local(created_at_dt),
        )
        order_inserts.append(f"({', '.join(order_values)})")

        # Generate ORDER ITEM INSERTS using the fixed inline helper
        for item_tuple in current_order_items:
            item_values = (
                str(current_order_id),
                str(item_tuple[0]),
                str(item_tuple[1]),
                format_sql_local(item_tuple[2]),  # price_at_purchase
            )
            order_item_inserts.append(f"({', '.join(item_values)})")

    # --- Write SQL to File (keep as before) ---
    # ... (SQL writing logic) ...
    with open(sql_output_path, "a") as sql_file:
        sql_file.write("\n-- Sample Order Data --\n")
        if order_inserts:
            order_cols = "(user_id, first_name, last_name, user_email, shipping_address, phone_number, payment_method, total_price, status, created_at, updated_at)"
            chunk_size = 100
            for i in range(0, len(order_inserts), chunk_size):
                chunk = order_inserts[i : i + chunk_size]
                sql_file.write(
                    f"INSERT INTO orders {order_cols} VALUES\n"
                    + ",\n".join(chunk)
                    + ";\n"
                )
        else:
            sql_file.write("-- No orders generated --\n")
        sql_file.write("\n-- Sample Order Item Data --\n")
        if order_item_inserts:
            item_cols = "(order_id, product_id, quantity, price_at_purchase)"
            chunk_size = 500
            for i in range(0, len(order_item_inserts), chunk_size):
                chunk = order_item_inserts[i : i + chunk_size]
                sql_file.write(
                    f"INSERT INTO order_items {item_cols} VALUES\n"
                    + ",\n".join(chunk)
                    + ";\n"
                )
        else:
            sql_file.write("-- No order items generated --\n")
    print(
        f"INSERT queries for {num_orders} orders and their items written to {sql_output_path}"
    )
    print(
        "IMPORTANT: Assumed Order IDs start from 1. Ensure sequence alignment if needed."
    )


def generate_refund_tickets(
    sql_output_path="./commands/insert_sample_data.sql",
    num_tickets=30,
):
    statuses = ["pending", "resolved"]
    reasons = [
        "Sản phẩm bị lỗi phần cứng.",
        "Không đúng mô tả.",
        "Không hài lòng với chất lượng.",
        "Giao nhầm sản phẩm.",
        "Thay đổi nhu cầu sử dụng.",
        "Không tương thích với phần mềm cần thiết.",
        "Giao hàng trễ.",
        "Sản phẩm đã qua sử dụng.",
    ]

    possible_order_ids = list(range(1, 101))  # assuming 100 orders
    used_combinations = set()
    values = []

    for _ in range(num_tickets):
        # Ensure unique (email, phone) as per schema constraint
        while True:
            email = f"user{random.randint(1, 200)}@example.com"
            phone = f"+84{random.randint(900000000, 999999999)}"
            key = (email, phone)
            if key not in used_combinations:
                used_combinations.add(key)
                break

        order_id = random.choice(possible_order_ids)
        reason = random.choice(reasons)
        status = random.choice(statuses)
        created_at = datetime.utcnow() - timedelta(days=random.randint(1, 100))
        resolved_at = None
        if status == "resolved":
            resolved_at = created_at + timedelta(days=random.randint(1, 7))

        updated_at = resolved_at or (created_at + timedelta(days=random.randint(1, 3)))

        def fmt(val):
            if val is None:
                return "NULL"
            if isinstance(val, datetime):
                return f"'{val.strftime('%Y-%m-%d %H:%M:%S')}'"
            if isinstance(val, str):
                escaped = val.replace("'", "''")
                return f"'{escaped}'"
            return str(val)

        values.append(
            f"({fmt(email)}, {fmt(phone)}, {order_id}, {fmt(reason)}, "
            f"{fmt(status)}, {fmt(created_at)}, {fmt(resolved_at)}, {fmt(updated_at)})"
        )

    if values:
        insert_query = (
            "-- Sample Refund Tickets --\n"
            "INSERT INTO refund_tickets "
            "(email, phone_number, order_id, reason, status, created_at, resolved_at, updated_at)\nVALUES\n"
            + ",\n".join(values)
            + ";\n"
        )
        with open(sql_output_path, "a") as f:
            f.write("\n" + insert_query)
        print(
            f"[✓] Generated and wrote {num_tickets} refund tickets to {sql_output_path}"
        )
    else:
        print("No refund tickets generated.")


if __name__ == "__main__":
    clear_old_commands()
    generate_admin_account()
    generate_laptop_insert_queries()
    generate_laptop_images()
    generate_reviews()
    generate_subscriptions()
    generate_posts()
    generate_post_images(num_posts=NUM_POSTS)
    generate_orders(num_orders=100)
    generate_refund_tickets(num_tickets=30)
