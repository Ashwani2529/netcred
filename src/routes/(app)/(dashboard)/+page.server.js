import db from "../../../../prisma/db.js";

BigInt.prototype.toJSON = function() { return this.toString() }

function getDatesInRange(startDate, endDate) {
  const dates = [];
  const current = new Date(startDate);
  while (current <= new Date(endDate)) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export async function load({locals, request}) {
  let endDate = new Date();
  let startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  // const eventCounts = await db.$queryRaw`
  //   SELECT event_type, SUM(count) as count
  //   FROM (
  //     SELECT event_type, COUNT(DISTINCT user_ip) as count
  //     FROM events
  //     WHERE org_id = ${locals.user.id} AND
  //       event_type IN ('credential-issued', 'credential-viewed', 'credential-engaged') AND
  //       timestamp >= ${startDate} AND
  //       timestamp <= ${endDate}
  //     GROUP BY event_type
  //     UNION ALL
  //     SELECT 'credential-issued', COUNT(*)
  //     FROM events
  //     WHERE org_id = ${locals.user.id} AND
  //       event_type = 'credential-issued' AND
  //       timestamp >= ${startDate} AND
  //       timestamp <= ${endDate}
  //       AND user_ip IS NULL
  //   ) AS subquery
  //   GROUP BY event_type
  // `;

  const eventCounts = await db.$queryRaw`
    SELECT event_type, COUNT(DISTINCT credential_id) as count
    FROM events
    WHERE org_id = ${locals.user.id} AND
      event_type IN ('credential-issued', 'credential-viewed', 'credential-engaged') AND
      timestamp >= ${startDate} AND
      timestamp <= ${endDate}
    GROUP BY event_type
  `;

  const formattedCounts = {};
      eventCounts.forEach(entry => {
      formattedCounts[entry.event_type] = entry.count;
  });

  // const activityChartData = await db.$queryRaw`
  //   SELECT timestamp, event_type,
  //     CASE 
  //       WHEN event_type = 'credential-issued' THEN COUNT(*) 
  //       ELSE COUNT(DISTINCT user_ip)
  //     END as count
  //   FROM events
  //   WHERE org_id = ${locals.user.id} AND
  //     event_type IN ('credential-issued', 'credential-viewed', 'credential-engaged') AND
  //     timestamp >= ${startDate} AND
  //     timestamp <= ${endDate}
  //   GROUP BY timestamp, event_type
  // `;

  // const formattedChartData = activityChartData.map(entry => ({
  //   date: entry.timestamp,
  //   event_type: entry.event_type,
  //   count: entry.count
  // }));
  
  // const activityChartData = await db.$queryRaw`
  //     SELECT DATE(timestamp) as date, event_type,
  //       CASE 
  //         WHEN event_type = 'credential-issued' THEN COUNT(*) 
  //         ELSE COUNT(DISTINCT user_ip)
  //       END as count
  //     FROM events
  //     WHERE org_id = ${locals.user.id} AND
  //       event_type IN ('credential-issued', 'credential-viewed', 'credential-engaged') AND
  //       timestamp >= ${startDate} AND
  //       timestamp <= ${endDate}
  //     GROUP BY date, event_type
  // `;

  const activityChartData = await db.$queryRaw`
      SELECT DATE(timestamp) as date, event_type,
             COUNT(DISTINCT credential_id) as count
      FROM events
      WHERE org_id = ${locals.user.id} AND
        event_type IN ('credential-issued', 'credential-viewed', 'credential-engaged') AND
        timestamp >= ${startDate} AND
        timestamp <= ${endDate}
      GROUP BY date, event_type
  `;

  const eventTypes = ['credential-issued', 'credential-viewed', 'credential-engaged'];

  const formattedChartData = {};

  const dateRange = getDatesInRange(startDate, endDate);
  dateRange.forEach(date => {
    formattedChartData[date] = {};
    eventTypes.forEach(eventType => {
      formattedChartData[date][eventType] = 0;
    });
  });

  // Fill in the actual counts from activityChartData
  activityChartData.forEach(entry => {
    const { date, event_type, count } = entry;
    const formattedDate = date.toISOString().split('T')[0];
    formattedChartData[formattedDate][event_type] = count;
  });

  const groups = await db.group.findMany({
    where: {
      org_id: locals.user.id
    },
    orderBy: {
        timestamp: 'desc'
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
      id: true
    }
});

	return {
    chartData: JSON.parse(JSON.stringify(formattedChartData)),
		eventCounts: JSON.parse(JSON.stringify(formattedCounts)),
    groups: groups,
    designs: designs
	};
}