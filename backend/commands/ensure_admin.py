#!/usr/bin/env python3
"""
Ensure admin account exists in the database
This script is safe to run multiple times - it will only create the account if it doesn't exist
"""
import os
import sys
from passlib.context import CryptContext
import psycopg2

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def ensure_admin_account():
    """Create admin account if it doesn't exist"""
    
    # Database connection parameters
    db_params = {
        'host': os.getenv('PGHOST', 'db'),
        'port': os.getenv('PGPORT', '5432'),
        'user': os.getenv('PGUSER', 'postgres'),
        'password': os.getenv('PGPASSWORD', 'postgres'),
        'database': os.getenv('PGDATABASE', 'postgres')
    }
    
    admin_email = 'admin@admin.com'
    admin_password = 'admin'
    
    try:
        # Connect to the database
        conn = psycopg2.connect(**db_params)
        cur = conn.cursor()
        
        # Check if admin account exists
        cur.execute("SELECT id FROM users WHERE email = %s", (admin_email,))
        existing_admin = cur.fetchone()
        
        if existing_admin:
            print(f"✓ Admin account already exists (ID: {existing_admin[0]})")
        else:
            # Hash the password
            hashed_password = pwd_context.hash(admin_password)
            
            # Insert admin account
            cur.execute("""
                INSERT INTO users (email, hashed_password, first_name, last_name, phone_number, shipping_address, role, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (admin_email, hashed_password, 'Admin', 'User', '+84999999999', 'Admin Address', 'admin', True))
            
            conn.commit()
            print(f"✓ Admin account created successfully (email: {admin_email}, password: {admin_password})")
        
        cur.close()
        conn.close()
        
    except psycopg2.OperationalError as e:
        print(f"✗ Database connection error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"✗ Error ensuring admin account: {e}")
        sys.exit(1)

if __name__ == "__main__":
    ensure_admin_account()
