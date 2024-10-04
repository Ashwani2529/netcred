import { json } from '@sveltejs/kit';
import db from "../../../../prisma/db.js";

export async function GET({ request, cookies, locals, url }) {
  let userId = url.searchParams.get('userId');

  let csvContent = 'Name,Email\nNetCredential,contact@netcredential.com';

  if (userId && userId != 'NA') {
    const organization = await db.organization.findUnique({
      where: {
        id: userId
      }
    });

    const name = organization.name;
    const email = organization.email;

    csvContent = `Name,Email\n${name},${email}`;
  }

  return new Response(csvContent,
    {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=sample.csv'
      }
    }
  );
}