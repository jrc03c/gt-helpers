const gt = require(".")
const { DataFrame, isEqual, isArray } = require("@jrc03c/js-math-tools")

test("tests that JS objects can be converted to GT associations", () => {
	const rights = [
		[234, 234],
		["foo", '"foo"'],
		[true, '"true"'],
		[false, '"false"'],
		[null, '"null"'],
		[undefined, '"undefined"'],
		[[2, 3, 4], "[2, 3, 4]"],
		[{ hello: "world" }, '{ "hello" -> "world" }'],
		[() => {}, '"<function>"'],
	]

	rights.forEach(pair => {
		expect(gt.object.toAssociation(pair[0])).toBe(pair[1])
	})

	class Person {
		constructor(name, age) {
			const self = this
			self.name = name
			self.age = age
			self.friends = []
		}

		addFriend(friend) {
			const self = this
			self.friends.push(friend)
			return self
		}
	}

	const alice = new Person("Alice", 23)
	const bob = new Person("Bob", 45)
	const charlize = new Person("Charlize", 67)
	alice.addFriend(bob)
	alice.addFriend(charlize)

	const x = JSON.parse(JSON.stringify(alice))
	const yTrue = `{ "name" -> "Alice", "age" -> 23, "friends" -> [{ "name" -> "Bob", "age" -> 45, "friends" -> [] }, { "name" -> "Charlize", "age" -> 67, "friends" -> [] }] }`
	const yPred = gt.object.toAssociation(x)
	expect(yPred).toBe(yTrue)
})

