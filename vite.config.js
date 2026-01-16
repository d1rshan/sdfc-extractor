import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

// Custom plugin to copy non-built files to dist
const copyExtensionsFiles = () => {
  return {
    name: 'copy-extension-files',
    closeBundle: async () => {
      const filesToCopy = [
        { src: 'manifest.json', dest: 'dist/manifest.json' },
        { src: 'service-worker.js', dest: 'dist/service-worker.js' },
      ];
      
      const dirsToCopy = [
        { src: 'content', dest: 'dist/content' }
      ];

      if (!fs.existsSync('dist')) {
        fs.mkdirSync('dist');
      }

      for (const file of filesToCopy) {
        fs.copyFileSync(file.src, file.dest);
      }

      for (const dir of dirsToCopy) {
        fs.cpSync(dir.src, dir.dest, { recursive: true });
      }
      
      console.log('Extensions files copied to dist/');
    }
  };
};

export default defineConfig({
  plugins: [react(), copyExtensionsFiles()],
  root: 'src', // Set root to src so it finds index.html there
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  }
});
