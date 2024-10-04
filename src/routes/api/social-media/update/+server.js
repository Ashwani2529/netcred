import axios from 'axios';
import { json } from '@sveltejs/kit';
import db from "../../../../../prisma/db.js";

export async function POST({ request, locals }) {
    const body = await request.json();
    const { selectedSocialMedia, socialMediaLink } = body;

    if (!selectedSocialMedia || selectedSocialMedia.trim() === '') {
        return json({ message: 'No Social Media! Please select the Social Media to continue.' }, { status: 400 });
    } else if (!socialMediaLink || socialMediaLink.trim() === '') {
        return json({ message: 'No Social Media Link! Please enter the Social Media Link to continue.' }, { status: 400 });
    }

    let responseObj = {};
    try {
        const organization = await db.organization.findUnique({
            where: { id: locals.user.id },
            select: { social_media_links: true }
        });

        let socialMediaLinks = organization.social_media_links || {
            "LinkedIn": "",
            "Instagram": "",
            "Facebook": "",
            "Twitter": ""
        };

        socialMediaLinks[selectedSocialMedia] = socialMediaLink;

        await db.organization.update({
            where: { id: locals.user.id },
            data: {
                social_media_links: socialMediaLinks
            }
        });

        responseObj.message = "Social Media updated successfully";
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
        return json(responseObj, { status: responseObj.status });
    }
}
