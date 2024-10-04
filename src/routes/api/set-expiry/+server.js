import { json } from '@sveltejs/kit';
import db from "../../../../prisma/db.js";

export async function POST({ request, locals }) {

	const { credential, whenExpiry, expiry } = await request.json();

	if (whenExpiry == 'immediate') {
		await db.credential.update({
			where: {
				id: credential.id,
				org_id: locals.user.id
			},
			data: {
				status: 'expired',
				expiry: new Date()
			}
		});
	} else if (whenExpiry == 'never') {
		await db.credential.update({
			where: {
				id: credential.id,
				org_id: locals.user.id
			},
			data: {
				status: 'published',
				expiry: null
			}
		});
	} else {
		await db.credential.update({
			where: {
				id: credential.id,
				org_id: locals.user.id
			},
			data: {
				expiry: new Date(expiry)
			}
		});
	}

	return json({ message: 'Success' }, { status: 200 });
}