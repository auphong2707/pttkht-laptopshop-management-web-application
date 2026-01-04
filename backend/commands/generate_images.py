#!/usr/bin/env python3
"""
Standalone script to generate images for laptops and posts.
This can be run independently of data generation.
"""
import sys
import os

# Add parent directory to path to import generate_sample_data
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from commands.generate_sample_data import generate_laptop_images, generate_post_images

if __name__ == "__main__":
    print("Generating laptop images...")
    generate_laptop_images()
    print("Laptop images generated successfully!")
    
    print("Generating post images...")
    generate_post_images(num_posts=20)
    print("Post images generated successfully!")
    
    print("All images generated!")
