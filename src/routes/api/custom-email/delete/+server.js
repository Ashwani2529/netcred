import axios from 'axios';
// import { MAILGUN_EMAIL, MAILGUN_PASSWORD } from '$env/static/private';
import { json } from '@sveltejs/kit';
import { unlink } from 'fs/promises';
import db from "../../../../../prisma/db.js";


export async function POST({ request,locals }) {
    const body = await request.json();
    const { domain_name, action } = body;
    console.log("domain name "+ domain_name)

    if (!domain_name || domain_name.trim() === '') {
        return json({ message: 'No email ! Please enter the email to continue.' }, { status: 400 });
    }
	
    const options = {
        method: 'DELETE',
        url: `https://api.mailgun.net/v3/domains/${domain_name}`,
        headers: {
			Authorization: 'Basic YXBpOjdhOGYzM2YyMmQ5ZDQ3ODg1Zjk1YjU3NDgzN2EyY2E5LTlkZmJlZWNkLTJmNmRmNjk1'
		},
    };

	let responseObj = {};
	
    try {
        const response = await axios.request(options);
        console.log(response,"--delete-Email-Api-Response-");
        await db.organization.updateMany({
            where: { id: locals.user.id },
            data: {
                custom_email_id: null,
                custom_email_name: null,
                custom_email_state: 0
            }
        });
        
        responseObj.message = "Email deleted successfully.";
        
		responseObj.status = 200;
    } catch (error) {
        if (error.response && error.response.data && error.response.data.message) {
            responseObj.message = error.response.data.message; 
            responseObj.status = error.response.status;
        } else {
            responseObj.message = 'An error occurred while processing your request.';
            responseObj.status = 500;
        }
    } finally {
        responseObj.message = responseObj.message || 'Failed to fetch response.';
        return json(responseObj, { status: responseObj.status });
    }
}
