import { redirect, fail } from '@sveltejs/kit';
import db from "../../../prisma/db.js";
import axios from 'axios';
import FormData from 'form-data';
import { customAlphabet } from 'nanoid';
import bcrypt from "bcryptjs";

const numbers = '0123456789';

export function load({ cookies }) {
    const token = cookies.get('AuthorizationToken');
 
    if (token) {
        throw redirect(302, '/');
    }
}

export const actions = {
    forgot: async ({ cookies, request, locals }) => {

        const { email } = Object.fromEntries(await request.formData());

        const organization = await db.organization.findUnique({
            where: {
                email: email
            }
        });

        if (!organization) {
            return fail(401, { error: 'The email you entered does not belong to a registered user.' });
        }

        const generateUniqueCode = customAlphabet(numbers, 6);
        let code = generateUniqueCode();

        try {
            await db.passwordReset.create({
                data: {
                    email: email,
                    code: code
                }
            });
        } catch (error) {
            // Error due to unique constraint on the email field
            if (error.code === 'P2002' && error.meta.target.includes('email')) { // P2002 is the Prisma error code for unique constraint. Adjust as per your database/ORM.
                // Delete the existing entry
                await db.passwordReset.delete({
                    where: {
                        email: email
                    }
                });

                // Now, retry creating a new entry for password reset
                await db.passwordReset.create({
                    data: {
                        email: email,
                        code: code
                    }
                });
            } else {
                // Handle other errors or re-throw
                throw error;
            }
        }

        let recipient_variables = {};
        recipient_variables[organization.email] = {
            "name": organization.name.split(" ")[0],
            "code": code
        }

        let data = new FormData();
        data.append('from', 'NetCredential <noreply@mail.netcredential.com>');
        data.append('to', `${organization.name} <${organization.email}>`)
        data.append('recipient-variables', JSON.stringify(recipient_variables));
        data.append('subject', 'NetCredential – Password reset instructions');
        data.append('template', 'reset-password');
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
            return json({ error: "Something went wrong" }, { status: 400 });
        }

        return {
            state: 'forgot',
            success: true
        };
    },
    reset: async ({ cookies, request, locals }) => {

        const { email, code, password } = Object.fromEntries(await request.formData());

        const req = await db.passwordReset.findUnique({
            where: {
                email: email
            }
        });

        if (!req) {
            return fail(401, { error: 'Something went wrong!' });
        }

        if (req.code !== code) {
            return fail(401, { error: 'Incorrect verification code' });
        } else {
            await db.passwordReset.delete({
                where: {
                    email: email
                }
            });
            await db.organization.update({
                where: {
                    email: email
                },
                data: {
                    email_verified: true,
                    password: await bcrypt.hash(password, 12)
                }
            });
            throw redirect(302, "/login")
        }

        return;
    }
};