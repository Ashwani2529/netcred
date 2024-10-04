import db from "../../../../prisma/db.js";

export async function load({locals}) {
	const invoices = await db.billing.findMany({
        where: {
          org_id: locals.user.id
        },
        orderBy: {
            timestamp: 'desc'
        }
  });

	return {
		invoices: invoices
	};
}