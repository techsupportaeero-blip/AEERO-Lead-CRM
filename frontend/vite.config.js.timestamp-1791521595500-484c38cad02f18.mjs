// vite.config.js
import { defineConfig, loadEnv } from "file:///C:/Users/pc/OneDrive%20-%20Urbanites%20Technologies/Desktop/ALL%20Things/crm%20lead%20aeero/AEERO%20lead%20managmentor/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/pc/OneDrive%20-%20Urbanites%20Technologies/Desktop/ALL%20Things/crm%20lead%20aeero/AEERO%20lead%20managmentor/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const port = parseInt(env.PORT || "3000", 10);
  return {
    plugins: [react()],
    server: {
      port,
      proxy: {
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true
        },
        "/socket.io": {
          target: "http://localhost:3001",
          ws: true
        }
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxwY1xcXFxPbmVEcml2ZSAtIFVyYmFuaXRlcyBUZWNobm9sb2dpZXNcXFxcRGVza3RvcFxcXFxBTEwgVGhpbmdzXFxcXGNybSBsZWFkIGFlZXJvXFxcXEFFRVJPIGxlYWQgbWFuYWdtZW50b3JcXFxcZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXHBjXFxcXE9uZURyaXZlIC0gVXJiYW5pdGVzIFRlY2hub2xvZ2llc1xcXFxEZXNrdG9wXFxcXEFMTCBUaGluZ3NcXFxcY3JtIGxlYWQgYWVlcm9cXFxcQUVFUk8gbGVhZCBtYW5hZ21lbnRvclxcXFxmcm9udGVuZFxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvcGMvT25lRHJpdmUlMjAtJTIwVXJiYW5pdGVzJTIwVGVjaG5vbG9naWVzL0Rlc2t0b3AvQUxMJTIwVGhpbmdzL2NybSUyMGxlYWQlMjBhZWVyby9BRUVSTyUyMGxlYWQlMjBtYW5hZ21lbnRvci9mcm9udGVuZC92aXRlLmNvbmZpZy5qc1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZywgbG9hZEVudiB9IGZyb20gJ3ZpdGUnXG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnXG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XG4gIGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSwgJycpO1xuICBjb25zdCBwb3J0ID0gcGFyc2VJbnQoZW52LlBPUlQgfHwgJzMwMDAnLCAxMCk7XG5cbiAgcmV0dXJuIHtcbiAgICBwbHVnaW5zOiBbcmVhY3QoKV0sXG4gICAgc2VydmVyOiB7XG4gICAgICBwb3J0LFxuICAgICAgcHJveHk6IHtcbiAgICAgICAgJy9hcGknOiB7XG4gICAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDozMDAxJyxcbiAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgICcvc29ja2V0LmlvJzoge1xuICAgICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMScsXG4gICAgICAgICAgd3M6IHRydWUsXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn0pXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWlpQixTQUFTLGNBQWMsZUFBZTtBQUN2a0IsT0FBTyxXQUFXO0FBR2xCLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBQ3hDLFFBQU0sTUFBTSxRQUFRLE1BQU0sUUFBUSxJQUFJLEdBQUcsRUFBRTtBQUMzQyxRQUFNLE9BQU8sU0FBUyxJQUFJLFFBQVEsUUFBUSxFQUFFO0FBRTVDLFNBQU87QUFBQSxJQUNMLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxJQUNqQixRQUFRO0FBQUEsTUFDTjtBQUFBLE1BQ0EsT0FBTztBQUFBLFFBQ0wsUUFBUTtBQUFBLFVBQ04sUUFBUTtBQUFBLFVBQ1IsY0FBYztBQUFBLFFBQ2hCO0FBQUEsUUFDQSxjQUFjO0FBQUEsVUFDWixRQUFRO0FBQUEsVUFDUixJQUFJO0FBQUEsUUFDTjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
