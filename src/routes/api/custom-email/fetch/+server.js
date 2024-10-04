import axios from 'axios';
// import { MAILGUN_EMAIL, MAILGUN_PASSWORD } from '$env/static/private';
import { json } from '@sveltejs/kit';
import db from "../../../../../prisma/db.js";


export async function POST({ request, locals }) {
    const body = await request.json();
    var { domain_name, email_status } = body;
    console.log("domain_name " + domain_name);
    console.log("email_status " + email_status);

    if (!domain_name || domain_name.trim() === '') {
        return json({ message: 'No custom domain name! Please enter the domain name to continue.' }, { status: 400 });
    }

    const options = {
        method: 'GET',
        url: `https://api.mailgun.net/v3/domains/${domain_name}`,
        headers: {
            Authorization: 'Basic YXBpOjdhOGYzM2YyMmQ5ZDQ3ODg1Zjk1YjU3NDgzN2EyY2E5LTlkZmJlZWNkLTJmNmRmNjk1'
        },
    };

    const response = await axios.request(options);

    if ( response.status == 200) {
        await db.organization.update({
            where: { id: locals.user.id },
            data: {
                custom_email_state: response.data.domain.state === 'unverified' ? -1 : (response.data.domain.state === 'active' ? 1 : 0)
            }
        });
        return json(response.data.domain, { status: 200 });
    } else if (response.status == 400) {
        return json(response.data.domain, { status: 400});
    } else {
        return json("Internal server error", { status: 500});
    } 
}

