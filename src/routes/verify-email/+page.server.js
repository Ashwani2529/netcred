import { redirect, fail } from '@sveltejs/kit';
import db from "../../../prisma/db.js";
import axios from 'axios';
import FormData from 'form-data';
import { JWT_ACCESS_SECRET } from '$env/static/private';
import jwt from 'jsonwebtoken';

export async function load({ cookies, locals, url }) {
    let uid = url.searchParams.get('uid') || null;
    let hash = url.searchParams.get('hash') || null;
    if (uid && hash) {
        const organization = await db.organization.findUnique({
            where: {
                id: uid
            }
        });
        if (organization.hash === hash) {
            await db.organization.update({
                where: {
                    id: uid
                },
                data: {
                    email_verified: true
                }
            });
            throw redirect(302, '/create');
        }
    }

    const authCookie = cookies.get('AuthorizationToken');
 
    if (!authCookie) {
        throw redirect(302, '/login');
    }

    let user = {};
    const token = authCookie.split(' ')[1];
    try {
        const jwtUser = jwt.verify(token, JWT_ACCESS_SECRET);
        if (jwtUser) {
            user = jwtUser;
        }
    } catch (error) {
        console.log(error);
        if (error == "JsonWebTokenError: jwt malformed") {
            cookies.delete("AuthorizationToken");
            throw redirect(302, '/login');
        }
    }

    const organization = await db.organization.findUnique({
		where: {
			id: user.id
		}
	});

    if (!organization) {
        throw redirect(302, '/logout');
    }

    if (organization.email_verified) {
        throw redirect(302, '/');
    }

    return {
		organization: organization
	};
}

export const actions = {
	default: async ({ cookies, request, locals }) => {

        const authCookie = cookies.get('AuthorizationToken');
 
        if (!authCookie) {
            throw redirect(302, '/login');
        }

        let user = {};
        const token = authCookie.split(' ')[1];
        try {
            const jwtUser = jwt.verify(token, JWT_ACCESS_SECRET);
            if (jwtUser) {
                user = jwtUser;
            }
        } catch (error) {
            console.log(error);
            if (error == "JsonWebTokenError: jwt malformed") {
                cookies.delete("AuthorizationToken");
                throw redirect(302, '/login');
            }
        }

        const organization = await db.organization.findUnique({
            where: {
                id: user.id
            }
        });
    
        if (!organization) {
            throw redirect(302, '/logout');
        }

        // Send email

        let recipient_variables = {};
        recipient_variables[organization.email] = {
            "name": organization.name.split(" ")[0],
            "uid": organization.id,
            "hash": organization.hash
        }

        let data = new FormData();
        data.append('from', 'NetCredential <noreply@mail.netcredential.com>');
        data.append('to', `${organization.name} <${organization.email}>`)
        data.append('recipient-variables', JSON.stringify(recipient_variables));
        data.append('subject', '🚀 Welcome to NetCredential');
        data.append('template', 'welcome-email');
        data.append('o:tag', organization.name);
        data.append('h:Reply-To', 'NetCredential <contact@netcredential.com>');

        let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://api.mailgun.net/v3/mail.netcredential.com/messages',
        headers: { 
            'Authorization': 'Basic YXBpOjdhOGYzM2YyMmQ5ZDQ3ODg1Zjk1YjU3NDgzN2EyY2E5LTlkZmJlZWNkLTJmNmRmNjk1', 
            ...data.getHeaders()
        },
        data: data
        };

        try {
        const response = await axios.request(config);
        console.log(response.data);
        } catch (error) {
        console.error('Error:', error);
        return json({ error: "Something went wrong"}, { status: 400 });
        }
        return { success: true };
	}
};
