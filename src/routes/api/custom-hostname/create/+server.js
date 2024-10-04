import axios from 'axios';
// import { ZONE_ID, CLOUDFLARE_AUTH_KEY, CLOUDFLARE_EMAIL } from '$env/static/private';
import { json } from '@sveltejs/kit';
import { writeFile, unlink } from 'fs/promises';
import fs from 'fs';
import db from "../../../../../prisma/db.js";

async function handleCreateHostname(host_name, id) {
	console.log(host_name, id);
	const options = {
		method: 'POST',
		url: `https://api.cloudflare.com/client/v4/zones/85e020900baacd4cc374701cc076f3b4/custom_hostnames`,
		headers: {
			'Content-Type': 'application/json',
			'X-Auth-Key': 'fdd1017eb2beaaed285b020accd7f2a0ebdaf',
			'X-Auth-Email': 'sathannan@hotmail.com'
		},
		data: {
			hostname: host_name,
			ssl: {
				method: 'txt',
				settings: {
					ciphers: ['ECDHE-RSA-AES128-GCM-SHA256', 'AES128-SHA'],
					early_hints: 'on',
					http2: 'on',
					min_tls_version: '1.2',
					tls_1_3: 'on'
				},
				type: 'dv',
				wildcard: false
			}
		}
	};

	try {
		const response = await axios.request(options);
		const customDomainData = response.data;

		await db.organization.updateMany({
			where: {
				id: id
			},
			data: {
				custom_domain_id: customDomainData.result.id,
				custom_domain_name: customDomainData.result.hostname,
				custom_domain_status: customDomainData.result.status === 'pending' ? -1 : (customDomainData.result.status === 'verified' ? 1 : 0)
			}
		});

		return { message: 'Domain created successfully', status: 201 };
	} catch (error) {
		console.log("API Error: ", error, "<<<-------->>>>");

		if (error.response && error.response.data && error.response.data.errors) {
			return { message: error.response.data.errors[0].message, status: error.response.status };
		} else {
			return { message: 'Failed to set the custom domain! Internal server error.', status: 500 };
		}
	}
}

export async function POST({ request, cookies, locals }) {
	const body = await request.json();
	let { host_name } = body;
	let customDomainData = null;

	if (!host_name || host_name.trim() === '') {
		return json({ message: 'Custom domain name field is blank! Please enter the domain name to continue.' }, { status: 400 });
	}

	host_name = host_name.toLowerCase();
	
// 	if (fs.existsSync(filePath)) {
// 		customDomainData = fs.readFileSync(filePath, 'utf-8') || null;
// 		let custom_hostname_id = JSON.parse(customDomainData).result.id;
// 		let host_name_in_file = JSON.parse(customDomainData).result.hostname;

// 		if (host_name_in_file !== host_name) {
// 			let allCookies = cookies.getAll();
// 			let token = allCookies[4]['value'];
// 			const headers = {
// 				'Authorization': `${token}`,
// 				'Content-Type': 'application/json'
// 			};

// 			await axios.post('http://localhost:5173/api/custom-hostname/delete', { custom_hostname_id }, { headers });
// 			await unlink(filePath);
// 			let response = await handleCreateHostname(host_name, whitelabelId);
// 			console.log("Response.message  " + response.message);
// 			return json({ message: response.message }, { status: response.status });
// 		} else {
// 			return json({ message: 'Same Domain name already exist.' }, { status: 200 });
// 		}
// 	} else {
// 		let response = await handleCreateHostname(host_name, whitelabelId);
// 		return json({ message: response.message }, { status: response.status });
// 	}
// }

const customDomain = await db.organization.findFirst({
	where: {
		custom_domain_name: host_name,
		id: locals.user.id
	}
  });

  if (customDomain == null) {
		let allCookies = cookies.getAll();
		let token = allCookies[4]['value'];
		const headers = {
			'Authorization': `${token}`,
			'Content-Type': 'application/json'
		};
		const customDomains = await db.organization.findUnique({
			where : {
				id: locals.user.id
			},
			select: {
				custom_domain_name: true
			}
		  });
		
		if (customDomains.length > 0) {
			await axios.post('http://localhost:5173/api/custom-hostname/delete', { custom_hostname_id }, { headers });
		}
		let response = await handleCreateHostname(host_name, locals.user.id); // Passing locals.user.id correctly
		return json({ message: response.message }, { status: response.status });
	} else {
		return json({ message: 'Same Domain already exists.' }, { status: 200 });	
	}
}
