#!/usr/bin/env python3
import os

# Create icons directory if it doesn't exist
os.makedirs('dist/icons', exist_ok=True)

# Create a simple 16x16 orange PNG using hex data
png_hex = bytes.fromhex('89504e470d0a1a0a0000000d49484452000000100000001008020000009091683600000019744558745361666520496d616765204564697427003ed17014000000154944415428917ca80000ffff81010101000000621ce3937b0000000049454e44ae426082')

# Write the icon files
with open('dist/icons/icon-16.png', 'wb') as f:
    f.write(png_hex)

with open('dist/icons/icon-48.png', 'wb') as f:
    f.write(png_hex)

with open('dist/icons/icon-128.png', 'wb') as f:
    f.write(png_hex)

print("Created PNG icon files successfully")
