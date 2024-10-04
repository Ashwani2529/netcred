import axios from 'axios';
// import { ZONE_ID, CLOUDFLARE_AUTH_KEY, CLOUDFLARE_EMAIL } from '$env/static/private';
import { json } from '@sveltejs/kit';
import db from "../../../../../prisma/db.js";

export async function POST({ request, locals }) {
    const body = await request.json();
    const { terms, privacy_policy,contact,faq } = body;

    if (!terms || terms.trim() === '') {
        return json({ message: 'No terms! Please enter the terms to continue.' }, { status: 400 });
    }
    else if (!privacy_policy || privacy_policy.trim() === '') {
        return json({ message: 'No privacy policy! Please enter the privacy policy to continue.' }, { status: 400 });
    }
    else if (!contact || contact.trim() === '') {
        return json({ message: 'No terms! Please enter the terms to continue.' }, { status: 400 });
    }
    else if (!faq || faq.trim() === '') {
        return json({ message: 'No faq! Please enter the faq to continue.' }, { status: 400 });
    }
    let responseObj = {};
    try {
    
        await db.organization.updateMany({
            where: { id: locals.user.id },
            data: {
                basic_details:{
                    "terms":terms,
                    "privacy_policy":privacy_policy,
                    "contact":contact,
                    "faq":faq
                }
            }
        });

        responseObj.message = "Basic Details updated successfully";
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