import axios from 'axios';
// import { ZONE_ID, CLOUDFLARE_AUTH_KEY, CLOUDFLARE_EMAIL } from '$env/static/private';
import { json } from '@sveltejs/kit';
import db from "../../../../../prisma/db.js";

export async function POST({ request, locals }) {
    const body = await request.json();
    var { custom_hostname_id, host_status } = body;

    if (!custom_hostname_id || custom_hostname_id.trim() === '') {
        return json({ message: 'No custom domain id! Please enter the domain id to continue.' }, { status: 400 });
    }

    const options = {
        method: 'GET',
        url: `https://api.cloudflare.com/client/v4/zones/85e020900baacd4cc374701cc076f3b4/custom_hostnames/${custom_hostname_id}`,
        headers: {
			'Content-Type': 'application/json',
			'X-Auth-Key': 'fdd1017eb2beaaed285b020accd7f2a0ebdaf',
			'X-Auth-Email': 'sathannan@hotmail.com'
		}
    };

    const response = await axios.request(options);
    
    if ( response.status == 200) {
        await db.organization.update({
            where: { id: locals.user.id },
            data: {
                custom_domain_status: response.data.result.status === 'pending' ? -1 : (response.data.result.status === 'active' ? 1 : 0)
            }
        });
        if (response.data.result.status === 'active') {
            await db.whitelabel.create({data: { org_id: locals.user.id, domain: response.data.result.hostname}});
        }
        return json(response.data.result, { status: 200 });
    } else if (response.status == 400) {
        return json(response.data.result, { status: 400});
    } else {
        return json("Internal server error", { status: 500});
    }
}
