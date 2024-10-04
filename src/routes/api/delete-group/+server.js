import { json } from '@sveltejs/kit';
import db from "../../../../prisma/db.js";

export async function POST({ request, cookies, locals }) {
	const { group } = await request.json();

	console.log(group);

	await db.event.deleteMany({
		where: {
			group_id: group
		}
	});

	await db.group.delete({
		where: {
		  id: group
		}
	});

	return json({ message: 'Success' }, { status: 200 });
}