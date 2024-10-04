import { json } from '@sveltejs/kit';
import crypto from 'node:crypto';
import db from "../../../../prisma/db.js";

const signingKey = "7a8f33f22d9d47885f95b574837a2ca9-9dfbeecd-2f6df695";

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

const verify = ({ token, timestamp, signature }) => {
	const encodedToken = crypto.createHmac('sha256', signingKey).update(timestamp.concat(token)).digest('hex')
	return (encodedToken === signature)
}

export async function POST({ request }) {
	const event = await request.json();
	
	if (!verify(event.signature)) {
		return json({ error: "Unauthorized"}, { status: 401 });
	}

	let eventData = event["event-data"];

	let credId = eventData["user-variables"]["credid"];
	let status = eventData["event"]; // delivered, opened, clicked, permanent_fail

	const updateData = {};

	if (status === 'delivered') {
		updateData.delivered_at = new Date();
		updateData.status = 'published';
	} else if (status === 'opened') {
		updateData.opened_at = new Date();
	} else if (status === 'clicked') {
		updateData.clicked_at = new Date();
	} else if (status == 'permanent_fail') {
		updateData.status = 'failed';
	} else if (status == 'failed') {
		updateData.status = 'failed';
	}

	// Update Credential
	await db.credential.update({
		where: {
			id: credId
		},
		data: updateData
	});

	return json({ status: 'success' }, { status: 200 });
}