import 'dotenv/config'; // this will load the .env in process.env

import ClickupClient from './ClickupClient';

function printDayRange(start: Date, end: Date) {
	const line = ''.concat(start.toLocaleDateString('UTC'))
	  .concat(' to ')
	  .concat(end.toLocaleDateString('UTC'));
	console.log(line);
}

function printTimeRange(start: Date, end: Date, taskName: string) {
	// helper for format: https://devhints.io/wip/intl-datetime
	let dateFormatter = new Intl.DateTimeFormat('UTC' , {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false
	  });

	const durationInMinutes = (end.valueOf() - start.valueOf()) / 1000 / 60;

	// equivalent : start.toLocaleTimeString('UTC', {hour12: false})
	console.log(`+-- ${dateFormatter.format(start)}`);
	console.log('|' + ' '.repeat(13) + `(${durationInMinutes.toFixed(0)} min) ` + taskName);
	console.log(`+-- ${dateFormatter.format(end)}`);
}


(async () => {
	try {
		const startDate = new Date();
		startDate.setHours(0,0,0,0);
		const endDate = new Date();
		endDate.setHours(23,59,59,999);

		const clickup = new ClickupClient(process.env.CLICKUP_API_PERSONNAL_TOKEN ?? '');
		const result = await clickup.getTimeEntriesWithinDateRange(process.env.CLICKUP_TEAM_ID ?? '', {start_date: startDate.valueOf(), end_date: endDate.valueOf()});
		printDayRange(startDate, endDate);
		result.data.forEach(timeEntry => {
			const start = new Date(parseInt(timeEntry.start, 10));
			const end = new Date(parseInt(timeEntry.end, 10));
			printTimeRange(start, end, timeEntry.task.name);
		});
		
	} catch (error) {
		console.error('Script Error. Something went wrong...');
		console.error(error);
	}
})();
