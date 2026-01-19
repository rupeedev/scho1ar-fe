#!/bin/bash

# concat-code.sh
#
# This script concatenates all code files from the src directory into a single file.
# It preserves the original file paths as comments for reference.
#
# Usage: ./concat-code.sh [output_file]

# Set source directory
SRC_DIR="/Users/rupesh.panwar/Documents/AI-Projects/costpie/src"
# Default output file (can be overridden with command line argument)
OUTPUT_FILE="${1:-all-code.txt}"
# Extensions to include
CODE_EXTENSIONS=(".ts" ".tsx" ".js" ".jsx" ".css" ".html")

# Initialize file counter
FILE_COUNT=0

# Check if source directory exists
if [ ! -d "$SRC_DIR" ]; then
  echo "Error: Source directory $SRC_DIR not found."
  exit 1
fi

# Create output file with header
cat > "$OUTPUT_FILE" << EOF
// All code files from $SRC_DIR
// Generated on $(date)
// Extensions included: ${CODE_EXTENSIONS[@]}
EOF

echo "Concatenating code files from $SRC_DIR to $OUTPUT_FILE..."

# Function to process a file
process_file() {
  local file="$1"
  local ext="${file##*.}"
  
  # Check if file extension is in our list of code extensions
  for code_ext in "${CODE_EXTENSIONS[@]}"; do
    if [[ ".${ext}" == "$code_ext" ]]; then
      # Add file separator and content to output file
      echo -e "\n\n// ===== File: $file =====\n" >> "$OUTPUT_FILE"
      cat "$file" >> "$OUTPUT_FILE"
      
      # Increment file counter and log progress
      ((FILE_COUNT++))
      echo "Processed ($FILE_COUNT): $file"
      break
    fi
  done
}

# Find all files in source directory and process each one
find "$SRC_DIR" -type f | while read -r file; do
  process_file "$file"
done

# Check if any files were processed
if [ "$FILE_COUNT" -eq 0 ]; then
  echo "No files with extensions ${CODE_EXTENSIONS[@]} found in $SRC_DIR."
  exit 0
fi

# Make script executable
chmod +x "$0"

echo -e "\nCompleted! $FILE_COUNT files concatenated to $OUTPUT_FILE"