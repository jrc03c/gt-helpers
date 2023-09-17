module.exports = function (request, response) {
	try {
		const date = new Date(request.query.date_string)
		const year = date.getFullYear()
		const month = date.getMonth() + 1
		const day = date.getDate()
		const hour = date.getHours()
		const minute = date.getMinutes()
		const second = date.getSeconds()
		const millisecond = date.getMilliseconds()

		return response.json({
			year,
			month,
			day,
			hour,
			minute,
			second,
			millisecond,
		})
	} catch (e) {
		return response.status(500).send(e.toString())
	}
}
