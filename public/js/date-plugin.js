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
			const live = ctx.scope.live;
			if (live && live.rooms && live.rooms.page) {
				const ref = new Date(live.rooms.page);
				sameDay = Math.abs((date.getTime() - ref.getTime())) < 1000 * 3600 * 24;
			}
			const time = getTimeStr(date);
			if (sameDay) {
				return time;
			} else {
				return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}\nà ${time}`;
			}
		}
	}]
};
