import db from "../../../../prisma/db.js";

export async function load({locals}) {
	const designs = await db.design.findMany({
      where: {
        org_id: locals.user.id
      },
      orderBy: {
        timestamp: 'desc'
      },
      select: {
        id: true,
        name: true,
        preview: true,
        status: true,
        type: true
      }
  });

	return {
		designs: designs
	};
}