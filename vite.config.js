import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/postcss';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [sveltekit()],
    css: {
      postcss: {
        plugins: [tailwindcss],
      },
    },
    server: {
      proxy: {
        '/api': {
          target: env.PUBLIC_API_BASE_URL || 'http://localhost:8080',
          changeOrigin: true,
        },
        '/auth': {
          target: env.PUBLIC_API_BASE_URL || 'http://localhost:8080',
          changeOrigin: true,
        }
      }
    }
  };
});