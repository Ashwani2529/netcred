import { json } from '@sveltejs/kit';
import db from "../../../../prisma/db.js";
import { customAlphabet } from 'nanoid';
import queue from '$lib/queue.js';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function addYearsToCurrentDate(yearsToAdd) {
	const currentDate = new Date();
	currentDate.setFullYear(currentDate.getFullYear() + yearsToAdd);
	return currentDate;
  }

export async function POST({ request, locals }) {
	const { group, identifier, type, expiry, designId, recipients, description, skills } = await request.json();
	
	const organization = await db.organization.findUnique({
		where: {
			id: locals.user.id
		}
	});

	// Check if organization has enough credits
	if (recipients.length > organization.credits) {
		return json({ error: "You don't have enough credits!"}, { status: 400 });
	}

	const generateGroupId = customAlphabet(alphabet, 28);
	let groupdId = generateGroupId();

	// Create Group
	const createdGroup = await db.group.create({
		data: {
		  id: groupdId,
		  org_id: locals.user.id,
		  name: group,
		  identifier: identifier,
		  type: type,
		  description: description,
		  skills: skills,
		  expiry: expiry,
		  status: 'Created',
		  template: designId,
		  timestamp: new Date(),
		  updated_at: new Date(),
		  total_credentials: recipients.length
		}
	});

	// Create Credential
	const generateCredentialId = customAlphabet(alphabet, 6);
	const generateEventId = customAlphabet(alphabet, 28);

	// Prepare data for bulk credential creation
	const credentialData = recipients.map((recipient) => {
		let issued = new Date();
		let expiryValue = null;

		if (expiry != '-1') expiryValue = addYearsToCurrentDate(parseInt(expiry));
		
		let { name, email, ...extra } = recipient;

		for (const [key, value] of Object.entries(extra)) {
			if (key == '[credential.issued]') {
				issued = new Date(extra[key]);
				delete extra[key];
			} else if (key == '[credential.expiry]') {
				expiryValue = new Date(extra[key]);
				delete extra[key];
			} else {
				extra[key] = value;
			}
		}
	
		return {
			id: `${locals.user.id.substring(0, 4)}${generateCredentialId()}`,
			org_id: locals.user.id,
			group_id: createdGroup.id,
			recipient_email: email,
			recipient_name: name,
			extra,
			status: 'queued',
			created_at: new Date(),
			updated_at: new Date(),
			issued,
			expiry: expiryValue
		};
	});
	
	// Bulk insert credentials
	const createdCredentials = await db.credential.createMany({
		data: credentialData
	});

	// Create jobs for credentials
	const jobPromises = credentialData.map(credential => 
		queue.createJob({ credential: credential.id }).save()
	);
	  
	await Promise.all(jobPromises).catch(console.error);
	
	// Prepare data for bulk event creation
	const eventData = credentialData.map((credential) => {
		return {
			id: generateEventId(),
			org_id: locals.user.id,
			group_id: createdGroup.id,
			credential_id: credential.id,
			event_type: 'credential-issued',
			timestamp: new Date()
		};
	});
	
	// Bulk insert events
	await db.event.createMany({
		data: eventData
	});

    await db.group.update({
		where: {
		  id: createdGroup.id
		},
		data: {
		  status: 'Processed'
		}
	});

	await db.organization.update({
		where: {
		  id: locals.user.id
		},
		data: {
		  credits: {
			decrement: recipients.length
		  }
		}
	});

	return json({ message: 'Success', groupId: createdGroup.id}, { status: 200 });
}