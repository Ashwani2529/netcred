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

  const organization = await db.organization.findUnique({
		where: {
			id: locals.user.id
		}
	});

	const credentials = await db.credential.findMany({
      where: {
        group_id: groupId
      },
      orderBy: {
        created_at: 'desc'
      }
  });

	return {
    group: group,
		credentials: credentials,
    organization: organization,
    design: design
	};
}