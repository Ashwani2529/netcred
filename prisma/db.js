import { PrismaClient } from '@prisma/client';

const db = new PrismaClient({ errorFormat: 'minimal' });
export default db;

// import { PrismaClient } from '@prisma/client';

// const db = new PrismaClient({ errorFormat: 'minimal' });

// async function fetchData() {
//   try {
//     const data = await db.organization.findMany();
//     console.log(data, "-- data --");
//   } catch (error) {
//     console.error('Error fetching data:', error);
//   } finally {
//     await db.$disconnect();
//   }
// }

// fetchData();
// export default db;

// ------------- Another --------

// import { PrismaClient } from '@prisma/client';

// const db = async () => {
//     const prisma = new PrismaClient();

//     try {
//         // Your logic to fetch organization goes here
//         // For example, fetching the first organization
//         const database = await prisma.organization.findMany();
//         return database;
//     } catch (error) {
//         console.error('Error fetching organization:', error);
//     } finally {
//         await prisma.$disconnect();
//     }
// };

// (async () => {
//     const data = await db();
//     console.log(data, "--data--");
// })();

// export default db;
