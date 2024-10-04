import { json } from '@sveltejs/kit';
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

export async function POST({ request, cookies, locals }) {
	const stat = await request.json();
	
	let endDate = stat.endDate;
	let startDate = stat.startDate;
	let group = stat.group;

	let eventCounts;
	let activityChartData;
	if (group == 'all') {
		eventCounts = await db.$queryRaw`
			SELECT event_type, COUNT(DISTINCT credential_id) as count
			FROM events
			WHERE org_id = ${locals.user.id} AND
			event_type IN ('credential-issued', 'credential-viewed', 'credential-engaged') AND
			timestamp >= ${startDate} AND
			timestamp <= ${endDate}
			GROUP BY event_type
		`;
	} else {
		eventCounts = await db.$queryRaw`
			SELECT event_type, COUNT(DISTINCT credential_id) as count
			FROM events
			WHERE org_id = ${locals.user.id} AND
			event_type IN ('credential-issued', 'credential-viewed', 'credential-engaged') AND
			timestamp >= ${startDate} AND
			timestamp <= ${endDate} AND
			group_id = ${group}
			GROUP BY event_type
		`;
	}

	const formattedCounts = {};
		eventCounts.forEach(entry => {
		formattedCounts[entry.event_type] = entry.count;
	});
	
	if (group == 'all') {
		activityChartData = await db.$queryRaw`
			SELECT DATE(timestamp) as date, event_type,
					COUNT(DISTINCT credential_id) as count
			FROM events
			WHERE org_id = ${locals.user.id} AND
				event_type IN ('credential-issued', 'credential-viewed', 'credential-engaged') AND
				timestamp >= ${startDate} AND
				timestamp <= ${endDate}
			GROUP BY date, event_type
		`;
	} else {
		activityChartData = await db.$queryRaw`
			SELECT DATE(timestamp) as date, event_type,
					COUNT(DISTINCT credential_id) as count
			FROM events
			WHERE org_id = ${locals.user.id} AND
				event_type IN ('credential-issued', 'credential-viewed', 'credential-engaged') AND
				timestamp >= ${startDate} AND
				timestamp <= ${endDate} AND
				group_id = ${group}
			GROUP BY date, event_type
		`;
	}

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

	return json({
		chartData: JSON.parse(JSON.stringify(formattedChartData)),
		eventCounts: JSON.parse(JSON.stringify(formattedCounts))
	}, { status: 200 });
}