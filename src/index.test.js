const {
	DataFrame,
	isArray,
	isEqual,
	seed,
	random,
	round,
} = require("@jrc03c/js-math-tools")

const { unindent } = require("@jrc03c/js-text-tools")
const gt = require(".")
const makeKey = require("@jrc03c/make-key")

test("tests that JS objects can be converted to GT associations", () => {
	function double(x) {
		return x * 2
	}

	const rights = [
		[{ hello: "world" }, '{"hello"->"world"}'],
		[
			{ a: { b: { c: { d: { e: [2, 3, 4] } } } } },
			`{"a"->{"b"->{"c"->{"d"->{"e"->[2,3,4]}}}}}`,
		],
	]

	rights.forEach(pair => {
		expect(gt.object.toAssociation(pair[0])).toBe(pair[1])
	})

	const wrongs = [
		"foo",
		234,
		false,
		null,
		true,
		undefined,
		-2.3,
		-Infinity,
		double,
		Infinity,
		NaN,
		Symbol.for("Hello, world!"),
		x => x,
		[2, 3, 4],
	]

	wrongs.forEach(value => {
		expect(() => gt.object.toAssociation(value)).toThrow()
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
	const yTrue = `{"name"->"Alice","age"->23,"friends"->[{"name"->"Bob","age"->45,"friends"->[]},{"name"->"Charlize","age"->67,"friends"->[]}]}`
	const yPred = gt.object.toAssociation(x)
	expect(yPred).toBe(yTrue)

	seed(12345)

	const variables = [
		0,
		1,
		2.3,
		-2.3,
		Infinity,
		-Infinity,
		NaN,
		"foo",
		true,
		false,
		null,
		undefined,
		Symbol.for("Hello, world!"),
		x => x,
		new Date(round(random() * 10e13)),
		double,
	]

	const obj = {}
	const frontier = [obj]

	for (let i = 0; i < 100; i++) {
		const endpoint = frontier[parseInt(random() * frontier.length)]

		const value =
			random() < 1 / 4
				? []
				: random() < 1 / 4
				? {}
				: variables[parseInt(random() * variables.length)]

		if (endpoint instanceof Array) {
			endpoint.push(value)
		} else {
			const key = makeKey(parseInt(random() * 5) + 1)
			endpoint[key] = value
		}

		if (
			typeof value === "object" &&
			value !== null &&
			!(value instanceof Date)
		) {
			frontier.push(value)
		}
	}

	const bigPred = gt.object.toAssociation(obj, "	")

	const bigTrue = unindent(`
		{
			"43" -> 2.3,
			"dgg4" -> [
				0,
				"false",
				0,
				{
					"2" -> [
						"undefined"
					],
					"5" -> "x => x",
					"49" -> [
						[],
						{},
						1,
						[]
					],
					"1d" -> "x => x",
					"2e03" -> 1,
					"e2b" -> [
						-2.3,
						"Infinity",
						[],
						2.3,
						"x => x"
					],
					"d0e58" -> "x => x",
					"fd0cc" -> {
						"3897" -> "undefined",
						"bf" -> {
							"14" -> [
								-2.3
							],
							"ab1" -> [],
							"8fg" -> "x => x"
						},
						"aa9d" -> "undefined",
						"c7" -> [
							[
								[
									2.3,
									[
										[
											"true"
										],
										[]
									],
									{}
								]
							],
							[]
						],
						"a9gb" -> {
							"1c9" -> [
								"-Infinity"
							],
							"0568" -> "Symbol(Hello, world!)"
						}
					},
					"1dfce" -> 0,
					"7c" -> {
						"0c6fc" -> {},
						"d7f2d" -> {}
					},
					"f7dd" -> [
						1
					]
				},
				[
					{
						"9" -> "-Infinity",
						"189f" -> {
							"9" -> [],
							"d6" -> {
								"9deg1" -> "foo",
								"d3f" -> [
									{
										"9" -> "foo",
										"962" -> [],
										"2g2bb" -> {},
										"4b8ce" -> "Symbol(Hello, world!)",
										"e777" -> 0
									},
									2.3
								]
							},
							"9a1" -> [
								{}
							]
						},
						"f1" -> {
							"7c4" -> {
								"a" -> 0
							}
						}
					},
					{
						"5" -> 1,
						"62859" -> {},
						"begd" -> {
							"year" -> 2365,
							"month" -> 2,
							"day" -> 16,
							"hour" -> 17,
							"minute" -> 47
						}
					},
					[],
					{},
					"true",
					[
						2.3
					]
				],
				"function double(x) {\\n    return x * 2;\\n  }",
				{
					"55da" -> [
						[
							"NaN",
							"null",
							"true",
							[]
						],
						"false",
						"NaN"
					],
					"87b8" -> [
						{
							"4f" -> "foo",
							"ad" -> "x => x"
						}
					]
				},
				[]
			],
			"73aa2" -> "NaN",
			"eff" -> "x => x",
			"f95" -> "function double(x) {\\n    return x * 2;\\n  }",
			"d8g3" -> {
				"year" -> 2365,
				"month" -> 2,
				"day" -> 16,
				"hour" -> 17,
				"minute" -> 47
			},
			"6ea" -> 1
		}	
	`).trim()

	const fs = require("fs")
	fs.writeFileSync("bigPred.txt", bigPred, "utf8")
	fs.writeFileSync("bigTrue.txt", bigTrue, "utf8")

	expect(bigPred).toBe(bigTrue)
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
						return JSON.stringify(value)
					} else {
						try {
							return JSON.stringify(JSON.parse(value))
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
		"*question: What's your name?\n *type: text\n *save: theirName"
	const worseProgram =
		"*question: What's your name?\n\t	\t \t *type: text\n \t	 \t	\t*save: theirName"
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

test("tests that 1- and 2-dimensional answer arrays are properly recorded", () => {
	const program1 = [
		`*question: What's your name?`,
		`\tAlice`,
		`\tBob`,
		`\tCharlize`,
	].join("\n")

	const data1 = gt.program.extractQuestions(program1)
	const answers1True = `["Alice","Bob","Charlize"]`
	const answers1Pred = data1.get(0, "answers")
	expect(isEqual(answers1True, answers1Pred)).toBe(true)

	expect(isEqual(JSON.parse(answers1Pred), ["Alice", "Bob", "Charlize"])).toBe(
		true
	)

	const program2 = [
		`*question: Do you like pizza?`,
		`\t*answers: [["Yes", 1], ["No", 0], ["Maybe so", 0.5]]`,
	].join("\n")

	const data2 = gt.program.extractQuestions(program2)
	const answers2True = `[["Yes",1],["No",0],["Maybe so",0.5]]`
	const answers2Pred = data2.get(0, "answers")
	expect(isEqual(answers2True, answers2Pred)).toBe(true)

	expect(
		isEqual(JSON.parse(answers2Pred), [
			["Yes", 1],
			["No", 0],
			["Maybe so", 0.5],
		])
	).toBe(true)
})
