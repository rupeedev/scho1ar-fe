
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  console.log(`Building in ${mode} mode`);

  return {
    server: {
      host: "::",
      port: 8080,
      allowedHosts: [
        "costpie.onrender.com",
        ".onrender.com",
        ".lovableproject.com",
        "21468d48-8668-4a39-b0b4-5b481128da49.lovableproject.com",
        "costpie.educa1ion.com"
      ],
    },
    preview: {
      host: "::",
      port: 8080,
      allowedHosts: [
        "costpie.onrender.com",
        ".onrender.com",
        ".lovableproject.com",
        "21468d48-8668-4a39-b0b4-5b481128da49.lovableproject.com",
        "costpie.educa1ion.com"
      ],
    },
    build: {
      outDir: "dist",
      minify: true,
      sourcemap: mode === 'development',
      emptyOutDir: true,
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
