import 'dotenv/config'; // this will load the .env in process.env

import ClickupClient from './ClickupClient';

const COLORS = {
	default: '[0m',
	red: '[31m',
	green: '[32m'
}

function print(text: string, color?: string){
	if(color === null){
		console.log(text);
	}else{
		console.log(`\x1b${color}${text}\x1b${COLORS.default}`);
	}
}

function customDateTimeFormatter(date: Date): string {
	const YMD = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
	const time = customTimeFormatter(date);

	return `${YMD}T${time}`;
}

function customTimeFormatter(date: Date): string {
	// other way to use JS Intl predefined format with option. https://devhints.io/wip/intl-datetime
	let dateFormatter = new Intl.DateTimeFormat('UTC' , {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hourCycle: 'h23' // to display 00 hour instead of 24
	  });
	
	return dateFormatter.format(date);
}

function printDayRange(start: Date, end: Date) {
	const line = ''.concat(customDateTimeFormatter(start))
	  .concat(' to ')
	  .concat(customDateTimeFormatter(end));
	console.log(line);
}

function printTimeRange(start: Date, end: Date, taskName: string) {

	const duration = (end.valueOf() - start.valueOf());

	// equivalent : start.toLocaleTimeString('UTC', {hour12: false})
	console.log(`+-- ${customTimeFormatter(start)}`);
	console.log('|' + ' '.repeat(13) + `${formatDuration(duration)} ` + taskName);
	console.log(`+-- ${customTimeFormatter(end)}`);
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
	print(`total time: ${duration}`, COLORS.green);
}

function stringDateYYYYMMDDtoDate(stringDate: string): Date {
	const YMD = stringDate.split('-').map(el => {
		return parseInt(el);
	});

	const date = new Date();
	date.setFullYear(YMD[0], YMD[1]-1, YMD[2]);

	return date;
}

(async () => {
	try {
		let totalTimeInMs = 0;
		const myArgs = process.argv.slice(2);
		const dateArgument = myArgs?.[0];

		const startDate = dateArgument ? stringDateYYYYMMDDtoDate(dateArgument) : new Date();
		startDate.setHours(0, 0, 0, 0);

		const endDate = dateArgument ? stringDateYYYYMMDDtoDate(dateArgument) : new Date();
		endDate.setHours(23, 59, 59, 999);

		const clickup = new ClickupClient(process.env.CLICKUP_API_PERSONNAL_TOKEN ?? '');
		const result = await clickup.getTimeEntriesWithinDateRange(process.env.CLICKUP_TEAM_ID ?? '', {start_date: startDate.valueOf(), end_date: endDate.valueOf()});
		printDayRange(startDate, endDate);
		
		result.data.sort((a, b) => {
			return a.start - b.start;
		});

		for (let index = 0; index < result.data.length; index++) {
			const timeEntry = result.data[index];
			const start = new Date(parseInt(timeEntry.start, 10));
			const end = new Date(parseInt(timeEntry.end, 10));
			totalTimeInMs += (end.valueOf() - start.valueOf());
			printTimeRange(start, end, timeEntry.task?.name ?? 'no task linked');

			if(result.data[index + 1]){
				const nextTimeEntry = result.data[index + 1];
				const nextStart = new Date(parseInt(nextTimeEntry.start, 10));
				
				if( (end.valueOf() - nextStart.valueOf()) >= (60 * 1000)){
					print("Time entry overlaps", COLORS.red);
				}
			}
		}
		
		printTotalTime(totalTimeInMs);
		
	} catch (error) {
		print("Script Error. Something went wrong...", COLORS.red);
		console.error(error);
	}
})();
