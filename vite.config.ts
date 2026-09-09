import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // base relativo: necesario cuando el build se empaqueta dentro de la app nativa (Capacitor)
  base: './',
  server: {
    host: true, // permite abrirlo desde el celular en la misma red: http://<tu-ip>:5173
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
