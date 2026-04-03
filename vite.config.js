import { defineConfig } from 'vite';

export default defineConfig({
    base: '/MyWebsite/',
    build: {
        outDir: 'dist',
        assetsDir: 'assets'
    }
});
