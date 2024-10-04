import { json } from '@sveltejs/kit';
import db from "../../../../prisma/db.js";

export async function POST({ request, cookies, locals }) {
	const { group, recipient } = await request.json();

	await db.event.deleteMany({
		where: {
			credential_id: recipient
		}
	});

	await db.credential.delete({
		where: {
		  id: recipient
		}
	});

	// Update total_credentials
    await db.group.update({
		where: {
		  id: group
		},
		data: {
		  total_credentials: {
			decrement: 1
		  }
		}
	});

	return json({ message: 'Success' }, { status: 200 });
}