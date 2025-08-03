import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Configuration for standalone web build (no server)
export default defineConfig({
  base: "./", // Use relative paths for standalone deployment
  build: {
    outDir: "dist/web",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
      },
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          ui: [
            "@radix-ui/react-tabs",
            "@radix-ui/react-select",
            "@radix-ui/react-dialog",
          ],
          utils: ["jspdf", "xlsx", "date-fns"],
        },
      },
    },
    target: "esnext",
    minify: "terser",
    sourcemap: false,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  define: {
    // Define environment variables for standalone mode
    __STANDALONE_MODE__: true,
  },
  optimizeDeps: {
    include: ["react", "react-dom", "jspdf", "xlsx"],
  },
});
