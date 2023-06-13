const {
	DataFrame,
	isArray,
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
		toGTDateObject(date) {
			const out = {
				year: date.getFullYear(),
				month: date.getMonth() + 1,
				day: date.getDate(),
				hour: date.getHours(),
				minute: date.getMinutes(),
			}

			return gt.object.toAssociation(out)
		},
	},

	object: {
		toAssociation(obj, indentation) {
			function helper(obj, depth) {
				const newline = indentation ? "\n" : ""
				depth = depth || 0
				const type = typeof obj

				if (type === "string") return stringify(obj)
				if (type === "number") return obj
				if (type === "boolean") return stringify(obj.toString())

				if (type === "function") {
					return stringify(
						`<function ${
							obj.name.trim().length === 0 ? "anonymous" : obj.name
						}>`
					)
				}

				if (type === "undefined") return stringify("undefined")
				if (obj === null) return stringify("null")

				if (obj instanceof Array) {
					if (obj.length === 0) {
						return prefix(indentation, depth - 1) + "[]"
					}

					return (
						prefix(indentation, depth - 1) +
						"[" +
						newline +
						obj
							.map(v => {
								let child = helper(v, depth + 1)

								if (typeof child === "string") {
									child = child.trim()
								}

								return prefix(indentation, depth + 1) + child
							})
							.join("," + newline) +
						prefix(indentation, depth) +
						newline +
						"]"
					)
				} else {
					const keys = Object.keys(obj)

					if (keys.length === 0) {
						return prefix(indentation, depth - 1) + "{}"
					}

					return (
						prefix(indentation, depth - 1) +
						"{" +
						newline +
						keys
							.map(key => {
								let child = helper(obj[key], depth + 1)

								if (typeof child === "string") {
									child = child.trim()
								}

								return (
									prefix(indentation, depth + 1) +
									stringify(key) +
									(indentation ? " " : "") +
									"->" +
									(indentation ? " " : "") +
									child
								)
							})
							.join("," + newline) +
						prefix(indentation, depth) +
						newline +
						"}"
					)
				}
			}

			return helper(obj)
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
				// make sure that the line's indentation doesn't include tabs
				const pattern = /^\s* \s*[^\s]/g

				if (line.match(pattern)) {
					throw new Error(
						`GT programs must be indented with spaces only! The indentation of line ${
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
