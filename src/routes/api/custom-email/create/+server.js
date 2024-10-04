import axios from 'axios';
// import { MAILGUN_EMAIL, MAILGUN_PASSWORD } from '$env/static/private';
import { json } from '@sveltejs/kit';
import { writeFile, unlink } from 'fs/promises';
import fs from 'fs';
import FormData from 'form-data';
import db from "../../../../../prisma/db.js";
import { log } from 'console';


async function handleCreateDomain(domain_name, id) {
	// console.log(domain_name, id);
	let data = new FormData();
	data.append('name', domain_name);
	const options = {
		method: 'POST',
		maxBodyLength: Infinity,
		url: `https://api.mailgun.net/v4/domains`,
		headers: {
			Authorization: 'Basic YXBpOjdhOGYzM2YyMmQ5ZDQ3ODg1Zjk1YjU3NDgzN2EyY2E5LTlkZmJlZWNkLTJmNmRmNjk1',
			'Content-Type': 'multipart/form-data'
		},
		data: data
	};

	try {
		const response = await axios.request(options);
		const customEmailData = response.data;
		// console.log(customEmailData);

		// await writeFile('customEmail.json', JSON.stringify(customEmailData, null, 2));

		// Parse and validate created_at date using new Date()
		// const domainCreatedAt = new Date(customEmailData.domain.created_at);

		let extractedRecord = customEmailData.sending_dns_records.find(record => record.value.startsWith('k=rsa'));

		await db.organization.update({
			where: {
				id: id
			},
			data: {
				custom_email_id: customEmailData.domain.id,
				custom_email_name: customEmailData.domain.name,
				custom_email_dkim_host: extractedRecord.name,
				custom_email_dkim_value: extractedRecord.value,
				custom_email_state: customEmailData.domain.state === 'unverified' ? -1 : (customEmailData.domain.state === 'verified' ? 1 : 0)
			}
		});
		return { message: 'Email created successfully', status: 201 };
	} catch (error) {
		console.log("API Error: ", error, "<<<-------->>>>");
		if (error.response && error.response.data && error.response.data.errors) {
			return { message: error.response.data.errors[0].message, status: error.response.status };
		} else {
			return { message: 'Failed to set the custom email! Internal server error.', status: 500 };
		}
	}
}

export async function POST({ request, cookies, locals }) {
	const body = await request.json();
	let { domain_name } = body;

	if (!domain_name || domain_name.trim() === '') {
		return json({ message: 'Custom email field is blank! Please enter the email to continue.' }, { status: 400 });
	}

	// Ensure domain_name is in lowercase
	domain_name = domain_name.toLowerCase();

	// const filePath = 'customEmail.json';
	// let customEmailData = null;

	// if (fs.existsSync(filePath)) {
	// 	customEmailData = fs.readFileSync(filePath, 'utf-8') || null;
	// 	let domain_name_in_file = JSON.parse(customEmailData).domain.name;

	// 	if (domain_name_in_file !== domain_name) {
	// 		let allCookies = cookies.getAll();
	// 		let token = allCookies[4]['value'];
	// 		const headers = {
	// 			'Authorization': `${token}`,
	// 			'Content-Type': 'application/json'
	// 		};

	// 		await axios.post('http://localhost:5173/api/custom-email/delete', { domain_name: domain_name_in_file }, { headers });
	// 		await unlink(filePath);

	// 		let response = await handleCreateDomain(domain_name, locals.user.id); // Passing locals.user.id correctly
	// 		return json({ message: response.message }, { status: response.status });
	// 	} else {
	// 		return json({ message: 'Same Email already exists.' }, { status: 200 });
	// 	}
	// } else {
	// 	let response = await handleCreateDomain(domain_name, locals.user.id); // Passing locals.user.id correctly
	// 	return json({ message: response.message }, { status: response.status });
	// }

	// -- Database Integration--

	const customEmail = await db.organization.findFirst({
		where: {
			custom_email_name: domain_name,
			id: locals.user.id
		}
	  });
	
	  if (customEmail == null) {
			let allCookies = cookies.getAll();
			let token = allCookies[4]['value'];
			const headers = {
				'Authorization': `${token}`,
				'Content-Type': 'application/json'
			};
			const customEmails = await db.organization.findUnique({
				where : {
					id: locals.user.id
				},
				select: {
					custom_email_name: true
				}
			  });
			// console.log(customEmails,"--result--");
			if (customEmails.length > 0) {
				await axios.post('/api/custom-email/delete', { domain_name: customEmails[0].custom_email_name }, { headers });
			}
			// console.log(domain_name,"--domain_name--");
			let response = await handleCreateDomain(domain_name, locals.user.id); // Passing locals.user.id correctly
			return json({ message: response.message }, { status: response.status });
		} else {
			return json({ message: 'Same Email already exists.' }, { status: 200 });	
		}
}
