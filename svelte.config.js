import preprocess from "svelte-preprocess";
// import adapter from "@sveltejs/adapter-auto";
import adapter from '@sveltejs/adapter-node';
import node from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({ out: 'build' }),
    adapter: node({
      // Configure fetch timeout here (in milliseconds)
      fetchOptions: {
        timeout: 120000 // Set a timeout of 2 minutes
      }
    })
  },
  preprocess: [
    preprocess({
      postcss: true,
    }),
  ],
};

export default config;
