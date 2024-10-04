import { json } from '@sveltejs/kit';
import db from "../../../../prisma/db.js";
import { customAlphabet } from 'nanoid';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

const generateDesignId = customAlphabet(alphabet, 32);

export async function POST({ request, cookies, locals }) {

	const { designId } = await request.json();

	const design = await db.design.findUnique({
		where: {
			id: designId
		}
	});
	
	design.id = generateDesignId();
	if (design.timestamp) delete design.timestamp;
	if (design.updated) delete design.updated;
	
	design.name = `${design.name} - Copy`;
	

	await db.design.create({
		data: design
	});

	return json({ message: 'Success' }, { status: 200 });
}