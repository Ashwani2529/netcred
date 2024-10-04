import { redirect } from '@sveltejs/kit';

export function load({ cookies }) {
	cookies.delete("AuthorizationToken");
    throw  redirect(302, "/login");
}