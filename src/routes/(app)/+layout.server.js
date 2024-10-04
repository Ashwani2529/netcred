import db from "../../../prisma/db.js";
import { redirect } from '@sveltejs/kit';

export async function load({locals}) {
	const organization = await db.organization.findUnique({
		where: {
			id: locals.user.id
		}
	});

	if (!organization) {
		throw redirect(302, '/logout');
	}
	
	if (!organization.email_verified) {
		throw redirect(302, '/verify-email');
	}
	
	return {
		organization: organization
	};
}