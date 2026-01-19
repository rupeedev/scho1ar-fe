#!/usr/bin/env python3

"""
concat-code.py

This script concatenates all code files from the src directory into a single file.
It preserves the original file paths as comments for reference.

Usage: python concat-code.py [output_file]
"""

import os
import sys
import datetime

# Configuration
src_dir = "src"
output_file = sys.argv[1] if len(sys.argv) > 1 else "all-code.txt"
code_extensions = [".ts", ".tsx", ".js", ".jsx", ".css", ".html"]

# Stats
file_count = 0

# Header for output file
header = f"// All code files from {src_dir}\n"
header += f"// Generated on {datetime.datetime.now().isoformat()}\n"
header += f"// Extensions included: {', '.join(code_extensions)}\n\n"

print(f"Concatenating code files from {src_dir} to {output_file}...")

# Function to concatenate files recursively
def concat_files(directory, output_content):
    global file_count
    
    # Walk through all files and directories
    for root, dirs, files in os.walk(directory):
        for file in files:
            # Get full file path
            file_path = os.path.join(root, file)
            
            # Check if file extension is in our list
            _, ext = os.path.splitext(file)
            if ext in code_extensions:
                try:
                    # Try to read file with UTF-8 encoding first
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            file_content = f.read()
                    except UnicodeDecodeError:
                        # Fall back to latin-1 encoding which can handle any byte sequence
                        with open(file_path, 'r', encoding='latin-1') as f:
                            file_content = f.read()
                            print(f"Note: Used latin-1 encoding for {file_path}")
                    
                    # Add file separator and content
                    output_content += f"\n\n// ===== File: {file_path} =====\n\n"
                    output_content += file_content
                    
                    # Log progress
                    file_count += 1
                    print(f"Processed ({file_count}): {file_path}")
                except Exception as e:
                    print(f"Error reading {file_path}: {str(e)}")
    
    return output_content

try:
    # Check if source directory exists
    if not os.path.isdir(src_dir):
        print(f"Error: Source directory {src_dir} not found.")
        sys.exit(1)
    
    # Concatenate all files
    all_content = concat_files(src_dir, header)
    
    # Check if any files were processed
    if file_count == 0:
        print(f"No files with extensions {', '.join(code_extensions)} found in {src_dir}.")
        sys.exit(0)
    
    # Write output file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(all_content)
    
    print(f"\nCompleted! {file_count} files concatenated to {output_file}")
except Exception as e:
    print(f"Error: {str(e)}")
    sys.exit(1)