test("tests that questions can be successfully extracted from a GT program string", () => {
	const keywords = [
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

	const program = `
		*question: What is your name?
			*before: My name is
			*save: theirName

		*question: How old are you?
			*type: slider
			*min: 0
			*max: 150
			*save: theirAge

		*question: Which of these ice cream flavors is your favorite?
			*tip: If none of them is your favorite, then just pick whichever one you like most.
			*save: theirFavoriteIceCream

			Chocolate

				*question: Yay! Chocolate is great, isn't it?
					Yes!
					Very yes!

			Vanilla

				*question: Hm. It seems like maybe something is wrong with you. Do you agree?
					Yes
					Maybe
					No

			Strawberry

				*question: Well, I think I'd like you better if you preferred chocolate, but this is good enough for now.
					Yeah, you're probably right.
					You know what? I don't care what you think.

		*question: Do you like penguins?
			*answers: [["Yes", 1], ["No", 0]]
			*save: likesPenguins

		*question: How many donuts did you eat today?
			*type: number
			*save: donutsToday

		*question: What was the date one week ago?
			*type: calendar
			*date: yes
			*time: no
			*save: oneWeekAgoDate

		*question: Which of these are your favorite things?
			*type: checkbox
			Raindrops on roses
			Whiskers on kittens
			Bright copper kettles
			Warm woolen mittens
			Brown paper packages tied up with strings

		*question: Tell me your life story.
			*type: paragraph
	`

	const yPred = gt.program.extractQuestions(program).get(null, keywords)

	let yTrue = new DataFrame(
		[
			{
				after: undefined,
				answers: undefined,
				before: "My name is",
				blank: undefined,
				confirm: undefined,
				countdown: undefined,
				date: undefined,
				default: undefined,
				max: undefined,
				min: undefined,
				multiple: undefined,
				question: "What is your name?",
				save: "theirName",
				shuffle: undefined,
				tags: undefined,
				throwaway: undefined,
				time: undefined,
				tip: undefined,
				type: "text",
			},

			{
				after: undefined,
				answers: undefined,
				before: undefined,
				blank: undefined,
				confirm: undefined,
				countdown: undefined,
				date: undefined,
				default: undefined,
				max: 150,
				min: 0,
				multiple: undefined,
				question: "How old are you?",
				save: "theirAge",
				shuffle: undefined,
				tags: undefined,
				throwaway: undefined,
				time: undefined,
				tip: undefined,
				type: "slider",
			},

			{
				after: undefined,
				answers: `["Chocolate", "Vanilla", "Strawberry"]`,
				before: undefined,
				blank: undefined,
				confirm: undefined,
				countdown: undefined,
				date: undefined,
				default: undefined,
				max: undefined,
				min: undefined,
				multiple: undefined,
				question: "Which of these ice cream flavors is your favorite?",
				save: "theirFavoriteIceCream",
				shuffle: undefined,
				tags: undefined,
				throwaway: undefined,
				time: undefined,
				tip: "If none of them is your favorite, then just pick whichever one you like most.",
				type: "choice",
			},

			{
				after: undefined,
				answers: ["Yes!", "Very yes!"],
				before: undefined,
				blank: undefined,
				confirm: undefined,
				countdown: undefined,
				date: undefined,
				default: undefined,
				max: undefined,
				min: undefined,
				multiple: undefined,
				question: "Yay! Chocolate is great, isn't it?",
				save: undefined,
				shuffle: undefined,
				tags: undefined,
				throwaway: undefined,
				time: undefined,
				tip: undefined,
				type: "choice",
			},

			{
				after: undefined,
				answers: ["Yes", "Maybe", "No"],
				before: undefined,
				blank: undefined,
				confirm: undefined,
				countdown: undefined,
				date: undefined,
				default: undefined,
				max: undefined,
				min: undefined,
				multiple: undefined,
				question:
					"Hm. It seems like maybe something is wrong with you. Do you agree?",
				save: undefined,
				shuffle: undefined,
				tags: undefined,
				throwaway: undefined,
				time: undefined,
				tip: undefined,
				type: "choice",
			},

			{
				after: undefined,
				answers: [
					"Yeah, you're probably right.",
					"You know what? I don't care what you think.",
				],
				before: undefined,
				blank: undefined,
				confirm: undefined,
				countdown: undefined,
				date: undefined,
				default: undefined,
				max: undefined,
				min: undefined,
				multiple: undefined,
				question:
					"Well, I think I'd like you better if you preferred chocolate, but this is good enough for now.",
				save: undefined,
				shuffle: undefined,
				tags: undefined,
				throwaway: undefined,
				time: undefined,
				tip: undefined,
				type: "choice",
			},

			{
				after: undefined,
				answers: `[["Yes", 1], ["No", 0]]`,
				before: undefined,
				blank: undefined,
				confirm: undefined,
				countdown: undefined,
				date: undefined,
				default: undefined,
				max: undefined,
				min: undefined,
				multiple: undefined,
				question: "Do you like penguins?",
				save: "likesPenguins",
				shuffle: undefined,
				tags: undefined,
				throwaway: undefined,
				time: undefined,
				tip: undefined,
				type: "choice",
			},

			{
				after: undefined,
				answers: undefined,
				before: undefined,
				blank: undefined,
				confirm: undefined,
				countdown: undefined,
				date: undefined,
				default: undefined,
				max: undefined,
				min: undefined,
				multiple: undefined,
				question: "How many donuts did you eat today?",
				save: "donutsToday",
				shuffle: undefined,
				tags: undefined,
				throwaway: undefined,
				time: undefined,
				tip: undefined,
				type: "number",
			},

			{
				after: undefined,
				answers: undefined,
				before: undefined,
				blank: undefined,
				confirm: undefined,
				countdown: undefined,
				date: "yes",
				default: undefined,
				max: undefined,
				min: undefined,
				multiple: undefined,
				question: "What was the date one week ago?",
				save: "oneWeekAgoDate",
				shuffle: undefined,
				tags: undefined,
				throwaway: undefined,
				time: "no",
				tip: undefined,
				type: "calendar",
			},

			{
				after: undefined,
				answers: [
					"Raindrops on roses",
					"Whiskers on kittens",
					"Bright copper kettles",
					"Warm woolen mittens",
					"Brown paper packages tied up with strings",
				],
				before: undefined,
				blank: undefined,
				confirm: undefined,
				countdown: undefined,
				date: undefined,
				default: undefined,
				max: undefined,
				min: undefined,
				multiple: undefined,
				question: "Which of these are your favorite things?",
				save: undefined,
				shuffle: undefined,
				tags: undefined,
				throwaway: undefined,
				time: undefined,
				tip: undefined,
				type: "checkbox",
			},

			{
				after: undefined,
				answers: undefined,
				before: undefined,
				blank: undefined,
				confirm: undefined,
				countdown: undefined,
				date: undefined,
				default: undefined,
				max: undefined,
				min: undefined,
				multiple: undefined,
				question: "Tell me your life story.",
				save: undefined,
				shuffle: undefined,
				tags: undefined,
				throwaway: undefined,
				time: undefined,
				tip: undefined,
				type: "paragraph",
			},
		].map(item =>
			keywords.map(keyword => {
				const value = item[keyword]

				if (keyword === "answers") {
					if (isArray(value)) {
						return value.join(" || ")
					} else {
						try {
							return JSON.parse(value).join(" || ")
						} catch (e) {
							return value
						}
					}
				} else {
					return value
				}
			})
		)
	)

	yTrue.columns = keywords
	yTrue = yTrue.get(null, keywords)

	expect(isEqual(yPred, yTrue)).toBe(true)
})

test("tests that errors are thrown in a program's indentation includes spaces", () => {
	const badProgram =
		"*question: What's your name?\n  *type: text\n  *save: theirName"
	const worseProgram =
		"*question: What's your name?\n\t  \t \t *type: text\n \t   \t  \t*save: theirName"
	const okayProgram =
		"*question: What's your name?\n\t\t\t*type: text\n\t\t\t*save: theirName"

	expect(() => {
		gt.program.extractQuestions(badProgram)
	}).toThrow()

	expect(() => {
		gt.program.extractQuestions(worseProgram)
	})

	expect(() => {
		gt.program.extractQuestions(okayProgram)
	}).not.toThrow()
})

test("tests that answers in multiple-choice and checkbox questions can be read as arrays", () => {
	const program = [
		"*question: What is your name?",
		"\tAlice",
		"\tBob",
		"\tCharlize",
	].join("\n")

	const data = gt.program.extractQuestions(program)
	const answers = data.get(0, "answers").split(" || ")

	expect(answers instanceof Array).toBe(true)
	expect(answers.length).toBe(3)
	expect(isEqual(answers, ["Alice", "Bob", "Charlize"])).toBe(true)
})
