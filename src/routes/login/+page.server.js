import { redirect, fail } from '@sveltejs/kit';
import { setAuthToken } from "../helpers.js";
import { loginUser } from "../../../prisma/user.js";
import { trackEvent } from '$lib/server/segment.js';
// import passport from 'passport';
// import { OIDCStrategy } from 'passport-azure-ad';
// import { JWT_ACCESS_SECRET,SECRET_CLIENT_ID,SECRET_CLIENT_SECRET,TENANT_ID,CLIENT_ID,CLIENT_SECRET } from '$env/static/private';
import { JWT_ACCESS_SECRET } from '$env/static/private';
// import { OAuth2Client } from 'google-auth-library';
import jwt from "jsonwebtoken";

export function load({ cookies }) {
    const token = cookies.get('AuthorizationToken');
 
    if (token) {
        throw redirect(302, '/');
    }
}

// passport.use(new OIDCStrategy({
//     identityMetadata: `https://login.microsoftonline.com/${TENANT_ID}/v2.0/.well-known/openid-configuration`,
//     clientID: 'ABCD', // CLIENT_ID
//     responseType: 'code',
//     responseMode: 'form_post',
//     redirectUrl: 'https://localhost:3000/auth/callback',
//     allowHttpForRedirectUrl: true,
//     clientSecret: 'LMN', // CLIENT_ID
//     validateIssuer: false,
//     passReqToCallback: false,
//     scope: ['openid', 'profile']
// }, (iss, sub, profile, accessToken, refreshToken, done) => {
//     // Authentication successful, handle user profile here
//     return done(null, profile);
// }));

export const actions = {
	login: async ({ cookies, request }) => {
        const formData = Object.fromEntries(await request.formData());
        const { email, password } = formData;

        trackEvent(null, 'login-init', {email});

        const { error, token } = await loginUser(email, password);

        if (error) {
            trackEvent(null, 'login-fail', {email, error});
            return fail(401, {error});
        }

        setAuthToken({cookies, token});

        const jwtUser = jwt.verify(token, JWT_ACCESS_SECRET);
        trackEvent(jwtUser.id, 'login-success', {});

        throw redirect(302, "/")
	},

    // OAuth2: async({})=>{
    //     const redirectURL = 'http://localhost:5173/oauth';

    //     console.log('id',SECRET_CLIENT_ID)

    //     const oAuth2Client = new OAuth2Client(
    //         SECRET_CLIENT_ID,
    //         SECRET_CLIENT_SECRET,
    //         redirectURL
    //       );
      
    //       // Generate the url that will be used for the consent dialog.
    //       const authorizeUrl = oAuth2Client.generateAuthUrl({
    //         access_type: 'offline',
    //         scope: 'https://www.googleapis.com/auth/userinfo.profile  openid ',
    //         prompt: 'consent'
    //       });

    //       throw redirect(302,authorizeUrl);
    // },

    // signInWithMicrosoft: async () => {
    //     try {
    //         // Initiate sign-in with Microsoft using Passport.js
    //         passport.authenticate('azuread-openidconnect')(req, res);
            
    //         // Return a success response
    //         // return {
    //         //     status: 200,
    //         //     body: {
    //         //         message: 'Sign-in with Microsoft initiated successfully'
    //         //     }
    //         // };
    //         throw redirect(302, "/")
    //     } catch (error) {
    //         console.error('Error occurred during sign-in with Microsoft:', error);
    //         // Handle error appropriately
    //         return {
    //             status: 500,
    //             body: {
    //                 error: 'Internal Server Error'
    //             }
    //         };
    //     }
    // }
};
