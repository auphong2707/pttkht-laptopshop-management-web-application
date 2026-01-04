CREATE TABLE IF NOT EXISTS laptops (
    id SERIAL PRIMARY KEY,
    inserted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    brand TEXT,
    sub_brand TEXT,
    name TEXT,
    description TEXT,
    usage_type TEXT,
    cpu TEXT,
    vga TEXT,
    ram_amount INTEGER,
    ram_type TEXT,
    storage_amount INTEGER,
    storage_type TEXT,
    webcam_resolution TEXT,
    screen_size DECIMAL(5,2),
    screen_resolution TEXT,
    screen_refresh_rate INTEGER,
    screen_brightness INTEGER,
    battery_capacity DECIMAL(5,2),
    battery_cells INTEGER,
    weight DECIMAL(5,2),
    default_os TEXT,
    warranty INTEGER,
    width DECIMAL(5,2),
    depth DECIMAL(5,2),
    height DECIMAL(5,2),
    number_usb_a_ports INTEGER,
    number_usb_c_ports INTEGER,
    number_hdmi_ports INTEGER,
    number_ethernet_ports INTEGER,
    number_audio_jacks INTEGER,
    product_images TEXT,
    quantity INTEGER,
    original_price INT,
    sale_price INT,
    rate DECIMAL(3,2) DEFAULT 0.00,
    num_rate INTEGER DEFAULT 0
);

-- Users table for local authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    shipping_address TEXT,
    role VARCHAR(20) NOT NULL DEFAULT 'customer',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_valid_role CHECK (role IN ('customer', 'admin'))
);

-- Create index on email and phone for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);

CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,  -- Nullable for legacy/sample data during migration
    laptop_id INTEGER NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (laptop_id) REFERENCES laptops(id) ON DELETE CASCADE
);

-- Create index on user_id for faster lookups (where not null)
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id) WHERE user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION update_laptop_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Update rate and num_rate in laptops table
    UPDATE laptops
    SET 
        rate = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE laptop_id = NEW.laptop_id),
        num_rate = (SELECT COUNT(*) FROM reviews WHERE laptop_id = NEW.laptop_id)
    WHERE id = NEW.laptop_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_laptop_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_laptop_rating();

-- Ensure updated_at updates on modification
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_laptops_updated_at
BEFORE UPDATE ON laptops
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_reviews_updated_at
BEFORE UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ORDERS
DROP TABLE IF EXISTS orders CASCADE; 
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,  -- Nullable for legacy/sample data during migration

    -- User details snapshot at time of order
    first_name TEXT,
    last_name TEXT,
    user_email TEXT,
    shipping_address TEXT,
    phone_number TEXT,
    payment_method TEXT,

    total_price DECIMAL(18, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on user_id for faster lookups (where not null)
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id) WHERE user_id IS NOT NULL;

DROP TABLE IF EXISTS order_items;
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price_at_purchase DECIMAL(18, 2) NOT NULL,
    subtotal DECIMAL(10, 2),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES laptops(id) ON DELETE RESTRICT
);

-- Create index on product_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Ensure updated_at updates on modification for orders
DROP TRIGGER IF EXISTS set_orders_updated_at ON orders; -- Add drop for idempotency
CREATE OR REPLACE FUNCTION set_updated_at() -- Ensure this function exists
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Create the RefundTicket table with email and phone_number as identifiers
CREATE TABLE IF NOT EXISTS refund_tickets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,  -- User's email
    phone_number TEXT NOT NULL,  -- User's phone number
    order_id INTEGER NOT NULL,  -- Associated order ID
    reason TEXT NOT NULL,  -- Reason for the refund
    status VARCHAR(50) DEFAULT 'pending',  -- Status: pending, approved, or rejected
    admin_comments TEXT,  -- Admin notes/comments when resolving refund ticket
    resolved_by_id INTEGER REFERENCES users(id),  -- User ID of the admin who resolved this refund ticket
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Timestamp when the refund was created
    resolved_at TIMESTAMP,  -- Timestamp when the refund was resolved (if applicable)
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,  -- Foreign key to orders
    CONSTRAINT unique_user_email_phone UNIQUE(email, phone_number, order_id),  -- Ensure unique combination of email and phone
    CONSTRAINT check_status_valid_values CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Create a function that updates the refund status to 'resolved' when resolved_at is set
CREATE OR REPLACE FUNCTION update_refund_status()
RETURNS TRIGGER AS $$
BEGIN
    -- If the resolved_at field is set, change the status to 'resolved'
    IF NEW.resolved_at IS NOT NULL THEN
        NEW.status := 'resolved';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger that calls the function after the resolved_at field is updated
CREATE TRIGGER update_refund_status_trigger
AFTER UPDATE OF resolved_at
ON refund_tickets
FOR EACH ROW
EXECUTE FUNCTION update_refund_status();

-- Add updated_at column to refund_tickets table
ALTER TABLE refund_tickets ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create a trigger to update the updated_at field on every update
CREATE OR REPLACE FUNCTION set_refund_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update the `updated_at` timestamp on every update
CREATE TRIGGER set_refund_ticket_updated_at_trigger
BEFORE UPDATE ON refund_tickets
FOR EACH ROW
EXECUTE FUNCTION set_refund_ticket_updated_at();

-- Create carts table
CREATE TABLE IF NOT EXISTS carts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    total_amount BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);

-- Create cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    laptop_id INTEGER NOT NULL REFERENCES laptops(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    unit_price BIGINT NOT NULL,
    subtotal BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_cart_item_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_item_laptop FOREIGN KEY (laptop_id) REFERENCES laptops(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_laptop_id ON cart_items(laptop_id);

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    method VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    gateway_ref VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP,
    CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
