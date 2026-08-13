// svelte.config.js
import adapterStatic from '@sveltejs/adapter-static';
import adapterAuto from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const useStatic = process.env.ADAPTER === 'static';

export default {
    preprocess: vitePreprocess(),
    kit: {
        adapter: useStatic
            ? adapterStatic({ pages: 'build', assets: 'build', fallback: 'index.html' })
            : adapterAuto()
    }
};