import db from "../../../../prisma/db.js";
import { json, redirect } from '@sveltejs/kit';

export async function load({ locals, url, request }) {
  let credentials = null;

  let totalCredData = await db.credential.count({
    where: {
      org_id: locals.user.id
    },
  })
  
    credentials = await db.credential.findMany({
      take: 2,
      where: {
        org_id: locals.user.id
      },
      select: {
        group: true,
        id: true,
        org_id: true,
        recipient_email: true,
        recipient_name: true,
        extra: true,
        issued: true,
        expiry: true,
        status: true,
        job: true,
        created_at: true,
        updated_at: true,
        delivered_at: true,
        opened_at: true,
        clicked_at: true,
        viewed_at: true,
        shared_at: true,
      },
      orderBy: {
        id: 'asc'
      }
    });

  let next = credentials[1].id; // Remember: zero-based index! :)

  let alterTable = credentials.map((data) => (
    {
      ...data,
      id: data.id,
      org_id: data.org_id,
      recipient_email: data.recipient_email,
      recipient_name: data.recipient_name,
      extra: data.extra,
      issued: data.issued,
      expiry: data.expiry,
      status: data.status,
      job: data.job,
      created_at: data.created_at,
      updated_at: data.updated_at,
      delivered_at: data.delivered_at,
      opened_at: data.opened_at,
      clicked_at: data.clicked_at,
      viewed_at: data.viewed_at,
      shared_at: data.shared_at,
      group_name: data.group.name
  }))

  return {
    credentials: alterTable,
    no_of_credentials: totalCredData,
    pg_next: next
  };
}


// ------------- Old Pagination Logic ----
// export const actions = {
//   search: async ({ cookies, request, locals }) => {
//     const { searchInput } = Object.fromEntries(await request.formData());

//     const searchTerm = `%${searchInput.toLowerCase()}%`;

//     // const credentials = await db.$queryRaw`
//     // SELECT c.*, g.*
//     // FROM \`credentials\` AS c
//     // LEFT JOIN \`groups\` AS g ON c.group_id = g.id
//     // WHERE c.org_id = ${locals.user.id} 
//     // AND (LOWER(c.recipient_email) LIKE ${searchTerm} OR LOWER(c.recipient_name) LIKE ${searchTerm})
//     // ORDER BY c.created_at DESC;
//     // `;

//     const rawData = await db.$queryRaw`
//       SELECT 
//           c.id as c_id,
//           c.org_id as c_org_id,
//           c.group_id as c_group_id,
//           c.recipient_email as c_recipient_email,
//           g.id as g_id,
//           g.name as g_name
//       FROM \`credentials\` AS c
//       LEFT JOIN \`groups\` AS g ON c.group_id = g.id
//       WHERE c.org_id = ${locals.user.id}
//       AND (LOWER(c.recipient_email) LIKE ${searchTerm} OR LOWER(c.recipient_name) LIKE ${searchTerm})
//       ORDER BY c.created_at DESC;
//       `;

//     const credentials = rawData.map(row => {
//       return {
//         id: row.c_id,
//         org_id: row.c_org_id,
//         group_id: row.c_group_id,
//         recipient_email: row.c_recipient_email,
//         group: {
//           id: row.g_id,
//           name: row.g_name,
//         }
//       }
//     });

//     console.log(credentials);

//     return {
//       state: 'forgot',
//       success: true
//     };
//   },

//   paginate: async ({request, locals}) => {
//     const request_data = await request.formData();

//     if (request_data.get('action') == "next_page") {
//       const myCursor = request_data.get('next');
//       let stringWithQuotes = myCursor;
//       let formated_myCursor = stringWithQuotes.replace(/^"(.*)"$/, '$1');
      
//       let credentials = await db.credential.findMany({
//         take:2,
//         skip:1,  //--1--
//         cursor: {
//           id: formated_myCursor,
//         },
//         where: {
//           org_id: locals.user.id
//         },
//         select: {
//           group: true,
//           id: true,
//           org_id: true,
//           recipient_email: true,
//           recipient_name: true,
//           extra: true,
//           issued: true,
//           expiry: true,
//           status: true,
//           job: true,
//           created_at: true,
//           updated_at: true,
//           delivered_at: true,
//           opened_at: true,
//           clicked_at: true,
//           viewed_at: true,
//           shared_at: true,
//         },
//         orderBy: {
//           id: 'asc'
//         }
//       });

