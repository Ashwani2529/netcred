import { redirect } from '@sveltejs/kit';

export function load() {
	throw redirect(301, 'https://verify.netcredential.com');
}