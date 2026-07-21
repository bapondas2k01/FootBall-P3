import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  base: "",
  server: {
    host: "::",
    port: 8080,
    hmr: false,
  },
  plugins: [],
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Separate vendor chunks
          if (id.includes("node_modules/phaser")) {
            return "phaser-vendor"
          }
          // Separate scene chunks
          if (id.includes("scenes/StartScene")) {
            return "scene-start"
          }
          if (id.includes("scenes/GameScene")) {
            return "scene-game"
          }
          if (id.includes("scenes/VictoryScene")) {
            return "scene-victory"
          }
        },
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
      },
    },
  },
})
