module.exports = function trackTime () {
	let startAt;
	return {
		start: () => {
			startAt = process.hrtime();
		},
		stop: () => process.hrtime(startAt),
	}
};