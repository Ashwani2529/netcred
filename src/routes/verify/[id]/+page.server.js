import { redirect } from '@sveltejs/kit';

export function load({ params }) {
	throw redirect(301, 'https://verify.netcredential.com/'+params.id);
}