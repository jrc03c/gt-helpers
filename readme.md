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
let gt = require("gt-helpers")
let fs = require("fs")

let template = fs.readFileSync("template.gt", "utf8")
let data = {
  questions: [
    {
      text: "Why?", 
      options: JSON.stringify(["Because.", "Why not?", "I said so."])
    },
    {
      text: "How much?", 
      options: JSON.stringify(["A lot.", "A little.", "None."])
    },
    {
      text: "When?", 
      options: JSON.stringify(["Now.", "Never."])
    },
  ]
}

gt.template.liquidBuild(template, data).then(function(final){
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

I've also added a few little utility functions that make it easy to:

- strip punctuation from a string
- convert strings to camel case
- shuffle arrays (with optional seeding of the random number generator)
- reduce an array to a set
- convert a JSON object to a GT association

So, for example:

```js
// build.js
let gt = require("gt-helpers")

let stripped = gt.string.stripPunctuation("Hello, world! My name is Josh.")
console.log(stripped)
// Hello world My name is Josh

let camelCased = gt.string.toCamelCase("Hello, world! My name is Josh.")
console.log(camelCased)
// helloWorldMyNameIsJosh

let seed = 5
let shuffled = gt.array.shuffle([1, 2, 3], seed)
console.log(shuffled)
// [3, 1, 2]

let set = gt.array.toSet([1, 2, 2, 3, 2, 2, 1, 2, 2, 2, 1, 1, 1, 2, 2, 3])
console.log(set)
// [1, 2, 3]

let object = {name: "Josh", position: {x: 5, y: 7}}
let association = gt.object.toAssociation(object)
console.log(association)
// {"name" -> "Josh", "position" -> {"x" -> 5, "y" -> 7}}

let date = new Date("December 10, 2019 10:30:00")
let gtDate = gt.date.toGTDateObject(date)
console.log(gtDate)
// { year: 2019, month: 12, day: 10, hour: 10, minute: 30 }
```
