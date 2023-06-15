const {
	assert,
	DataFrame,
	decycle,
	isArray,
	isDate,
	isObject,
	isString,
	isUndefined,
	range,
	Series,
} = require("@jrc03c/js-math-tools")

const { Liquid } = require("liquidjs")
const { stringify } = require("@jrc03c/js-text-tools")

if (!String.prototype.replaceAll) {
	String.prototype.replaceAll = function (a, b) {
		const self = this
		return self.split(a).join(b)
	}
}

function prefix(s, n) {
	if (!s || n <= 0) return ""

	return range(0, n)
		.map(() => s)
		.join("")
}

function getIndentation(text) {
	return text.split(/[^\s]/g)[0]
}

const liquid = new Liquid()

const gt = {
	date: {
		toGTDateObject(date, indentation) {
			const out = {
				year: date.getFullYear(),
				month: date.getMonth() + 1,
				day: date.getDate(),
				hour: date.getHours(),
				minute: date.getMinutes(),
			}

			return gt.object.toAssociation(out, indentation)
		},
	},

	object: {
		toAssociation(x, indentation) {
			assert(
				isObject(x),
				"The first argument passed into the `toAssociation` function must be a JS object!"
			)

			assert(
				isString(indentation) || isUndefined(indentation),
				"The second parameter to the `toAssociation` function must be undefined or a string!"
			)

			const newline = indentation ? "\n" : ""

			function helper(x, indentation, depth) {
				depth = depth || 0

				if (typeof x === "number" || typeof x === "bigint") {
					if (x === Infinity) {
						return '"Infinity"'
					}

					if (x === -Infinity) {
						return '"-Infinity"'
					}

					if (isNaN(x)) {
						return '"NaN"'
					}

					return x.toString()
				}

				if (typeof x === "string") {
					return stringify(x)
				}

				if (typeof x === "boolean") {
					return stringify(stringify(x))
				}

				if (typeof x === "undefined") {
					return '"undefined"'
				}

				if (typeof x === "symbol") {
					return stringify(stringify(x))
				}

				if (typeof x === "function") {
					return JSON.stringify(x.toString()).trim()
				}

				if (typeof x === "object") {
					if (x === null) {
						return '"null"'
					}

					if (isDate(x)) {
						let out = gt.date.toGTDateObject(x, indentation)

						if (indentation) {
							out = out
								.split("\n")
								.map((line, i) => {
									if (i === 0) {
										return prefix(indentation, depth - 1) + line
									}

									return prefix(indentation, depth) + line
								})
								.join("\n")
						}

						return out
					}

					if (isArray(x)) {
						if (x.length === 0) {
							return prefix(indentation, depth - 1) + "[]"
						}

						return (
							prefix(indentation, depth - 1) +
							"[" +
							newline +
							x
								.map(v => {
									let child = helper(v, indentation, depth + 1)
									if (isString(child)) child = child.trim()
									return prefix(indentation, depth + 1) + child
								})
								.join("," + newline) +
							newline +
							prefix(indentation, depth) +
							"]"
						)
					}

					if (Object.keys(x).length === 0) {
						return prefix(indentation, depth - 1) + "{}"
					}

					return (
						prefix(indentation, depth - 1) +
						"{" +
						newline +
						Object.keys(x)
							.map(key => {
								let child = helper(x[key], indentation, depth + 1)
								if (isString(child)) child = child.trim()

								return (
									prefix(indentation, depth + 1) +
									JSON.stringify(key) +
									(indentation ? " " : "") +
									"->" +
									(indentation ? " " : "") +
									child
								)
							})
							.join("," + newline) +
						newline +
						prefix(indentation, depth) +
						"}"
					)
				}

				return '"undefined"'
			}

			return helper(decycle(x), indentation)
		},
	},

	template: {
		registerLiquidFilter(name, fn) {
			liquid.registerFilter(name, fn)
		},

		async liquidBuild(template, dict) {
			return await liquid.parseAndRender(template, dict)
		},
	},

	program: {
		extractQuestions(text) {
			const questionKeywords = [
				"after",
				"answers",
				"before",
				"blank",
				"confirm",
				"countdown",
				"date",
				"default",
				"max",
				"min",
				"multiple",
				"question",
				"save",
				"shuffle",
				"tags",
				"throwaway",
				"time",
				"tip",
				"type",
			]

			const lines = text.split("\n")
			const questions = []

			lines.forEach((line, i) => {
				// make sure that the line's indentation doesn't include spaces

				if (line.split(/[^\s]/g)[0].includes(" ")) {
					throw new Error(
						`GT programs must be indented with tabs only! The indentation of line ${
							i + 1
						} in your program includes spaces!`
					)
				}

				// if this is a question line...
				if (line.trim().startsWith("*question:")) {
					// define question object
					const question = {
						question: line.replace("*question: ", "").trim(),
					}

					// find the index of the next line that whose indentation is the same
					// length or shorter than this line's indentation AND which is not an
					// empty line
					const indentation = getIndentation(line)

					const j = (() => {
						const index = lines.findIndex((other, j) => {
							return (
								j > i &&
								getIndentation(other).length <= indentation.length &&
								other.trim().length > 0
							)
						})

						if (index < 0) return lines.length
						return index
					})()

					// get the subsequent lines whose indentation is exactly this one's
					// plus a single tab
					const otherLines = lines
						.slice(i + 1, j)
						.filter(other => getIndentation(other) === indentation + "\t")

					// if there are such lines that are indented by one tab...
					if (otherLines.length > 0) {
						// for each such line...
						otherLines.forEach(other => {
							// trim the line
							other = other.trim()

							// check to see if the line starts with a keyword;
							// if it does, then set its key-value pair in the question
							// object
							let startsWithAKeyword = false

							questionKeywords.forEach(keyword => {
								if (startsWithAKeyword) return

								if (other.startsWith("*" + keyword)) {
									startsWithAKeyword = true

									const value = (() => {
										// if the line includes a colon, then it probably has a
										// key-value pair; so extract the value and return it
										if (other.includes(":")) {
											const parts = other.split(":")
											const value = parts.slice(1).join(":").trim()

											try {
												return JSON.parse(value)
											} catch (e) {
												return value
											}
										}

										// otherwise, it's probably just a boolean; so just
										// return true
										else {
											return true
										}
									})()

									question[keyword] = value
								}
							})

							// if the line DIDN'T start with a keyword, then just add the
							// line to the list of answers
							if (!startsWithAKeyword) {
								if (!question.answers) {
									question.answers = []
								}

								if (question.answers instanceof Array) {
									question.answers.push(other)
								}
							}
						})
					}

					// if the question doesn't have an explicit type, then infer it
					if (isUndefined(question.type)) {
						if (question.answers) {
							question.type = "choice"
						} else {
							question.type = "text"
						}
					}

					// add it to the list of questions
					questions.push(question)
				}
			})

			if (questions.length === 0) {
				const out = new DataFrame([questionKeywords.map(() => undefined)])
				out.columns = questionKeywords
				return out
			}

			let out = new DataFrame(
				questions.map(question =>
					questionKeywords.map(keyword => {
						const value = question[keyword]

						if (isArray(value)) {
							return stringify(value)
						} else {
							return value
						}
					})
				)
			)

			out.columns = questionKeywords

			out = out.get(
				null,
				["question"].concat(questionKeywords.filter(k => k !== "question"))
			)

			if (out instanceof Series) {
				return out.toDataFrame().transpose()
			} else {
				return out
			}
		},
	},
}

if (typeof module !== "undefined") {
	module.exports = gt
}

if (typeof window !== "undefined") {
	window.gt = gt
}
