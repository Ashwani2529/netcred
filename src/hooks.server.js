import { JWT_ACCESS_SECRET } from '$env/static/private';
import jwt from 'jsonwebtoken';
import { redirect } from '@sveltejs/kit';
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        format.splat(),
        format.json()
    ),
    defaultMeta: { service: 'sveltekit-service' },
    transports: [
        new transports.File({ filename: 'errors.log', level: 'error' }),
        new transports.File({ filename: 'combined.log' })
    ]
});

const whitelist = [
    /^\/verify(\/[a-zA-Z0-9]*)?$/,
    /^\/api\/credential\/.*$/,
    /^\/api\/organization-logo\/.*$/,
    '/verify-email',
    '/api/add-event',
    '/login',
    '/register',
    '/forgot-password',
    '/api/update-status',
];

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
    const isPathWhitelisted = whitelist.some(path => 
        path instanceof RegExp ? path.test(event.url.pathname) : path === event.url.pathname
    );
    if (isPathWhitelisted) {
        return await resolve(event);
    } else {
        const header_token = event.request.headers.get('authorization') || null;
        const authCookie = event.cookies.get('AuthorizationToken') ? event.cookies.get('AuthorizationToken') : header_token;
        if (!authCookie) {
            throw redirect(302, '/login');
        }
    
        if (authCookie) {
            const token = authCookie.split(' ')[1];
            try {
                const jwtUser = jwt.verify(token, JWT_ACCESS_SECRET);
                if (jwtUser) {   
                    event.locals.user = jwtUser;
                }
            } catch (error) {
                console.log(error);
                if (error == "JsonWebTokenError: jwt malformed") {
                    event.cookies.delete("AuthorizationToken");
                    throw redirect(302, '/login');
                }
            }
        }
        return await resolve(event);
    }
}

export const handleError = async ({ error, event }) => {
    console.log(error);
    logger.error('An error occurred:', error);
}