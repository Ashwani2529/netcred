import db from "../../../../../../prisma/db.js";
import { redirect } from '@sveltejs/kit';

export async function load({locals, params}) {
  const groupId = params.group;
  
  const group = await db.group.findUnique({
    where: {
      id: groupId
    }
  });

  if (!group) {
    throw redirect(302, '/groups');
  }

  if (group.org_id != locals.user.id) {
    throw redirect(302, '/groups');
  }

  const design = await db.design.findUnique({
    where: {
      id: group.template
    }
  });

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

  const organization = await db.organization.findUnique({
		where: {
			id: locals.user.id
		}
	});

	return {
    group: group,
    design: design,
    designs: designs,
    organization: organization
	};
}