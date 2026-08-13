// svelte.config.js
import adapterStatic from '@sveltejs/adapter-static';
import adapterVercel from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const useStatic = process.env.ADAPTER === 'static';

export default {
    preprocess: vitePreprocess(),
    kit: {
        adapter: useStatic
            ? adapterStatic({ pages: 'build', assets: 'build', fallback: 'index.html' })
            : adapterVercel()
    }
};