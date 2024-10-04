import { json } from '@sveltejs/kit';
import db from "../../../../prisma/db.js";
import { customAlphabet } from 'nanoid';
import axios from 'axios';
import FormData from 'form-data';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export async function POST({ request, cookies, locals }) {
	const { group, recipient } = await request.json();
	
	const organization = await db.organization.findUnique({
		where: {
			id: locals.user.id
		}
	});

	const existingCredential = await db.credential.findUnique({
		where: {
		  id: recipient.id
		}
	});
	  
	// Store the existing recipient email
	const oldRecipientEmail = existingCredential.recipient_email;

	// Create Credential
	let generatedCredential = await db.credential.update({
		where: {
			id: recipient.id
		},
		data: {
			updated_at: new Date(),
			recipient_email: recipient.recipient_email,
			recipient_name: recipient.recipient_name,
			extra: recipient.extra,
			issued: new Date(recipient.issued),
			...(recipient.recipient_email !== oldRecipientEmail && { status: 'queued' }),
		}
	});

	if (recipient.recipient_email !== oldRecipientEmail) {
		let recipient_variables = {};
		recipient_variables[generatedCredential.recipient_email] = {
			"name": generatedCredential.recipient_name.split(" ")[0],
			"company": organization.name,
			"credid": generatedCredential.id,
			"group": group.name
		}
		
		// Send email
		let data = new FormData();

		if (organization.whitelabel && organization.whitelabel.active) {
			data.append('from', `${organization.name} <noreply@${organization.whitelabel.email}>`);
		} else {
			data.append('from', `${organization.name} via NetCredential <noreply@mail.netcredential.com>`);
		}
	
		data.append('to', `${generatedCredential.recipient_name} <${generatedCredential.recipient_email}>`)
		data.append('recipient-variables', JSON.stringify(recipient_variables));
	
		if (organization.whitelabel && organization.whitelabel.active) {
			data.append('subject', `${group.name}`);
		} else {
			data.append('subject', `${group.name} from ${organization.name}`);
		}
	
		data.append('template', 'credential');
		data.append('o:tag', organization.name);
		data.append('v:credid', "%recipient.credid%");
		data.append('h:Reply-To', `${organization.name} <${organization.email}>`);
	
		let url = 'https://api.mailgun.net/v3/mail.netcredential.com/messages';
		if (organization.whitelabel && organization.whitelabel.active) {
			url = `https://api.mailgun.net/v3/${organization.whitelabel.email}/messages`;
		}
	
		let config = {
			method: 'post',
			maxBodyLength: Infinity,
			url: url,
			headers: { 
				'Authorization': 'Basic YXBpOjdhOGYzM2YyMmQ5ZDQ3ODg1Zjk1YjU3NDgzN2EyY2E5LTlkZmJlZWNkLTJmNmRmNjk1', 
				...data.getHeaders()
			},
			data: data
		};
	
		try {
			const response = await axios.request(config);
			console.log(response.data);
		} catch (error) {
			console.error('Error:', error);
			return json({ error: "Something went wrong"}, { status: 400 });
		}
	}

	return json({ message: 'Success' }, { status: 200 });
}