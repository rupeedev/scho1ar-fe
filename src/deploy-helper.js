
// This file is a helper to ensure proper builds during deployment
console.log("Deployment helper initialized");
console.log("Using local path to node_modules for Vite commands");
console.log("Current working directory:", process.cwd());
console.log("Node version:", process.version);
console.log("Checking for vite installation...");

try {
  // Try to require vite to check if it's installed
  require.resolve('vite');
  console.log("✅ Vite is properly installed and accessible");
} catch (error) {
  console.error("❌ Vite is not accessible:", error.message);
  console.log("This might cause build failures. Make sure vite is installed correctly.");
}
