import db from "../../../../prisma/db.js";

export async function load({locals}) {
	const groups = await db.group.findMany({
        where: {
          org_id: locals.user.id
        },
        orderBy: {
            timestamp: 'desc'
        }
  });

  // console.log("Groups", groups);

	return {
		groups: groups
	};
}