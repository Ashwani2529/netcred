import db from "../../../../prisma/db.js";
import { customAlphabet } from 'nanoid';
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

const generateUniqueString = customAlphabet(alphabet, 32);

export async function load({locals}) {
	const tokens = await db.token.findMany({
        where: {
          org_id: locals.user.id
        },
        orderBy: {
            timestamp: 'desc'
        }
  });

	return {
		tokens: tokens
	};
}

export const actions = {
	default: async ({ request, locals }) => {
    const formData = Object.fromEntries(await request.formData());
    await db.token.create({
        data: {
          name: formData.token,
          token: generateUniqueString(),
          org_id: locals.user.id
        }
    });
    return { success: true };
	}
};