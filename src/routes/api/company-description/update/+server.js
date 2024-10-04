import axios from 'axios';
// import { ZONE_ID, CLOUDFLARE_AUTH_KEY, CLOUDFLARE_EMAIL } from '$env/static/private';
import { json } from '@sveltejs/kit';
import db from "../../../../../prisma/db.js";

export async function POST({ request, locals }) {
    const body = await request.json();
    const { description} = body;

    if (!description || description.trim() === '') {
        return json({ message: 'No description! Please enter the description to continue.' }, { status: 400 });
    }
   
    let responseObj = {};
    try {
    
        await db.organization.updateMany({
            where: { id: locals.user.id },
            data: {
                description:description
            }
        });

        responseObj.message = "Company Description updated successfully";
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