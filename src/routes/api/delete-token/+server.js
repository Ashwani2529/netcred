import { json } from '@sveltejs/kit';
import db from "../../../../prisma/db.js";

export async function POST({ request, cookies, locals }) {
	const { tokenId } = await request.json();

  await db.token.delete({
		where: {
		  id: tokenId,
      org_id: locals.user.id
		}
	});
	
	return json({ message: 'Success' }, { status: 200 });
}