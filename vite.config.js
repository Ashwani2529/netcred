import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		// Serve static files using Vite's fsServe option
		fsServe: {
		  // Define the list of directories to serve static files from
		  // You can specify multiple directories if needed
		  root: 'static'
		}
	  }
});
