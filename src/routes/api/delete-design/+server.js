import { json } from '@sveltejs/kit';
import db from "../../../../prisma/db.js";

export async function POST({ request, cookies, locals }) {

	const { designId } = await request.json();

	const groups = await db.group.findMany({
		where: {
		  template: designId
		}
	});

	if (groups && groups.length > 0) {
		return json({ message: 'Used', groups: groups.length }, { status: 200 });
	} else {
		await db.design.delete({
			where: {
			  id: designId,
			  org_id: locals.user.id
			}
		});
	
		return json({ message: 'Success' }, { status: 200 });
	}
}