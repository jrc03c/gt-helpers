const gt = require(".")
const { DataFrame, isEqual, isArray } = require("@jrc03c/js-math-tools")
const { stringifyArray } = require("./helpers.js")

test("tests that JS objects can be converted to GT associations", () => {
  const rights = [
    [234, 234],
    ["foo", '"foo"'],
    [true, '"true"'],
    [false, '"false"'],
    [null, '"null"'],
    [undefined, '"undefined"'],
    [[2, 3, 4], '{ "0" -> 2, "1" -> 3, "2" -> 4 }'],
    [{ hello: "world" }, '{ "hello" -> "world" }'],
    [() => {}, '"<function>"'],
  ]

  rights.forEach(pair => {
    expect(gt.object.toAssociation(pair[0])).toBe(pair[1])
  })
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
        type: undefined,
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
        type: undefined,
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
        type: undefined,
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
        type: undefined,
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
        type: undefined,
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
        type: undefined,
      },
    ].map(item =>
      keywords.map(keyword => {
        const value = item[keyword]

        if (keyword === "answers") {
          if (isArray(value)) {
            return stringifyArray(value)
          } else {
            try {
              return stringifyArray(JSON.parse(value))
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
