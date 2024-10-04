import { json } from '@sveltejs/kit';
import db from "../../../../../prisma/db.js";

export async function GET({ params }) {
	// let view = url.searchParams.get('view');
	const organization = await db.organization.findUnique({
		where: {
		  id: params.id
		}
	});

	// const imageBuffer = Buffer.from(organization.whitelabel.logo, 'base64');

	const base64Data = organization.whitelabel.logo.split(',')[1];

    // Convert the base64 string to a buffer
    const imageBuffer = Buffer.from(base64Data, 'base64');

	return new Response(imageBuffer, {
		status: 200,
		headers: {
			'Content-Type': 'image/png'
		}
	});
}