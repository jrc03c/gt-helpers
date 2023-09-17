module.exports = function (request, response) {
	try {
		const date = new Date(request.query.date_string)

		if (date.toString() === "Invalid Date") {
			throw new Error(
				"The date string you provided was not in a date format we recognized!"
			)
		}

		const year = date.getFullYear()
		const month = date.getMonth() + 1
		const day = date.getDate()
		const hour = date.getHours()
		const minute = date.getMinutes()
		const second = date.getSeconds()

		return response.json({
			year,
			month,
			day,
			hour,
			minute,
			second,
		})
	} catch (e) {
		return response.status(500).send(e.toString())
	}
}
