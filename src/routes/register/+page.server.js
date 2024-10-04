import { redirect, fail } from '@sveltejs/kit';
import { setAuthToken } from "../helpers.js";
import { createUser } from "../../../prisma/user.js";
import { trackEvent } from '$lib/server/segment.js';
import { JWT_ACCESS_SECRET } from '$env/static/private';
import jwt from "jsonwebtoken";

export function load({ cookies, event }) {
    const token = cookies.get('AuthorizationToken');
    if (token) {
        throw redirect(302, '/');
    }
}

export const actions = {
	default: async ({ cookies, request }) => {
        const userAgent = request.headers.get('user-agent');
        const ip = request.headers.get('x-real-ip') || request.headers.get('X-Forwarded-For') || null;
        const formData = Object.fromEntries(await request.formData());
        const { organization, email, password } = formData;

        trackEvent(null, 'register-init', {organization, email, userAgent, ip});

        const { error, token } = await createUser(organization, email, password, userAgent, ip);

        if (error) {
            trackEvent(null, 'register-fail', {organization, email, userAgent, ip, error});
            return fail(401, {error});
        }

        setAuthToken({cookies, token});
        const jwtUser = jwt.verify(token, JWT_ACCESS_SECRET);
        trackEvent(jwtUser.id, 'register-success', {});

        throw redirect(302, "/verify-email")
	}
};
