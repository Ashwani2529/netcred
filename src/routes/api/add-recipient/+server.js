import { json } from '@sveltejs/kit';
import db from "../../../../prisma/db.js";
import { customAlphabet } from 'nanoid';
import axios from 'axios';
import FormData from 'form-data';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

const getRootDomain = url => ((url.match(/:\/\/(www[0-9]?\.)?(.[^/:]+)/i) || [])[2] || '').split('.').slice(-2).join('.');

function addYearsToCurrentDate(yearsToAdd) {
	const currentDate = new Date();
	currentDate.setFullYear(currentDate.getFullYear() + yearsToAdd);
	return currentDate;
}

export async function POST({ request, cookies, locals }) {
	const { group, recipient } = await request.json();
	
	const organization = await db.organization.findUnique({
		where: {
			id: locals.user.id
		}
	});

	const _group = await db.group.findUnique({
		where: {
			id: group.id
		}
	});

	// Check if organization has enough credits
	if (organization.credits < 1) {
		return json({ error: "You don't have enough credits!"}, { status: 400 });
	}

	// Create Credential
	const generateCredentialId = customAlphabet(alphabet, 6);
	const generateEventId = customAlphabet(alphabet, 28);

	let expiryValue = null;

	if (_group.expiry != '-1' && _group.expiry != null) expiryValue = addYearsToCurrentDate(parseInt(_group.expiry));

	// console.log(recipient, _group, expiryValue);

	let generatedCredential = await db.credential.create({
		data: {
		  id: locals.user.id.substring(0, 4) + generateCredentialId(),
		  org_id: locals.user.id,
		  group_id: group.id,
		  recipient_email: recipient.recipient_email,
		  recipient_name: recipient.recipient_name,
		  extra: recipient.extra,
		  status: 'queued',
		  created_at: new Date(),
		  updated_at: new Date(),
		  issued: new Date(recipient.issued),
		  expiry: expiryValue
		}
	});

	await db.event.create({
		data: {
		  id: generateEventId(),
		  org_id: locals.user.id,
		  group_id: group.id,
		  credential_id: generatedCredential.id,
		  event_type: 'credential-issued',
		  timestamp: new Date()
		}
	});

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

	data.append('template', 'internship'); 
	// data.append('template', 'credential');
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

	// Update total_credentials
    await db.group.update({
		where: {
		  id: group.id
		},
		data: {
		  total_credentials: {
			increment: 1
		  }
		}
	});

	// Update the credits of the organization
	const updatedOrganization = await db.organization.update({
		where: {
		  id: locals.user.id
		},
		data: {
		  credits: {
			decrement: 1
		  }
		}
	});

	return json({ message: 'Success' }, { status: 200 });
}