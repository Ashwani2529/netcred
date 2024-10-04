import db from "../../../../../prisma/db.js";

export async function load({locals, url}) {
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
        attributes: true
      }
  });

	return {
    designs: designs
	};
}