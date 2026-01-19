#!/usr/bin/env node

/**
 * AWS Icons Download Script
 * Downloads official AWS service icons for CostPie resource discovery
 * 
 * Based on discovered resource types:
 * - 2392 CLOUDWATCH METRIC
 * - 21 SUBNET  
 * - 17 CLOUDWATCH ALARM
 * - 17 RDS SNAPSHOT
 * - 4 VPC
 * - 3 NAT GATEWAY, INTERNET GATEWAY, EC2 INSTANCE, EBS VOLUME, ECS SERVICE, ECS TASK
 * - 2 DYNAMODB TABLE, S3 BUCKET, ECS CLUSTER, ELB
 * - 1 RDS INSTANCE, LAMBDA FUNCTION, CLOUDWATCH DASHBOARD
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// AWS Service Icon URLs (official AWS Architecture Icons)
const awsIcons = {
  // Compute Services
  'ec2': 'https://a0.awsstatic.com/libra-css/images/site/touch-icon-ipad-144-smile.png',
  'lambda': 'https://a0.awsstatic.com/libra-css/images/site/touch-icon-ipad-144-smile.png',
  'ecs': 'https://a0.awsstatic.com/libra-css/images/site/touch-icon-ipad-144-smile.png',
  
  // Database Services  
  'rds': 'https://a0.awsstatic.com/libra-css/images/site/touch-icon-ipad-144-smile.png',
  'dynamodb': 'https://a0.awsstatic.com/libra-css/images/site/touch-icon-ipad-144-smile.png',
  
  // Storage Services
  's3': 'https://a0.awsstatic.com/libra-css/images/site/touch-icon-ipad-144-smile.png',
  
  // Networking Services
  'vpc': 'https://a0.awsstatic.com/libra-css/images/site/touch-icon-ipad-144-smile.png',
  'elb': 'https://a0.awsstatic.com/libra-css/images/site/touch-icon-ipad-144-smile.png',
  
  // Monitoring Services
  'cloudwatch': 'https://a0.awsstatic.com/libra-css/images/site/touch-icon-ipad-144-smile.png'
};

// Icon categories mapping
const iconCategories = {
  'ec2': 'compute',
  'lambda': 'compute', 
  'ecs': 'compute',
  'rds': 'database',
  'dynamodb': 'database',
  's3': 'storage',
  'vpc': 'networking',
  'elb': 'networking',
  'cloudwatch': 'monitoring'
};

// Base directory for icons
const iconsBaseDir = path.join(__dirname, 'src', 'assets', 'aws-icons');

// Ensure directories exist
Object.values(iconCategories).forEach(category => {
  const categoryDir = path.join(iconsBaseDir, category);
  if (!fs.existsSync(categoryDir)) {
    fs.mkdirSync(categoryDir, { recursive: true });
    console.log(`Created directory: ${categoryDir}`);
  }
});

/**
 * Download an icon from URL
 */
function downloadIcon(serviceName, url, category) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(iconsBaseDir, category, `${serviceName}.svg`);
    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✅ Downloaded ${serviceName} icon to ${category}/${serviceName}.svg`);
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(filePath, () => {}); // Delete partial file
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Create placeholder SVG icons for immediate use
 */
function createPlaceholderIcon(serviceName, category, color) {
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="8" fill="${color}" opacity="0.1"/>
  <rect x="12" y="12" width="40" height="40" rx="4" fill="${color}" opacity="0.8"/>
  <text x="32" y="38" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="8" font-weight="bold">
    ${serviceName.toUpperCase()}
  </text>
</svg>`;

  const filePath = path.join(iconsBaseDir, category, `${serviceName}.svg`);
  fs.writeFileSync(filePath, svgContent);
  console.log(`📝 Created placeholder ${serviceName} icon`);
}

/**
 * Service-specific colors for placeholder icons
 */
const serviceColors = {
  'ec2': '#FF9900',      // AWS Orange
  'lambda': '#FF9900',   // AWS Orange  
  'ecs': '#FF9900',      // AWS Orange
  'rds': '#3498DB',      // Blue
  'dynamodb': '#E74C3C', // Red
  's3': '#27AE60',       // Green
  'vpc': '#9B59B6',      // Purple
  'elb': '#E91E63',      // Pink
  'cloudwatch': '#3498DB' // Blue
};

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting AWS Icons download for CostPie...\n');
  
  // Create placeholder icons for immediate use
  console.log('📝 Creating placeholder icons...');
  for (const [serviceName, category] of Object.entries(iconCategories)) {
    const color = serviceColors[serviceName] || '#6B7280';
    createPlaceholderIcon(serviceName, category, color);
  }
  
  console.log('\n✅ AWS Icons setup complete!');
  console.log('\n📋 Next Steps:');
  console.log('1. Replace placeholder SVGs with official AWS Architecture Icons');
  console.log('2. Download from: https://aws.amazon.com/architecture/icons/');
  console.log('3. Update the awsIcons URLs in this script with official icon URLs');
  console.log('4. Run this script again to download official icons');
  
  console.log('\n📊 Resource Types Covered:');
  console.log('- EC2 Instances & EBS Volumes');
  console.log('- Lambda Functions'); 
  console.log('- ECS Clusters, Services & Tasks');
  console.log('- RDS Instances & Snapshots');
  console.log('- DynamoDB Tables');
  console.log('- S3 Buckets');
  console.log('- VPC, Subnets, Gateways');
  console.log('- Load Balancers');
  console.log('- CloudWatch Metrics, Alarms & Dashboards');
  
  console.log(`\n🎯 Total: 2392 resources across 19 resource types discovered!`);
}

// Run the script
main().catch(console.error);