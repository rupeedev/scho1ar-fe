#!/usr/bin/env node

/**
 * concat-code.js
 * 
 * This script concatenates all code files from the src directory into a single file.
 * It preserves the original file paths as comments for reference.
 * 
 * Usage: node concat-code.js [output_file]
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

// Configuration
const srcDir = path.resolve('./src');
const outputFile = process.argv[2] || 'all-code.txt';
const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.css', '.html'];

// Stats
let fileCount = 0;

/**
 * Main function using async/await
 */
async function main() {
  console.log(`Starting concatenation process...`);
  console.log(`Source directory: ${srcDir}`);
  console.log(`Output file: ${outputFile}`);
  console.log(`Included extensions: ${codeExtensions.join(', ')}`);
  
  try {
    // Verify source directory exists
    try {
      await fs.access(srcDir);
    } catch (error) {
      console.error(`Error: Source directory ${srcDir} not found.`);
      console.error(`Current working directory: ${process.cwd()}`);
      process.exit(1);
    }
    
    // Create header for output file
    let outputContent = `// All code files from ${srcDir}\n`;
    outputContent += `// Generated on ${new Date().toISOString()}\n`;
    outputContent += `// Extensions included: ${codeExtensions.join(', ')}\n\n`;
    
    // Process files recursively
    outputContent += await walkAndConcatenate(srcDir);
    
    // Check if any files were processed
    if (fileCount === 0) {
      console.log(`No files with extensions ${codeExtensions.join(', ')} found in ${srcDir}.`);
      process.exit(0);
    }
    
    // Write output
    await fs.writeFile(outputFile, outputContent, 'utf8');
    console.log(`\nCompleted! ${fileCount} files concatenated to ${outputFile}`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

/**
 * Recursively walk directory and concatenate file contents
 * @param {string} dirPath - Directory path to process
 * @returns {Promise<string>} - Concatenated content
 */
async function walkAndConcatenate(dirPath) {
  let content = '';
  
  try {
    // Get directory contents
    const items = await fs.readdir(dirPath);
    
    // Process each item
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      
      try {
        // Get item stats
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
          // Recurse into subdirectories
          content += await walkAndConcatenate(itemPath);
        } else if (stats.isFile()) {
          // Check file extension
          const ext = path.extname(itemPath);
          
          if (codeExtensions.includes(ext)) {
            try {
              // Read file content
              const fileContent = await fs.readFile(itemPath, 'utf8');
              
              // Add file separator and content
              content += `// ===== File: ${itemPath} =====\n\n`;
              content += fileContent;
              content += '\n\n';
              
              // Increase counter and log progress
              fileCount++;
              console.log(`Processed (${fileCount}): ${itemPath}`);
            } catch (readError) {
              console.error(`Error reading file ${itemPath}: ${readError.message}`);
            }
          }
        }
      } catch (itemError) {
        console.error(`Error processing ${itemPath}: ${itemError.message}`);
      }
    }
  } catch (dirError) {
    console.error(`Error reading directory ${dirPath}: ${dirError.message}`);
  }
  
  return content;
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});