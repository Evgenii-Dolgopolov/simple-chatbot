import { defineConfig } from 'vite';
import replace from '@rollup/plugin-replace';

export default defineConfig({
  plugins: [
    replace({
      'process.env.VITE_POLYGON_API_KEY': JSON.stringify(process.env.VITE_POLYGON_API_KEY),
      'process.env.VITE_OPENAI_API_KEY': JSON.stringify(process.env.VITE_OPENAI_API_KEY),
    }),
  ],
});
