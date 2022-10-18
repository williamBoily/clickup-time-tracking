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

	const duration = (end.valueOf() - start.valueOf());

	// equivalent : start.toLocaleTimeString('UTC', {hour12: false})
	console.log(`+-- ${dateFormatter.format(start)}`);
	console.log('|' + ' '.repeat(13) + `${formatDuration(duration)} ` + taskName);
	console.log(`+-- ${dateFormatter.format(end)}`);
}

function formatDuration(durationInMs: number){
	const dateForDuration = new Date(durationInMs);
	const hh = dateForDuration.getUTCHours().toString();
	const mm = dateForDuration.getUTCMinutes().toString().padStart(2, '0');
	const ss = dateForDuration.getUTCSeconds().toString().padStart(2, '0');
	return `${hh}:${mm}:${ss}`;
}

function printTotalTime(durationInMs: number) {
	const duration = formatDuration(durationInMs);
	console.log(`total time: ${duration}`);
}


(async () => {
	try {
		let totalTimeInMs = 0;
		const myArgs = process.argv.slice(2);
		const dateArgument = myArgs?.[0];

		// when passing the time with the date, the local time zone is used.
		// if only the date, UTC is used.
		const startDate = dateArgument ? new Date(dateArgument.concat('T00:00:00')) : new Date();
		const endDate = dateArgument ? new Date(dateArgument.concat('T23:59:59')) : new Date();

		const clickup = new ClickupClient(process.env.CLICKUP_API_PERSONNAL_TOKEN ?? '');
		const result = await clickup.getTimeEntriesWithinDateRange(process.env.CLICKUP_TEAM_ID ?? '', {start_date: startDate.valueOf(), end_date: endDate.valueOf()});
		printDayRange(startDate, endDate);
		
		result.data.sort((a, b) => {
			return a.start - b.start;
		})
		.forEach(timeEntry => {
			const start = new Date(parseInt(timeEntry.start, 10));
			const end = new Date(parseInt(timeEntry.end, 10));
			totalTimeInMs += (end.valueOf() - start.valueOf());
			printTimeRange(start, end, timeEntry.task?.name ?? 'no task linked');
		});

		printTotalTime(totalTimeInMs);
		
	} catch (error) {
		console.error('Script Error. Something went wrong...');
		console.error(error);
	}
})();
