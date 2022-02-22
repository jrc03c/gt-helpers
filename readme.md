**gt-helpers** is a set of tools for creating GuidedTrack programs. Its main use is compiling GT programs in Liquid template form into finished GT programs, though it has a few other little tools as well.

**Installation**

To use in Node:

`npm install --save https://github.com/jrc03c/gt-helpers`

To use in the browser:

1. Clone this repo
2. Attach the dist/gt-helpers.js script to a web page, which will make the `gt` object accessible as a global variable

**Examples**

To compile a simple Liquid template, start with a GT program that mixes in Liquid templating syntax:

```
-- template.gt
This is a GT program!

{% for question in questions %}
*question: {{ question.text }}
	*answers: {{ question.options }}
{% endfor %}
```

Create a JS file that handles the build process:

```js
// build.js
const gt = require("gt-helpers")
const fs = require("fs")

const template = fs.readFileSync("template.gt", "utf8")

const data = {
  questions: [
    {
      text: "Why?",
      options: JSON.stringify(["Because.", "Why not?", "I said so."]),
    },
    {
      text: "How much?",
      options: JSON.stringify(["A lot.", "A little.", "None."]),
    },
    {
      text: "When?",
      options: JSON.stringify(["Now.", "Never."]),
    },
  ],
}

gt.template.liquidBuild(template, data).then(final => {
  fs.writeFileSync("final.gt", final, "utf8")
})
```

And then invoke the JS file:

`node build.js`

This produces:

```
-- template.gt
This is a GT program!


*question: Why?
	*answers: ["Because.","Why not?","I said so."]

*question: How much?
	*answers: ["A lot.","A little.","None."]

*question: When?
	*answers: ["Now.","Never."]
```

**NOTE:** Since GT syntax relies on using tabs for indentation, make sure that _both_ your GT template _and_ your JS file uses tabs to avoid ending up with a compiled GT program that uses spaced indentation!

I've also added some little utility functions that make it easy to:

- convert a JSON object to a GT association
- convert a JS `Date` object to a GT datetime object

So, for example:

```js
const gt = require("gt-helpers")

const object = { name: "Josh", position: { x: 5, y: 7 } }
const association = gt.object.toAssociation(object)
console.log(association)
// '{"name" -> "Josh", "position" -> {"x" -> 5, "y" -> 7}}'

const date = new Date("December 10, 2019 10:30:00")
const gtDate = gt.date.toGTDateObject(date)
console.log(gtDate)
// '{ "year" -> 2019, "month" -> 12, "day" -> 10, "hour" -> 10, "minute" -> 30 }'
```

It's also possible (but experimental) to extract questions from the text of a GT program like this:

```js
const gt = require(".")
const program = `
	*question: How old are you?
		*type: number
		*save: age

	*question: What is your name?
		*save: name

	*question: Which of these is your favorite ice cream flavor?
		*tip: If these aren't your favorites, then just pick which one of the three you like best.
		Chocolate
		Vanilla
		Strawberry
`

const questionData = gt.program.extractQuestions(program)
questionData.print()
```

![](https://i.ibb.co/3c329sm/questions.png)

The returned data is a [js-math-tools](https://github.com/jrc03c/js-math-tools) `DataFrame`.
