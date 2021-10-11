const months = [
	'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
	'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
];

function getTimeStr(date) {
	return date.toLocaleTimeString('fr-FR').split(':').slice(0, 2).join(':');
}

export const filters = {
	date: ['date?now', 'string', (ctx, date, fmt) => {
		if (fmt == "iso") {
			return date.toISOString();
		} else if (fmt == "cal") {
			return `le ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} à ${getTimeStr(date)}`;
		} else if (fmt == "rel") {
			let sameDay = false;
			const page = ctx.data?.page;
			if (page) {
				const ref = new Date(page.stop || page.updated_at || page.start);
				sameDay = date.getFullYear() === ref.getFullYear() && date.getMonth() === ref.getMonth() && date.getDate() === ref.getDate();
			}
			const time = getTimeStr(date);
			if (sameDay) {
				return time;
			} else {
				return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}\nà ${time}`;
			}
		} else if (fmt == "time") {
			return date.toLocaleTimeString().replace(':', 'H').replace(':', 'M');
		} else if (fmt == "date") {
			return date.toLocaleDateString();
		}
	}]
};