//       let next = credentials.length > 0 ? credentials[1]?.id: null ;
      
//       let alterTable = credentials.map((data) => (
//         {
//           ...data,
//           id: data.id,
//           org_id: data.org_id,
//           recipient_email: data.recipient_email,
//           recipient_name: data.recipient_name,
//           extra: data.extra,
//           issued: data.issued,
//           expiry: data.expiry,
//           status: data.status,
//           job: data.job,
//           created_at: data.created_at,
//           updated_at: data.updated_at,
//           delivered_at: data.delivered_at,
//           opened_at: data.opened_at,
//           clicked_at: data.clicked_at,
//           viewed_at: data.viewed_at,
//           shared_at: data.shared_at,
//           group_name: data.group?.name
//       }))
  
//       let _alterTable = JSON.stringify(alterTable);
//       let _next = JSON.stringify(next);
//       return {
//         data: {
//           _alterTable,_next
//         }
//       };
//     } 
//   },

//   tableSearch: async ({request, locals}) => {
//     const { searchInput, action, next } = Object.fromEntries(await request.formData());

//     if (action == "first_page") {
//       const searchTerm = `%${searchInput.toLowerCase()}%`;

//       const dataCount = await db.credential.count({
//         where: {
//           org_id: locals.user.id,
//           group: {
//             name: {
//               contains: searchTerm
//             }
//           }
//         },
//         orderBy: {
//           id: 'asc',
//         },
//       });

//       const rawData = await db.credential.findMany({
//         take:2,
//         where: {
//           org_id: locals.user.id,
//           group: {
//             name: {
//               contains: searchTerm
//             }
//           }
//         },
//         include: {
//           group: true,
//         },
//         orderBy: {
//           id: 'asc',
//         },
//       });

//       let nextData = rawData.length > 0 ? rawData[1]?.id: null ;

//       const data_wrapped = rawData.map(row => {
//         return {
//           ...row,
//           id: row.id,
//           org_id: row.org_id,
//           recipient_email: row.recipient_email,
//           recipient_name: row.recipient_name,
//           extra: row.extra,
//           issued: row.issued,
//           expiry: row.expiry,
//           status: row.status,
//           job: row.job,
//           created_at: row.created_at,
//           updated_at: row.updated_at,
//           delivered_at: row.delivered_at,
//           opened_at: row.opened_at,
//           clicked_at: row.clicked_at,
//           viewed_at: row.viewed_at,
//           shared_at: row.shared_at,
//           group_name: row.group?.name
//         }
//       });
    
//       let credentials = JSON.stringify(data_wrapped);
//       let _next = JSON.stringify(nextData);
//       let _dataCount = JSON.stringify(dataCount);

//       return {
//         credentials,_next,_dataCount,
//         success: true
//       };
      
//     } else {
//       const searchTerm = `%${searchInput.toLowerCase()}%`;
//       const myCursor = next;
//       let stringWithQuotes = myCursor;
//       let formated_myCursor = stringWithQuotes.replace(/^"(.*)"$/, '$1');

//       const rawData = await db.credential.findMany({
//         take:2,
//         skip:1,
//         cursor: {
//           id: formated_myCursor,
//         },
//         where: {
//           org_id: locals.user.id,
//           group: {
//             name: {
//               contains: searchTerm
//             }
//           }
//         },
//         include: {
//           group: true,
//         },
//         orderBy: {
//           id: 'asc',
//         },
//       });

//       let nextData = rawData.length > 0 ? rawData[1]?.id: null ;

//       const data_wrapped = rawData.map(row => {
//         return {
//           ...row,
//           id: row.id,
//           org_id: row.org_id,
//           recipient_email: row.recipient_email,
//           recipient_name: row.recipient_name,
//           extra: row.extra,
//           issued: row.issued,
//           expiry: row.expiry,
//           status: row.status,
//           job: row.job,
//           created_at: row.created_at,
//           updated_at: row.updated_at,
//           delivered_at: row.delivered_at,
//           opened_at: row.opened_at,
//           clicked_at: row.clicked_at,
//           viewed_at: row.viewed_at,
//           shared_at: row.shared_at,
//           group_name: row.group?.name
//         }
//       });
    
