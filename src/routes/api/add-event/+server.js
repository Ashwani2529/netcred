import { json } from '@sveltejs/kit';
import db from "../../../../prisma/db.js";
import { customAlphabet } from 'nanoid';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export async function POST({ request, cookies, locals }) {
	const { cred_id, group_id, org_id, referrer } = await request.json();

	const userAgent = request.headers.get('user-agent');
  const ip = request.headers.get('x-real-ip') || request.headers.get('X-Forwarded-For') || null;

  const generateEventId = customAlphabet(alphabet, 28);
	
	await db.event.create({
        data: {
          id: generateEventId(),
          org_id: org_id,
          group_id: group_id,
          credential_id: cred_id,
          event_type: 'credential-engaged',
          user_ip: ip,
          user_agent: userAgent,
          referrer_url: referrer,
          timestamp: new Date()
        }
    });

	return json({ message: 'Success' }, { status: 200 });
}