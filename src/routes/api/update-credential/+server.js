import { json } from '@sveltejs/kit';
import db from "../../../../prisma/db.js";
import { customAlphabet } from 'nanoid';
import axios from 'axios';
import FormData from 'form-data';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export async function POST({ request, cookies, locals }) {
	const { groupId, designId } = await request.json();

	// Retrieve design from Canva
	let template;
	try {
		let data = JSON.stringify({
			"design": `https://www.canva.com/design/${designId}/view`,
			"group": groupId
		});
		
		let config = {
			method: 'post',
			maxBodyLength: Infinity,
			url: 'https://us-central1-netcredential-22f17.cloudfunctions.net/generatetemplate',
			headers: { 
				'Content-Type': 'application/json'
			},
			data: data
		};

		const response = await axios.request(config);
		console.log(response.data);
		template = response.data.template;
	} catch (error) {
		console.log(error);
		return json({ error: "Design retrieval failed. Please recheck and retry."}, { status: 400 });
	}

	await db.group.update({
		where: {
		  id: groupId
		},
		data: {
		  template: template,
		  updated_at: new Date()
		}
	});

	return json({ message: 'Success', groupId: groupId}, { status: 200 });
}