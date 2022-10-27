export const formats = {
	date: {
		cal(ctx, date) {
			return ctx.filter(date, 'date', 'D', 'month', 'Y', 'h', 'm');
		},
		rel(ctx, date) {
			let sameDay = false;
			const page = ctx.data?.page;
			if (page) {
				const ref = new Date(page.stop || page.updated_at || page.start);
				sameDay = date.getFullYear() === ref.getFullYear() && date.getMonth() === ref.getMonth() && date.getDate() === ref.getDate();
			}
			if (sameDay) {
				return ctx.filter(date, 'date', 'h', 'm');
			} else {
				const shortDate = ctx.filter(date, 'date', 'D', 'M', 'Y');
				const longDate = ctx.filter(date, 'date', 'D', 'month', 'Y');
				const str = ctx.filter(date, 'date', 'D', 'month', 'Y', 'h', 'm');
				return ctx.format(str.replace(longDate, shortDate + '\n'), 'as', 'text');
			}
		},
		hms(ctx, date) {
			return ctx.filter(date, 'date', 'time').replace(':', 'H').replace(':', 'M');
		}
	}
};
