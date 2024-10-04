import axios from 'axios';
// import { ZONE_ID, CLOUDFLARE_AUTH_KEY, CLOUDFLARE_EMAIL } from '$env/static/private';
import { json } from '@sveltejs/kit';
import db from "../../../../../prisma/db.js";

export async function POST({ request, locals }) {
    const body = await request.json();
    const { custom_hostname_id, action } = body;

    if (!custom_hostname_id || custom_hostname_id.trim() === '') {
        return json({ message: 'No custom domain id! Please enter the domain id to continue.' }, { status: 400 });
    }

    const options = {
        method: 'DELETE',
        url: `https://api.cloudflare.com/client/v4/zones/85e020900baacd4cc374701cc076f3b4/custom_hostnames/${custom_hostname_id}`,
        headers: {
			'Content-Type': 'application/json',
			'X-Auth-Key': 'fdd1017eb2beaaed285b020accd7f2a0ebdaf',
			'X-Auth-Email': 'sathannan@hotmail.com'
		}
    };

    let responseObj = {};

    try {
        const response = await axios.request(options);
        await db.organization.updateMany({
            where: { id: locals.user.id },
            data: {
                custom_domain_id: null,
                custom_domain_name: null,
                custom_domain_status: 0
            }
        });
        responseObj.message = "Domain deleted successfully";
        responseObj.status = 200;
    } catch (error) {
        if (error.response && error.response.data && error.response.data.errors) {
            responseObj.message = error.response.data.errors[0].message;
            responseObj.status = error.response.status;
        } else {
            responseObj.message = 'An error occurred while processing your request.';
            responseObj.status = 500;
        }
    } finally {
        responseObj.message = responseObj.message || 'Failed to fetch response.';
        return json(responseObj, { status: 200 });
    }
}