//       let credentials = JSON.stringify(data_wrapped);
//       let _next = JSON.stringify(nextData);
//       return {
//         credentials,_next,
//         success: true
//       };      
//     }
//   }
// };

// ---------- Optimised Logic Need Testing -----------

export const actions = {
  search: async ({ cookies, request, locals }) => {
    const { searchInput } = Object.fromEntries(await request.formData());
    const searchTerm = `%${searchInput.toLowerCase()}%`;

    const rawData = await db.$queryRaw`
      SELECT 
          c.id as c_id,
          c.org_id as c_org_id,
          c.group_id as c_group_id,
          c.recipient_email as c_recipient_email,
          g.id as g_id,
          g.name as g_name
      FROM \`credentials\` AS c
      LEFT JOIN \`groups\` AS g ON c.group_id = g.id
      WHERE c.org_id = ${locals.user.id}
      AND (LOWER(c.recipient_email) LIKE ${searchTerm} OR LOWER(c.recipient_name) LIKE ${searchTerm})
      ORDER BY c.created_at DESC;
    `;

    const credentials = rawData.map(row => ({
      id: row.c_id,
      org_id: row.c_org_id,
      group_id: row.c_group_id,
      recipient_email: row.c_recipient_email,
      group: {
        id: row.g_id,
        name: row.g_name,
      }
    }));

    console.log(credentials);

    return {
      state: 'forgot',
      success: true,
    };
  },

  paginate: async ({ request, locals }) => {
    const request_data = await request.formData();
    const myCursor = request_data.get('next');
    const formated_myCursor = myCursor.replace(/^"(.*)"$/, '$1');

    let credentials = await db.credential.findMany({
      take: 2,
      skip: 1,
      cursor: { id: formated_myCursor },
      where: { org_id: locals.user.id },
      select: {
        group: true,
        id: true,
        org_id: true,
        recipient_email: true,
        recipient_name: true,
        extra: true,
        issued: true,
        expiry: true,
        status: true,
        job: true,
        created_at: true,
        updated_at: true,
        delivered_at: true,
        opened_at: true,
        clicked_at: true,
        viewed_at: true,
        shared_at: true,
      },
      orderBy: { id: 'asc' },
    });

    let next = credentials.length > 0 ? credentials[1]?.id : null;

    let alterTable = credentials.map(data => ({
      ...data,
      group_name: data.group?.name
    }));

    let _alterTable = JSON.stringify(alterTable);
    let _next = JSON.stringify(next);

    return {
      data: { _alterTable, _next },
    };
  },

  tableSearch: async ({ request, locals }) => {
    const { searchInput, action, next } = Object.fromEntries(await request.formData());
    const searchTerm = `%${searchInput.toLowerCase()}%`;

    if (action === "first_page") {
      const dataCount = await db.credential.count({
        where: {
          org_id: locals.user.id,
          group: {
            name: {
              contains: searchTerm
            }
          }
        },
      });

      const rawData = await db.credential.findMany({
        take: 2,
        where: {
          org_id: locals.user.id,
          group: {
            name: {
              contains: searchTerm
            }
          }
        },
        include: { group: true },
        orderBy: { id: 'asc' },
      });

      let nextData = rawData.length > 0 ? rawData[1]?.id : null;

      const data_wrapped = rawData.map(row => ({
        ...row,
        group_name: row.group?.name
      }));

      return {
        credentials: JSON.stringify(data_wrapped),
        _next: JSON.stringify(nextData),
        _dataCount: JSON.stringify(dataCount),
        success: true,
      };
    } else {
      const myCursor = next.replace(/^"(.*)"$/, '$1');

      const rawData = await db.credential.findMany({
        take: 2,
        skip: 1,
        cursor: { id: myCursor },
        where: {
          org_id: locals.user.id,
          group: {
            name: {
              contains: searchTerm
            }
          }
        },
        include: { group: true },
        orderBy: { id: 'asc' },
      });

      let nextData = rawData.length > 0 ? rawData[1]?.id : null;

      const data_wrapped = rawData.map(row => ({
        ...row,
        group_name: row.group?.name
      }));

      return {
        credentials: JSON.stringify(data_wrapped),
        _next: JSON.stringify(nextData),
        success: true,
      };
    }
  }
};
