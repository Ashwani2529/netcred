import db from "../../../../prisma/db.js";
import { trackEvent } from '$lib/server/segment.js';
import fs from 'fs';

export async function load({locals}) {
    const customDomainFilePath = 'customDomain.json';
    const custEmailFilePath = 'customEmail.json';
    let custom_domain_data = {};
    let custom_email_data = {};

	// if (fs.existsSync(customDomainFilePath)) {
    //     let customDomainFile = fs.readFileSync(customDomainFilePath, 'utf-8') || null;
    //     custom_domain_data = JSON.parse(customDomainFile).result;
    // }

    // if (fs.existsSync(custEmailFilePath)) {
    //     let customEmailFile = fs.readFileSync(custEmailFilePath, 'utf-8') || null;
    //     custom_email_data = JSON.parse(customEmailFile);
    // }

    let org_data = await db.organization.findUnique({
        where: { id: locals.user.id }
    });

	return {
        orgData: org_data,
	};
}


export const actions = {
	default: async ({ request, locals }) => {
        try {
            const formData = Object.fromEntries(await request.formData());
            if (formData?.verified) formData.verified = parseInt(formData.verified);
            if (!formData?.logo) delete formData.logo;
            delete formData.email;
            await db.organization.update({
                where: {
                    id: locals.user.id
                },
                data: formData
            });
            trackEvent(locals.user.id, 'profile-updated', formData);
            return { success: true };
        } catch (error) {
            return {
                status: 500,
                body: {
                    status: 'error',
                    error: error.message
                }
            }
        }
	}
};