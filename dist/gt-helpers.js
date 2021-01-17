(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
let tools = require("js-math-tools")
let Liquid = require("liquidjs").Liquid
let liquid = new Liquid()

let gt = {
	date: {
		toGTDateObject: function(date){
			let out = {
				"year": date.getFullYear(),
				"month": date.getMonth()+1,
				"day": date.getDate(),
				"hour": date.getHours(),
				"minute": date.getMinutes(),
			}

			return out
		},
	},

	string: {
		stripPunctuation: function(string){
			let valid = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890 \t\n\r"
			let out = ""

			for (let i=0; i<string.length; i++){
				let char = string[i]
				if (valid.includes(char)) out += char
			}

			while (out.includes("\t")) out = out.replace("\t", " ")
			while (out.includes("\n")) out = out.replace("\n", " ")
			while (out.includes("\r")) out = out.replace("\r", " ")
			while (out.includes("  ")) out = out.replace("  ", " ")

			return out
		},

		toCamelCase: function(string){
			let array = gt.string.stripPunctuation(string).split(" ").filter(s => s.length > 0)
			let out = array[0].toLowerCase()

			for (let i=1; i<array.length; i++){
				let s = array[i]
				out += s[0].toUpperCase() + s.slice(1, s.length).toLowerCase()
			}

			return out
		},
	},

	array: {
		shuffle: function(array, seed){
			tools.math.seed(seed)
			return tools.math.shuffle(array)
		},

		toSet: function(array){
			return tools.math.set(array)
		},
	},

	object: {
		toAssociation(obj){
			function recursiveParse(obj){
				let type = typeof(obj)

				if (type === "string") return JSON.stringify(obj)
				if (type === "number") return obj

				let pairs = []

				Object.keys(obj).forEach(function(key){
					let val = recursiveParse(obj[key])
					pairs.push(`"` + key + `" -> ` + val)
				})

				return "{" + pairs.join(", ") + "}"
			}

			return recursiveParse(obj)
		}
	},

	template: {
		build: function(templateString, variableDict){
			// variable syntax: {$ variable $}
			let out = templateString
			let rx = /\{\$ ?(.*?) ?\$\}/g
			placeholders = templateString.match(rx)

			if (!placeholders) return out

			placeholders.forEach(function(placeholder){
				let abbrev = placeholder.split(" ").join("").replace("{$", "").replace("$}", "")
				if (!variableDict[abbrev]) throw "No definition for " + abbrev + "."

				while (out.includes(placeholder)){
					out = out.replace(placeholder, variableDict[abbrev])
				}
			})

			return out
		},

		liquidBuild: async function(templateString, variableDict){
			return await liquid.parseAndRender(templateString, variableDict)
		},
	},
}

try {module.exports = gt} catch(e){}
try {window.gt = gt} catch(e){}

},{"js-math-tools":5,"liquidjs":77}],2:[function(require,module,exports){
let out = {
  downloadCanvas: require("./download-canvas.js"),
  Plot: require("./plot.js"),
}

module.exports = out

},{"./download-canvas.js":3,"./plot.js":4}],3:[function(require,module,exports){
function downloadCanvas(canvas, filename){
  let a = document.createElement("a")
  a.href = canvas.toDataURL()
  a.download = filename
  a.dispatchEvent(new MouseEvent("click"))
}

module.exports = downloadCanvas

},{}],4:[function(require,module,exports){
let map = require("../math/map.js")
let max = require("../math/max.js")
let downloadCanvas = require("./download-canvas.js")
let assert = require("../misc/assert.js")
let isUndefined = require("../math/is-undefined.js")
let isNumber = require("../math/is-number.js")
let isString = require("../math/is-string.js")
let isBoolean = require("../math/is-boolean.js")
let isArray = require("../math/is-array.js")
let isEqual = require("../math/is-equal.js")
let shape = require("../math/shape.js")
let flatten = require("../math/flatten.js")
let distrib = require("../math/distrib.js")
let scale = require("../math/scale.js")

function Plot(canvas){
  assert(!isUndefined(canvas), "You must pass an HTML5 canvas element into the `Plot` constructor!")
  assert(canvas.constructor.name === "HTMLCanvasElement", "You must pass an HTML5 canvas element into the `Plot` constructor!")

  let self = this

  let xmin = -1
  let xmax = 1
  let ymin = -1
  let ymax = 1
  let fillColor = "black"
  let strokeColor = "black"
  let dotSize = 5
  let lineThickness = 1
  let axesAreVisible = true
  let textStyle = {
    family: "monospace",
    size: 12,
    alignment: "center",
    baseline: "middle",
    isBold: false,
    isItalicized: false,
    lineHeight: 14,
    color: "black",
  }

  let context = canvas.getContext("2d")
  let width = canvas.width
  let height = canvas.height

  self.setOpacity = function(a){
    assert(!isUndefined(a), "You must pass a number between 0 and 1 into the plot's `setOpacity` method!")
    assert(isNumber(a), "You must pass a number between 0 and 1 into the plot's `setOpacity` method!")
    assert(a >= 0 && a <= 1, "You must pass a number between 0 and 1 into the plot's `setOpacity` method!")

    context.globalAlpha = a
    return self
  }

  self.setFillColor = function(c){
    assert(!isUndefined(c), "You must pass a color string into the plot's `setFillColor` method!")
    assert(isString(c), "You must pass a color string into the plot's `setFillColor` method!")

    fillColor = c
    return self
  }

  self.setLineColor = function(c){
    assert(!isUndefined(c), "You must pass a color string into the plot's `setLineColor` method!")
    assert(isString(c), "You must pass a color string into the plot's `setLineColor` method!")

    strokeColor = c
    return self
  }

  self.setDotSize = function(s){
    assert(!isUndefined(s), "You must pass a positive number into the plot's `setDotSize` method!")
    assert(isNumber(s), "You must pass a positive number into the plot's `setDotSize` method!")
    assert(s >= 0, "You must pass a positive number into the plot's `setDotSize` method!")

    dotSize = s
    return self
  }

  self.setLineThickness = function(t){
    assert(!isUndefined(t), "You must pass a positive number into the plot's `setLineThickness` method!")
    assert(isNumber(t), "You must pass a positive number into the plot's `setLineThickness` method!")
    assert(t >= 0, "You must pass a positive number into the plot's `setLineThickness` method!")

    lineThickness = t
    return self
  }

  self.setAxesAreVisible = function(v){
    assert(!isUndefined(v), "You must pass a boolean value into the plot's `setAxesAreVisible` method!")
    assert(isBoolean(v), "You must pass a boolean value into the plot's `setAxesAreVisible` method!")

    axesAreVisible = v
    return self
  }

  self.setTextStyle = function(t){
    assert(!isUndefined(t), "You must pass a text style string into the plot's `setTextStyle` method!")

    textStyle = t
    return self
  }

  self.setRange = function(a, b, c, d){
    assert(!isUndefined(a), "You must pass four numbers into the plot's `setRange` method!")
    assert(!isUndefined(b), "You must pass four numbers into the plot's `setRange` method!")
    assert(!isUndefined(c), "You must pass four numbers into the plot's `setRange` method!")
    assert(!isUndefined(d), "You must pass four numbers into the plot's `setRange` method!")
    assert(isNumber(a), "You must pass four numbers into the plot's `setRange` method!")
    assert(isNumber(b), "You must pass four numbers into the plot's `setRange` method!")
    assert(isNumber(c), "You must pass four numbers into the plot's `setRange` method!")
    assert(isNumber(d), "You must pass four numbers into the plot's `setRange` method!")
    assert(a < b, "The xmin value must be less than the xmax value in the plot's `setRange` method!")
    assert(c < d, "The ymin value must be less than the ymax value in the plot's `setRange` method!")

    xmin = a
    xmax = b
    ymin = c
    ymax = d
    return self
  }

  self.splitTextIntoLines = function(text, maxWidth){
    assert(!isUndefined(text), "You must pass a string and a positive number into the plot's `splitTextIntoLines` method!")
    assert(isString(text), "You must pass a string and a positive number into the plot's `splitTextIntoLines` method!")
    assert(!isUndefined(maxWidth), "You must pass a string and a positive number into the plot's `splitTextIntoLines` method!")
    assert(isNumber(maxWidth), "You must pass a string and a positive number into the plot's `splitTextIntoLines` method!")
    assert(maxWidth >= 0, "You must pass a string and a positive number into the plot's `splitTextIntoLines` method!")

    let lines = []
    let words = text.split(" ")
    let temp = ""

    words.forEach(function(word){
      let width = context.measureText(temp + " " + word).width

      if (width > maxWidth){
        lines.push(temp)
        temp = word
      } else {
        if (temp.length === 0) temp += word
        else temp += " " + word
      }
    })

    if (temp.length > 0){
      lines.push(temp)
    }

    return lines
  }

  self.clear = function(){
    context.clearRect(0, 0, width, height)
    context.fillStyle = "white"
    context.fillRect(0, 0, width, height)
    return self
  }

  self.drawAxes = function(){
    if (axesAreVisible){
      context.fillStyle = "none"
      context.strokeStyle = "black"
      context.lineWidth = 1

      context.beginPath()
      context.moveTo(-width/2, map(0, ymin, ymax, -height/2, height/2))
      context.lineTo(width/2, map(0, ymin, ymax, -height/2, height/2))
      context.stroke()

      context.beginPath()
      context.moveTo(map(0, xmin, xmax, -width/2, width/2), -height/2)
      context.lineTo(map(0, xmin, xmax, -width/2, width/2), height/2)
      context.stroke()
    }

    return self
  }

  self.scatter = function(x, y){
    assert(!isUndefined(x), "You must pass two equally-sized one-dimensional arrays of numbers into the plot's `scatter` method!")
    assert(!isUndefined(y), "You must pass two equally-sized one-dimensional arrays of numbers into the plot's `scatter` method!")
    assert(isArray(x), "You must pass two equally-sized one-dimensional arrays of numbers into the plot's `scatter` method!")
    assert(isArray(y), "You must pass two equally-sized one-dimensional arrays of numbers into the plot's `scatter` method!")

    let xShape = shape(x)
    let yShape = shape(y)

    assert(xShape.length < 2, "You must pass two equally-sized one-dimensional arrays of numbers into the plot's `scatter` method!")
    assert(yShape.length < 2, "You must pass two equally-sized one-dimensional arrays of numbers into the plot's `scatter` method!")
    assert(isEqual(xShape, yShape), "You must pass two equally-sized one-dimensional arrays of numbers into the plot's `scatter` method!")

    context.save()
    context.translate(width/2, height/2)
    context.scale(1, -1)

    self.drawAxes()

    context.fillStyle = fillColor
    context.strokeStyle = strokeColor
    context.lineWidth = lineThickness

    for (let i=0; i<x.length; i++){
      xTemp = map(x[i], xmin, xmax, -width/2, width/2)
      yTemp = map(y[i], ymin, ymax, -height/2, height/2)

      context.beginPath()
      context.ellipse(xTemp, yTemp, dotSize / 2, dotSize / 2, 0, 0, Math.PI * 2)
      if (fillColor !== "none") context.fill()
      if (lineThickness > 0) context.stroke()
    }

    context.restore()
    return self
  }

  self.line = function(x, y){
    assert(!isUndefined(x), "You must pass two equally-sized one-dimensional arrays of numbers into the plot's `line` method!")
    assert(!isUndefined(y), "You must pass two equally-sized one-dimensional arrays of numbers into the plot's `line` method!")
    assert(isArray(x), "You must pass two equally-sized one-dimensional arrays of numbers into the plot's `line` method!")
    assert(isArray(y), "You must pass two equally-sized one-dimensional arrays of numbers into the plot's `line` method!")

    let xShape = shape(x)
    let yShape = shape(y)

    assert(xShape.length < 2, "You must pass two equally-sized one-dimensional arrays of numbers into the plot's `line` method!")
    assert(yShape.length < 2, "You must pass two equally-sized one-dimensional arrays of numbers into the plot's `line` method!")
    assert(isEqual(xShape, yShape), "You must pass two equally-sized one-dimensional arrays of numbers into the plot's `line` method!")

    context.save()
    context.translate(width/2, height/2)
    context.scale(1, -1)

    self.drawAxes()

    context.fillStyle = fillColor
    context.strokeStyle = strokeColor
    context.lineWidth = lineThickness

    for (let i=0; i<x.length-1; i++){
      xTemp1 = map(x[i], xmin, xmax, -width/2, width/2)
      yTemp1 = map(y[i], ymin, ymax, -height/2, height/2)
      xTemp2 = map(x[i+1], xmin, xmax, -width/2, width/2)
      yTemp2 = map(y[i+1], ymin, ymax, -height/2, height/2)

      context.beginPath()
      context.moveTo(xTemp1, yTemp1)
      context.lineTo(xTemp2, yTemp2)
      context.stroke()
    }

    context.restore()
    return self
  }

  self.dottedLine = function(x, y){
    assert(!isUndefined(x), "You must pass two equally-sized one-dimensional arrays of numbers into the plot's `dottedLine` method!")
    assert(!isUndefined(y), "You must pass two equally-sized one-dimensional arrays of numbers into the plot's `dottedLine` method!")
    assert(isArray(x), "You must pass two equally-sized one-dimensional arrays of numbers into the plot's `dottedLine` method!")
    assert(isArray(y), "You must pass two equally-sized one-dimensional arrays of numbers into the plot's `dottedLine` method!")

    let xShape = shape(x)
    let yShape = shape(y)

    assert(xShape.length < 2, "You must pass two equally-sized one-dimensional arrays of numbers into the plot's `dottedLine` method!")
    assert(yShape.length < 2, "You must pass two equally-sized one-dimensional arrays of numbers into the plot's `dottedLine` method!")
    assert(isEqual(xShape, yShape), "You must pass two equally-sized one-dimensional arrays of numbers into the plot's `dottedLine` method!")

    context.save()
    context.translate(width/2, height/2)
    context.scale(1, -1)

    self.drawAxes()

    context.fillStyle = fillColor
    context.strokeStyle = strokeColor
    context.lineWidth = lineThickness

    for (let i=0; i<x.length-1; i+=2){
      try {
        xTemp1 = map(x[i], xmin, xmax, -width/2, width/2)
        yTemp1 = map(y[i], ymin, ymax, -height/2, height/2)
        xTemp2 = map(x[i+1], xmin, xmax, -width/2, width/2)
        yTemp2 = map(y[i+1], ymin, ymax, -height/2, height/2)

        context.beginPath()
        context.moveTo(xTemp1, yTemp1)
        context.lineTo(xTemp2, yTemp2)
        context.stroke()
      } catch(e){}
    }

    context.restore()
    return self
  }

  self.bar = function(values, colors){
    assert(!isUndefined(values), "You must pass two equally-sized one-dimensional arrays into the plot's `bar` method: an array of numeric values and array of color strings!")
    assert(!isUndefined(colors), "You must pass two equally-sized one-dimensional arrays into the plot's `bar` method: an array of numeric values and array of color strings!")
    assert(isArray(values), "You must pass two equally-sized one-dimensional arrays into the plot's `bar` method: an array of numeric values and array of color strings!")
    assert(isArray(colors), "You must pass two equally-sized one-dimensional arrays into the plot's `bar` method: an array of numeric values and array of color strings!")

    let valuesShape = shape(values)
    let colorsShape = shape(colors)

    assert(valuesShape.length < 2, "You must pass two equally-sized one-dimensional arrays into the plot's `bar` method: an array of numeric values and array of color strings!")
    assert(colorsShape.length < 2, "You must pass two equally-sized one-dimensional arrays into the plot's `bar` method: an array of numeric values and array of color strings!")
    assert(isEqual(valuesShape, colorsShape), "You must pass two equally-sized one-dimensional arrays into the plot's `bar` method: an array of numeric values and array of color strings!")

    values.forEach(function(value){
      assert(isNumber(value), "You must pass two equally-sized one-dimensional arrays into the plot's `bar` method: an array of numeric values and array of color strings!")
    })

    colors.forEach(function(color){
      assert(isString(color), "You must pass two equally-sized one-dimensional arrays into the plot's `bar` method: an array of numeric values and array of color strings!")
    })

    let maxValue = max(values)
    self.setRange(1, 2 + values.length, -0.1 * maxValue, 1.1 * maxValue)

    context.save()
    context.translate(width/2, height/2)
    context.scale(1, -1)

    context.strokeStyle = strokeColor
    context.lineWidth = lineThickness

    let barThickness = 0.5

    for (let i=0; i<values.length; i++){
      context.fillStyle = colors[i]

      let xTemp = map((i + 2) - barThickness / 2, xmin, xmax, -width/2, width/2)
      let yTemp = map(0, ymin, ymax, -height/2, height/2)
      let wTemp = map(barThickness, 0, xmax - xmin, 0, width)
      let hTemp = map(values[i], 0, ymax - ymin, 0, height)

      if (colors[i] !== "none") context.fillRect(xTemp, yTemp, wTemp, hTemp)
      if (lineThickness > 0) context.strokeRect(xTemp, yTemp, wTemp, hTemp)
    }

    self.drawAxes()
    context.restore()
    return self
  }

  self.hist = function(x, bins, isDensity){
    assert(!isUndefined(x), "You must pass an array of numbers (and optionally an integer number of bins and a boolean that determines whether or not to display the histogram as a density plot) into the plot's `hist` method!")
    assert(isArray(x), "You must pass an array of numbers (and optionally an integer number of bins and a boolean that determines whether or not to display the histogram as a density plot) into the plot's `hist` method!")

    let temp = flatten(x)
    temp.forEach(v => assert(isNumber(v), "You must pass an array of numbers (and optionally an integer number of bins and a boolean that determines whether or not to display the histogram as a density plot) into the plot's `hist` method!"))

    if (isUndefined(bins)){
      bins = parseInt(Math.sqrt(temp.length))
    } else {
      assert(isNumber(bins), "You must pass an array of numbers (and optionally an integer number of bins and a boolean that determines whether or not to display the histogram as a density plot) into the plot's `hist` method!")
      assert(bins === parseInt(bins), "You must pass an array of numbers (and optionally an integer number of bins and a boolean that determines whether or not to display the histogram as a density plot) into the plot's `hist` method!")
    }

    if (isUndefined(isDensity)){
      isDensity = false
    } else {
      assert(isBoolean(isDensity), "You must pass an array of numbers (and optionally an integer number of bins and a boolean that determines whether or not to display the histogram as a density plot) into the plot's `hist` method!")
    }

    let y = distrib(temp, bins)

    context.save()
    context.translate(width/2, height/2)
    context.scale(1, -1)
    self.drawAxes()
    context.fillStyle = fillColor
    context.strokeStyle = strokeColor
    context.lineWidth = lineThickness

    temp = apply(temp, v => map(v, xmin, xmax, -width/2, width/2))
    let start = min(temp)
    let stop = max(temp)
    let step = (stop - start) / bins
    x = range(start, stop, step)
    y = apply(y, v => map(v, 0, ymax - ymin, 0, height))

    if (isDensity){
      y = apply(y, v => v / temp.length)
    }

    for (let i=0; i<x.length; i++){
      context.fillRect(x[i], map(0, ymin, ymax, -height/2, height/2), step, y[i])
      context.strokeRect(x[i], map(0, ymin, ymax, -height/2, height/2), step, y[i])
    }

    context.restore()
    return self
  }

  self.gkde = function(x, bandwidth, scalar, resolution){
    assert(!isUndefined(x), "You must pass an array of numbers (and optionally a numeric bandwidth value, a numeric scale value, and a numeric resolution value) into the plot's `gkde` method!")
    assert(isArray(x), "You must pass an array of numbers (and optionally a numeric bandwidth value, a numeric scale value, and a numeric resolution value) into the plot's `gkde` method!")

    let temp = flatten(x)
    temp.forEach(v => assert(isNumber(v), "You must pass an array of numbers (and optionally a numeric bandwidth value, a numeric scale value, and a numeric resolution value) into the plot's `gkde` method!"))

    if (isUndefined(bandwidth)){
      bandwidth = 0.5
    } else {
      assert(isNumber(bandwidth), "You must pass an array of numbers (and optionally a numeric bandwidth value, a numeric scale value, and a numeric resolution value) into the plot's `gkde` method!")
    }

    if (isUndefined(scalar)){
      scalar = 1
    } else {
      assert(isNumber(scalar), "You must pass an array of numbers (and optionally a numeric bandwidth value, a numeric scale value, and a numeric resolution value) into the plot's `gkde` method!")
    }

    if (isUndefined(resolution)){
      resolution = 50
    } else {
      assert(isNumber(resolution), "You must pass an array of numbers (and optionally a numeric bandwidth value, a numeric scale value, and a numeric resolution value) into the plot's `gkde` method!")
    }

    let k = vectorize(function(x, h){
      return Math.exp(-(x * x) / (2 * h * h))
    })

    let f = function(y, x, h){
      return apply(y, v => sum(k(scale(add(v, scale(x, -1)), 1 / h), h)))
    }

    let start = min(temp)
    let stop = max(temp)
    let step = (stop - start) / resolution
    x = range(start - step * 20, stop + step * 20, step)
    let y = f(x, temp, bandwidth)
    let yMin = min(y)
    let yMax = max(y)
    y = apply(y, v => map(v, yMin, yMax, 0, scalar))

    x = apply(x, v => map(v, xmin, xmax, -width/2, width/2))
    y = apply(y, v => map(v, ymin, ymax, -height/2, height/2))
    let yZero = map(0, ymin, ymax, -height/2, height/2)

    context.save()
    context.translate(width/2, height/2)
    context.scale(1, -1)
    self.drawAxes()

    context.beginPath()
    context.moveTo(x[0], yZero)
    context.lineTo(x[0], y[0])

    for (let i=0; i<x.length; i++){
      context.lineTo(x[i], y[i])
    }

    context.lineTo(x[x.length-1], yZero)
    context.fillStyle = fillColor
    context.strokeStyle = strokeColor
    context.lineWidth = lineThickness
    context.fill()
    context.stroke()
    context.restore()
    return self
  }

  self.text = function(text, x, y, rotation, maxWidth){
    assert(!isUndefined(text), "You must pass a string and two numbers for coordinates (and optionally a positive third number for the maximum width of the text) into the plot's `text` method!")
    assert(!isUndefined(x), "You must pass a string and two numbers for coordinates (and optionally a positive third number for the maximum width of the text) into the plot's `text` method!")
    assert(!isUndefined(y), "You must pass a string and two numbers for coordinates (and optionally a positive third number for the maximum width of the text) into the plot's `text` method!")

    assert(isString(text), "You must pass a string and two numbers for coordinates (and optionally a positive third number for the maximum width of the text) into the plot's `text` method!")
    assert(isNumber(x), "You must pass a string and two numbers for coordinates (and optionally a positive third number for the maximum width of the text) into the plot's `text` method!")
    assert(isNumber(y), "You must pass a string and two numbers for coordinates (and optionally a positive third number for the maximum width of the text) into the plot's `text` method!")

    if (!isUndefined(maxWidth)){
      assert(isNumber(maxWidth), "You must pass a string and two numbers for coordinates (and optionally a positive third number for the maximum width of the text) into the plot's `text` method!")
      assert(maxWidth >= 0, "You must pass a string and two numbers for coordinates (and optionally a positive third number for the maximum width of the text) into the plot's `text` method!")
    }

    context.save()
    context.translate(width/2, height/2)
    context.rotate(rotation)
    context.scale(1, -1)

    context.fillStyle = textStyle.color
    context.font = `${textStyle.isBold ? "bold" : ""} ${textStyle.isItalicized ? "italic" : ""} ${textStyle.size}px ${textStyle.family}`
    context.textAlign = textStyle.alignment
    context.textBaseline = textStyle.baseline

    let lines

    if (maxWidth){
      lines = self.splitTextIntoLines(text, map(maxWidth, 0, xmax - xmin, 0, width))
    } else {
      lines = [text]
    }

    lines.forEach(function(line, index){
      context.save()
      context.translate(map(x, xmin, xmax, -width/2, width/2), map(y, ymin, ymax, -height/2, height/2) - index * textStyle.lineHeight)
      context.scale(1, -1)
      context.fillText(line, 0, 0)
      context.restore()
    })

    context.restore()
    return self
  }

  self.getContext = function(){
    return context
  }

  self.download = function(filename){
    if (!isUndefined(filename)){
      assert(isString(filename), "You must pass a string (or nothing at all) into the plot's `download` method!")
    }

    filename = filename || "untitled.png"
    downloadCanvas(canvas, filename)
    return self
  }
}

module.exports = Plot

},{"../math/distrib.js":23,"../math/flatten.js":25,"../math/is-array.js":29,"../math/is-boolean.js":30,"../math/is-equal.js":31,"../math/is-number.js":33,"../math/is-string.js":34,"../math/is-undefined.js":35,"../math/map.js":38,"../math/max.js":39,"../math/scale.js":52,"../math/shape.js":55,"../misc/assert.js":72,"./download-canvas.js":3}],5:[function(require,module,exports){
let out = {
  canvas: require("./canvas/__index__.js"),
  math: require("./math/__index__.js"),
  misc: require("./misc/__index__.js"),
}

out.dump = function(){
  out.misc.dump(out.canvas)
  out.misc.dump(out.math)
  out.misc.dump(out.misc)
}

try {
  module.exports = out
} catch(e){}

try {
  window.JSMathTools = out
} catch(e){}

},{"./canvas/__index__.js":2,"./math/__index__.js":6,"./misc/__index__.js":69}],6:[function(require,module,exports){
let out = {
  abs: require("./abs.js"),
  add: require("./add.js"),
  append: require("./append.js"),
  arccos: require("./arccos.js"),
  arcsin: require("./arcsin.js"),
  arctan: require("./arctan.js"),
  ceil: require("./ceil.js"),
  chop: require("./chop.js"),
  clamp: require("./clamp.js"),
  cohensd: require("./cohens-d.js"),
  copy: require("./copy.js"),
  correl: require("./correl.js"),
  cos: require("./cos.js"),
  count: require("./count.js"),
  covariance: require("./covariance.js"),
  distance: require("./distance.js"),
  distrib: require("./distrib.js"),
  dot: require("./dot.js"),
  flatten: require("./flatten.js"),
  floor: require("./floor.js"),
  identity: require("./identity.js"),
  inverse: require("./inverse.js"),
  isArray: require("./is-array.js"),
  isBoolean: require("./is-boolean.js"),
  isEqual: require("./is-equal.js"),
  isFunction: require("./is-function.js"),
  isNumber: require("./is-number.js"),
  isString: require("./is-string.js"),
  isUndefined: require("./is-undefined.js"),
  lerp: require("./lerp.js"),
  log: require("./log.js"),
  map: require("./map.js"),
  max: require("./max.js"),
  mean: require("./mean.js"),
  median: require("./median.js"),
  min: require("./min.js"),
  mode: require("./mode.js"),
  ndarray: require("./ndarray.js"),
  normal: require("./normal.js"),
  ones: require("./ones.js"),
  pow: require("./pow.js"),
  random: require("./random.js"),
  range: require("./range.js"),
  reverse: require("./reverse.js"),
  round: require("./round.js"),
  scale: require("./scale.js"),
  seed: require("./seed.js"),
  set: require("./set.js"),
  shape: require("./shape.js"),
  shuffle: require("./shuffle.js"),
  sign: require("./sign.js"),
  sin: require("./sin.js"),
  slice: require("./slice.js"),
  sort: require("./sort.js"),
  sqrt: require("./sqrt.js"),
  std: require("./std.js"),
  sum: require("./sum.js"),
  tan: require("./tan.js"),
  transpose: require("./transpose.js"),
  variance: require("./variance.js"),
  vectorize: require("./vectorize.js"),
  zeros: require("./zeros.js"),
}

module.exports = out

},{"./abs.js":7,"./add.js":8,"./append.js":9,"./arccos.js":10,"./arcsin.js":11,"./arctan.js":12,"./ceil.js":13,"./chop.js":14,"./clamp.js":15,"./cohens-d.js":16,"./copy.js":17,"./correl.js":18,"./cos.js":19,"./count.js":20,"./covariance.js":21,"./distance.js":22,"./distrib.js":23,"./dot.js":24,"./flatten.js":25,"./floor.js":26,"./identity.js":27,"./inverse.js":28,"./is-array.js":29,"./is-boolean.js":30,"./is-equal.js":31,"./is-function.js":32,"./is-number.js":33,"./is-string.js":34,"./is-undefined.js":35,"./lerp.js":36,"./log.js":37,"./map.js":38,"./max.js":39,"./mean.js":40,"./median.js":41,"./min.js":42,"./mode.js":43,"./ndarray.js":44,"./normal.js":45,"./ones.js":46,"./pow.js":47,"./random.js":48,"./range.js":49,"./reverse.js":50,"./round.js":51,"./scale.js":52,"./seed.js":53,"./set.js":54,"./shape.js":55,"./shuffle.js":56,"./sign.js":57,"./sin.js":58,"./slice.js":59,"./sort.js":60,"./sqrt.js":61,"./std.js":62,"./sum.js":63,"./tan.js":64,"./transpose.js":65,"./variance.js":66,"./vectorize.js":67,"./zeros.js":68}],7:[function(require,module,exports){
let assert = require("../misc/assert.js")
let vectorize = require("./vectorize.js")
let isArray = require("./is-array.js")
let isNumber = require("./is-number.js")
let isUndefined = require("./is-undefined.js")

let abs = vectorize(function(x){
  assert(!isUndefined(x), "You must pass exactly one number into the `abs` function!")
  assert(isNumber(x), "The `abs` function only works on numbers!")
  return Math.abs(x)
})

module.exports = abs

// tests
if (!module.parent && typeof(window) === "undefined"){
  let result = abs(3)
  assert(result === 3, `abs(3) should be 3, but instead is ${result}!`)

  result = abs(-3)
  assert(result === 3, `abs(-3) should be 3, but instead is ${result}!`)

  result = abs(17.25)
  assert(result === 17.25, `abs(17.25) should be 17.25, but instead is ${result}!`)

  result = abs(-101.5)
  assert(result === 101.5, `abs(-101.5) should be 101.5, but instead is ${result}!`)

  x = [-2, 3, -4]
  yTrue = [2, 3, 4]
  yPred = abs(x)

  for (let i=0; i<yTrue.length; i++){
    assert(yTrue[i] === yPred[i], `abs(${x[i]}) should be ${yTrue[i]}, but instead is ${yPred[i]}!`)
  }

  x = [
    [1, -2, -3],
    [4, -5, 6],
    [-7, 8, -9],
  ]

  yTrue = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ]

  yPred = abs(x)

  for (let r=0; r<yTrue.length; r++){
    for (let c=0; c<yTrue[r].length; c++){
      assert(yTrue[r][c] === yPred[r][c], `abs(${x[r][c]}) should be ${yTrue[r][c]}, but instead is ${yPred[r][c]}!`)
    }
  }

  let hasFailed

  try {
    hasFailed = false
    abs("foo")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `abs("foo") should have failed!`)

  try {
    hasFailed = false
    abs(["foo", "bar", "baz"])
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `abs(["foo", "bar", "baz"]) should have failed!`)

  try {
    hasFailed = false
    abs({x: 5})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `abs({x: 5}) should have failed!`)

  try {
    hasFailed = false
    abs(true)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `abs(true) should have failed!`)

  let foo

  try {
    hasFailed = false
    abs(foo)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `abs(foo) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./is-array.js":29,"./is-number.js":33,"./is-undefined.js":35,"./vectorize.js":67}],8:[function(require,module,exports){
let assert = require("../misc/assert.js")
let vectorize = require("./vectorize.js")
let isNumber = require("./is-number.js")
let isString = require("./is-string.js")
let isUndefined = require("./is-undefined.js")

let add = vectorize(function(){
  let out = 0
  let argKeys = Object.keys(arguments)
  let argValues = argKeys.map(key => arguments[key])
  let argTypes = argValues.map(value => typeof(value))

  argValues.forEach(value => assert(isNumber(value) || isString(value), "The `add` function only works on strings or numbers!"))

  argValues.forEach(value => assert(!isUndefined(value), "You must pass numbers or equally-sized arrays of numbers into the `add` function!"))

  if (argTypes.indexOf("string") > -1) out = ""

  argValues.forEach(x => out += x)

  return out
})

module.exports = add

// tests
if (!module.parent && typeof(window) === "undefined"){
  let a = 3
  let b = 4
  cTrue = a + b
  cPred = add(a, b)
  assert(cTrue === cPred, `add(${a}, ${b}) should be ${cTrue}, but instead is ${cPred}!`)

  a = -4
  b = 22.5
  cTrue = a + b
  cPred = add(a, b)
  assert(cTrue === cPred, `add(${a}, ${b}) should be ${cTrue}, but instead is ${cPred}!`)

  a = [2, 3, 4]
  b = -10
  cTrue = [-8, -7, -6]
  cPred = add(a, b)
  for (let i=0; i<cTrue.length; i++) assert(cTrue[i] === cPred[i], `add(${a[i]}, ${b}) should be ${cTrue[i]}, but instead is ${cPred[i]}!`)

  a = -10
  b = [2, 3, 4]
  cTrue = [-8, -7, -6]
  cPred = add(a, b)
  for (let i=0; i<cTrue.length; i++) assert(cTrue[i] === cPred[i], `add(${a}, ${b[i]}) should be ${cTrue[i]}, but instead is ${cPred[i]}!`)

  a = [2, 3, 4]
  b = [5, 6, 7]
  cTrue = [7, 9, 11]
  cPred = add(a, b)
  for (let i=0; i<cTrue.length; i++) assert(cTrue[i] === cPred[i], `add(${a[i]}, ${b[i]}) should be ${cTrue[i]}, but instead is ${cPred[i]}!`)

  a = [[2, 3, 4], [5, 6, 7]]
  b = 10
  cTrue = [[12, 13, 14], [15, 16, 17]]
  cPred = add(a, b)

  for (let row=0; row<cTrue.length; row++){
    for (let col=0; col<cTrue[row].length; col++){
      assert(cTrue[row][col] === cPred[row][col], `add(${a[row][col]}, ${b}) should be ${cTrue[row][col]}, but instead is ${cPred[row][col]}!`)
    }
  }

  a = [[2, 3, 4], [5, 6, 7]]
  b = [10, 20, 30]
  let hasFailed

  try {
    hasFailed = false
    add(a, b)
  } catch(e){
    hasFailed = true
  }

  if (!hasFailed) assert(false, `add(${a}, ${b}) should have failed!`)

  a = "hello, "
  b = ["foo", "bar", "baz"]
  cTrue = ["hello, foo", "hello, bar", "hello, baz"]
  cPred = add(a, b)
  for (let i=0; i<cTrue.length; i++) assert(cTrue[i] === cPred[i], `add(${a}, ${b[i]}) should be ${cTrue[i]}, but instead is ${cPred[i]}!`)

  a = true
  b = 3

  try {
    hasFailed = false
    add(a, b)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `add(${a}, ${b}) should have failed!`)

  a = [2, 3, 4]
  b = [5, 6, "seven"]
  cTrue = [7, 9, "4seven"]
  cPred = add(a, b)
  for (let i=0; i<cTrue.length; i++) assert(cTrue[i] === cPred[i], `add(${a[i]}, ${b[i]}) should be ${cTrue[i]}, but instead was ${cPred[i]}!`)

  let foo

  try {
    hasFailed = false
    add(3, foo)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `add(3, foo) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./is-number.js":33,"./is-string.js":34,"./is-undefined.js":35,"./vectorize.js":67}],9:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isUndefined = require("./is-undefined.js")
let isArray = require("./is-array.js")
let isNumber = require("./is-number.js")
let shape = require("./shape.js")
let slice = require("./slice.js")
let transpose = require("./transpose.js")

function append(a, b, axis=0){
  assert(!isUndefined(a), "You must pass two arrays into the `append` function!")
  assert(!isUndefined(b), "You must pass two arrays into the `append` function!")
  assert(isArray(a), "You must pass two arrays into the `append` function!")
  assert(isArray(b), "You must pass two arrays into the `append` function!")
  assert(isNumber(axis), "The `axis` argument to the `append` function must be 0 or 1!")
  assert(axis >= 0 && axis < 2, "The `axis` argument to the `append` function must be 0 or 1!")
  assert(parseInt(axis) === axis, "The `axis` argument to the `append` function must be 0 or 1!")

  let aShape = shape(a)
  let bShape = shape(b)

  assert(aShape.length === bShape.length, "The two arrays passed into the `append` function must have the same number of dimensions!")
  assert(aShape.length < 3 && bShape.length < 3, "The two arrays passed into the `append` function must be 1- or 2-dimensional!")

  for (let i=0; i<aShape.length; i++){
    if (i !== axis){
      assert(aShape[i] === bShape[i], `The two arrays passed into the \`append\` function must have the same shapes along all axes *except* the axis along which they're being appended! (${aShape[i]} != ${bShape[i]})`)
    }
  }

  assert(axis < aShape.length, "The axis argument you passed into the `append` function is out of bounds for the array!")

  if (aShape.length === 0){
    return []
  } else if (aShape.length === 1){
    return a.concat(b)
  } else if (aShape.length === 2){
    if (axis === 0){
      let out = []
      for (let i=0; i<aShape[0]; i++) out.push(a[i])
      for (let i=0; i<bShape[0]; i++) out.push(b[i])
      return out
    } else if (axis === 1){
      return transpose(append(transpose(a), transpose(b), 0))
    }
  }
}

module.exports = append

// tests
if (!module.parent && typeof(window) === "undefined"){
  let isEqual = require("./is-equal.js")
  let normal = require("./normal.js")
  let range = require("./range.js")

  function printArray(x){
    return `[${x.join(", ")}]`
  }

  let a = [2, 3, 4]
  let b = [5, 6, 7]
  let axis = 0
  let yTrue = [2, 3, 4, 5, 6, 7]
  let yPred = append(a, b, axis)
  assert(isEqual(yTrue, yPred), `append(${printArray(a)}, ${printArray(b)}) should be ${printArray(yTrue)}, but instead was ${printArray(yPred)}!`)

  a = [[2, 3, 4]]
  b = [[5, 6, 7]]
  axis = 0
  yTrue = [[2, 3, 4], [5, 6, 7]]
  yPred = append(a, b, axis)
  assert(isEqual(yTrue, yPred), `append(${printArray(a)}, ${printArray(b)}) should be ${printArray(yTrue)}, but instead was ${printArray(yPred)}!`)

  a = [[2, 3, 4]]
  b = [[5, 6, 7]]
  axis = 1
  yTrue = [[2, 3, 4, 5, 6, 7]]
  yPred = append(a, b, axis)
  assert(isEqual(yTrue, yPred), `append(${printArray(a)}, ${printArray(b)}) should be ${printArray(yTrue)}, but instead was ${printArray(yPred)}!`)

  yTrue = normal([10, 5])
  a = slice(yTrue, [range(0, 3), null])
  b = slice(yTrue, [range(3, 10), null])
  axis = 0
  yPred = append(a, b, axis)
  assert(isEqual(yTrue, yPred), `FAIL when appending 2D matrices on axis 0!`)

  yTrue = normal([5, 10])
  a = slice(yTrue, [null, range(0, 3)])
  b = slice(yTrue, [null, range(3, 10)])
  axis = 1
  yPred = append(a, b, axis)
  assert(isEqual(yTrue, yPred), `FAIL when appending 2D matrices on axis 1!`)

  let hasFailed

  try {
    hasFailed = false
    append()
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `append() should have failed!`)

  try {
    hasFailed = false
    append(normal([2, 3]), normal([4, 5]), 0)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `append(normal([2, 3]), normal([4, 5]), 0) should have failed!`)

  try {
    hasFailed = false
    append(normal([3, 3]), normal([3, 2]), 0)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `append(normal([3, 3]), normal([3, 2]), 0) should have failed!`)

  try {
    hasFailed = false
    append(normal([3, 2]), normal([2, 2]), 1)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `append(normal([3, 2]), normal([2, 2]), 1) should have failed!`)

  try {
    hasFailed = false
    append(normal([5, 5], normal([5, 5])), 2)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `append(normal([5, 5]), normal([5, 5]), 2) should have failed!`)

  try {
    hasFailed = false
    append(normal([2, 3, 4]), normal([2, 3, 4]), 0)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `append(normal([2, 3, 4]), normal([2, 3, 4]), 0) should have failed!`)

  console.log("All tests passed! (But I should probably make `append` compatible with (n > 2)-dimensional arrays!)")
}

},{"../misc/assert.js":72,"./is-array.js":29,"./is-equal.js":31,"./is-number.js":33,"./is-undefined.js":35,"./normal.js":45,"./range.js":49,"./shape.js":55,"./slice.js":59,"./transpose.js":65}],10:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isUndefined = require("./is-undefined.js")
let isNumber = require("./is-number.js")
let vectorize = require("./vectorize.js")

let arccos = vectorize(function(x){
  assert(!isUndefined(x), "You must pass a number or an array of numbers into the `arccos` function!")
  assert(isNumber(x), "You must pass a number or an array of numbers into the `arccos` function!")
  assert(x >= -1 && x <= 1, "The `arccos` function is only defined for -1 <= x <= 1!")
  return Math.acos(x)
})

module.exports = arccos

// tests
if (!module.parent && typeof(window) === "undefined"){
  let random = require("./random.js")

  let x = 0
  let yTrue = Math.PI / 2
  let yPred = arccos(x)
  assert(yTrue === yPred, `arccos(${x}) should be ${yTrue}, but instead is ${yPred}!`)

  x = 1
  yTrue = 0
  yPred = arccos(x)
  assert(yTrue === yPred, `arccos(${x}) should be ${yTrue}, but instead is ${yPred}!`)

  let hasFailed

  try {
    hasFailed = false
    arccos()
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `arccos() should have failed!`)

  try {
    hasFailed = false
    arccos("foo")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `arccos("foo") should have failed!`)

  try {
    hasFailed = false
    arccos(true)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `arccos(true) should have failed!`)

  try {
    hasFailed = false
    arccos(-2)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `arccos(-2) should have failed!`)

  try {
    hasFailed = false
    arccos(2)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `arccos(2) should have failed!`)

  try {
    hasFailed = false
    arccos({})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `arccos({}) should have failed!`)

  try {
    hasFailed = false
    arccos(random(100))
  } catch(e){
    hasFailed = true
  }

  assert(!hasFailed, `arccos(random(100)) should have succeeded!`)

  try {
    hasFailed = false
    arccos(() => {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `arccos(() => {}) should have failed!`)

  try {
    let foo
    hasFailed = false
    arccos(foo)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `arccos(foo) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./is-number.js":33,"./is-undefined.js":35,"./random.js":48,"./vectorize.js":67}],11:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isUndefined = require("./is-undefined.js")
let isNumber = require("./is-number.js")
let vectorize = require("./vectorize.js")

let arcsin = vectorize(function(x){
  assert(!isUndefined(x), "You must pass a number or an array of numbers into the `arcsin` function!")
  assert(isNumber(x), "You must pass a number or an array of numbers into the `arcsin` function!")
  assert(x >= -1 && x <= 1, "The `arcsin` function is only defined for -1 <= x <= 1!")
  return Math.asin(x)
})

module.exports = arcsin

// tests
if (!module.parent && typeof(window) === "undefined"){
  let random = require("./random.js")

  let x = 0
  let yTrue = 0
  let yPred = arcsin(x)
  assert(yTrue === yPred, `arcsin(${x}) should be ${yTrue}, but instead is ${yPred}!`)

  x = 1
  yTrue = Math.PI / 2
  yPred = arcsin(x)
  assert(yTrue === yPred, `arcsin(${x}) should be ${yTrue}, but instead is ${yPred}!`)

  let hasFailed

  try {
    hasFailed = false
    arcsin()
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `arcsin() should have failed!`)

  try {
    hasFailed = false
    arcsin("foo")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `arcsin("foo") should have failed!`)

  try {
    hasFailed = false
    arcsin(true)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `arcsin(true) should have failed!`)

  try {
    hasFailed = false
    arcsin(-2)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `arcsin(-2) should have failed!`)

  try {
    hasFailed = false
    arcsin(2)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `arcsin(2) should have failed!`)

  try {
    hasFailed = false
    arcsin({})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `arcsin({}) should have failed!`)

  try {
    hasFailed = false
    arcsin(random(100))
  } catch(e){
    hasFailed = true
  }

  assert(!hasFailed, `arcsin(random(100)) should have succeeded!`)

  try {
    hasFailed = false
    arcsin(() => {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `arcsin(() => {}) should have failed!`)

  try {
    let foo
    hasFailed = false
    arcsin(foo)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `arcsin(foo) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./is-number.js":33,"./is-undefined.js":35,"./random.js":48,"./vectorize.js":67}],12:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isUndefined = require("./is-undefined.js")
let isNumber = require("./is-number.js")
let vectorize = require("./vectorize.js")

let arctan = vectorize(function(x){
  assert(!isUndefined(x), "You must pass a number or an array of numbers into the `arctan` function!")
  assert(isNumber(x), "You must pass a number or an array of numbers into the `arctan` function!")
  return Math.atan(x)
})

module.exports = arctan

// tests
if (!module.parent && typeof(window) === "undefined"){
  let random = require("./random.js")

  let x = 0
  let yTrue = 0
  let yPred = arctan(x)
  assert(yTrue === yPred, `arctan(${x}) should be ${yTrue}, but instead is ${yPred}!`)

  x = 1
  yTrue = Math.PI / 4
  yPred = arctan(x)
  assert(yTrue === yPred, `arctan(${x}) should be ${yTrue}, but instead is ${yPred}!`)

  let hasFailed

  try {
    hasFailed = false
    arctan()
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `arctan() should have failed!`)

  try {
    hasFailed = false
    arctan("foo")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `arctan("foo") should have failed!`)

  try {
    hasFailed = false
    arctan(true)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `arctan(true) should have failed!`)

  try {
    hasFailed = false
    arctan(-2)
  } catch(e){
    hasFailed = true
  }

  assert(!hasFailed, `arctan(-2) should have succeeded!`)

  try {
    hasFailed = false
    arctan(2)
  } catch(e){
    hasFailed = true
  }

  assert(!hasFailed, `arctan(2) should have succeeded!`)

  try {
    hasFailed = false
    arctan({})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `arctan({}) should have failed!`)

  try {
    hasFailed = false
    arctan(random(100))
  } catch(e){
    hasFailed = true
  }

  assert(!hasFailed, `arctan(random(100)) should have succeeded!`)

  try {
    hasFailed = false
    arctan(() => {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `arctan(() => {}) should have failed!`)

  try {
    let foo
    hasFailed = false
    arctan(foo)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `arctan(foo) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./is-number.js":33,"./is-undefined.js":35,"./random.js":48,"./vectorize.js":67}],13:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isNumber = require("./is-number.js")
let isUndefined = require("./is-undefined.js")
let vectorize = require("./vectorize.js")

let ceil = vectorize(function(x){
  assert(!isUndefined(x), "You must pass a single number or a single array of numbers into the `ceil` function!")
  assert(isNumber(x), "The `ceil` function only works on numbers!")
  return Math.ceil(x)
})

module.exports = ceil

// tests
if (!module.parent && typeof(window) === "undefined"){
  let x = 3.5
  let yTrue = 4
  let yPred = ceil(x)
  assert(yTrue === yPred, `ceil(${x}) should be ${yTrue}, but instead was ${yPred}!`)

  x = 3.25
  yTrue = 4
  yPred = ceil(x)
  assert(yTrue === yPred, `ceil(${x}) should be ${yTrue}, but instead was ${yPred}!`)

  x = -17.2
  yTrue = -17
  yPred = ceil(x)
  assert(yTrue === yPred, `ceil(${x}) should be ${yTrue}, but instead was ${yPred}!`)

  x = [2.5, 3.4, 7.9]
  yTrue = [3, 4, 8]
  yPred = ceil(x)
  for (let i=0; i<yTrue.length; i++) assert(yTrue[i] === yPred[i], `ceil(${x[i]}) should be ${yTrue[i]}, but instead was ${yPred[i]}!`)

  let hasFailed
  x = "foo"

  try {
    hasFailed = false
    ceil(x)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `ceil(${x}) should have failed!`)

  x = [true, 2, 3]

  try {
    hasFailed = false
    ceil(x)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `ceil(${x}) should have failed!`)

  x = {x: 5}

  try {
    hasFailed = false
    ceil(x)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `ceil(${x}) should have failed!`)

  let foo

  try {
    hasFailed = false
    ceil(foo)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `ceil(foo) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./is-number.js":33,"./is-undefined.js":35,"./vectorize.js":67}],14:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isNumber = require("./is-number.js")
let isUndefined = require("./is-undefined.js")
let abs = require("./abs.js")
let vectorize = require("./vectorize.js")

let chop = vectorize(function(x, threshold){
  assert(!isUndefined(x), "You must pass a single number or a single array of numbers into the `chop` function!")
  assert(isNumber(x), "The `chop` function only works on numbers!")

  threshold = isUndefined(threshold) ? 1e-10 : threshold
  assert(isNumber(threshold), "The `chop` function only works on numbers!")

  return abs(x) < threshold ? 0 : x
})

module.exports = chop

// tests
if (!module.parent && typeof(window) === "undefined"){
  let x = 1
  let y = chop(x)
  assert(y === 1, `chop(1) should be 1, but instead is ${y}!`)

  x = 0
  y = chop(x)
  assert(y === 0, `chop(0) should be 0, but instead is ${y}!`)

  x = 1e-15
  y = chop(x)
  assert(y === 0, `chop(1e-15) should be 0, but instead is ${y}!`)

  x = 100
  y = chop(x)
  assert(y === 100, `chop(100) should be 100, but instead is ${y}!`)

  x = -100
  y = chop(x)
  assert(y === -100, `chop(-100) should be -100, but instead is ${y}!`)

  x = [1e-20, 1e-15, 1e-5]
  let yTrue = [0, 0, 1e-5]
  yPred = chop(x)
  for (let i=0; i<yTrue.length; i++) assert(yTrue[i] === yPred[i], `chop(x[i]) should be ${yTrue[i]}, but instead is ${yPred[i]}!`)

  x = [1, 1, 1]
  thresholds = [1e-1, 1e0, 1e1]
  yTrue = [1, 1, 0]
  yPred = chop(x, thresholds)
  for (let i=0; i<yTrue.length; i++) assert(yTrue[i] === yPred[i], `chop(x[i]) should be ${yTrue[i]}, but instead is ${yPred[i]}!`)

  let hasFailed

  try {
    hasFailed = false
    chop(true)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `chop(true) should have failed!`)

  try {
    hasFailed = false
    chop({})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `chop({}) should have failed!`)

  try {
    hasFailed = false
    chop("foo")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `chop("foo") should have failed!`)

  try {
    hasFailed = false
    chop(() => {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `chop(() => {})) should have failed!`)

  try {
    hasFailed = false
    chop([1, 2, "three"])
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `chop([1, 2, "three"]) should have failed!`)

  try {
    let foo
    hasFailed = false
    chop(foo)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `chop(foo) should have failed!`)

  try {
    hasFailed = false
    chop([2, 3, 4], [5, 6, "seven"])
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `chop([2, 3, 4], [5, 6, "seven"]) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./abs.js":7,"./is-number.js":33,"./is-undefined.js":35,"./vectorize.js":67}],15:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isNumber = require("./is-number.js")
let isUndefined = require("./is-undefined.js")
let vectorize = require("./vectorize.js")

let clamp = vectorize(function(x, a, b){
  assert(!isUndefined(x) && !isUndefined(a) && !isUndefined(b), "You must pass exactly three numbers (or three equally-sized arrays of numbers) into the `clamp` function!")

  assert(isNumber(x), "The `clamp` function only works on numbers!")
  assert(isNumber(a), "The `clamp` function only works on numbers!")
  assert(isNumber(b), "The `clamp` function only works on numbers!")

  assert(a < b, `The minimum parameter, a, must be less than the maximum parameter, b.`)

  if (x < a) return a
  if (x > b) return b
  return x
})

module.exports = clamp

// tests
if (!module.parent && typeof(window) === "undefined"){
  let x = 5
  let a = 1
  let b = 10
  let yTrue = 5
  let yPred = clamp(x, a, b)
  assert(yTrue === yPred, `clamp(${x}, ${a}, ${b}) should be ${yTrue}, but instead is ${yPred}!`)

  x = -100
  a = 1
  b = 10
  yTrue = a
  yPred = clamp(x, a, b)
  assert(yTrue === yPred, `clamp(${x}, ${a}, ${b}) should be ${yTrue}, but instead is ${yPred}!`)

  x = 999
  a = 1
  b = 10
  yTrue = b
  yPred = clamp(x, a, b)
  assert(yTrue === yPred, `clamp(${x}, ${a}, ${b}) should be ${yTrue}, but instead is ${yPred}!`)

  x = [0, 100, 1000]
  a = 5
  b = 500
  yTrue = [5, 100, 500]
  yPred = clamp(x, a, b)
  for (let i=0; i<yTrue.length; i++) assert(yTrue[i] === yPred[i], `clamp(${x[i]}, ${a}, ${b}) should be ${yTrue[i]}, but instead was ${yPred[i]}!`)

  x = [0, 100, 1000]
  a = [5, 10, 15]
  b = [100, 200, 300]
  yTrue = [5, 100, 300]
  yPred = clamp(x, a, b)
  for (let i=0; i<yTrue.length; i++) assert(yTrue[i] === yPred[i], `clamp(${x[i]}, ${a[i]}, ${b[i]}) should be ${yTrue[i]}, but instead was ${yPred[i]}.`)

  x = 5
  a = 10
  b = 1
  let hasFailed = false

  try {
    clamp(x, a, b)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `clamp(${x}, ${a}, ${b}) should have failed!`)

  x = "foo"
  a = "bar"
  b = "baz"
  hasFailed = false

  try {
    clamp(x, a, b)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `clamp(${x}, ${a}, ${b}) should have failed!`)

  let foo
  hasFailed = false

  try {
    clamp(foo, foo, foo)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `clamp(foo, foo, foo) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./is-number.js":33,"./is-undefined.js":35,"./vectorize.js":67}],16:[function(require,module,exports){
let mean = require("./mean.js")
let sqrt = require("./sqrt.js")
let variance = require("./variance.js")

function cohensd(arr1, arr2){
  let m1 = mean(arr1)
  let m2 = mean(arr2)
  let s = sqrt((variance(arr1) + variance(arr2)) / 2)
  return (m1 - m2) / s
}

module.exports = cohensd

},{"./mean.js":40,"./sqrt.js":61,"./variance.js":66}],17:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isUndefined = require("./is-undefined.js")
let isArray = require("./is-array.js")

function copy(x){
  if (typeof(x) === "object"){
    if (isUndefined(x)){
      return x
    } else if (isArray(x)){
      return x.map(copy)
    } else {
      let out = {}

      Object.keys(x).forEach(function(key){
        out[key] = copy(x[key])
      })

      return out
    }
  } else {
    return x
  }
}

module.exports = copy

// tests
if (!module.parent && typeof(window) === "undefined"){
  let normal = require("./normal.js")
  let isEqual = require("./is-equal.js")
  let isTheSameObject = (a, b) => a === b
  let isACopy = (a, b) => isEqual(a, b) && (typeof(a) === "object" && !isUndefined(a) && !isUndefined(b) ? !isTheSameObject(a, b) : true)

  assert(isACopy(234, copy(234)), `copy(234) failed!`)
  assert(isACopy(true, copy(true)), `copy(true) failed!`)
  assert(isACopy("foo", copy("foo")), `copy("foo") failed!`)
  assert(isACopy([2, 3, 4], copy([2, 3, 4])), `copy([2, 3, 4]) failed!`)
  assert(isACopy(undefined, copy(undefined)), `copy(undefined) failed!`)

  let x = normal([10, 10, 10])
  assert(isACopy(x, copy(x)), `copy(normal([10, 10, 10])) failed!`)

  x = {foo: normal([5, 5, 5, 5]), name: "Josh", position: {x: 234.5, y: 567.8, z: -890.1}}
  assert(isACopy(x, copy(x)), `copy(obj) failed!`)

  x = () => {}
  assert(isACopy(x, copy(x)), `copy(fn) failed!`)

  x = null
  assert(isACopy(x, copy(x)), `copy(null) failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./is-array.js":29,"./is-equal.js":31,"./is-undefined.js":35,"./normal.js":45}],18:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isArray = require("./is-array.js")
let isNumber = require("./is-number.js")
let isUndefined = require("./is-undefined.js")
let covariance = require("./covariance.js")
let std = require("./std.js")

function correl(x, y){
  assert(!isUndefined(x) && !isUndefined(y), "You must pass two equally-sized one-dimensional arrays into the `correl` function!")
  assert(isArray(x) && isArray(y), "The `correl` function works on exactly two one-dimensional arrays!")
  assert(x.length === y.length, "The two one-dimensional arrays passed into the `correl` function must have the same length!")

  x.concat(y).forEach(function(value){
    assert(isNumber(value), "The two one-dimensional arrays passed into the `correl` function must contain only numbers!")
  })

  return covariance(x, y) / (std(x) * std(y))
}

module.exports = correl

// tests
if (!module.parent && typeof(window) === "undefined"){
  let normal = require("./normal.js")
  let abs = require("./abs.js")
  let add = require("./add.js")
  let scale = require("./scale.js")

  let x = normal([10000])
  let y = normal([10000])
  let r = correl(x, y)

  assert(abs(r) < 0.05, `correl(normal([10000]), normal([10000])) should be approximately 0, but instead was ${r}!`)

  y = add(x, scale(0.01, normal([10000])))
  r = correl(x, y)
  assert(r > 0.95, `correl(x, x + 0.01 * normal([10000])) should be approximately 1, but instead was ${r}!`)

  y = add(scale(-1, x), scale(0.01, normal([10000])))
  r = correl(x, y)
  assert(r < -0.95, `correl(x, -x + 0.01 * normal([10000])) should be approximately -1, but instead was ${r}!`)

  let hasFailed

  try {
    hasFailed = false
    correl(1, 2)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `correl(1, 2) should have failed!`)

  try {
    hasFailed = false
    correl(true, false)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `correl(true, false) should have failed!`)

  try {
    hasFailed = false
    correl([], {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `correl([], {}) should have failed!`)

  try {
    hasFailed = false
    correl("foo", "bar")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `correl("foo", "bar") should have failed!`)

  try {
    hasFailed = false
    correl([2, 3, 4], ["a", "b", "c"])
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `correl([2, 3, 4], ["a", "b", "c"]) should have failed!`)

  try {
    hasFailed = false
    correl([[2, 3, 4], [5, 6, 7]], [[8, 9, 10], [11, 12, 13]])
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `correl([[2, 3, 4], [5, 6, 7]], [[8, 9, 10], [11, 12, 13]]) should have failed!`)

  let fn = () => {}

  try {
    hasFailed = false
    correl(fn, fn)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `correl(fn, fn) should have failed!`)

  try {
    let foo
    hasFailed = false
    correl(foo, foo)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `correl(foo, foo) should have failed!`)

  assert(isNaN(correl([2, 3, 4], [1, 1, 1])), `correl([2, 3, 4], [1, 1, 1]) should be NaN!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./abs.js":7,"./add.js":8,"./covariance.js":21,"./is-array.js":29,"./is-number.js":33,"./is-undefined.js":35,"./normal.js":45,"./scale.js":52,"./std.js":62}],19:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isNumber = require("./is-number.js")
let isUndefined = require("./is-undefined.js")
let vectorize = require("./vectorize.js")

let cos = vectorize(function(x){
  assert(!isUndefined(x), "You must pass a single number or single array of numbers into the `cos` function!")
  assert(isNumber(x), "The `cos` function only works on numbers!")
  return Math.cos(x)
})

module.exports = cos

// tests
if (!module.parent && typeof(window) === "undefined"){
  let min = require("./min.js")
  let max = require("./max.js")
  let normal = require("./normal.js")
  let chop = require("./chop.js")

  let x = normal([10000]).map(v => v * 100)
  let y = cos(x)

  assert(min(y) >= -1, "Values produced by the `cos` function should never be below -1!")
  assert(max(y) <= 1, "Values produced by the `cos` function should never be above 1!")

  x = 0
  y = cos(x)
  assert(y === 1, `cos(0) should be 1, but instead is ${y}!`)

  x = Math.PI / 2
  y = cos(x)
  assert(chop(y) === 0, `cos(Math.PI / 2) should be 0, but instead is ${y}!`)

  x = Math.PI
  y = cos(x)
  assert(y === -1, `cos(Math.PI) should be -1, but instead is ${y}!`)

  x = 3 * Math.PI / 2
  y = cos(x)
  assert(chop(y) === 0, `cos(3 * Math.PI / 2) should be 0, but instead is ${y}!`)

  let hasFailed

  try {
    hasFailed = false
    cos("foo")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `cos("foo") should have failed!`)

  try {
    hasFailed = false
    cos(true)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `cos(true) should have failed!`)

  try {
    hasFailed = false
    cos({})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `cos({}) should have failed!`)

  try {
    hasFailed = false
    cos([1, 2, "three"])
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `cos([1, 2, "three"]) should have failed!`)

  try {
    hasFailed = false
    cos(() => {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `cos(() => {}) should have failed!`)

  try {
    let foo
    hasFailed = false
    cos(foo)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `cos(foo) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./chop.js":14,"./is-number.js":33,"./is-undefined.js":35,"./max.js":39,"./min.js":42,"./normal.js":45,"./vectorize.js":67}],20:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isUndefined = require("./is-undefined.js")
let isArray = require("./is-array.js")
let flatten = require("./flatten.js")

function count(arr, items){
  assert(!isUndefined(arr), "You must an array and an item to count to the `count` function!")
  assert(isArray(arr), "You must an array and an item to count to the `count` function!")

  // NOTE: This currently flattens the array that's passed in, which means that it's not possible to count occurrences of arrays within arrays! I'm not sure whether this is desirable behavior or not, so I'm just making a note of it for now. It's not trivial to count occurrences of identical objects, so maybe this function should refuse to operate on objects!
  let temp = flatten(arr)

  if (isArray(items)){
    return flatten(items).map(function(item1){
      return temp.filter(item2 => item2 === item1).length
    })
  } else {
    return temp.filter(other => other === items).length
  }
}

module.exports = count

// tests
if (!module.parent && typeof(window) === "undefined"){
  let random = require("./random.js")
  let round = require("./round.js")
  let abs = require("./abs.js")

  let x = [2, 2, 2, 3, 4, 2, 2]
  let yTrue = 5
  let yPred = count(x, 2)
  assert(yTrue === yPred)

  x = [true, true, false, false, false, "a", "a", "a", "a", "a"]
  yTrue = [2, 3, 5]
  yPred = count(x, [true, false, "a"])
  for (let i=0; i<yTrue.length; i++) assert(yTrue[i] === yPred[i], `count([true, true, false, false, false, "a", "a", "a", "a", "a"], [true, false, "a"]) should be [2, 3, 5]!`)

  x = round(random([10000]))
  let y1 = count(x, 0)
  let y2 = count(x, 1)
  assert(abs(y1 - 5000) < 0.05 * 5000, `count(round(random([10000])), 0) should be approximately 5000!`)
  assert(abs(y2 - 5000) < 0.05 * 5000, `count(round(random([10000])), 1) should be approximately 5000!`)

  assert(count([2, 3, 4]) === 0, `count([2, 3, 4]) should be 0!`)

  let hasFailed

  try {
    hasFailed = false
    count()
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `count() should have failed!`)

  try {
    hasFailed = false
    count(234)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `count(234) should have failed!`)

  try {
    hasFailed = false
    count(true)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `count(true) should have failed!`)

  try {
    hasFailed = false
    count("foo")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `count("foo") should have failed!`)

  try {
    hasFailed = false
    count({})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `count({}) should have failed!`)

  try {
    hasFailed = false
    count(() => {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `count(() => {}) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./abs.js":7,"./flatten.js":25,"./is-array.js":29,"./is-undefined.js":35,"./random.js":48,"./round.js":51}],21:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isArray = require("./is-array.js")
let isUndefined = require("./is-undefined.js")
let isNumber = require("./is-number.js")
let mean = require("./mean.js")

function covariance(x, y){
  assert(!isUndefined(x) && !isUndefined(y), "You must pass two equally-sized one-dimensional arrays into the `covariance` function!")

  assert(isArray(x) && isArray(y), "The `covariance` function only works on two equally-sized one-dimensional arrays of numbers!")

  x.concat(y).forEach(function(v){
    assert(isNumber(v), "The `covariance` function only works on two equally-sized one-dimensional arrays of numbers!")
  })

  assert(x.length === y.length, "The two one-dimensional arrays passed into the `covariance` function must be of equal length!")

  let mx = mean(x)
  let my = mean(y)
  let out = 0
  for (let i=0; i<x.length; i++) out += (x[i] - mx) * (y[i] - my)
  return out / x.length
}

module.exports = covariance

// tests
if (!module.parent && typeof(window) === "undefined"){
  let normal = require("./normal.js")
  let abs = require("./abs.js")
  let chop = require("./chop.js")

  let x = [2, 3, 4]
  let y = [1, 1, 1]
  let cv = covariance(x, y)
  assert(cv === 0, `covariance([2, 3, 4], [1, 1, 1]) should be 0, but instead was ${cv}!`)

  x = normal([10000])
  y = normal([10000])
  cv = covariance(x, y)
  assert(abs(cv) < 0.05, `covariance(normal([10000]), normal(10000)) should be approximately 0, but instead is ${cv}!`)

  y = covariance(x, x)
  assert(y > 0.95, `covariance(x, x) should be approximately 1, but instead is ${y}!`)

  assert(isNaN(covariance([], [])), `covariance([], []) should be NaN!`)

  let hasFailed

  try {
    hasFailed = false
    covariance([1, 2, 3], [1, 2, 3, 4])
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `covariance([1, 2, 3], [1, 2, 3, 4]) should have failed!`)

  try {
    hasFailed = false
    covariance(["foo", "bar", "baz"], ["a", "b", "c"])
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `covariance(["foo", "bar", "baz"], ["a", "b", "c"]) should have failed!`)

  try {
    let foo
    hasFailed = false
    covariance([foo], [foo])
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `covariance([foo], [foo]) should have failed!`)

  try {
    let fn = () => {}
    hasFailed = false
    covariance([fn], [fn])
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `covariance([fn], [fn]) should have failed!`)

  try {
    hasFailed = false
    covariance({}, {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `covariance({}, {}) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./abs.js":7,"./chop.js":14,"./is-array.js":29,"./is-number.js":33,"./is-undefined.js":35,"./mean.js":40,"./normal.js":45}],22:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isUndefined = require("./is-undefined.js")
let isNumber = require("./is-number.js")
let shape = require("./shape.js")
let flatten = require("./flatten.js")
let pow = require("./pow.js")
let sum = require("./sum.js")
let add = require("./add.js")
let scale = require("./scale.js")

function distance(a, b){
  assert(!isUndefined(a) && !isUndefined(b), "You must pass two congruently-shaped arrays of numbers into the `distance` function!")

  let shape1 = shape(a)
  let shape2 = shape(b)

  assert(shape1.length === shape2.length, "You must pass two congruently-shaped arrays of numbers into the `distance` function!")

  assert(sum(add(shape1, scale(shape2, -1))) === 0, "You must pass two congruently-shaped arrays of numbers into the `distance` function!")

  flatten(a).concat(flatten(b)).forEach(function(value){
    assert(isNumber(value), "The `distance` function only works on numbers!")
  })

  return pow(sum(pow(add(a, scale(b, -1)), 2)), 0.5)
}

module.exports = distance

// tests
if (!module.parent && typeof(window) === "undefined"){
  let normal = require("./normal.js")

  let a = [4, 6]
  let b = [1, 2]
  assert(distance(a, b) === 5, `distance([4, 6], [1, 2]) should be 5!`)

  a = [-2, -2]
  b = [-1, -1]
  assert(distance(a, b) === pow(2, 0.5), `distance([-2, -2], [-1, -1]) should be sqrt(2)!`)

  a = normal([5, 5, 5, 5])
  assert(distance(a, a) === 0, `distance(x, x) should be 0!`)

  let hasFailed

  try {
    hasFailed = false
    distance()
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `distance() should have failed!`)

  try {
    hasFailed = false
    distance(normal(5), normal(6))
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `distance(normal(5), normal(6)) should have failed!`)

  try {
    hasFailed = false
    distance(true, false)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `distance(true, false) should have failed!`)

  try {
    hasFailed = false
    distance("foo", "bar")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `distance("foo", "bar") should have failed!`)

  try {
    hasFailed = false
    distance({}, {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `distance({}, {}) should have failed!`)

  try {
    let fn = () => {}
    hasFailed = false
    distance(fn, fn,)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `distance(fn, fn) should have failed!`)

  try {
    let foo
    hasFailed = false
    distance(foo, foo)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `distance(foo, foo) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./add.js":8,"./flatten.js":25,"./is-number.js":33,"./is-undefined.js":35,"./normal.js":45,"./pow.js":47,"./scale.js":52,"./shape.js":55,"./sum.js":63}],23:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isUndefined = require("./is-undefined.js")
let isArray = require("./is-array.js")
let isNumber = require("./is-number.js")
let flatten = require("./flatten.js")
let min = require("./min.js")
let max = require("./max.js")
let apply = require("../misc/apply.js")

function distrib(x, bins){
  assert(!isUndefined(x), "You must pass an array of numbers (and optionally an integer number of bins) into the `distrib` function!")
  assert(isArray(x), "You must pass an array of numbers (and optionally an integer number of bins) into the `distrib` function!")

  let temp = flatten(x)
  temp.forEach(val => assert(isNumber(val)), "You must pass an array of numbers (and optionally an integer number of bins) into the `distrib` function!")

  if (isUndefined(bins)){
    bins = parseInt(temp.length / 10)
  } else {
    assert(isNumber(bins), "You must pass an array of numbers (and optionally an integer number of bins) into the `distrib` function!")
    assert(bins === parseInt(bins), "You must pass an array of numbers (and optionally an integer number of bins) into the `distrib` function!")
  }

  let out = []
  let start = min(temp)
  let stop = max(temp)
  let step = (stop - start) / bins

  for (let i=start; i<stop; i+=step){
    let drop = temp.filter(val => (val >= i && val < i + step) || (i + step >= stop && val >= stop))
    let count = drop.length
    drop.forEach(val => temp.splice(temp.indexOf(val), 1))
    out.push(count)
  }

  return out
}

module.exports = distrib

// tests
if (!module.parent && typeof(window) === "undefined"){
  let isEqual = require("./is-equal.js")
  let normal = require("./normal.js")

  let x = [1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 4, 4, 5]
  let bins = 5
  let yTrue = [5, 4, 3, 2, 1]
  let yPred = distrib(x, bins)
  assert(isEqual(yTrue, yPred), `distrib([1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 4, 4, 5], 5) should be [5, 4, 3, 2, 1], but instead was [${yPred.join(", ")}]!`)

  x = [3, 4, 5, 6, 7, 8, 9, 10]
  bins = 8
  yTrue = [1, 1, 1, 1, 1, 1, 1, 1]
  yPred = distrib(x, bins)
  assert(isEqual(yTrue, yPred), `distrib([3, 4, 5, 6, 7, 8, 9, 10], 8) should be [1, 1, 1, 1, 1, 1, 1, 1], but instead was [${yPred.join(", ")}]!`)

  x = [-2.5, -2.5, -1.5, -1.5, -1.5, -1.5, -0.5, 0.5, 0.5, 0.5, 1.5, 1.5, 1.5, 1.5, 1.5, 2.5, 2.5]
  bins = 3
  yTrue = [6, 4, 7]
  yPred = distrib(x, bins)
  assert(isEqual(yTrue, yPred), `distrib([-2.5, -2.5, -1.5, -1.5, -1.5, -1.5, -0.5, 0.5, 0.5, 0.5, 1.5, 1.5, 1.5, 1.5, 1.5, 2.5, 2.5], 3) should be [6, 4, 7], but instead was [${yPred.join(", ")}]!`)

  let hasFailed

  try {
    hasFailed = false
    distrib()
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `distrib() should have failed!`)

  try {
    hasFailed = false
    distrib(true)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `distrib(true) should have failed!`)

  try {
    hasFailed = false
    distrib("foo")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `distrib("foo") should have failed!`)

  try {
    hasFailed = false
    distrib(234)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `distrib(234) should have failed!`)

  try {
    let foo
    hasFailed = false
    distrib(foo)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `distrib(foo) should have failed!`)

  try {
    hasFailed = false
    distrib(() => {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `distrib(() => {}) should have failed!`)

  try {
    hasFailed = false
    distrib({})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `distrib({}) should have failed!`)

  try {
    hasFailed = false
    distrib([], "foo")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `distrib([], "foo") should have failed!`)

  try {
    hasFailed = false
    distrib([], true)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `distrib(true) should have failed!`)

  try {
    hasFailed = false
    distrib([], [])
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `distrib([]) should have failed!`)

  try {
    hasFailed = false
    distrib([], {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `distrib([], {}) should have failed!`)

  try {
    hasFailed = false
    distrib([], () => {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `distrib([], () => {}) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/apply.js":70,"../misc/assert.js":72,"./flatten.js":25,"./is-array.js":29,"./is-equal.js":31,"./is-number.js":33,"./is-undefined.js":35,"./max.js":39,"./min.js":42,"./normal.js":45}],24:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isUndefined = require("./is-undefined.js")
let isArray = require("./is-array.js")
let isNumber = require("./is-number.js")
let isEqual = require("./is-equal.js")
let flatten = require("./flatten.js")
let shape = require("./shape.js")
let sum = require("./sum.js")
let scale = require("./scale.js")
let transpose = require("./transpose.js")

function dot(a, b){
  assert(!isUndefined(a) && !isUndefined(b), "You must pass two arrays of numbers into the `dot` function!")
  assert(isArray(a) && isArray(b), "You must pass two arrays of numbers into the `dot` function!")

  flatten(a).concat(flatten(b)).forEach(function(val){
    assert(isNumber(val), "The `dot` function only works on numbers!")
  })

  let aShape = shape(a)
  let bShape = shape(b)

  assert(aShape.length <= 2 && bShape.length <= 2, "I'm not smart enough to know how to get the dot-product of arrays that have more than 2 dimensions. Sorry for the inconvenience! Please only pass 1- or 2-dimensional arrays into the `dot` function!")
  assert(aShape[aShape.length-1] === bShape[0], `There's a dimension misalignment in the two arrays you passed into the \`dot\` function. (${aShape[aShape.length-1]} !== ${bShape[0]})`)

  if (aShape.length === 1 && bShape.length === 1){
    return sum(scale(a, b))
  } else if (aShape.length === 1 && bShape.length === 2){
    return transpose(b).map(col => dot(a, col))
  } else if (aShape.length === 2 && bShape.length === 1){
    return a.map(row => dot(row, b))
  } else if (aShape.length === 2 && bShape.length === 2){
    let bTranspose = transpose(b)
    let out = []

    for (let i=0; i<a.length; i++){
      let row = []

      for (let j=0; j<bTranspose.length; j++){
        row.push(dot(a[i], bTranspose[j]))
      }

      out.push(row)
    }

    return out
  }
}

module.exports = dot

// tests
if (!module.parent && typeof(window) === "undefined"){
  let normal = require("./normal.js")

  let a = [2, 3, 4]
  let b = [5, 6, 7]
  let yTrue = 56
  let yPred = dot(a, b)
  assert(isEqual(yTrue, yPred), `dot([2, 3, 4], [5, 6, 7]) should be 56!`)

  a = [[2, 3], [4, 5], [6, 7]]
  b = [[8, 9, 10], [11, 12, 13]]
  yTrue = [[49, 54, 59], [87, 96, 105], [125, 138, 151]]
  yPred = dot(a, b)
  assert(isEqual(yTrue, yPred), `dot([[2, 3], [4, 5], [6, 7]], [[8, 9, 10], [11, 12, 13]]) should be [[49, 54, 59], [87, 96, 105], [125, 138, 151]]!`)

  a = [4, 3, 2, 1]
  b = [[12, 11], [10, 9], [8, 7], [6, 5]]
  yTrue = [100, 90]
  yPred = dot(a, b)
  assert(isEqual(yTrue, yPred), `dot([4, 3, 2, 1], [[12, 11], [10, 9], [8, 7], [6, 5]]) should be [100, 90]!`)

  a = [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10]]
  b = [11, 12, 13, 14, 15]
  yTrue = [205, 530]
  yPred = dot(a, b)
  assert(isEqual(yTrue, yPred), `dot([[1, 2, 3, 4, 5], [6, 7, 8, 9, 10]], [11, 12, 13, 14, 15]) should be [100, 90]!`)

  let hasFailed

  try {
    hasFailed = false
    dot()
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `dot() should have failed!`)

  try {
    hasFailed = false
    dot(2, 3)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `dot(2, 3) should have failed!`)

  try {
    hasFailed = false
    dot(true, false)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `dot(true, false) should have failed!`)

  try {
    hasFailed = false
    dot("foo", "bar")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `dot("foo", "bar") should have failed!`)

  try {
    hasFailed = false
    dot(normal([2, 3]), normal([2, 3]))
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `dot(normal([2, 3]), normal([2, 3])) should have failed!`)

  try {
    hasFailed = false
    dot(normal([2, 3, 4]))
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `dot([2, 3, 4]) should have failed!`)

  try {
    let fn = () => {}
    hasFailed = false
    dot(fn, fn)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `dot(fn, fn) should have failed!`)

  try {
    let foo
    hasFailed = false
    dot(foo, foo)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `dot(foo, foo) should have failed!`)

  try {
    hasFailed = false
    dot({}, {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `dot({}, {}) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./flatten.js":25,"./is-array.js":29,"./is-equal.js":31,"./is-number.js":33,"./is-undefined.js":35,"./normal.js":45,"./scale.js":52,"./shape.js":55,"./sum.js":63,"./transpose.js":65}],25:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isUndefined = require("./is-undefined.js")
let isArray = require("./is-array.js")

function flatten(arr){
  assert(!isUndefined(arr), "You must pass one array into the `flatten` function!")
  assert(isArray(arr), "The `flatten` function only works on arrays!")

  let out = []

  arr.forEach(function(value){
    if (isArray(value)){
      out = out.concat(flatten(value))
    } else {
      out.push(value)
    }
  })

  return out
}

module.exports = flatten

// tests
if (!module.parent && typeof(window) === "undefined"){
  let normal = require("./normal.js")

  let x = [2, 3, 4]
  let yTrue = [2, 3, 4]
  let yPred = flatten(x)
  for (let i=0; i<yTrue.length; i++) assert(yTrue[i] === yPred[i], `flatten([2, 3, 4]) should be [2, 3, 4]!`)

  x = [[2, 3, 4], [5, 6, 7]]
  yTrue = [2, 3, 4, 5, 6, 7]
  yPred = flatten(x)
  for (let i=0; i<yTrue.length; i++) assert(yTrue[i] === yPred[i], `flatten([[2, 3, 4], [5, 6, 7]]) should be [2, 3, 4, 5, 6, 7]!`)

  x = normal([2, 3, 4, 5])
  yPred = flatten(x)
  assert(yPred.length === 120, `flatten(normal([2, 3, 4, 5])) should have 120 values!`)

  let hasFailed

  try {
    hasFailed = false
    flatten()
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `flatten() should have failed!`)

  try {
    hasFailed = false
    flatten({})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `flatten({}) should have failed!`)

  try {
    hasFailed = false
    flatten(true)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `flatten(true) should have failed!`)

  try {
    hasFailed = false
    flatten("foo")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `flatten("foo") should have failed!`)

  try {
    hasFailed = false
    flatten(() => {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `flatten(() => {}) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./is-array.js":29,"./is-undefined.js":35,"./normal.js":45}],26:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isNumber = require("./is-number.js")
let isUndefined = require("./is-undefined.js")
let vectorize = require("./vectorize.js")

let floor = vectorize(function(x){
  assert(!isUndefined(x), "You must pass a single number or a single array of numbers into the `floor` function!")

  assert(isNumber(x), "The `floor` function only works on numbers!")

  return Math.floor(x)
})

module.exports = floor

// tests
if (!module.parent && typeof(window) === "undefined"){
  let random = require("./random.js")
  let zeros = require("./zeros.js")

  let x = 5.95
  let yTrue = 5
  let yPred = floor(x)
  assert(yTrue === yPred, `floor(${x}) should be ${yTrue}, but instead was ${yPred}!`)

  x = -3.25
  yTrue = -4
  yPred = floor(x)
  assert(yTrue === yPred, `floor(${x}) should be ${yTrue}, but instead was ${yPred}!`)

  x = [1.25, 2.5, 3.75]
  yTrue = [1, 2, 3]
  yPred = floor(x)
  for (let i=0; i<yTrue.length; i++) assert(yTrue[i] === yPred[i], `floor(${x[i]}) should be ${yTrue[i]}, but instead was ${yPred[i]}!`)

  x = random([500])
  yTrue = zeros([500])
  yPred = floor(x)
  for (let i=0; i<yTrue.length; i++) assert(yTrue[i] === yPred[i], `floor(${x[i]}) should be ${yTrue[i]}, but instead was ${yPred[i]}!`)

  let hasFailed

  try {
    hasFailed = false
    floor("foo")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `floor("foo") should have failed!`)

  try {
    hasFailed = false
    floor({})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `floor({}) should have failed!`)

  try {
    hasFailed = false
    floor([1, 2, "three"])
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `floor([1, 2, "three"]) should have failed!`)

  try {
    let foo
    hasFailed = false
    floor(foo)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `floor(foo) should have failed!`)

  try {
    hasFailed = false
    floor(() => {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `floor(() => {}) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./is-number.js":33,"./is-undefined.js":35,"./random.js":48,"./vectorize.js":67,"./zeros.js":68}],27:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isUndefined = require("./is-undefined.js")
let isNumber = require("./is-number.js")
let zeros = require("./zeros.js")

function identity(size){
  assert(!isUndefined(size), "You must pass an integer greater than 0 (representing the size) into the `identity` function!")
  assert(isNumber(size), "You must pass an integer greater than 0 (representing the size) into the `identity` function!")
  assert(parseInt(size) === size, "You must pass an integer greater than 0 (representing the size) into the `identity` function!")
  assert(size > 0, "You must pass an integer greater than 0 (representing the size) into the `identity` function!")

  let out = zeros([size, size])
  for (let i=0; i<size; i++) out[i][i] = 1
  return out
}

module.exports = identity

// tests
if (!module.parent && typeof(window) === "undefined"){
  function isIdentity(x){
    for (let i=0; i<x.length; i++){
      let row = x[i]

      for (let j=0; j<row.length; j++){
        if (i === j){
          if (x[i][j] !== 1) return false
        } else {
          if (x[i][j] !== 0) return false
        }
      }
    }

    return true
  }

  let x = identity(100)
  assert(isIdentity(x), `identity(100) is not an identity matrix!`)

  let hasFailed

  try {
    hasFailed = false
    identity()
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `identity() should have failed!`)

  try {
    hasFailed = false
    identity("foo")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `identity("foo") should have failed!`)

  try {
    hasFailed = false
    identity(23.4)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `identity(23.4) should have failed!`)

  try {
    hasFailed = false
    identity(-10)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `identity(-10) should have failed!`)

  try {
    hasFailed = false
    identity(true)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `identity(true) should have failed!`)

  try {
    hasFailed = false
    identity({})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `identity({}) should have failed!`)

  try {
    hasFailed = false
    identity(() => {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `identity(() => {}) should have failed!`)

  try {
    let foo
    hasFailed = false
    identity(foo)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `identity(foo) should have failed!`)

  try {
    hasFailed = false
    identity([])
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `identity([]) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./is-number.js":33,"./is-undefined.js":35,"./zeros.js":68}],28:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isUndefined = require("./is-undefined.js")
let isArray = require("./is-array.js")
let isNumber = require("./is-number.js")
let flatten = require("./flatten.js")
let shape = require("./shape.js")
let slice = require("./slice.js")
let dot = require("./dot.js")
let add = require("./add.js")
let scale = require("./scale.js")
let append = require("./append.js")
let range = require("./range.js")

function inverse(x){
  assert(!isUndefined(x), "You must pass a square 2D array into the `inverse` function!")
  assert(isArray(x), "You must pass a square 2D array into the `inverse` function!")
  flatten(x).forEach(v => assert(isNumber(v), "The array passed into the `inverse` function must contain only numbers!"))

  let xShape = shape(x)
  assert(xShape.length === 2, "The array passed into the `inverse` function must be exactly two-dimensional and square!")
  assert(xShape[0] === xShape[1], "The array passed into the `inverse` function must be exactly two-dimensional and square!")
  assert(xShape[0] >= 0, "The array passed into the `inverse` function must be exactly two-dimensional and square!")

  // https://en.wikipedia.org/wiki/Invertible_matrix#Blockwise_inversion
  if (xShape[0] === 0){
    return x
  } else if (xShape[0] === 1){
    assert(x[0][0] !== 0, "This matrix cannot be inverted!")
    return 1 / x[0][0]
  } else if (xShape[0] === 2){
    let a = x[0][0]
    let b = x[0][1]
    let c = x[1][0]
    let d = x[1][1]

    let det = a * d - b * c
    assert(det !== 0, "This matrix cannot be inverted!")

    let out = [[d, -b], [-c, a]]
    return scale(out, 1 / det)
  } else if (xShape[0] > 1){
    let times = (a, b) => (isNumber(a) || isNumber(b)) ? scale(a, b) : dot(a, b)

    for (let divider=1; divider<xShape[0]-1; divider++){
      try {
        let A = slice(x, [range(0, divider), range(0, divider)])
        let B = slice(x, [range(0, divider), range(divider, xShape[0])])
        let C = slice(x, [range(divider, xShape[0]), range(0, divider)])
        let D = slice(x, [range(divider, xShape[0]), range(divider, xShape[0])])

        let AInv = inverse(A)
        let CompInv = inverse(add(D, times(-1, times(times(C, AInv), B))))

        let topLeft = add(AInv, times(times(times(times(AInv, B), CompInv), C), AInv))
        let topRight = times(-1, times(times(AInv, B), CompInv))
        let bottomLeft = times(-1, times(times(CompInv, C), AInv))
        let bottomRight = CompInv

        let out = append(append(topLeft, topRight, 1), append(bottomLeft, bottomRight, 1), 0)
        return out
      } catch(e){}
    }

    assert(false, "This matrix cannot be inverted!")
  }
}

module.exports = inverse

// tests
if (!module.parent && typeof(window) === "undefined"){
  let identity = require("./identity.js")
  let isEqual = require("./is-equal.js")
  let normal = require("./normal.js")
  let random = require("./random.js")
  let distance = require("./distance.js")
  let round = require("./round.js")
  let zeros = require("./zeros.js")

  let x = normal([10, 10])
  let xinv = inverse(x)
  assert(distance(identity(10), dot(x, xinv)) < 1e-5, `FAIL!`)

  x = random([20, 20])
  xinv = inverse(x)
  assert(distance(identity(20), dot(x, xinv)) < 1e-5, `FAIL!`)

  x = round(add(scale(normal([10, 10]), 10), 20))
  xinv = inverse(x)
  assert(distance(identity(10), dot(x, xinv)) < 1e-5, `FAIL!`)

  x = identity(10)
  xinv = inverse(x)
  assert(distance(identity(10), dot(x, xinv)) < 1e-5, `FAIL!`)

  let hasFailed

  try {
    hasFailed = false
    inverse()
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `inverse() should have failed!`)

  try {
    hasFailed = false
    inverse(234)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `inverse(234) should have failed!`)

  try {
    hasFailed = false
    inverse("foo")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `inverse("foo") should have failed!`)

  try {
    hasFailed = false
    inverse(true)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `inverse(true) should have failed!`)

  try {
    hasFailed = false
    inverse({})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `inverse({}) should have failed!`)

  try {
    hasFailed = false
    inverse(() => {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `inverse(() => {}) should have failed!`)

  try {
    let foo
    hasFailed = false
    inverse(foo)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `inverse(foo) should have failed!`)

  try {
    hasFailed = false
    x = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
    inverse(x)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `inverse([[1, 2, 3], [4, 5, 6], [7, 8, 9]]) should have failed!`)

  try {
    hasFailed = false
    inverse(zeros([10, 10]))
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `inverse(zeros([10, 10])) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./add.js":8,"./append.js":9,"./distance.js":22,"./dot.js":24,"./flatten.js":25,"./identity.js":27,"./is-array.js":29,"./is-equal.js":31,"./is-number.js":33,"./is-undefined.js":35,"./normal.js":45,"./random.js":48,"./range.js":49,"./round.js":51,"./scale.js":52,"./shape.js":55,"./slice.js":59,"./zeros.js":68}],29:[function(require,module,exports){
function isArray(obj){
  return obj instanceof Array
}

module.exports = isArray

// tests
if (!module.parent && typeof(window) === "undefined"){
  let assert = require("../misc/assert.js")

  assert(isArray([]), `isArray([]) should return true!`)
  assert(isArray([2, 3, 4]), `isArray([2, 3, 4]) should return true!`)
  assert(isArray(new Array()), `isArray(new Array()) should return true!`)
  assert(!isArray({}), `isArray({}) should return false!`)
  assert(!isArray({push: () => {}}), `isArray({push: () => {}}) should return false!`)
  assert(!isArray("foo"), `isArray("foo") should return false!`)
  assert(!isArray(true), `isArray(true) should return false!`)
  assert(!isArray(false), `isArray(false) should return false!`)
  assert(!isArray(() => {}), `isArray(() => {}) should return false!`)
  assert(!isArray(3), `isArray(3) should return false!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72}],30:[function(require,module,exports){
function isBoolean(x){
  return typeof(x) === "boolean"
}

module.exports = isBoolean

},{}],31:[function(require,module,exports){
let isArray = require("./is-array.js")

function isEqual(a, b){
  let aType = typeof(a)
  let bType = typeof(b)
  if (aType !== bType) return false

  if (aType === "undefined") return true
  if (aType === "boolean") return a === b
  if (aType === "number") return a === b
  if (aType === "string") return a === b
  if (aType === "function") return a === b

  if (aType === "object"){
    if (a === null || b === null){
      return a === null && b === null
    } else {
      let aKeys = Object.keys(a)
      let bKeys = Object.keys(b)
      if (aKeys.length !== bKeys.length) return false

      for (let i=0; i<aKeys.length; i++){
        let key = aKeys[i]
        if (!b.hasOwnProperty(key)) return false
        if (!isEqual(a[key], b[key])) return false
      }

      return true
    }
  }
}

module.exports = isEqual

// tests
if (!module.parent && typeof(window) === "undefined"){
  let assert = require("../misc/assert.js")

  assert(isEqual(2, 2), `isEqual(2, 2) should be true!`)
  assert(isEqual(-3.5, -3.5), `isEqual(-3.5, -3.5) should be true!`)
  assert(isEqual("foo", "foo"), `isEqual("foo", "foo") should be true!`)
  assert(isEqual(true, true), `isEqual(true, true) should be true!`)
  assert(isEqual(false, false), `isEqual(false, false) should be true!`)
  assert(isEqual({}, {}), `isEqual({}, {}) should be true!`)
  assert(isEqual(undefined, undefined), `isEqual(undefined, undefined) should be true!`)
  assert(isEqual(null, null), `isEqual(null, null) should be true!`)
  assert(isEqual({x: 5}, {x: 5}), `isEqual({x: 5}, {x: 5}) should be true!`)
  assert(isEqual([2, 3, 4], [2, 3, 4]), `isEqual([2, 3, 4], [2, 3, 4]) should be true!`)

  let fn = () => {}
  assert(isEqual(fn, fn), `isEqual(fn, fn) should be true!`)

  let a = {name: "James", friends: ["Bill", "Sally"]}
  let b = {name: "James", friends: ["Bill", "Sally"]}
  assert(isEqual(a, b), `isEqual(a, b) should be true!`)

  let others = [2, -3.5, "foo", true, false, {}, undefined, null, {x: 5}, [2, 3, 4], {name: "James", friends: ["Bill", "Sally"]}]

  for (let i=0; i<others.length-1; i++){
    for (let j=i; j<others.length; j++){
      if (i !== j){
        a = others[i]
        b = others[j]
        assert(!isEqual(a, b), `isEqual(a, b) should be false! (a: ${JSON.stringify(a)}, b: ${JSON.stringify(b)})`)
      }
    }
  }

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./is-array.js":29}],32:[function(require,module,exports){
function isFunction(fn){
  return typeof(fn) === "function"
}

module.exports = isFunction

},{}],33:[function(require,module,exports){
function isNumber(x){
  return typeof(x) === "number"
}

module.exports = isNumber

// tests
if (!module.parent && typeof(window) === "undefined"){
  let assert = require("../misc/assert.js")

  assert(isNumber(3), `3 is a number!`)
  assert(isNumber(-3.5), `-3.5 is a number!`)
  assert(isNumber(2573.2903482093482035023948, `2573.2903482093482035023948 is a number!`))
  assert(!isNumber("35"), `"35" is not a number!`)
  assert(!isNumber("foo"), `"foo" is not a number!`)
  assert(!isNumber([2, 3, 4]), `[2, 3, 4] is not a number!`)
  assert(!isNumber({x: 5}), "{x: 5} is not a number!")
  assert(!isNumber(true), `true is not a number!`)
  assert(!isNumber(false), `false is not a number!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72}],34:[function(require,module,exports){
function isString(s){
  return typeof(s) === "string"
}

module.exports = isString

// tests
if (!module.parent && typeof(window) === "undefined"){
  let assert = require("../misc/assert.js")

  assert(isString("hi"), `"hi" is a string!`)
  assert(isString(""), `"" is a string!`)
  assert(isString(``), `\`\` is a string!`)
  assert(isString('foo', `'foo' is a string!`))
  assert(!isString(3), `3 is not a string!`)
  assert(!isString(true), `true is not a string!`)
  assert(!isString(false), `false is not a string!`)
  assert(!isString({x: 5}), `{x: 5} is not a string!`)
  assert(!isString(["a", "b", "c"]), `["a", "b", "c"] is not a string!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72}],35:[function(require,module,exports){
function isUndefined(x){
  return x === null || typeof(x) === "undefined"
}

module.exports = isUndefined

// tests
if (!module.parent && typeof(window) === "undefined"){
  let assert = require("../misc/assert.js")

  assert(!isUndefined("foo"), `isUndefined("foo") should be false, but instead was true!`)
  assert(!isUndefined({}), `isUndefined({}) should be false, but instead was true!`)
  assert(!isUndefined(3), `isUndefined(3) should be false, but instead was true!`)
  assert(!isUndefined([]), `isUndefined([]) should be false, but instead was true!`)
  assert(!isUndefined(true), `isUndefined(true) should be false, but instead was true!`)
  assert(!isUndefined(false), `isUndefined(false) should be false, but instead was true!`)
  assert(!isUndefined(() => {}), `isUndefined(() => {}) should be false, but instead was true!`)

  let x
  assert(isUndefined(x), `isUndefined(x) should be true, but instead was false!`)

  let hasFailed

  try {
    hasFailed = false
    isUndefined(foo)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `isUndefined(foo) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72}],36:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isNumber = require("./is-number.js")
let isUndefined = require("./is-undefined.js")
let vectorize = require("./vectorize.js")

let lerp = vectorize(function(a, b, f){
  assert(!isUndefined(a) && !isUndefined(b) && !isUndefined(f), "You must pass exactly three numbers (or three equally-sized arrays of numbers) into the `lerp` function!")

  assert(isNumber(a) && isNumber(b) && isNumber(f), "The `lerp` function only works on numbers!")

  return f * (b - a) + a
})

module.exports = lerp

// tests
if (!module.parent && typeof(window) === "undefined"){
  let a = 0
  let b = 1
  let f = 1
  let c = lerp(a, b, f)
  assert(c === 1, `lerp(0, 1, 1) should be 1, but instead was ${c}!`)

  a = -1
  b = 1
  f = 0.5
  c = lerp(a, b, f)
  assert(c === 0, `lerp(-1, 1, 0.5) should be 0, but instead was ${c}!`)

  a = -100
  b = 100
  f = 0.75
  c = lerp(a, b, f)
  assert(c === 50, `lerp(-100, 100, 0.75) should be 50, but instead was ${c}!`)

  a = [1, 2, 3]
  b = [2, 3, 4]
  f = [0.5, 0.75, 0.9]
  let cTrue = [1.5, 2.75, 3.9]
  let cPred = lerp(a, b, f)
  for (let i=0; i<cTrue.length; i++) assert(cTrue[i] === cPred[i], `lerp(${a[i]}, ${b[i]}, ${f[i]}) should be ${cTrue[i]}, but instead was ${cPred[i]}!`)

  let hasFailed

  try {
    hasFailed = false
    lerp(3, 4, "foo")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `lerp(3, 4, "foo") should have failed!`)

  try {
    hasFailed = false
    lerp([1], [2, 3], 0.75)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `lerp([1], [2, 3], 0.75) should have failed!`)

  try {
    hasFailed = false
    lerp({}, {}, {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `lerp({}, {}, {}) should have failed!`)

  try {
    let foo
    hasFailed = false
    lerp(foo, foo, foo)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `lerp(foo, foo, foo) should have failed!`)

  try {
    let fn = () => {}
    hasFailed = false
    lerp(fn, fn, fn)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `lerp(fn, fn, fn) should have failed!`)

  try {
    hasFailed = false
    lerp(1, 2)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `lerp(1, 2) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./is-number.js":33,"./is-undefined.js":35,"./vectorize.js":67}],37:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isNumber = require("./is-number.js")
let isUndefined = require("./is-undefined.js")
let vectorize = require("./vectorize.js")

let log = vectorize(function(x, base){
  assert(!isUndefined(x), "You must pass a single number or a single array of numbers into the `log` function!")
  assert(isNumber(x), "You must pass a single number or a single array of numbers into the `log` function!")

  base = isUndefined(base) ? Math.E : base
  assert(isNumber(base), "The base parameter of the `log` function must be a number or an array of numbers!")

  return Math.log(x) / Math.log(base)
})

module.exports = log

// tests
if (!module.parent && typeof(window) === "undefined"){
  let abs = require("./abs.js")
  let chop = require("./chop.js")

  let x = Math.E
  let base = Math.E
  let yTrue = 1
  let yPred = log(x, base)
  assert(yTrue === yPred, `log(${x}) should be ${yTrue}, but instead was ${yPred}!`)

  x = 10
  base = 10
  yTrue = 1
  yPred = log(x, base)
  assert(yTrue === yPred, `log(${x}) should be ${yTrue}, but instead was ${yPred}!`)

  x = 100
  base = 10
  yTrue = 2
  yPred = log(x, base)
  assert(yTrue === yPred, `log(${x}) should be ${yTrue}, but instead was ${yPred}!`)

  x = [100, 1000, 10000]
  base = 10
  yTrue = [2, 3, 4]
  yPred = log(x, base)
  for (let i=0; i<yTrue.length; i++) assert(chop(abs(yTrue[i] - yPred[i])) === 0, `log(${x[i]}, ${base}) should be ${yTrue[i]}, but instead was ${yPred[i]}!`)

  x = 64
  base = [2, 4, 8]
  yTrue = [6, 3, 2]
  yPred = log(x, base)
  for (let i=0; i<yTrue.length; i++) assert(chop(abs(yTrue[i] - yPred[i])) === 0, `log(${x[i]}, ${base}) should be ${yTrue[i]}, but instead was ${yPred[i]}!`)

  assert(log([]).length === 0, `log([]) should have produced an empty array!`)

  let hasFailed

  try {
    hasFailed = false
    log()
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `log() should have failed!`)

  try {
    hasFailed = false
    log("foo")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `log("foo") should have failed!`)

  try {
    hasFailed = false
    log({})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `log({}) should have failed!`)

  try {
    hasFailed = false
    log(true)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `log(true) should have failed!`)

  try {
    hasFailed = false
    log(() => {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `log(() => {}) should have failed!`)

  try {
    let foo
    hasFailed = false
    log(foo)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `log(foo) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./abs.js":7,"./chop.js":14,"./is-number.js":33,"./is-undefined.js":35,"./vectorize.js":67}],38:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isUndefined = require("./is-undefined.js")
let isNumber = require("./is-number.js")
let vectorize = require("./vectorize.js")

let map = vectorize(function(x, a, b, c, d){
  assert(!isUndefined(x) && !isUndefined(a) && !isUndefined(b) && !isUndefined(c) && !isUndefined(d), "You should pass five numbers (or five equally-sized arrays of numbers) into the `map` function!")

  assert(isNumber(x) && isNumber(a) && isNumber(b) && isNumber(c) && isNumber(d), "The `map` function only works on numbers!")

  return (d - c) * (x - a) / (b - a) + c
})

module.exports = map

// tests
if (!module.parent && typeof(window) === "undefined"){
  let x = 1
  let a = 0
  let b = 2
  let c = 0
  let d = 10
  let yTrue = 5
  let yPred = map(x, a, b, c, d)
  assert(yTrue === yPred, `map(${x}, ${a}, ${b}, ${c}, ${c}) should be ${yTrue}, but instead is ${yPred}!`)

  x = 2
  a = 1
  b = 3
  c = 100
  d = 500
  yTrue = 300
  yPred = map(x, a, b, c, d)
  assert(yTrue === yPred, `map(${x}, ${a}, ${b}, ${c}, ${c}) should be ${yTrue}, but instead is ${yPred}!`)

  x = [1, 2, 3]
  a = 0
  b = 4
  c = 100
  d = 500
  yTrue = [200, 300, 400]
  yPred = map(x, a, b, c, d)
  for (let i=0; i<yTrue.length; i++) assert(yTrue[i] === yPred[i], `map(${x[i]}, ${a}, ${b}, ${c}, ${d}) should be ${yTrue[i]}, but instead was ${yPred[i]}!`)

  let hasFailed

  try {
    hasFailed = false
    map(1, 2, 3, 4, "five")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `map(1, 2, 3, 4, "five") should have failed!`)

  try {
    hasFailed = false
    map()
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `map() should have failed!`)

  try {
    hasFailed = false
    map(1, 2, 3, 4, {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `map(1, 2, 3, 4, {}) should have failed!`)

  try {
    let foo
    hasFailed = false
    map(1, 2, 3, 4, foo)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `map(1, 2, 3, 4, foo) should have failed!`)

  try {
    hasFailed = false
    map(1, 2, 3, 4, () => {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `map(1, 2, 3, 4, () => {}) should have failed!`)

  try {
    hasFailed = false
    map(1, 2, 3, 4, true)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `map(1, 2, 3, 4, true) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./is-number.js":33,"./is-undefined.js":35,"./vectorize.js":67}],39:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isArray = require("./is-array.js")
let isNumber = require("./is-number.js")
let isUndefined = require("./is-undefined.js")
let flatten = require("./flatten.js")

function max(arr){
  assert(!isUndefined(arr), "You must pass one array of numbers into the `max` function!")
  assert(isArray(arr), "You must pass one array of numbers into the `max` function!")

  let temp = flatten(arr)

  temp.forEach(function(value){
    assert(isNumber(value), "The `max` function only works on numbers or arrays of numbers!")
  })

  let out = -Infinity

  temp.forEach(function(x){
    if (x > out){
      out = x
    }
  })

  return out === -Infinity ? undefined : out
}

module.exports = max

// tests
if (!module.parent && typeof(window) === "undefined"){
  let normal = require("./normal.js")
  let random = require("./random.js")
  let min = require("./min.js")

  let x = [2, 3, 4]
  let y = max(x)
  assert(y === 4, `max([2, 3, 4]) should be 4, but instead was ${y}!`)

  x = [-10, -5, -20]
  y = max(x)
  assert(y === -5, `max([-10, -5, -20]) should be -5, but instead was ${y}!`)

  x = random([10000])
  y = max(x)
  assert(y <= 1 && y >= 0, `max(random([10000])) should be >= 0 and <= 1!`)

  x = normal([10000])
  xMin = min(x)
  xMax = max(x)
  xRange = xMax - xMin
  x = x.map(v => (v - xMin) / xRange)
  assert(max(x) === 1, `max(normalizedData) should be 1!`)

  let hasFailed

  try {
    hasFailed = false
    max()
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `max() should have failed!`)

  try {
    hasFailed = false
    max(2)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `max(2) should have failed!`)

  try {
    hasFailed = false
    max(true)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `max(true) should have failed!`)

  try {
    hasFailed = false
    max({})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `max({}) should have failed!`)

  try {
    hasFailed = false
    max(() => {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `max(() => {}) should have failed!`)

  try {
    hasFailed = false
    max([1, 2, "three"])
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `max([1, 2, "three"]) should have failed!`)

  try {
    hasFailed = false
    max("foo")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `max("foo") should have failed!`)

  try {
    let foo
    hasFailed = false
    max(foo)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `max(foo) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./flatten.js":25,"./is-array.js":29,"./is-number.js":33,"./is-undefined.js":35,"./min.js":42,"./normal.js":45,"./random.js":48}],40:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isUndefined = require("./is-undefined.js")
let isArray = require("./is-array.js")
let isNumber = require("./is-number.js")
let flatten = require("./flatten.js")
let sum = require("./sum.js")

function mean(arr){
  assert(!isUndefined(arr), "You must pass one array of numbers into the `mean` function!")
  assert(isArray(arr), "You must pass one array of numbers into the `mean` function!")

  let temp = flatten(arr)

  temp.forEach(function(value){
    assert(isNumber(value), "The `mean` function only works on arrays of numbers!")
  })

  return sum(temp) / temp.length
}

module.exports = mean

// tests
if (!module.parent && typeof(window) === "undefined"){
  let normal = require("./normal.js")
  let random = require("./random.js")
  let abs = require("./abs.js")

  let x = [2, 3, 4]
  let yTrue = 3
  let yPred = mean(x)
  assert(yTrue === yPred, `mean(2, 3, 4) should be 3, but instead is ${yPred}!`)

  x = normal([10000])
  yPred = mean(x)
  assert(abs(yPred) < 0.05, `mean(normal([10000])) should be approximately 0, but instead was ${yPred}!`)

  x = random([10000])
  yPred = mean(x)
  assert(yPred - 0.5 < 0.05, `mean(random([10000])) should be approximately 0.5, but instead was ${yPred}!`)

  x = normal([10, 10, 10, 10])
  yPred = mean(x)
  assert(abs(yPred) < 0.05, `mean(normal([10, 10, 10, 10])) should be approximately 0, but instead was ${yPred}!`)

  let hasFailed

  try {
    hasFailed = false
    mean()
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `mean() should have failed!`)

  try {
    hasFailed = false
    mean("foo")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `mean("foo") should have failed!`)

  try {
    hasFailed = false
    mean({})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `mean({}) should have failed!`)

  try {
    hasFailed = false
    mean(true)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `mean(true) should have failed!`)

  try {
    let foo
    hasFailed = false
    mean(foo)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `mean(foo) should have failed!`)

  try {
    hasFailed = false
    mean(() => {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `mean(() => {}) should have failed!`)

  try {
    hasFailed = false
    mean([1, 2, "three"])
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `mean([1, 2, "three"]) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./abs.js":7,"./flatten.js":25,"./is-array.js":29,"./is-number.js":33,"./is-undefined.js":35,"./normal.js":45,"./random.js":48,"./sum.js":63}],41:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isUndefined = require("./is-undefined.js")
let isArray = require("./is-array.js")
let isNumber = require("./is-number.js")
let flatten = require("./flatten.js")
let sort = require("./sort.js")

function median(arr){
  assert(!isUndefined(arr), "You must pass one array of numbers into the `median` function!")
  assert(isArray(arr), "You must pass one array of numbers into the `median` function!")

  let temp = flatten(arr)

  temp.forEach(function(item){
    assert(isNumber(item), "The `median` function only works on numbers!")
  })

  temp = sort(temp, function(a, b){
    if (a < b) return -1
    if (a > b) return 1
    return 0
  })

  let out

  if (temp.length % 2 === 0){
    out = (temp[temp.length / 2 - 1] + temp[temp.length / 2]) / 2
  } else {
    out = temp[Math.floor(temp.length / 2)]
  }

  return out
}

module.exports = median

// tests
if (!module.parent && typeof(window) === "undefined"){
  let shuffle = require("./shuffle.js")
  let normal = require("./normal.js")
  let random = require("./random.js")
  let round = require("./round.js")
  let scale = require("./scale.js")

  let x = [2, 4, 3]
  let yTrue = 3
  let yPred = median(x)
  assert(yTrue === yPred, `median([2, 4, 3]) should be 3, but instead was ${yPred}!`)

  let x1 = round(scale(random([5, 5, 5, 5]), 100))
  let x2 = shuffle(x1)
  let x3 = shuffle(x1)
  let x4 = shuffle(x1)
  let y1 = median(x1)
  let y2 = median(x2)
  let y3 = median(x3)
  let y4 = median(x4)
  assert(y1 === y2 && y2 === y3 && y3 === y4, "The `median` function should return the same median for shuffled versions of the same array!")

  assert(isNaN(median([])), `median([]) should be NaN!`)

  let hasFailed

  try {
    hasFailed = false
    median()
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `median() should have failed!`)

  try {
    hasFailed = false
    median("foo")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `median("foo") should have failed!`)

  try {
    hasFailed = false
    median([1, 2, "three"])
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `median([1, 2, "three"]) should have failed!`)

  try {
    hasFailed = false
    median([true])
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `median([true]) should have failed!`)

  try {
    hasFailed = false
    median([{}])
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `median([{}]) should have failed!`)

  try {
    let foo
    hasFailed = false
    median([foo, foo, foo])
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `median([foo, foo, foo]) should have failed!`)

  try {
    let fn = () => {}
    hasFailed = false
    median([fn, fn, fn,])
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `median([fn, fn, fn]) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./flatten.js":25,"./is-array.js":29,"./is-number.js":33,"./is-undefined.js":35,"./normal.js":45,"./random.js":48,"./round.js":51,"./scale.js":52,"./shuffle.js":56,"./sort.js":60}],42:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isUndefined = require("./is-undefined.js")
let isArray = require("./is-array.js")
let isNumber = require("./is-number.js")
let flatten = require("./flatten.js")

function min(arr){
  assert(!isUndefined(arr), "You must pass one array of numbers into the `min` function!")
  assert(isArray(arr), "You must pass one array of numbers into the `min` function!")

  let temp = flatten(arr)

  temp.forEach(function(item){
    assert(isNumber(item), "The `min` function only works on arrays of numbers!")
  })

  let out = Infinity

  temp.forEach(function(x){
    if (x < out){
      out = x
    }
  })

  return out === Infinity ? undefined : out
}

module.exports = min

// tests
if (!module.parent && typeof(window) === "undefined"){
  let random = require("./random.js")

  let x = [4, 2, 3]
  let yTrue = 2
  let yPred = min(x)
  assert(yTrue === yPred, `min([4, 2, 3]) should be 2, but instead was ${yPred}!`)

  x = [[-50, 50, 234], [100, -100, 0]]
  yTrue = -100
  yPred = min(x)
  assert(yTrue === yPred, `min([[-50, 50, 234], [100, -100, 0]]) should be -100, but instead was ${yPred}!`)

  x = random([2, 3, 4, 5])
  yPred = min(x)
  assert(yPred <= 1 && yPred >= 0, `min(random([2, 3, 4, 5])) should be >= 0 and <= 1!`)

  let hasFailed

  try {
    hasFailed = false
    min()
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `min() should have failed!`)

  try {
    hasFailed = false
    min(234)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `min(234) should have failed!`)

  try {
    hasFailed = false
    min({})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `min({}) should have failed!`)

  try {
    hasFailed = false
    min("foo")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `min("foo") should have failed!`)

  try {
    hasFailed = false
    min(true)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `min(true) should have failed!`)

  try {
    hasFailed = false
    min([1, 2, "three"])
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `min([1, 2, "three"]) should have failed!`)

  try {
    hasFailed = false
    min([() => {}])
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `min([() => {}]) should have failed!`)

  try {
    let foo
    hasFailed = false
    min([foo, foo, foo])
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `min([foo, foo, foo]) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./flatten.js":25,"./is-array.js":29,"./is-number.js":33,"./is-undefined.js":35,"./random.js":48}],43:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isUndefined = require("./is-undefined.js")
let isArray = require("./is-array.js")
let flatten = require("./flatten.js")
let count = require("./count.js")
let set = require("./set.js")
let sort = require("./sort.js")

function mode(arr){
  assert(!isUndefined(arr), "You must pass one array into the `mode` function!")
  assert(isArray(arr), "You  must pass one array into the `mode` function!")

  let temp = flatten(arr)
  let counts = {}
  let refs = {}
  let tempSet = set(temp)

  tempSet.forEach(function(item){
    counts[item] = count(temp, item)
    refs[item] = item
  })

  let sortedTempSet = sort(tempSet, function(a, b){
    let count1 = counts[a]
    let count2 = counts[b]

    if (count1 > count2) return -1
    if (count1 < count2) return 1
    return 0
  })

  let mostCountedItem = sortedTempSet[0]
  let out = sortedTempSet.filter(item => counts[item] === counts[mostCountedItem])
  return out
}

module.exports = mode

// tests
if (!module.parent && typeof(window) === "undefined"){
  let random = require("./random.js")
  let round = require("./round.js")
  let shuffle = require("./shuffle.js")
  let scale = require("./scale.js")

  let x = [2, 3, 3, 3, 2, 4]
  let yTrue = [3]
  let yPred = mode(x)
  for (let i=0; i<yTrue.length; i++) assert(yTrue[i] === yPred[i], `mode([2, 3, 3, 3, 2, 4]) should be 3, but instead was ${yPred}!`)

  let x1 = round(scale(random([5, 5, 5, 5]), 100))
  let x2 = shuffle(x1)
  let x3 = shuffle(x1)
  let x4 = shuffle(x1)
  let y1 = mode(x1)
  let y2 = mode(x2)
  let y3 = mode(x3)
  let y4 = mode(x4)
  for (let i=0; i<y1.length; i++) assert(y1[i] === y2[i], "The `mode` function should return the same mode for shuffled versions of the same array!")
  for (let i=0; i<y1.length; i++) assert(y2[i] === y3[i], "The `mode` function should return the same mode for shuffled versions of the same array!")
  for (let i=0; i<y1.length; i++) assert(y3[i] === y4[i], "The `mode` function should return the same mode for shuffled versions of the same array!")

  let hasFailed

  try {
    hasFailed = false
    mode()
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `mode() should have failed!`)

  try {
    hasFailed = false
    mode("foo")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `mode("foo") should have failed!`)

  try {
    hasFailed = false
    mode({})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `mode({}) should have failed!`)

  try {
    hasFailed = false
    mode(() => {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `mode(() => {}) should have failed!`)

  try {
    hasFailed = false
    mode(true)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `mode(true) should have failed!`)

  try {
    hasFailed = false
    mode()
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `mode() should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./count.js":20,"./flatten.js":25,"./is-array.js":29,"./is-undefined.js":35,"./random.js":48,"./round.js":51,"./scale.js":52,"./set.js":54,"./shuffle.js":56,"./sort.js":60}],44:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isUndefined = require("./is-undefined.js")
let isArray = require("./is-array.js")
let isNumber = require("./is-number.js")
let floor = require("./floor.js")
let range = require("./range.js")

let error = "You must pass an integer or a one-dimensional array of integers into the `ndarray` function!"

function ndarray(shape){
  assert(!isUndefined(shape), error)

  if (!isArray(shape)) shape = [shape]

  assert(shape.length > 0, error)

  shape.forEach(function(x){
    assert(isNumber(x), error)
    assert(floor(x) === x, error)
    assert(x >= 0, error)
  })

  if (shape.length === 1){
    return range(0, shape[0]).map(v => undefined)
  } else {
    let out = []
    for (let i=0; i<shape[0]; i++) out.push(ndarray(shape.slice(1, shape.length)))
    return out
  }
}

module.exports = ndarray

// tests
if (!module.parent && typeof(window) === "undefined"){
  let flatten = require("./flatten.js")

  assert(ndarray(3).length === 3, `ndarray(3) should have a length of 3!`)
  assert(ndarray([3]).length === 3, `ndarray([3]) should have a length of 3!`)
  assert(ndarray([3, 2]).length === 3, `ndarray([3, 2]) should have a length of 3!`)
  assert(flatten(ndarray([2, 3, 4])).length === 24, `flatten(ndarray([2, 3, 4])) should have a length of 24!`)

  let hasFailed

  try {
    hasFailed = false
    ndarray()
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `ndarray() should have failed!`)

  try {
    hasFailed = false
    ndarray("foo")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `ndarray("foo") should have failed!`)

  try {
    hasFailed = false
    ndarray(3.5)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `ndarray(3.5) should have failed!`)

  try {
    hasFailed = false
    ndarray(-10)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `ndarray(-10) should have failed!`)

  try {
    hasFailed = false
    ndarray({})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `ndarray({}) should have failed!`)

  try {
    hasFailed = false
    ndarray(true)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `ndarray(true) should have failed!`)

  try {
    hasFailed = false
    ndarray([])
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `ndarray([]) should have failed!`)

  try {
    hasFailed = false
    ndarray(() => {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `ndarray(() => {}) should have failed!`)

  try {
    let foo
    hasFailed = false
    ndarray(foo)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `ndarray(foo) should have failed!`)

  try {
    hasFailed = false
    ndarray([1, 2, "three"])
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `ndarray([1, 2, "three"]) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./flatten.js":25,"./floor.js":26,"./is-array.js":29,"./is-number.js":33,"./is-undefined.js":35,"./range.js":49}],45:[function(require,module,exports){
let isUndefined = require("./is-undefined.js")
let ndarray = require("./ndarray.js")
let apply = require("../misc/apply.js")
let random = require("./random.js")

function normal(shape){
  function n(){
    let u1 = random()
    let u2 = random()
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  }

  if (isUndefined(shape)) return n()
  return apply(ndarray(shape), n)
}

module.exports = normal

// tests
if (!module.parent && typeof(window) === "undefined"){
  let assert = require("../misc/assert.js")
  let std = require("./std.js")
  let mean = require("./mean.js")
  let abs = require("./abs.js")
  let seed = require("./seed.js")
  let distance = require("./distance.js")

  let x = normal([10000])
  let m = mean(x)
  let s = std(x)

  assert(abs(m) < 0.05, `normal([10000]) should have a mean of approximately 0!`)
  assert(abs(s - 1) < 0.05, `normal([10000]) should have a standard deviation of approximately 1!`)

  x = normal([10, 10, 10, 10])
  m = mean(x)
  s = std(x)

  assert(abs(m) < 0.05, `normal([10, 10, 10, 10]) should have a mean of approximately 0!`)
  assert(abs(s - 1) < 0.05, `normal([10, 10, 10, 10]) should have a standard deviation of approximately 1!`)

  seed(230498230498)
  let a = normal(10000)
  seed(230498230498)
  let b = normal(10000)
  assert(distance(a, b) === 0, "Two normally-distributed arrays seeded with the same value should be identical!")

  let hasFailed

  try {
    hasFailed = false
    normal("foo")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `normal("foo") should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/apply.js":70,"../misc/assert.js":72,"./abs.js":7,"./distance.js":22,"./is-undefined.js":35,"./mean.js":40,"./ndarray.js":44,"./random.js":48,"./seed.js":53,"./std.js":62}],46:[function(require,module,exports){
let ndarray = require("./ndarray.js")
let apply = require("../misc/apply.js")

function ones(shape){
  return apply(ndarray(shape), v => 1)
}

module.exports = ones

// tests
if (!module.parent && typeof(window) === "undefined"){
  let assert = require("../misc/assert.js")
  let sum = require("./sum.js")
  let mean = require("./mean.js")
  let std = require("./std.js")
  let flatten = require("./flatten.js")

  let x = ones([2, 3, 4, 5])
  assert(sum(x) === 2 * 3 * 4 * 5, `sum(ones([2, 3, 4, 5])) should be 2 * 3 * 4 * 5!`)
  assert(mean(x) === 1, `mean(ones([2, 3, 4, 5])) should be 1!`)
  assert(std(x) === 0, `std(ones([2, 3, 4, 5])) should be 0!`)
  assert(sum(x) === flatten(x).length, `sum(ones([2, 3, 4, 5])) should be the same as flatten(ones([2, 3, 4, 5])).length!`)

  let hasFailed

  try {
    hasFailed = false
    ones()
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `ones() should have failed!`)

  try {
    hasFailed = false
    ones("foo")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `ones("foo") should have failed!`)

  try {
    hasFailed = false
    ones(true)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `ones(true) should have failed!`)

  try {
    hasFailed = false
    ones({})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `ones({}) should have failed!`)

  try {
    let foo
    hasFailed = false
    ones(foo)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `ones(foo) should have failed!`)

  try {
    hasFailed = false
    ones([1, 2, "three"])
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `ones([1, 2, "three"]) should have failed!`)

  try {
    hasFailed = false
    ones(() => {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `ones(() => {}) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/apply.js":70,"../misc/assert.js":72,"./flatten.js":25,"./mean.js":40,"./ndarray.js":44,"./std.js":62,"./sum.js":63}],47:[function(require,module,exports){
let vectorize = require("./vectorize.js")
let assert = require("../misc/assert.js")
let isUndefined = require("./is-undefined.js")
let isNumber = require("./is-number.js")

let pow = vectorize(function(x, p){
  assert(!isUndefined(x) && !isUndefined(p), "You must pass two numbers (or two equally-sized arrays of numbers) into the `pow` function!")
  assert(isNumber(x) && isNumber(p), "You must pass two numbers (or two equally-sized arrays of numbers) into the `pow` function!")

  return Math.pow(x, p)
})

module.exports = pow

// tests
if (!module.parent && typeof(window) === "undefined"){
  let x = 3
  let p = 2
  let yTrue = 9
  let yPred = pow(x, p)
  assert(yTrue === yPred, `pow(${x}, ${p}) should be ${yTrue}, but instead was ${yPred}!`)

  x = [3, 4, 5]
  p = 2
  yTrue = [9, 16, 25]
  yPred = pow(x, p)
  for (let i=0; i<yTrue.length; i++) assert(yTrue[i] === yPred[i], `pow(${x[i]}, ${p}) should be ${yTrue[i]}, but instead was ${yPred[i]}!`)

  x = 3
  p = [2, 3, 4]
  yTrue = [9, 27, 81]
  yPred = pow(x, p)
  for (let i=0; i<yTrue.length; i++) assert(yTrue[i] === yPred[i], `pow(${x}, ${p[i]}) should be ${yTrue[i]}, but instead was ${yPred[i]}!`)

  x = [2, 3, 4]
  p = [2, 3, 4]
  yTrue = [4, 27, 256]
  yPred = pow(x, p)
  for (let i=0; i<yTrue.length; i++) assert(yTrue[i] === yPred[i], `pow(${x[i]}, ${p[i]}) should be ${yTrue[i]}, but instead was ${yPred[i]}!`)

  let hasFailed

  try {
    hasFailed = false
    pow()
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `pow() should have failed!`)

  try {
    hasFailed = false
    pow(2)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `pow(2) should have failed!`)

  try {
    hasFailed = false
    pow(2, "three")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `pow(2, "three") should have failed!`)

  try {
    hasFailed = false
    pow("two", 3)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `pow("two", 3) should have failed!`)

  try {
    hasFailed = false
    pow(true, true)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `pow(true, true) should have failed!`)

  try {
    hasFailed = false
    pow({}, {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `pow({}, {}) should have failed!`)

  try {
    let foo
    hasFailed = false
    pow(foo, foo)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `pow(foo, foo) should have failed!`)

  try {
    let fn = () => {}
    hasFailed = false
    pow(fn, fn)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `pow(fn, fn) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./is-number.js":33,"./is-undefined.js":35,"./vectorize.js":67}],48:[function(require,module,exports){
let ndarray = require("./ndarray.js")
let apply = require("../misc/apply.js")
let isUndefined = require("./is-undefined.js")
let seed = require("./seed.js")
let pow = require("./pow.js")

let a = 1103515245
let c = 12345
let m = pow(2, 31)

function lcg(){
  let s = seed()
  let out = (a * s + c) % m
  seed(out)
  return out / m
}

function random(shape){
  if (isUndefined(shape)) return lcg()
  return apply(ndarray(shape), lcg)
}

module.exports = random

// tests
if (!module.parent && typeof(window) === "undefined"){
  let assert = require("../misc/assert.js")
  let distance = require("./distance.js")
  let min = require("./min.js")
  let max = require("./max.js")
  let abs = require("./abs.js")
  let mean = require("./mean.js")

  let x = random([10, 10, 10, 10])
  assert(min(x) >= 0 && max(x) <= 1, `random([10, 10, 10, 10]) should be in the range [0, 1]!`)
  assert(abs(mean(x)) - 0.5 < 0.05, `random([10, 10, 10, 10]) should have a mean of approximately 0.5!`)

  x = random()
  assert(x >= 0 && x <= 1, `random() should be in the range [0, 1]!`)

  seed(203948203948)
  let a = random([10, 10, 10, 10])
  seed(203948203948)
  let b = random([10, 10, 10, 10])
  assert(distance(a, b) === 0, "Two random arrays seeded with the same value should be identical!")

  let hasFailed

  try {
    hasFailed = false
    random("foo")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `random("foo") should have failed!`)

  try {
    hasFailed = false
    random(true)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `random(true) should have failed!`)

  try {
    hasFailed = false
    random({})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `random({}) should have failed!`)

  try {
    hasFailed = false
    random(() => {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `random(() => {}) should have failed!`)

  try {
    hasFailed = false
    random([1, 2, "three"])
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `random([1, 2, "three"]) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/apply.js":70,"../misc/assert.js":72,"./abs.js":7,"./distance.js":22,"./is-undefined.js":35,"./max.js":39,"./mean.js":40,"./min.js":42,"./ndarray.js":44,"./pow.js":47,"./seed.js":53}],49:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isUndefined = require("./is-undefined.js")
let isNumber = require("./is-number.js")

function range(a, b, step=1){
  assert(!isUndefined(a) && !isUndefined(b) && !isUndefined(step), "You must pass two numbers and optionally a step value to the `range` function!")
  assert(isNumber(a) && isNumber(b) && isNumber(step), "You must pass two numbers and optionally a step value to the `range` function!")
  assert(step > 0, "The step value must be greater than 0! (NOTE: The step value is a magnitude; it does not indicate direction.)")

  let shouldReverse = false

  if (a > b){
    shouldReverse = true
    let buffer = a
    a = b + step
    b = buffer + step
  }

  let out = []
  for (let i=a; i<b; i+=step) out.push(i)
  if (shouldReverse) out.reverse()
  return out
}

module.exports = range

// tests
if (!module.parent && typeof(window) === "undefined"){
  let yTrue = [5, 6, 7, 8, 9]
  let yPred = range(5, 10)
  for (let i=0; i<yTrue; i++) assert(yTrue[i] === yPred[i], `range(5, 10) should be [5, 6, 7, 8, 9]!`)

  yTrue = [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5]
  yPred = range(5, 10, 0.5)
  for (let i=0; i<yTrue; i++) assert(yTrue[i] === yPred[i], `range(5, 10, 0.5) should be [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5]!`)

  yTrue = [3, 2, 1, 0, -1, -2]
  yPred = range(3, -3)
  for (let i=0; i<yTrue; i++) assert(yTrue[i] === yPred[i], `range(3, -3) should be [3, 2, 1, 0, -1, -2]!`)

  yTrue = [-1, -1.25, -1.5, -1.75]
  yPred = range(-1, -2, 0.25)
  for (let i=0; i<yTrue; i++) assert(yTrue[i] === yPred[i], `range(-1, -2, 0.25) should be [-1, -1.25, -1.5, -1.75]!`)

  let hasFailed

  try {
    hasFailed = false
    range()
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `range() should have failed!`)

  try {
    hasFailed = false
    range(1, 2, -3)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `range(1, 2, -3) should have failed!`)

  try {
    hasFailed = false
    range("foo", "bar", "baz")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `range("foo", "bar", "baz") should have failed!`)

  try {
    hasFailed = false
    range([], [], [])
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `range([], [], []) should have failed!`)

  try {
    hasFailed = false
    range(true, true, true)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `range(true, true, true) should have failed!`)

  try {
    hasFailed = false
    range({}, {}, {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `range({}, {}, {}) should have failed!`)

  try {
    let foo
    hasFailed = false
    range(foo, foo, foo)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `range(foo, foo, foo) should have failed!`)

  try {
    let fn = () => {}
    hasFailed = false
    range(fn, fn, fn)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `range(fn, fn, fn) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./is-number.js":33,"./is-undefined.js":35}],50:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isUndefined = require("./is-undefined.js")
let isArray = require("./is-array.js")

function reverse(arr){
  assert(!isUndefined(arr), "You must pass an array into the `reverse` function!")
  assert(isArray(arr), "You must pass an array into the `reverse` function!")

  let out = []
  for (let i=arr.length-1; i>=0; i--) out.push(arr[i])
  return out
}

module.exports = reverse

// tests
if (!module.parent && typeof(window) === "undefined"){
  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./is-array.js":29,"./is-undefined.js":35}],51:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isUndefined = require("./is-undefined.js")
let isNumber = require("./is-number.js")
let vectorize = require("./vectorize.js")

let round = vectorize(function(x){
  assert(!isUndefined(x), "You must pass a number or an array of numbers into the `round` function!")
  assert(isNumber(x), "You must pass a number or an array of numbers into the `round` function!")

  return Math.round(x)
})

module.exports = round

// tests
if (!module.parent && typeof(window) === "undefined"){
  let random = require("./random.js")
  let set = require("./set.js")
  let sort = require("./sort.js")

  let yTrue = 2
  let yPred = round(2.34)
  assert(yTrue === yPred, `round(2.34) should be 2, but instead was ${yPred}!`)

  yTrue = 3
  yPred = round(2.5)
  assert(yTrue === yPred, `round(2.5) should be 3, but instead was ${yPred}!`)

  yTrue = -4
  yPred = round(-3.75)
  assert(yTrue === yPred, `round(-3.75) should be -4, but instead was ${yPred}!`)

  yPred = sort(set(round(random([10, 10, 10, 10]))), function(a, b){
    if (a < b) return -1
    if (a > b) return 1
    return 0
  })

  assert(yPred[0] === 0 && yPred[1] === 1 && yPred.length === 2, `sort(set(round(random([10, 10, 10, 10])))) should be [0, 1]!`)

  let hasFailed

  try {
    hasFailed = false
    round()
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `round() should have failed!`)

  try {
    hasFailed = false
    round("foo")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `round("foo") should have failed!`)

  try {
    hasFailed = false
    round(true)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `round(true) should have failed!`)

  try {
    hasFailed = false
    round({})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `round({}) should have failed!`)

  try {
    hasFailed = false
    round(() => {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `round(() => {}) should have failed!`)

  try {
    let foo
    hasFailed = false
    round(foo)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `round(foo) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./is-number.js":33,"./is-undefined.js":35,"./random.js":48,"./set.js":54,"./sort.js":60,"./vectorize.js":67}],52:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isUndefined = require("./is-undefined.js")
let isNumber = require("./is-number.js")
let vectorize = require("./vectorize.js")

let scale = vectorize(function(a, b){
  assert(!isUndefined(a) && !isUndefined(b), "You must pass two numbers (or an array of numbers and a number, or a number and an array of numbers, or two arrays of numbers) into the `scale` function!")
  assert(isNumber(a) && isNumber(b), "You must pass two numbers (or an array of numbers and a number, or a number and an array of numbers, or two arrays of numbers) into the `scale` function!")

  return a * b
})

module.exports = scale

// tests
if (!module.parent && typeof(window) === "undefined"){
  let a = 3
  let b = 5
  let yTrue = 15
  let yPred = scale(a, b)
  assert(yTrue === yPred, `scale(${a}, ${b}) should be ${yTrue}, but instead was ${yPred}!`)

  a = [3, 4, 5]
  b = 5
  yTrue = [15, 20, 25]
  yPred = scale(a, b)
  for (let i=0; i<yTrue.length; i++) assert(yTrue[i] === yPred[i], `scale(${a[i]}, ${b}) should be ${yTrue[i]}, but instead was ${yPred[i]}!`)

  a = 3
  b = [5, 6, 7]
  yTrue = [15, 18, 21]
  yPred = scale(a, b)
  for (let i=0; i<yTrue.length; i++) assert(yTrue[i] === yPred[i], `scale(${a}, ${b[i]}) should be ${yTrue[i]}, but instead was ${yPred[i]}!`)

  a = [2, 3, 4]
  b = [5, 6, 7]
  yTrue = [10, 18, 28]
  yPred = scale(a, b)
  for (let i=0; i<yTrue.length; i++) assert(yTrue[i] === yPred[i], `scale(${a[i]}, ${b[i]}) should be ${yTrue[i]}, but instead was ${yPred[i]}!`)

  let hasFailed

  try {
    hasFailed = false
    scale()
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `scale() should have failed!`)

  try {
    hasFailed = false
    scale("two", "three")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `scale("two", "three") should have failed!`)

  try {
    hasFailed = false
    scale(true, false)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `scale(true, false) should have failed!`)

  try {
    hasFailed = false
    scale({}, {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `scale({}, {}) should have failed!`)

  try {
    let fn = () => {}
    hasFailed = false
    scale(fn, fn)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `scale(fn, fn) should have failed!`)

  try {
    let foo
    hasFailed = false
    scale(foo, foo)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `scale(foo, foo) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./is-number.js":33,"./is-undefined.js":35,"./vectorize.js":67}],53:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isUndefined = require("./is-undefined.js")
let isNumber = require("./is-number.js")
let s = parseInt(Math.random() * 999999)

function seed(val){
  if (!isUndefined(val)){
    assert(isNumber(val), "If passing a value into the `seed` function, then that value must be a positive integer!")
    assert(parseInt(val) === val, "If passing a value into the `seed` function, then that value must be a positive integer!")
    assert(val >= 0, "If passing a value into the `seed` function, then that value must be a positive integer!")
  }

  if (!isUndefined(val)) s = val
  else return s
}

module.exports = seed

},{"../misc/assert.js":72,"./is-number.js":33,"./is-undefined.js":35}],54:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isUndefined = require("./is-undefined.js")
let isArray = require("./is-array.js")
let flatten = require("./flatten.js")

function set(arr){
  assert(!isUndefined(arr), "You must pass an array into the `set` function!")
  assert(isArray(arr), "You must pass an array into the `set` function!")

  let out = []

  flatten(arr).forEach(function(item){
    if (out.indexOf(item) < 0) out.push(item)
  })

  return out
}

module.exports = set

// tests
if (!module.parent && typeof(window) === "undefined"){
  let sort = require("./sort.js")
  let round = require("./round.js")
  let random = require("./random.js")
  let range = require("./range.js")

  function alphasort(a, b){
    if (a < b) return -1
    if (a > b) return 1
    return 0
  }

  let x = [2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 3, 4, 3, 2, 2, 3, 3, 3, 3, 4]
  let yTrue = [2, 3, 4]
  let yPred = sort(set(x), alphasort)
  for (let i=0; i<yTrue.length; i++) assert(yTrue[i] === yPred[i], `set([2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 3, 4, 3, 2, 2, 3, 3, 3, 3, 4]) should be [2, 3, 4]!`)

  x = round(random([10, 10, 10, 10]))
  yTrue = [0, 1]
  yPred = sort(set(x), alphasort)
  for (let i=0; i<yTrue.length; i++) assert(yTrue[i] === yPred[i], `set(round(random([10, 10, 10, 10]))) should be [0, 1]!`)

  x = range(10, 20, 0.25)
  yTrue = x.slice()
  yPred = set(x)
  for (let i=0; i<yTrue.length; i++) assert(yTrue[i] === yPred[i], `set(range(10, 20, 0.25)) should be the same as range(10, 20, 0.25)!`)

  x = ["foo", "bar", "baz", "foo", "foo", true, true, false, true, 234, 234, 0]
  yTrue = ["foo", "bar", "baz", true, false, 234, 0]
  yPred = set(x)
  for (let i=0; i<yTrue.length; i++) assert(yTrue[i] === yPred[i], `set(["foo", "bar", "baz", "foo", "foo", true, true, false, true, 234, 234, 0]) should be ["foo", "bar", "baz", true, false, 234, 0]!`)

  let hasFailed

  try {
    hasFailed = false
    set()
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `set() should have failed!`)

  try {
    hasFailed = false
    set("foo")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `set("foo") should have failed!`)

  try {
    hasFailed = false
    set(234)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `set(234) should have failed!`)

  try {
    hasFailed = false
    set(true)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `set(true) should have failed!`)

  try {
    hasFailed = false
    set({})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `set({}) should have failed!`)

  try {
    hasFailed = false
    set(() => {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `set(() => {}) should have failed!`)

  try {
    let foo
    hasFailed = false
    set(foo)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `set(foo) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./flatten.js":25,"./is-array.js":29,"./is-undefined.js":35,"./random.js":48,"./range.js":49,"./round.js":51,"./sort.js":60}],55:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isUndefined = require("./is-undefined.js")
let isArray = require("./is-array.js")
let max = require("./max.js")

function shape(arr){
  assert(!isUndefined(arr), "You must pass an array into the `shape` function!")
  assert(isArray(arr), "You must pass an array into the `shape` function!")

  let out = [arr.length]
  let childrenAreArrays = arr.map(x => isArray(x))

  if (childrenAreArrays.indexOf(true) > -1){
    assert(childrenAreArrays.indexOf(false) < 0, "The array passed into the `shape` function has some children that are not themselves arrays!")

    let lengths = arr.map(x => x.length)
    let maxLength = max(lengths)

    lengths.forEach(function(length){
      assert(length === maxLength, "The array passed into the `shape` function has some children of inconsistent length!")
    })

    out = out.concat(shape(arr[0]))
  }

  return out
}

module.exports = shape

// tests
if (!module.parent && typeof(window) === "undefined"){
  let normal = require("./normal.js")

  let yTrue = 500
  let yPred = shape(normal(yTrue))[0]
  assert(yTrue === yPred, `shape(normal(500)) should be 500, but instead was ${yPred}!`)

  yTrue = [2, 3, 4]
  yPred = shape(normal(yTrue))
  for (let i=0; i<yTrue.shape; i++) assert(yTrue[i] === yPred[i], `shape(normal([2, 3, 4])) should be [2, 3, 4]!`)

  let hasFailed

  try {
    hasFailed = false
    shape()
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `shape() should have failed!`)

  try {
    hasFailed = false
    shape("foo")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `shape("foo") should have failed!`)

  try {
    hasFailed = false
    shape(234)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `shape(234) should have failed!`)

  try {
    hasFailed = false
    shape(true)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `shape(true) should have failed!`)

  try {
    hasFailed = false
    shape({})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `shape({}) should have failed!`)

  try {
    hasFailed = false
    shape(() => {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `shape(() => {}) should have failed!`)

  try {
    let foo
    hasFailed = false
    shape(foo)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `shape(foo) should have failed!`)

  try {
    hasFailed = false
    shape([[2, 3, 4], [5, 6]])
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `shape([[2, 3, 4], [5, 6]]) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./is-array.js":29,"./is-undefined.js":35,"./max.js":39,"./normal.js":45}],56:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isUndefined = require("./is-undefined.js")
let isArray = require("./is-array.js")
let floor = require("./floor.js")
let random = require("./random.js")

function shuffle(arr){
  assert(!isUndefined(arr), "You must pass a one-dimensional array into the `shuffle` function!")
  assert(isArray(arr), "You must pass a one-dimensional array into the `shuffle` function!")

  arr.forEach(function(item){
    assert(!isArray(item), "You must pass a one-dimensional array into the `shuffle` function!")
  })

  let out = arr.slice()

  for (let i=0; i<arr.length; i++){
    let index1 = floor(random() * arr.length)
    let index2 = floor(random() * arr.length)
    let buffer = out[index1]
    out[index1] = out[index2]
    out[index2] = buffer
  }

  return out
}

module.exports = shuffle

// tests
if (!module.parent && typeof(window) === "undefined"){
  let normal = require("./normal.js")
  let seed = require("./seed.js")
  let distance = require("./distance.js")

  let a = normal(10000)
  let b = shuffle(a)

  assert(distance(a, b) > 0, `shuffle(a) should not be in the same order as a!`)

  a = normal(10000)
  seed(20394230948)
  a1 = shuffle(a)
  seed(20394230948)
  a2 = shuffle(a)

  assert(distance(a1, a2) === 0, `Shuffling using the same seed should produce the same results!`)

  let hasFailed

  try {
    hasFailed = true
    shuffle()
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `shuffle() should have failed!`)

  try {
    hasFailed = true
    shuffle("foo")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `shuffle("foo") should have failed!`)

  try {
    hasFailed = true
    shuffle(true)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `shuffle(true) should have failed!`)

  try {
    hasFailed = true
    shuffle({})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `shuffle({}) should have failed!`)

  try {
    hasFailed = true
    shuffle(234)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `shuffle(234) should have failed!`)

  try {
    hasFailed = true
    shuffle(() => {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `shuffle(() => {}) should have failed!`)

  try {
    hasFailed = true
    shuffle(random([2, 3, 4]))
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `shuffle(random([2, 3, 4])) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./distance.js":22,"./floor.js":26,"./is-array.js":29,"./is-undefined.js":35,"./normal.js":45,"./random.js":48,"./seed.js":53}],57:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isUndefined = require("./is-undefined.js")
let isNumber = require("./is-number.js")
let vectorize = require("./vectorize.js")

let sign = vectorize(function(x){
  assert(!isUndefined(x), "You must pass a number or an array of numbers into the `sign` function!")
  assert(isNumber(x), "You must pass a number or an array of numbers into the `sign` function!")

  if (x < 0) return -1
  if (x > 1) return 1
  return 0
})

module.exports = sign

// tests
if (!module.parent && typeof(window) === "undefined"){
  let random = require("./random.js")
  let normal = require("./normal.js")
  let round = require("./round.js")
  let set = require("./set.js")
  let sort = require("./sort.js")
  let chop = require("./chop.js")
  let scale = require("./scale.js")
  let add = require("./add.js")

  function alphasort(a, b){
    if (a < b) return -1
    if (a > b) return 1
    return 0
  }

  let x = sort(set(sign(chop(normal(10000)))), alphasort)
  assert(x[0] === -1 && x[1] === 0 && x[2] === 1, `sort(set(sign(chop(normal(10000)))), alphasort) should be [-1, 0, 1]!`)

  x = sign(add(random(10000), 100))
  x.forEach(v => assert(v >= 0), `sign(add(random(10000), 100)) should only result in positive values!`)

  x = sign(scale(random(10000), -1))
  x.forEach(v => assert(v <= 0), `sign(scale(random(10000), -1)) should only result in negative values!`)

  let hasFailed

  try {
    hasFailed = false
    sign()
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `sign() should have failed!`)

  try {
    hasFailed = false
    sign("foo")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `sign("foo") should have failed!`)

  try {
    hasFailed = false
    sign(true)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `sign(true) should have failed!`)

  try {
    hasFailed = false
    sign({})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `sign({}) should have failed!`)

  try {
    hasFailed = false
    sign(() => {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `sign(() => {}) should have failed!`)

  try {
    let foo
    hasFailed = false
    sign(foo)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `sign(foo) should have failed!`)

  try {
    hasFailed = false
    sign([1, 2, "three"])
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `sign([1, 2, "three"]) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./add.js":8,"./chop.js":14,"./is-number.js":33,"./is-undefined.js":35,"./normal.js":45,"./random.js":48,"./round.js":51,"./scale.js":52,"./set.js":54,"./sort.js":60,"./vectorize.js":67}],58:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isUndefined = require("./is-undefined.js")
let isNumber = require("./is-number.js")
let vectorize = require("./vectorize.js")

let sin = vectorize(function(x){
  assert(!isUndefined(x), "You must pass a number or an array of numbers into the `sin` function!")
  assert(isNumber(x), "You must pass a number or an array of numbers into the `sin` function!")

  return Math.sin(x)
})

module.exports = sin

// tests
if (!module.parent && typeof(window) === "undefined"){
  let min = require("./min.js")
  let max = require("./max.js")
  let range = require("./range.js")

  let x = sin(range(0, 10 * Math.PI, Math.PI / 180))
  assert(min(x) === -1 && max(x) === 1, `sin(range(0, 10 * Math.PI, Math.PI / 100)) should be in the range [-1, 1]!`)

  let hasFailed

  try {
    hasFailed = false
    sin()
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `sin() should have failed!`)

  try {
    hasFailed = false
    sin("foo")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `sin("foo") should have failed!`)

  try {
    hasFailed = false
    sin(true)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `sin(true) should have failed!`)

  try {
    hasFailed = false
    sin({})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `sin({}) should have failed!`)

  try {
    hasFailed = false
    sin(() => {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `sin(() => {}) should have failed!`)

  try {
    let foo
    hasFailed = false
    sin(foo)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `sin(foo) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./is-number.js":33,"./is-undefined.js":35,"./max.js":39,"./min.js":42,"./range.js":49,"./vectorize.js":67}],59:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isUndefined = require("./is-undefined.js")
let isNumber = require("./is-number.js")
let isArray = require("./is-array.js")
let range = require("./range.js")
let flatten = require("./flatten.js")
let shape = require("./shape.js")
let floor = require("./floor.js")

function slice(arr, indices){
  assert(!isUndefined(arr), "You must pass an array into the `slice` function!")
  assert(isArray(arr), "You must pass an array into the `slice` function!")

  if (isUndefined(indices)) return arr.slice()

  assert(isArray(indices), "The indices passed into the `slice` function must be a one-dimensional array of integers or null values.")

  flatten(indices).forEach(function(idx){
    assert(isUndefined(idx) || (isNumber(idx) && floor(idx) === idx), "The indices passed into the `slice` function must be a one-dimensional array of integers or null values.")
  })

  let idx = indices[0]
  if (isUndefined(idx)) idx = range(0, arr.length)
  if (isNumber(idx)) idx = [idx]

  let out = []

  idx.forEach(function(i){
    assert(i < arr.length, "Index out of bounds in the `slice` function!")
    if (i < 0) i += arr.length

    let item = arr[i]

    if (isArray(item)){
      out.push(slice(arr[i], indices.slice(1, indices.length)))
    } else {
      out.push(arr[i])
    }
  })

  // if (shape(out).indexOf(1) > -1) out = flatten(out)

  return out
}

module.exports = slice

// tests
if (!module.parent && typeof(window) === "undefined"){
  let distance = require("./distance.js")

  let x = [[2, 3, 4], [5, 6, 7], [8, 9, 10]]
  let yTrue = [[3, 6, 9]]
  let yPred = slice(x, [null, 1])

  x = [[2, 3, 4], [5, 6, 7], [8, 9, 10]]
  yTrue = [[2, 3], [8, 9]]
  yPred = slice(x, [[0, 2], [0, 1]])

  assert(distance(yTrue, yPred) === 0, `slice([[2, 3, 4], [5, 6, 7], [8, 9, 10]], [[0, 2], [0, 1]]) should be [[2, 3], [8, 9]]!`)

  x = [5, 6, 7]
  assert(slice(x, [-1])[0] === 7, `slice([5, 6, 7], [-1]) should be [7]!`)

  x = [[2, 3, 4], [5, 6, 7], [8, 9, 10]]
  yTrue = [[9]]
  yPred = slice(x, [-1, -2])
  assert(distance(yTrue, yPred) === 0, `slice([[2, 3, 4], [5, 6, 7], [8, 9, 10]], [-1, -2]) should be [9]!`)

  let hasFailed

  try {
    hasFailed = false
    slice()
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `slice() should have failed!`)

  try {
    hasFailed = false
    slice([2, 3, 4], [1.5, 2.5, 3.5])
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `slice([2, 3, 4], [1.5, 2.5, 3.5]) should have failed!`)

  try {
    hasFailed = false
    slice([2, 3, 4], 0)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `slice([2, 3, 4], 0) should have failed!`)

  try {
    hasFailed = false
    slice("foo")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `slice("foo") should have failed!`)

  try {
    hasFailed = false
    slice(234)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `slice(234) should have failed!`)

  try {
    hasFailed = false
    slice({})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `slice({}) should have failed!`)

  try {
    hasFailed = false
    slice(() => {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `slice(() => {}) should have failed!`)

  try {
    let foo
    hasFailed = false
    slice(foo)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `slice(foo) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./distance.js":22,"./flatten.js":25,"./floor.js":26,"./is-array.js":29,"./is-number.js":33,"./is-undefined.js":35,"./range.js":49,"./shape.js":55}],60:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isUndefined = require("./is-undefined.js")
let isArray = require("./is-array.js")

function sort(arr, fn){
  assert(!isUndefined(arr) && !isUndefined(fn), "You must pass an array and a function into the `sort` function!")
  assert(isArray(arr), "You must pass an array and a function into the `sort` function!")
  assert(typeof(fn) === "function", "You must pass an array and a function into the `sort` function!")

  let out = arr.slice()
  out.sort(fn)
  return out
}

module.exports = sort

// tests
if (!module.parent && typeof(window) === "undefined"){
  let shuffle = require("./shuffle.js")
  let range = require("./range.js")
  let distance = require("./distance.js")
  let normal = require("./normal.js")

  function alphasort(a, b){
    if (a < b) return -1
    if (a > b) return 1
    return 0
  }

  let x = shuffle(range(1, 7))
  let yTrue = range(1, 7)
  let yPred = sort(x, alphasort)
  assert(distance(yTrue, yPred) === 0, `sort(shuffle(range(1, 7)), alphasort) should be range(1, 7)!`)

  x = [{x: 5}, {x: 3}, {x: 10}]
  yTrue = [{x: 10}, {x: 5}, {x: 3}]
  yPred = sort(x, function(a, b){
    if (a.x < b.x) return 1
    if (a.x > b.x) return -1
    return 0
  })

  for (let i=0; i<yPred.length-1; i++){
    assert(yPred[i].x > yPred[i+1].x, "The objects should've been reverse-sorted by x-value!")
  }

  x = normal(10000)
  yPred = sort(x, alphasort)

  for (let i=0; i<yPred.length-1; i++){
    assert(yPred[i] < yPred[i+1], `${yPred[i]} should be less than ${yPred[i+1]}!`)
  }

  x = ["b", "c", "a", "d", "f", "e"]
  yTrue = ["a", "b", "c", "d", "e", "f"]
  yPred = sort(x, alphasort)

  for (let i=0; i<yTrue.length; i++){
    assert(yTrue[i] === yPred[i], `sort(["b", "c", "a", "d", "f", "e"], alphasort) should be ["a", "b", "c", "d", "e", "f"]!`)
  }

  let hasFailed

  try {
    hasFailed = false
    sort()
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `sort() should have failed!`)

  try {
    hasFailed = false
    sort([], [])
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `sort([], []) should have failed!`)

  try {
    hasFailed = false
    sort("foo", "foo")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `sort("foo", "foo") should have failed!`)

  try {
    hasFailed = false
    sort(true, true)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `sort(true, true) should have failed!`)

  try {
    hasFailed = false
    sort({}, {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `sort({}, {}) should have failed!`)

  try {
    let foo
    hasFailed = false
    sort(foo, foo)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `sort(foo, foo) should have failed!`)

  try {
    let fn = () => {}
    hasFailed = false
    sort(fn, fn)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `sort(fn, fn) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./distance.js":22,"./is-array.js":29,"./is-undefined.js":35,"./normal.js":45,"./range.js":49,"./shuffle.js":56}],61:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isUndefined = require("./is-undefined.js")
let isNumber = require("./is-number.js")
let vectorize = require("./vectorize.js")

let sqrt = vectorize(function(x){
  assert(!isUndefined(x), "You must pass a number or an array of numbers into the `sqrt` function!")
  assert(isNumber(x), "You must pass a number or an array of numbers into the `sqrt` function!")
  assert(x >= 0, "The `sqrt` function only operates on zero or positive numbers!")

  return Math.sqrt(x)
})

module.exports = sqrt

// tests
if (!module.parent && typeof(window) === "undefined"){
  let distance = require("./distance.js")

  let x = 4
  let yTrue = 2
  let yPred = sqrt(x)
  assert(yTrue === yPred, `sqrt(4) should be 2, but instead was ${yPred}!`)

  x = [9, 4, 16]
  yTrue = [3, 2, 4]
  yPred = sqrt(x)
  assert(distance(yTrue, yPred) === 0, `sqrt([9, 4, 16]) should be [3, 2, 4]!`)

  let hasFailed

  try {
    hasFailed = false
    sqrt()
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `sqrt() should have failed!`)

  try {
    hasFailed = false
    sqrt("foo")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `sqrt("foo") should have failed!`)

  try {
    hasFailed = false
    sqrt(true)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `sqrt(true) should have failed!`)

  try {
    hasFailed = false
    sqrt({})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `sqrt({}) should have failed!`)

  try {
    hasFailed = false
    sqrt(-4)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `sqrt(-4) should have failed!`)

  try {
    hasFailed = false
    sqrt(() => {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `sqrt(() => {}) should have failed!`)

  try {
    let foo
    hasFailed = false
    sqrt(foo)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `sqrt(foo) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./distance.js":22,"./is-number.js":33,"./is-undefined.js":35,"./vectorize.js":67}],62:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isUndefined = require("./is-undefined.js")
let isArray = require("./is-array.js")
let isNumber = require("./is-number.js")
let flatten = require("./flatten.js")
let mean = require("./mean.js")
let pow = require("./pow.js")
let sqrt = require("./sqrt.js")

function std(arr){
  assert(!isUndefined(arr), "You must pass an array of numbers into the `std` function!")
  assert(isArray(arr), "You must pass an array of numbers into the `std` function!")

  let temp = flatten(arr)
  if (temp.length === 0) return undefined

  temp.forEach(function(v){
    assert(isNumber(v), "You must pass an array of numbers into the `std` function!")
  })

  let m = mean(temp)
  let out = 0
  temp.forEach(x => out += pow(x - m, 2))
  return sqrt(out / temp.length)
}

module.exports = std

// tests
if (!module.parent && typeof(window) === "undefined"){
  let normal = require("./normal.js")
  let abs = require("./abs.js")
  let add = require("./add.js")
  let scale = require("./scale.js")

  let x = normal(10000)
  assert(abs(std(x) - 1) < 0.05, `std(normal(10000)) should be approximately 1!`)

  x = add(scale(x, 100), -250)
  assert(abs(std(x) - 100) < 5, `std(normal(10000) * 100 - 250) should be approximately 100!`)

  let hasFailed

  try {
    hasFailed = false
    std()
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `std() should have failed!`)

  try {
    hasFailed = false
    std(123)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `std(123) should have failed!`)

  try {
    hasFailed = false
    std("foo")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `std("foo") should have failed!`)

  try {
    hasFailed = false
    std(true)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `std(true) should have failed!`)

  try {
    hasFailed = false
    std({})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `std({}) should have failed!`)

  try {
    hasFailed = false
    std(() => {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `std(() => {}) should have failed!`)

  try {
    let foo
    hasFailed = false
    std(foo)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `std(foo) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./abs.js":7,"./add.js":8,"./flatten.js":25,"./is-array.js":29,"./is-number.js":33,"./is-undefined.js":35,"./mean.js":40,"./normal.js":45,"./pow.js":47,"./scale.js":52,"./sqrt.js":61}],63:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isUndefined = require("./is-undefined.js")
let isArray = require("./is-array.js")
let isNumber = require("./is-number.js")
let flatten = require("./flatten.js")

function sum(arr){
  assert(!isUndefined(arr), "You must pass an array of numbers into the `sum` function!")
  assert(isArray(arr), "You must pass an array of numbers into the `sum` function!")

  let temp = flatten(arr)

  temp.forEach(function(v){
    assert(isNumber(v), "You must pass an array of numbers into the `sum` function!")
  })

  let out = 0
  temp.forEach(v => out += v)
  return out
}

module.exports = sum

// tests
if (!module.parent && typeof(window) === "undefined"){
  let range = require("./range.js")
  let normal = require("./normal.js")
  let abs = require("./abs.js")

  let x = [2, 3, 4]
  let yTrue = 9
  let yPred = sum(x)
  assert(yTrue === yPred, `sum([2, 3, 4]) should be 9, but instead is ${yPred}!`)

  x = range(-100, 101)
  yTrue = 0
  yPred = sum(x)
  assert(yTrue === yPred, `sum(range(-100, 101)) should be 0, but instead is ${yPred}!`)

  x = []
  yTrue = 0
  yPred = sum(x)
  assert(yTrue === yPred, `sum([]) should be 0, but instead was ${yPred}!`)

  let hasFailed

  try {
    hasFailed = false
    sum()
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `sum() should have failed!`)

  try {
    hasFailed = false
    sum("foo")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `sum("foo") should have failed!`)

  try {
    hasFailed = false
    sum(123)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `sum(123) should have failed!`)

  try {
    hasFailed = false
    sum(true)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `sum(true) should have failed!`)

  try {
    hasFailed = false
    sum(() => {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `sum(() => {}) should have failed!`)

  try {
    hasFailed = false
    sum({})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `sum({}) should have failed!`)

  try {
    hasFailed = false
    sum([1, 2, "three"])
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `sum([1, 2, "three"]) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./abs.js":7,"./flatten.js":25,"./is-array.js":29,"./is-number.js":33,"./is-undefined.js":35,"./normal.js":45,"./range.js":49}],64:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isUndefined = require("./is-undefined.js")
let isNumber = require("./is-number.js")
let vectorize = require("./vectorize.js")
let floor = require("./floor.js")

let tan = vectorize(function(x){
  assert(!isUndefined(x), "You must pass a number or an array of numbers into the `tan` function!")
  assert(isNumber(x), "You must pass a number or an array of numbers into the `tan` function!")

  let k = (x - Math.PI / 2) / Math.PI
  if (k === floor(k)) return undefined
  return Math.tan(x)
})

module.exports = tan

// tests
if (!module.parent && typeof(window) === "undefined"){
  let abs = require("./abs.js")
  let normal = require("./normal.js")

  let x = Math.PI / 4
  let yTrue = 1
  let yPred = tan(x)
  assert(abs(yTrue - yPred) < 0.01, `tan(pi / 4) should be 1, but instead was ${yPred}!`)

  x = -Math.PI / 2
  yTrue = undefined
  yPred = tan(x)
  assert(yTrue === yPred, "tan(-pi / 2) should be undefined, but instead was ${yPred}!")

  x = 2 * Math.PI
  yTrue = 0
  yPred = tan(x)
  assert(abs(yTrue - yPred) < 0.01, `tan(2 * pi) should be 0, but instead was ${yPred}!`)

  let hasFailed

  try {
    hasFailed = false
    tan()
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `tan() should have failed!`)

  try {
    hasFailed = false
    tan(normal(10000))
  } catch(e){
    hasFailed = true
  }

  assert(!hasFailed, `tan(normal(10000)) should not have failed!`)

  try {
    hasFailed = false
    tan("foo")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `tan("foo") should have failed!`)

  try {
    hasFailed = false
    tan(true,)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `tan(true) should have failed!`)

  try {
    hasFailed = false
    tan({})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `tan({}) should have failed!`)

  try {
    hasFailed = false
    tan(() => {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `tan(() => {}) should have failed!`)

  try {
    let foo
    hasFailed = false
    tan(foo)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `tan(foo) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./abs.js":7,"./floor.js":26,"./is-number.js":33,"./is-undefined.js":35,"./normal.js":45,"./vectorize.js":67}],65:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isUndefined = require("./is-undefined.js")
let isArray = require("./is-array.js")
let shape = require("./shape.js")
let reverse = require("./reverse.js")
let ndarray = require("./ndarray.js")

function transpose(arr){
  assert(!isUndefined(arr), "You must pass an array into the `transpose` function!")
  assert(isArray(arr), "You must pass an array into the `transpose` function!")

  let theShape = shape(arr)
  assert(theShape.length <= 2, "I'm not smart enough to know how to transpose arrays that have more than 2 dimensions. Sorry for the inconvenience! Please only pass 1- or 2-dimensional arrays into the `transpose` function!")

  if (theShape.length === 1){
    return reverse(arr)
  } else if (theShape.length === 2){
    let out = ndarray(reverse(theShape))

    for (let row=0; row<theShape[0]; row++){
      for (let col=0; col<theShape[1]; col++){
        out[col][row] = arr[row][col]
      }
    }

    return out
  }
}

module.exports = transpose

// tests
if (!module.parent && typeof(window) === "undefined"){
  let isEqual = require("./is-equal.js")

  let x = [2, 3, 4]
  let yTrue = [4, 3, 2]
  let yPred = transpose(x)
  assert(isEqual(yTrue, yPred), `transpose([2, 3, 4]) should be [4, 3, 2]!`)

  x = [[2, 3, 4], [5, 6, 7], [8, 9, 10]]
  yTrue = [[2, 5, 8], [3, 6, 9], [4, 7, 10]]
  yPred = transpose(x)
  assert(isEqual(yTrue, yPred), `transpose([[2, 3, 4], [5, 6, 7], [8, 9, 10]]) should be [[2, 5, 8], [3, 6, 9], [4, 7, 10]]!`)

  x = [["a", "b", "c", "d"], ["e", "f", "g", "h"]]
  yTrue = [["a", "e"], ["b", "f"], ["c", "g"], ["d", "h"]]
  yPred = transpose(x)
  assert(isEqual(yTrue, yPred), `transpose([["a", "b", "c", "d"], ["e", "f", "g", "h"]]) should be [["a", "e"], ["b", "f"], ["c", "g"], ["d", "h"]]!`)

  let hasFailed

  try {
    hasFailed = false
    transpose()
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `transpose() should have failed!`)

  try {
    hasFailed = false
    transpose([[2, 3, 4], [5, 6]])
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `transpose([[2, 3, 4], [5, 6]]) should have failed!`)

  try {
    hasFailed = false
    transpose({})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `transpose({}) should have failed!`)

  try {
    hasFailed = false
    transpose(() => {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `transpose(() => {}) should have failed!`)

  try {
    hasFailed = false
    transpose("foo")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `transpose("foo") should have failed!`)

  try {
    hasFailed = false
    transpose(234)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `transpose(234) should have failed!`)

  try {
    hasFailed = false
    transpose(true)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `transpose(true) should have failed!`)

  try {
    hasFailed = false
    transpose(ndarray([2, 3, 4]))
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `transpose() should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./is-array.js":29,"./is-equal.js":31,"./is-undefined.js":35,"./ndarray.js":44,"./reverse.js":50,"./shape.js":55}],66:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isUndefined = require("./is-undefined.js")
let isArray = require("./is-array.js")
let isNumber = require("./is-number.js")
let flatten = require("./flatten.js")
let pow = require("./pow.js")
let std = require("./std.js")

function variance(arr){
  assert(!isUndefined(arr), "You must pass an array of numbers into the `variance` function!")
  assert(isArray(arr), "You must pass an array of numbers into the `std` function!")

  let temp = flatten(arr)

  temp.forEach(function(val){
    assert(isNumber(val), "You must pass an array of numbers into the `std` function!")
  })

  return pow(std(temp), 2)
}

module.exports = variance

// tests
if (!module.parent && typeof(window) === "undefined"){
  let abs = require("./abs.js")
  let normal = require("./normal.js")
  let scale = require("./scale.js")

  let x = normal(10000)
  let yTrue = 1
  let yPred = variance(x)
  assert(abs(yTrue - yPred) < 0.05, `variance(normal(10000)) should be approximately 1, but instead is ${yPred}!`)

  x = scale(normal([10, 10, 10, 10]), 2)
  yTrue = 4
  yPred = variance(x)
  assert(abs(yTrue - yPred) < 0.05, `variance(normal(10000) * 2) should be approximately 4, but instead is ${yPred}!`)

  let hasFailed

  try {
    hasFailed = false
    variance()
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `variance() should have failed!`)

  try {
    hasFailed = false
    variance("foo")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `variance("foo") should have failed!`)

  try {
    hasFailed = false
    variance(true)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `variance(true) should have failed!`)

  try {
    hasFailed = false
    variance(() => {})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `variance(() => {}) should have failed!`)

  try {
    hasFailed = false
    variance({})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `variance({}) should have failed!`)

  try {
    let foo
    hasFailed = false
    variance(foo)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `variance(foo) should have failed!`)

  try {
    hasFailed = false
    variance([1, 2, "three"])
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `variance([1, 2, "three"]) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./abs.js":7,"./flatten.js":25,"./is-array.js":29,"./is-number.js":33,"./is-undefined.js":35,"./normal.js":45,"./pow.js":47,"./scale.js":52,"./std.js":62}],67:[function(require,module,exports){
let assert = require("../misc/assert.js")
let isUndefined = require("./is-undefined.js")
let isFunction = require("./is-function.js")
let isArray = require("./is-array.js")
let max = require("./max.js")

function vectorize(fn){
  assert(!isUndefined(fn), "You must pass a function into the `vectorize` function!")
  assert(isFunction(fn), "You must pass a function into the `vectorize` function!")

  return function temp(){
    let atLeastOneArgumentIsAnArray = (Object.keys(arguments).map(key => isArray(arguments[key])).indexOf(true) > -1)

    if (atLeastOneArgumentIsAnArray){
      let out = []
      let lengths = Object.keys(arguments).filter(key => isArray(arguments[key])).map(key => arguments[key].length)
      let maxLength = max(lengths)

      lengths.forEach(function(length){
        assert(length === maxLength, `If using arrays for all arguments to this function, then the arrays must all have equal length!`)
      })

      for (let i=0; i<maxLength; i++){
        let args = Object.keys(arguments).map(key => {
          if (isArray(arguments[key])) return arguments[key][i]
          return arguments[key]
        })
        out.push(temp(...args))
      }

      return out
    } else {
      return fn(...arguments)
    }
  }
}

module.exports = vectorize

// tests
if (!module.parent && typeof(window) === "undefined"){
  let isEqual = require("./is-equal.js")

  let x = [2, 3, 4]
  let double = vectorize(x => x * 2)
  let yTrue = [4, 6, 8]
  let yPred = double(x)
  assert(isEqual(yTrue, yPred), "double([2, 3, 4]) should be [4, 6, 8]!")

  x = [0, 1, 2, 3]
  let tens = vectorize(x => 10)
  yTrue = [10, 10, 10, 10]
  yPred = tens(x)
  assert(isEqual(yTrue, yPred), "tens([0, 1, 2, 3]) should be [10, 10, 10, 10]!")

  x = [[[[1, 2, 3, 4]]]]
  let square = vectorize(x => x * x)
  yTrue = [[[[1, 4, 9, 16]]]]
  yPred = square(x)
  assert(isEqual(yTrue, yPred), "square([[[[1, 2, 3, 4]]]]) should be [[[[1, 4, 9, 16]]]]!")

  x = ["a", "b", "c"]
  let foo = vectorize(x => x + "foo")
  yTrue = ["afoo", "bfoo", "cfoo"]
  yPred = foo(x)
  assert(isEqual(yTrue, yPred), `foo(["a", "b", "c"]) should be ["afoo", "bfoo", "cfoo"]!`)

  let hasFailed

  try {
    hasFailed = false
    vectorize()
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `vectorize() should have failed!`)

  try {
    hasFailed = false
    let add = vectorize((a, b) => a + b)
    add([2, 3, 4], [5, 6])
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `add([2, 3, 4], [5, 6]) should have failed!`)

  try {
    hasFailed = false
    vectorize(123)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `vectorize(123) should have failed!`)

  try {
    hasFailed = false
    vectorize("foo")
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `vectorize("foo") should have failed!`)

  try {
    hasFailed = false
    vectorize(true)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `vectorize(true) should have failed!`)

  try {
    hasFailed = false
    vectorize({})
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `vectorize({}) should have failed!`)

  try {
    let foo
    hasFailed = false
    vectorize(foo)
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `vectorize(foo) should have failed!`)

  try {
    hasFailed = false
    vectorize([])
  } catch(e){
    hasFailed = true
  }

  assert(hasFailed, `vectorize([]) should have failed!`)

  console.log("All tests passed!")
}

},{"../misc/assert.js":72,"./is-array.js":29,"./is-equal.js":31,"./is-function.js":32,"./is-undefined.js":35,"./max.js":39}],68:[function(require,module,exports){
let ndarray = require("./ndarray.js")
let apply = require("../misc/apply.js")

function zeros(shape){
  return apply(ndarray(shape), x => 0)
}

module.exports = zeros

},{"../misc/apply.js":70,"./ndarray.js":44}],69:[function(require,module,exports){
let out = {
  apply: require("./apply.js"),
  array: require("./array.js"),
  assert: require("./assert.js"),
  downloadJSON: require("./download-json.js"),
  dump: require("./dump.js"),
  pause: require("./pause.js"),
  print: require("./print.js"),
}

module.exports = out

},{"./apply.js":70,"./array.js":71,"./assert.js":72,"./download-json.js":73,"./dump.js":74,"./pause.js":75,"./print.js":76}],70:[function(require,module,exports){
let vectorize = require("../math/vectorize.js")

let apply = vectorize(function(x, fn){
  return fn(x)
})

module.exports = apply

},{"../math/vectorize.js":67}],71:[function(require,module,exports){
Array.prototype.asyncForEach = async function(fn){
  for (let i=0; i<this.length; i++) await fn(this[i], i, this)
  return this
}

Array.prototype.alphaSort = function(key){
  return this.sort(function(a, b){
    if (key){
      if (a[key] < b[key]) return -1
      if (a[key] > b[key]) return 1
      return 0
    } else {
      if (a < b) return -1
      if (a > b) return 1
      return 0
    }
  })
}

},{}],72:[function(require,module,exports){
module.exports = function(isTrue, message){
  if (!isTrue) throw new Error(message)
}

},{}],73:[function(require,module,exports){
function downloadJSON(obj, filename){
  let a = document.createElement("a")
  a.href = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(obj, null, "\t"))}`
  a.download = filename
  a.dispatchEvent(new MouseEvent("click"))
}

module.exports = downloadJSON

},{}],74:[function(require,module,exports){
(function (global){(function (){
function dump(obj, excluded=["dump"]){
  Object.keys(obj).forEach(function(key){
    if (excluded.indexOf(key) < 0){
      global[key] = obj[key]
    }
  })
}

module.exports = dump

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],75:[function(require,module,exports){
function pause(ms){
  return new Promise(function(resolve, reject){
    try {
      return setTimeout(resolve, ms)
    } catch(e){
      return reject(e)
    }
  })
}

module.exports = pause

},{}],76:[function(require,module,exports){
function print(x){
  return console.log(x)
}

module.exports = print

},{}],77:[function(require,module,exports){
/*
 * liquidjs@9.11.10, https://github.com/harttle/liquidjs
 * (c) 2016-2020 harttle
 * Released under the MIT License.
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = global || self, factory(global.liquidjs = {}));
}(this, function (exports) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __awaiter(thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    function __generator(thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    }

    function __values(o) {
        var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
        if (m) return m.call(o);
        return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
    }

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    function __spread() {
        for (var ar = [], i = 0; i < arguments.length; i++)
            ar = ar.concat(__read(arguments[i]));
        return ar;
    }

    var Drop = /** @class */ (function () {
        function Drop() {
        }
        Drop.prototype.valueOf = function () {
            return undefined;
        };
        Drop.prototype.liquidMethodMissing = function (key) {
            return undefined;
        };
        return Drop;
    }());

    var toStr = Object.prototype.toString;
    var toLowerCase = String.prototype.toLowerCase;
    /*
     * Checks if value is classified as a String primitive or object.
     * @param {any} value The value to check.
     * @return {Boolean} Returns true if value is a string, else false.
     */
    function isString(value) {
        return toStr.call(value) === '[object String]';
    }
    function isFunction(value) {
        return typeof value === 'function';
    }
    function stringify(value) {
        value = toValue(value);
        return isNil(value) ? '' : String(value);
    }
    function toValue(value) {
        return value instanceof Drop ? value.valueOf() : value;
    }
    function isNumber(value) {
        return typeof value === 'number';
    }
    function toLiquid(value) {
        if (value && isFunction(value.toLiquid))
            return toLiquid(value.toLiquid());
        return value;
    }
    function isNil(value) {
        return value === null || value === undefined;
    }
    function isArray(value) {
        // be compatible with IE 8
        return toStr.call(value) === '[object Array]';
    }
    /*
     * Iterates over own enumerable string keyed properties of an object and invokes iteratee for each property.
     * The iteratee is invoked with three arguments: (value, key, object).
     * Iteratee functions may exit iteration early by explicitly returning false.
     * @param {Object} object The object to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @return {Object} Returns object.
     */
    function forOwn(object, iteratee) {
        object = object || {};
        for (var k in object) {
            if (object.hasOwnProperty(k)) {
                if (iteratee(object[k], k, object) === false)
                    break;
            }
        }
        return object;
    }
    function last(arr) {
        return arr[arr.length - 1];
    }
    /*
     * Checks if value is the language type of Object.
     * (e.g. arrays, functions, objects, regexes, new Number(0), and new String(''))
     * @param {any} value The value to check.
     * @return {Boolean} Returns true if value is an object, else false.
     */
    function isObject(value) {
        var type = typeof value;
        return value !== null && (type === 'object' || type === 'function');
    }
    function range(start, stop, step) {
        if (step === void 0) { step = 1; }
        var arr = [];
        for (var i = start; i < stop; i += step) {
            arr.push(i);
        }
        return arr;
    }
    function padStart(str, length, ch) {
        if (ch === void 0) { ch = ' '; }
        return pad(str, length, ch, function (str, ch) { return ch + str; });
    }
    function padEnd(str, length, ch) {
        if (ch === void 0) { ch = ' '; }
        return pad(str, length, ch, function (str, ch) { return str + ch; });
    }
    function pad(str, length, ch, add) {
        str = String(str);
        var n = length - str.length;
        while (n-- > 0)
            str = add(str, ch);
        return str;
    }
    function identify(val) {
        return val;
    }
    function snakeCase(str) {
        return str.replace(/(\w?)([A-Z])/g, function (_, a, b) { return (a ? a + '_' : '') + b.toLowerCase(); });
    }
    function changeCase(str) {
        var hasLowerCase = __spread(str).some(function (ch) { return ch >= 'a' && ch <= 'z'; });
        return hasLowerCase ? str.toUpperCase() : str.toLowerCase();
    }
    function ellipsis(str, N) {
        return str.length > N ? str.substr(0, N - 3) + '...' : str;
    }
    // compare string in case-insensitive way, undefined values to the tail
    function caseInsensitiveCompare(a, b) {
        if (a == null && b == null)
            return 0;
        if (a == null)
            return 1;
        if (b == null)
            return -1;
        a = toLowerCase.call(a);
        b = toLowerCase.call(b);
        if (a < b)
            return -1;
        if (a > b)
            return 1;
        return 0;
    }

    var Node = /** @class */ (function () {
        function Node(key, value, next, prev) {
            this.key = key;
            this.value = value;
            this.next = next;
            this.prev = prev;
        }
        return Node;
    }());
    var LRU = /** @class */ (function () {
        function LRU(limit, size) {
            if (size === void 0) { size = 0; }
            this.limit = limit;
            this.size = size;
            this.cache = {};
            this.head = new Node('HEAD', null, null, null);
            this.tail = new Node('TAIL', null, null, null);
            this.head.next = this.tail;
            this.tail.prev = this.head;
        }
        LRU.prototype.write = function (key, value) {
            if (this.cache[key]) {
                this.cache[key].value = value;
            }
            else {
                var node = new Node(key, value, this.head.next, this.head);
                this.head.next.prev = node;
                this.head.next = node;
                this.cache[key] = node;
                this.size++;
                this.ensureLimit();
            }
        };
        LRU.prototype.read = function (key) {
            if (!this.cache[key])
                return;
            var value = this.cache[key].value;
            this.remove(key);
            this.write(key, value);
            return value;
        };
        LRU.prototype.remove = function (key) {
            var node = this.cache[key];
            node.prev.next = node.next;
            node.next.prev = node.prev;
            delete this.cache[key];
            this.size--;
        };
        LRU.prototype.clear = function () {
            this.head.next = this.tail;
            this.tail.prev = this.head;
            this.size = 0;
            this.cache = {};
        };
        LRU.prototype.ensureLimit = function () {
            if (this.size > this.limit)
                this.remove(this.tail.prev.key);
        };
        return LRU;
    }());

    var defaultOptions = {
        root: ['.'],
        cache: undefined,
        extname: '',
        dynamicPartials: true,
        trimTagRight: false,
        trimTagLeft: false,
        trimOutputRight: false,
        trimOutputLeft: false,
        greedy: true,
        tagDelimiterLeft: '{%',
        tagDelimiterRight: '%}',
        outputDelimiterLeft: '{{',
        outputDelimiterRight: '}}',
        strictFilters: false,
        strictVariables: false,
        globals: {}
    };
    function normalize(options) {
        options = options || {};
        if (options.hasOwnProperty('root')) {
            options.root = normalizeStringArray(options.root);
        }
        if (options.hasOwnProperty('cache')) {
            var cache = void 0;
            if (typeof options.cache === 'number')
                cache = options.cache > 0 ? new LRU(options.cache) : undefined;
            else if (typeof options.cache === 'object')
                cache = options.cache;
            else
                cache = options.cache ? new LRU(1024) : undefined;
            options.cache = cache;
        }
        return options;
    }
    function applyDefault(options) {
        return __assign({}, defaultOptions, options);
    }
    function normalizeStringArray(value) {
        if (isArray(value))
            return value;
        if (isString(value))
            return [value];
        return [];
    }

    var Context = /** @class */ (function () {
        function Context(env, opts, sync) {
            if (env === void 0) { env = {}; }
            if (opts === void 0) { opts = defaultOptions; }
            if (sync === void 0) { sync = false; }
            this.scopes = [{}];
            this.registers = {};
            this.sync = sync;
            this.opts = opts;
            this.globals = opts.globals;
            this.environments = env;
        }
        Context.prototype.getRegister = function (key, defaultValue) {
            if (defaultValue === void 0) { defaultValue = {}; }
            return (this.registers[key] = this.registers[key] || defaultValue);
        };
        Context.prototype.setRegister = function (key, value) {
            return (this.registers[key] = value);
        };
        Context.prototype.saveRegister = function () {
            var _this = this;
            var keys = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                keys[_i] = arguments[_i];
            }
            return keys.map(function (key) { return [key, _this.getRegister(key)]; });
        };
        Context.prototype.restoreRegister = function (keyValues) {
            var _this = this;
            return keyValues.forEach(function (_a) {
                var _b = __read(_a, 2), key = _b[0], value = _b[1];
                return _this.setRegister(key, value);
            });
        };
        Context.prototype.getAll = function () {
            return __spread([this.globals, this.environments], this.scopes).reduce(function (ctx, val) { return __assign(ctx, val); }, {});
        };
        Context.prototype.get = function (paths) {
            var scope = this.findScope(paths[0]);
            return this.getFromScope(scope, paths);
        };
        Context.prototype.getFromScope = function (scope, paths) {
            var _this = this;
            if (typeof paths === 'string')
                paths = paths.split('.');
            return paths.reduce(function (scope, path) {
                scope = readProperty(scope, path);
                if (isNil(scope) && _this.opts.strictVariables) {
                    throw new TypeError("undefined variable: " + path);
                }
                return scope;
            }, scope);
        };
        Context.prototype.push = function (ctx) {
            return this.scopes.push(ctx);
        };
        Context.prototype.pop = function () {
            return this.scopes.pop();
        };
        Context.prototype.bottom = function () {
            return this.scopes[0];
        };
        Context.prototype.findScope = function (key) {
            for (var i = this.scopes.length - 1; i >= 0; i--) {
                var candidate = this.scopes[i];
                if (key in candidate)
                    return candidate;
            }
            if (key in this.environments)
                return this.environments;
            return this.globals;
        };
        return Context;
    }());
    function readProperty(obj, key) {
        if (isNil(obj))
            return obj;
        obj = toLiquid(obj);
        if (obj instanceof Drop) {
            if (isFunction(obj[key]))
                return obj[key]();
            if (obj.hasOwnProperty(key))
                return obj[key];
            return obj.liquidMethodMissing(key);
        }
        if (key === 'size')
            return readSize(obj);
        if (key === 'first')
            return readFirst(obj);
        if (key === 'last')
            return readLast(obj);
        return obj[key];
    }
    function readFirst(obj) {
        if (isArray(obj))
            return obj[0];
        return obj['first'];
    }
    function readLast(obj) {
        if (isArray(obj))
            return obj[obj.length - 1];
        return obj['last'];
    }
    function readSize(obj) {
        if (isArray(obj) || isString(obj))
            return obj.length;
        return obj['size'];
    }

    function domResolve(root, path) {
        var base = document.createElement('base');
        base.href = root;
        var head = document.getElementsByTagName('head')[0];
        head.insertBefore(base, head.firstChild);
        var a = document.createElement('a');
        a.href = path;
        var resolved = a.href;
        head.removeChild(base);
        return resolved;
    }
    function resolve(root, filepath, ext) {
        if (root.length && last(root) !== '/')
            root += '/';
        var url = domResolve(root, filepath);
        return url.replace(/^(\w+:\/\/[^/]+)(\/[^?]+)/, function (str, origin, path) {
            var last = path.split('/').pop();
            if (/\.\w+$/.test(last))
                return str;
            return origin + path + ext;
        });
    }
    function readFile(url) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var xhr = new XMLHttpRequest();
                        xhr.onload = function () {
                            if (xhr.status >= 200 && xhr.status < 300) {
                                resolve(xhr.responseText);
                            }
                            else {
                                reject(new Error(xhr.statusText));
                            }
                        };
                        xhr.onerror = function () {
                            reject(new Error('An error occurred whilst receiving the response.'));
                        };
                        xhr.open('GET', url);
                        xhr.send();
                    })];
            });
        });
    }
    function readFileSync(url) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, false);
        xhr.send();
        if (xhr.status < 200 || xhr.status >= 300) {
            throw new Error(xhr.statusText);
        }
        return xhr.responseText;
    }
    function exists(filepath) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, true];
            });
        });
    }
    function existsSync(filepath) {
        return true;
    }

    var fs = /*#__PURE__*/Object.freeze({
        resolve: resolve,
        readFile: readFile,
        readFileSync: readFileSync,
        exists: exists,
        existsSync: existsSync
    });

    var TokenKind;
    (function (TokenKind) {
        TokenKind[TokenKind["Number"] = 1] = "Number";
        TokenKind[TokenKind["Literal"] = 2] = "Literal";
        TokenKind[TokenKind["Tag"] = 4] = "Tag";
        TokenKind[TokenKind["Output"] = 8] = "Output";
        TokenKind[TokenKind["HTML"] = 16] = "HTML";
        TokenKind[TokenKind["Filter"] = 32] = "Filter";
        TokenKind[TokenKind["Hash"] = 64] = "Hash";
        TokenKind[TokenKind["PropertyAccess"] = 128] = "PropertyAccess";
        TokenKind[TokenKind["Word"] = 256] = "Word";
        TokenKind[TokenKind["Range"] = 512] = "Range";
        TokenKind[TokenKind["Quoted"] = 1024] = "Quoted";
        TokenKind[TokenKind["Operator"] = 2048] = "Operator";
        TokenKind[TokenKind["Delimited"] = 12] = "Delimited";
    })(TokenKind || (TokenKind = {}));

    function isDelimitedToken(val) {
        return !!(getKind(val) & TokenKind.Delimited);
    }
    function isOperatorToken(val) {
        return getKind(val) === TokenKind.Operator;
    }
    function isHTMLToken(val) {
        return getKind(val) === TokenKind.HTML;
    }
    function isOutputToken(val) {
        return getKind(val) === TokenKind.Output;
    }
    function isTagToken(val) {
        return getKind(val) === TokenKind.Tag;
    }
    function isQuotedToken(val) {
        return getKind(val) === TokenKind.Quoted;
    }
    function isLiteralToken(val) {
        return getKind(val) === TokenKind.Literal;
    }
    function isNumberToken(val) {
        return getKind(val) === TokenKind.Number;
    }
    function isPropertyAccessToken(val) {
        return getKind(val) === TokenKind.PropertyAccess;
    }
    function isWordToken(val) {
        return getKind(val) === TokenKind.Word;
    }
    function isRangeToken(val) {
        return getKind(val) === TokenKind.Range;
    }
    function getKind(val) {
        return val ? val.kind : -1;
    }

    var typeGuards = /*#__PURE__*/Object.freeze({
        isDelimitedToken: isDelimitedToken,
        isOperatorToken: isOperatorToken,
        isHTMLToken: isHTMLToken,
        isOutputToken: isOutputToken,
        isTagToken: isTagToken,
        isQuotedToken: isQuotedToken,
        isLiteralToken: isLiteralToken,
        isNumberToken: isNumberToken,
        isPropertyAccessToken: isPropertyAccessToken,
        isWordToken: isWordToken,
        isRangeToken: isRangeToken
    });

    // **DO NOT CHANGE THIS FILE**
    //
    // This file is generated by bin/character-gen.js
    // bitmask character types to boost performance
    var TYPES = [0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 4, 4, 4, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 2, 8, 0, 0, 0, 0, 8, 0, 0, 0, 64, 0, 65, 0, 0, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 0, 0, 2, 2, 2, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0];
    var VARIABLE = 1;
    var BLANK = 4;
    var QUOTE = 8;
    var INLINE_BLANK = 16;
    var NUMBER = 32;
    var SIGN = 64;
    TYPES[160] = TYPES[5760] = TYPES[6158] = TYPES[8192] = TYPES[8193] = TYPES[8194] = TYPES[8195] = TYPES[8196] = TYPES[8197] = TYPES[8198] = TYPES[8199] = TYPES[8200] = TYPES[8201] = TYPES[8202] = TYPES[8232] = TYPES[8233] = TYPES[8239] = TYPES[8287] = TYPES[12288] = BLANK;

    function whiteSpaceCtrl(tokens, options) {
        options = __assign({ greedy: true }, options);
        var inRaw = false;
        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            if (!isDelimitedToken(token))
                continue;
            if (!inRaw && token.trimLeft) {
                trimLeft(tokens[i - 1], options.greedy);
            }
            if (isTagToken(token)) {
                if (token.name === 'raw')
                    inRaw = true;
                else if (token.name === 'endraw')
                    inRaw = false;
            }
            if (!inRaw && token.trimRight) {
                trimRight(tokens[i + 1], options.greedy);
            }
        }
    }
    function trimLeft(token, greedy) {
        if (!token || !isHTMLToken(token))
            return;
        var mask = greedy ? BLANK : INLINE_BLANK;
        while (TYPES[token.input.charCodeAt(token.end - 1 - token.trimRight)] & mask)
            token.trimRight++;
    }
    function trimRight(token, greedy) {
        if (!token || !isHTMLToken(token))
            return;
        var mask = greedy ? BLANK : INLINE_BLANK;
        while (TYPES[token.input.charCodeAt(token.begin + token.trimLeft)] & mask)
            token.trimLeft++;
        if (token.input.charAt(token.begin + token.trimLeft) === '\n')
            token.trimLeft++;
    }

    var Token = /** @class */ (function () {
        function Token(kind, input, begin, end, file) {
            this.kind = kind;
            this.input = input;
            this.begin = begin;
            this.end = end;
            this.file = file;
        }
        Token.prototype.getText = function () {
            return this.input.slice(this.begin, this.end);
        };
        Token.prototype.getPosition = function () {
            var _a = __read([1, 1], 2), row = _a[0], col = _a[1];
            for (var i = 0; i < this.begin; i++) {
                if (this.input[i] === '\n') {
                    row++;
                    col = 1;
                }
                else
                    col++;
            }
            return [row, col];
        };
        Token.prototype.size = function () {
            return this.end - this.begin;
        };
        return Token;
    }());

    var NumberToken = /** @class */ (function (_super) {
        __extends(NumberToken, _super);
        function NumberToken(whole, decimal) {
            var _this = _super.call(this, TokenKind.Number, whole.input, whole.begin, decimal ? decimal.end : whole.end, whole.file) || this;
            _this.whole = whole;
            _this.decimal = decimal;
            return _this;
        }
        return NumberToken;
    }(Token));

    // a word can be an identifier, a number, a keyword or a single-word-literal
    var WordToken = /** @class */ (function (_super) {
        __extends(WordToken, _super);
        function WordToken(input, begin, end, file) {
            var _this = _super.call(this, TokenKind.Word, input, begin, end, file) || this;
            _this.input = input;
            _this.begin = begin;
            _this.end = end;
            _this.file = file;
            _this.content = _this.getText();
            return _this;
        }
        WordToken.prototype.isNumber = function (allowSign) {
            if (allowSign === void 0) { allowSign = false; }
            var begin = allowSign && TYPES[this.input.charCodeAt(this.begin)] & SIGN
                ? this.begin + 1
                : this.begin;
            for (var i = begin; i < this.end; i++) {
                if (!(TYPES[this.input.charCodeAt(i)] & NUMBER))
                    return false;
            }
            return true;
        };
        return WordToken;
    }(Token));

    var EmptyDrop = /** @class */ (function (_super) {
        __extends(EmptyDrop, _super);
        function EmptyDrop() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        EmptyDrop.prototype.equals = function (value) {
            if (isString(value) || isArray(value))
                return value.length === 0;
            if (isObject(value))
                return Object.keys(value).length === 0;
            return false;
        };
        EmptyDrop.prototype.gt = function () {
            return false;
        };
        EmptyDrop.prototype.geq = function () {
            return false;
        };
        EmptyDrop.prototype.lt = function () {
            return false;
        };
        EmptyDrop.prototype.leq = function () {
            return false;
        };
        EmptyDrop.prototype.valueOf = function () {
            return '';
        };
        return EmptyDrop;
    }(Drop));

    var BlankDrop = /** @class */ (function (_super) {
        __extends(BlankDrop, _super);
        function BlankDrop() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        BlankDrop.prototype.equals = function (value) {
            if (value === false)
                return true;
            if (isNil(toValue(value)))
                return true;
            if (isString(value))
                return /^\s*$/.test(value);
            return _super.prototype.equals.call(this, value);
        };
        return BlankDrop;
    }(EmptyDrop));

    var NullDrop = /** @class */ (function (_super) {
        __extends(NullDrop, _super);
        function NullDrop() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        NullDrop.prototype.equals = function (value) {
            return isNil(toValue(value)) || value instanceof BlankDrop;
        };
        NullDrop.prototype.gt = function () {
            return false;
        };
        NullDrop.prototype.geq = function () {
            return false;
        };
        NullDrop.prototype.lt = function () {
            return false;
        };
        NullDrop.prototype.leq = function () {
            return false;
        };
        NullDrop.prototype.valueOf = function () {
            return null;
        };
        return NullDrop;
    }(Drop));

    var literalValues = {
        'true': true,
        'false': false,
        'nil': new NullDrop(),
        'null': new NullDrop(),
        'empty': new EmptyDrop(),
        'blank': new BlankDrop()
    };

    var LiteralToken = /** @class */ (function (_super) {
        __extends(LiteralToken, _super);
        function LiteralToken(input, begin, end, file) {
            var _this = _super.call(this, TokenKind.Literal, input, begin, end, file) || this;
            _this.input = input;
            _this.begin = begin;
            _this.end = end;
            _this.file = file;
            _this.literal = _this.getText();
            return _this;
        }
        return LiteralToken;
    }(Token));

    var precedence = {
        '==': 1,
        '!=': 1,
        '>': 1,
        '<': 1,
        '>=': 1,
        '<=': 1,
        'contains': 1,
        'and': 0,
        'or': 0
    };
    var OperatorToken = /** @class */ (function (_super) {
        __extends(OperatorToken, _super);
        function OperatorToken(input, begin, end, file) {
            var _this = _super.call(this, TokenKind.Operator, input, begin, end, file) || this;
            _this.input = input;
            _this.begin = begin;
            _this.end = end;
            _this.file = file;
            _this.operator = _this.getText();
            return _this;
        }
        OperatorToken.prototype.getPrecedence = function () {
            return precedence[this.getText()];
        };
        return OperatorToken;
    }(Token));

    var PropertyAccessToken = /** @class */ (function (_super) {
        __extends(PropertyAccessToken, _super);
        function PropertyAccessToken(variable, props, end) {
            var _this = _super.call(this, TokenKind.PropertyAccess, variable.input, variable.begin, end, variable.file) || this;
            _this.variable = variable;
            _this.props = props;
            return _this;
        }
        return PropertyAccessToken;
    }(Token));

    var LiquidError = /** @class */ (function (_super) {
        __extends(LiquidError, _super);
        function LiquidError(err, token) {
            var _this = _super.call(this, err.message) || this;
            _this.originalError = err;
            _this.token = token;
            return _this;
        }
        LiquidError.prototype.update = function () {
            var err = this.originalError;
            var context = mkContext(this.token);
            this.message = mkMessage(err.message, this.token);
            this.stack = this.message + '\n' + context +
                '\n' + this.stack + '\nFrom ' + err.stack;
        };
        return LiquidError;
    }(Error));
    var TokenizationError = /** @class */ (function (_super) {
        __extends(TokenizationError, _super);
        function TokenizationError(message, token) {
            var _this = _super.call(this, new Error(message), token) || this;
            _this.name = 'TokenizationError';
            _super.prototype.update.call(_this);
            return _this;
        }
        return TokenizationError;
    }(LiquidError));
    var ParseError = /** @class */ (function (_super) {
        __extends(ParseError, _super);
        function ParseError(err, token) {
            var _this = _super.call(this, err, token) || this;
            _this.name = 'ParseError';
            _this.message = err.message;
            _super.prototype.update.call(_this);
            return _this;
        }
        return ParseError;
    }(LiquidError));
    var RenderError = /** @class */ (function (_super) {
        __extends(RenderError, _super);
        function RenderError(err, tpl) {
            var _this = _super.call(this, err, tpl.token) || this;
            _this.name = 'RenderError';
            _this.message = err.message;
            _super.prototype.update.call(_this);
            return _this;
        }
        RenderError.is = function (obj) {
            return obj instanceof RenderError;
        };
        return RenderError;
    }(LiquidError));
    var AssertionError = /** @class */ (function (_super) {
        __extends(AssertionError, _super);
        function AssertionError(message) {
            var _this = _super.call(this, message) || this;
            _this.name = 'AssertionError';
            _this.message = message + '';
            return _this;
        }
        return AssertionError;
    }(Error));
    function mkContext(token) {
        var _a = __read(token.getPosition(), 1), line = _a[0];
        var lines = token.input.split('\n');
        var begin = Math.max(line - 2, 1);
        var end = Math.min(line + 3, lines.length);
        var context = range(begin, end + 1)
            .map(function (lineNumber) {
            var indicator = (lineNumber === line) ? '>> ' : '   ';
            var num = padStart(String(lineNumber), String(end).length);
            var text = lines[lineNumber - 1];
            return "" + indicator + num + "| " + text;
        })
            .join('\n');
        return context;
    }
    function mkMessage(msg, token) {
        if (token.file)
            msg += ", file:" + token.file;
        var _a = __read(token.getPosition(), 2), line = _a[0], col = _a[1];
        msg += ", line:" + line + ", col:" + col;
        return msg;
    }

    function assert(predicate, message) {
        if (!predicate) {
            var msg = message ? message() : "expect " + predicate + " to be true";
            throw new AssertionError(msg);
        }
    }

    var FilterToken = /** @class */ (function (_super) {
        __extends(FilterToken, _super);
        function FilterToken(name, args, input, begin, end, file) {
            var _this = _super.call(this, TokenKind.Filter, input, begin, end, file) || this;
            _this.name = name;
            _this.args = args;
            return _this;
        }
        return FilterToken;
    }(Token));

    var HashToken = /** @class */ (function (_super) {
        __extends(HashToken, _super);
        function HashToken(input, begin, end, name, value, file) {
            var _this = _super.call(this, TokenKind.Hash, input, begin, end, file) || this;
            _this.input = input;
            _this.begin = begin;
            _this.end = end;
            _this.name = name;
            _this.value = value;
            _this.file = file;
            return _this;
        }
        return HashToken;
    }(Token));

    var QuotedToken = /** @class */ (function (_super) {
        __extends(QuotedToken, _super);
        function QuotedToken(input, begin, end, file) {
            var _this = _super.call(this, TokenKind.Quoted, input, begin, end, file) || this;
            _this.input = input;
            _this.begin = begin;
            _this.end = end;
            _this.file = file;
            return _this;
        }
        return QuotedToken;
    }(Token));

    var HTMLToken = /** @class */ (function (_super) {
        __extends(HTMLToken, _super);
        function HTMLToken(input, begin, end, file) {
            var _this = _super.call(this, TokenKind.HTML, input, begin, end, file) || this;
            _this.input = input;
            _this.begin = begin;
            _this.end = end;
            _this.file = file;
            _this.trimLeft = 0;
            _this.trimRight = 0;
            return _this;
        }
        HTMLToken.prototype.getContent = function () {
            return this.input.slice(this.begin + this.trimLeft, this.end - this.trimRight);
        };
        return HTMLToken;
    }(Token));

    var DelimitedToken = /** @class */ (function (_super) {
        __extends(DelimitedToken, _super);
        function DelimitedToken(kind, content, input, begin, end, trimLeft, trimRight, file) {
            var _this = _super.call(this, kind, input, begin, end, file) || this;
            _this.trimLeft = false;
            _this.trimRight = false;
            _this.content = _this.getText();
            var tl = content[0] === '-';
            var tr = last(content) === '-';
            _this.content = content
                .slice(tl ? 1 : 0, tr ? -1 : content.length)
                .trim();
            _this.trimLeft = tl || trimLeft;
            _this.trimRight = tr || trimRight;
            return _this;
        }
        return DelimitedToken;
    }(Token));

    var TagToken = /** @class */ (function (_super) {
        __extends(TagToken, _super);
        function TagToken(input, begin, end, options, file) {
            var _this = this;
            var trimTagLeft = options.trimTagLeft, trimTagRight = options.trimTagRight, tagDelimiterLeft = options.tagDelimiterLeft, tagDelimiterRight = options.tagDelimiterRight;
            var value = input.slice(begin + tagDelimiterLeft.length, end - tagDelimiterRight.length);
            _this = _super.call(this, TokenKind.Tag, value, input, begin, end, trimTagLeft, trimTagRight, file) || this;
            var nameEnd = 0;
            while (TYPES[_this.content.charCodeAt(nameEnd)] & VARIABLE)
                nameEnd++;
            _this.name = _this.content.slice(0, nameEnd);
            if (!_this.name)
                throw new TokenizationError("illegal tag syntax", _this);
            var argsBegin = nameEnd;
            while (TYPES[_this.content.charCodeAt(argsBegin)] & BLANK)
                argsBegin++;
            _this.args = _this.content.slice(argsBegin);
            return _this;
        }
        return TagToken;
    }(DelimitedToken));

    var RangeToken = /** @class */ (function (_super) {
        __extends(RangeToken, _super);
        function RangeToken(input, begin, end, lhs, rhs, file) {
            var _this = _super.call(this, TokenKind.Range, input, begin, end, file) || this;
            _this.input = input;
            _this.begin = begin;
            _this.end = end;
            _this.lhs = lhs;
            _this.rhs = rhs;
            _this.file = file;
            return _this;
        }
        return RangeToken;
    }(Token));

    var OutputToken = /** @class */ (function (_super) {
        __extends(OutputToken, _super);
        function OutputToken(input, begin, end, options, file) {
            var _this = this;
            var trimOutputLeft = options.trimOutputLeft, trimOutputRight = options.trimOutputRight, outputDelimiterLeft = options.outputDelimiterLeft, outputDelimiterRight = options.outputDelimiterRight;
            var value = input.slice(begin + outputDelimiterLeft.length, end - outputDelimiterRight.length);
            _this = _super.call(this, TokenKind.Output, value, input, begin, end, trimOutputLeft, trimOutputRight, file) || this;
            return _this;
        }
        return OutputToken;
    }(DelimitedToken));

    var trie = {
        a: { n: { d: { end: true, needBoundary: true } } },
        o: { r: { end: true, needBoundary: true } },
        c: { o: { n: { t: { a: { i: { n: { s: { end: true, needBoundary: true } } } } } } } },
        '=': { '=': { end: true } },
        '!': { '=': { end: true } },
        '>': { end: true, '=': { end: true } },
        '<': { end: true, '=': { end: true } }
    };
    function matchOperator(str, begin, end) {
        if (end === void 0) { end = str.length; }
        var node = trie;
        var i = begin;
        var info;
        while (node[str[i]] && i < end) {
            node = node[str[i++]];
            if (node['end'])
                info = node;
        }
        if (!info)
            return -1;
        if (info['needBoundary'] && str.charCodeAt(i) & VARIABLE)
            return -1;
        return i;
    }

    var Tokenizer = /** @class */ (function () {
        function Tokenizer(input, file) {
            if (file === void 0) { file = ''; }
            this.input = input;
            this.file = file;
            this.p = 0;
            this.N = input.length;
        }
        Tokenizer.prototype.readExpression = function () {
            var operand, operator, operand_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        operand = this.readValue();
                        if (!operand)
                            return [2 /*return*/];
                        return [4 /*yield*/, operand];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        if (!(this.p < this.N)) return [3 /*break*/, 5];
                        operator = this.readOperator();
                        if (!operator)
                            return [2 /*return*/];
                        operand_1 = this.readValue();
                        if (!operand_1)
                            return [2 /*return*/];
                        return [4 /*yield*/, operator];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, operand_1];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/];
                }
            });
        };
        Tokenizer.prototype.readOperator = function () {
            this.skipBlank();
            var end = matchOperator(this.input, this.p, this.p + 8);
            if (end === -1)
                return;
            return new OperatorToken(this.input, this.p, (this.p = end), this.file);
        };
        Tokenizer.prototype.readFilters = function () {
            var filters = [];
            while (true) {
                var filter = this.readFilter();
                if (!filter)
                    return filters;
                filters.push(filter);
            }
        };
        Tokenizer.prototype.readFilter = function () {
            var _this = this;
            this.skipBlank();
            if (this.end())
                return null;
            assert(this.peek() === '|', function () { return "unexpected token at " + _this.snapshot(); });
            this.p++;
            var begin = this.p;
            var name = this.readWord();
            if (!name.size())
                return null;
            var args = [];
            this.skipBlank();
            if (this.peek() === ':') {
                do {
                    ++this.p;
                    var arg = this.readFilterArg();
                    arg && args.push(arg);
                    while (this.p < this.N && this.peek() !== ',' && this.peek() !== '|')
                        ++this.p;
                } while (this.peek() === ',');
            }
            return new FilterToken(name.getText(), args, this.input, begin, this.p, this.file);
        };
        Tokenizer.prototype.readFilterArg = function () {
            var key = this.readValue();
            if (!key)
                return;
            this.skipBlank();
            if (this.peek() !== ':')
                return key;
            ++this.p;
            var value = this.readValue();
            return [key.getText(), value];
        };
        Tokenizer.prototype.readTopLevelTokens = function (options) {
            if (options === void 0) { options = defaultOptions; }
            var tokens = [];
            while (this.p < this.N) {
                var token = this.readTopLevelToken(options);
                tokens.push(token);
            }
            whiteSpaceCtrl(tokens, options);
            return tokens;
        };
        Tokenizer.prototype.readTopLevelToken = function (options) {
            var tagDelimiterLeft = options.tagDelimiterLeft, outputDelimiterLeft = options.outputDelimiterLeft;
            if (this.matchWord(tagDelimiterLeft))
                return this.readTagToken(options);
            if (this.matchWord(outputDelimiterLeft))
                return this.readOutputToken(options);
            return this.readHTMLToken(options);
        };
        Tokenizer.prototype.readHTMLToken = function (options) {
            var begin = this.p;
            while (this.p < this.N) {
                var tagDelimiterLeft = options.tagDelimiterLeft, outputDelimiterLeft = options.outputDelimiterLeft;
                if (this.matchWord(tagDelimiterLeft))
                    break;
                if (this.matchWord(outputDelimiterLeft))
                    break;
                ++this.p;
            }
            return new HTMLToken(this.input, begin, this.p, this.file);
        };
        Tokenizer.prototype.readTagToken = function (options) {
            var _a = this, file = _a.file, input = _a.input;
            var tagDelimiterRight = options.tagDelimiterRight;
            var begin = this.p;
            if (this.readTo(tagDelimiterRight) === -1) {
                this.mkError("tag " + this.snapshot(begin) + " not closed", begin);
            }
            return new TagToken(input, begin, this.p, options, file);
        };
        Tokenizer.prototype.readOutputToken = function (options) {
            var _a = this, file = _a.file, input = _a.input;
            var outputDelimiterRight = options.outputDelimiterRight;
            var begin = this.p;
            if (this.readTo(outputDelimiterRight) === -1) {
                this.mkError("output " + this.snapshot(begin) + " not closed", begin);
            }
            return new OutputToken(input, begin, this.p, options, file);
        };
        Tokenizer.prototype.mkError = function (msg, begin) {
            throw new TokenizationError(msg, new WordToken(this.input, begin, this.N, this.file));
        };
        Tokenizer.prototype.snapshot = function (begin) {
            if (begin === void 0) { begin = this.p; }
            return JSON.stringify(ellipsis(this.input.slice(begin), 16));
        };
        Tokenizer.prototype.readWord = function () {
            this.skipBlank();
            var begin = this.p;
            while (this.peekType() & VARIABLE)
                ++this.p;
            return new WordToken(this.input, begin, this.p, this.file);
        };
        Tokenizer.prototype.readHashes = function () {
            var hashes = [];
            while (true) {
                var hash = this.readHash();
                if (!hash)
                    return hashes;
                hashes.push(hash);
            }
        };
        Tokenizer.prototype.readHash = function () {
            this.skipBlank();
            if (this.peek() === ',')
                ++this.p;
            var begin = this.p;
            var name = this.readWord();
            if (!name.size())
                return;
            var value;
            this.skipBlank();
            if (this.peek() === ':') {
                ++this.p;
                value = this.readValue();
            }
            return new HashToken(this.input, begin, this.p, name, value, this.file);
        };
        Tokenizer.prototype.remaining = function () {
            return this.input.slice(this.p);
        };
        Tokenizer.prototype.advance = function (i) {
            if (i === void 0) { i = 1; }
            this.p += i;
        };
        Tokenizer.prototype.end = function () {
            return this.p >= this.N;
        };
        Tokenizer.prototype.readTo = function (end) {
            while (this.p < this.N) {
                ++this.p;
                if (this.reverseMatchWord(end))
                    return this.p;
            }
            return -1;
        };
        Tokenizer.prototype.readValue = function () {
            var value = this.readQuoted() || this.readRange();
            if (value)
                return value;
            var variable = this.readWord();
            if (!variable.size())
                return;
            var isNumber = variable.isNumber(true);
            var props = [];
            while (true) {
                if (this.peek() === '[') {
                    isNumber = false;
                    this.p++;
                    var prop = this.readValue() || new WordToken(this.input, this.p, this.p, this.file);
                    this.readTo(']');
                    props.push(prop);
                }
                else if (this.peek() === '.' && this.peek(1) !== '.') { // skip range syntax
                    this.p++;
                    var prop = this.readWord();
                    if (!prop.size())
                        break;
                    if (!prop.isNumber())
                        isNumber = false;
                    props.push(prop);
                }
                else
                    break;
            }
            if (!props.length && literalValues.hasOwnProperty(variable.content)) {
                return new LiteralToken(this.input, variable.begin, variable.end, this.file);
            }
            if (isNumber)
                return new NumberToken(variable, props[0]);
            return new PropertyAccessToken(variable, props, this.p);
        };
        Tokenizer.prototype.readRange = function () {
            this.skipBlank();
            var begin = this.p;
            if (this.peek() !== '(')
                return;
            ++this.p;
            var lhs = this.readValueOrThrow();
            this.p += 2;
            var rhs = this.readValueOrThrow();
            ++this.p;
            return new RangeToken(this.input, begin, this.p, lhs, rhs, this.file);
        };
        Tokenizer.prototype.readValueOrThrow = function () {
            var _this = this;
            var value = this.readValue();
            assert(value, function () { return "unexpected token " + _this.snapshot() + ", value expected"; });
            return value;
        };
        Tokenizer.prototype.readQuoted = function () {
            this.skipBlank();
            var begin = this.p;
            if (!(this.peekType() & QUOTE))
                return;
            ++this.p;
            var escaped = false;
            while (this.p < this.N) {
                ++this.p;
                if (this.input[this.p - 1] === this.input[begin] && !escaped)
                    break;
                if (escaped)
                    escaped = false;
                else if (this.input[this.p - 1] === '\\')
                    escaped = true;
            }
            return new QuotedToken(this.input, begin, this.p, this.file);
        };
        Tokenizer.prototype.readFileName = function () {
            var begin = this.p;
            while (!(this.peekType() & BLANK) && this.peek() !== ',' && this.p < this.N)
                this.p++;
            return new WordToken(this.input, begin, this.p, this.file);
        };
        Tokenizer.prototype.matchWord = function (word) {
            for (var i = 0; i < word.length; i++) {
                if (word[i] !== this.input[this.p + i])
                    return false;
            }
            return true;
        };
        Tokenizer.prototype.reverseMatchWord = function (word) {
            for (var i = 0; i < word.length; i++) {
                if (word[word.length - 1 - i] !== this.input[this.p - 1 - i])
                    return false;
            }
            return true;
        };
        Tokenizer.prototype.peekType = function (n) {
            if (n === void 0) { n = 0; }
            return TYPES[this.input.charCodeAt(this.p + n)];
        };
        Tokenizer.prototype.peek = function (n) {
            if (n === void 0) { n = 0; }
            return this.input[this.p + n];
        };
        Tokenizer.prototype.skipBlank = function () {
            while (this.peekType() & BLANK)
                ++this.p;
        };
        return Tokenizer;
    }());

    var Emitter = /** @class */ (function () {
        function Emitter() {
            this.html = '';
            this.break = false;
            this.continue = false;
        }
        Emitter.prototype.write = function (html) {
            this.html += html;
        };
        return Emitter;
    }());

    var Render = /** @class */ (function () {
        function Render() {
        }
        Render.prototype.renderTemplates = function (templates, ctx, emitter) {
            var templates_1, templates_1_1, tpl, html, e_1, err, e_2_1;
            var e_2, _a;
            if (emitter === void 0) { emitter = new Emitter(); }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 7, 8, 9]);
                        templates_1 = __values(templates), templates_1_1 = templates_1.next();
                        _b.label = 1;
                    case 1:
                        if (!!templates_1_1.done) return [3 /*break*/, 6];
                        tpl = templates_1_1.value;
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, tpl.render(ctx, emitter)];
                    case 3:
                        html = _b.sent();
                        html && emitter.write(html);
                        if (emitter.break || emitter.continue)
                            return [3 /*break*/, 6];
                        return [3 /*break*/, 5];
                    case 4:
                        e_1 = _b.sent();
                        err = RenderError.is(e_1) ? e_1 : new RenderError(e_1, tpl);
                        throw err;
                    case 5:
                        templates_1_1 = templates_1.next();
                        return [3 /*break*/, 1];
                    case 6: return [3 /*break*/, 9];
                    case 7:
                        e_2_1 = _b.sent();
                        e_2 = { error: e_2_1 };
                        return [3 /*break*/, 9];
                    case 8:
                        try {
                            if (templates_1_1 && !templates_1_1.done && (_a = templates_1.return)) _a.call(templates_1);
                        }
                        finally { if (e_2) throw e_2.error; }
                        return [7 /*endfinally*/];
                    case 9: return [2 /*return*/, emitter.html];
                }
            });
        };
        return Render;
    }());

    var ParseStream = /** @class */ (function () {
        function ParseStream(tokens, parseToken) {
            this.handlers = {};
            this.stopRequested = false;
            this.tokens = tokens;
            this.parseToken = parseToken;
        }
        ParseStream.prototype.on = function (name, cb) {
            this.handlers[name] = cb;
            return this;
        };
        ParseStream.prototype.trigger = function (event, arg) {
            var h = this.handlers[event];
            return h ? (h(arg), true) : false;
        };
        ParseStream.prototype.start = function () {
            this.trigger('start');
            var token;
            while (!this.stopRequested && (token = this.tokens.shift())) {
                if (this.trigger('token', token))
                    continue;
                if (isTagToken(token) && this.trigger("tag:" + token.name, token)) {
                    continue;
                }
                var template = this.parseToken(token, this.tokens);
                this.trigger('template', template);
            }
            if (!this.stopRequested)
                this.trigger('end');
            return this;
        };
        ParseStream.prototype.stop = function () {
            this.stopRequested = true;
            return this;
        };
        return ParseStream;
    }());

    var TemplateImpl = /** @class */ (function () {
        function TemplateImpl(token) {
            this.token = token;
        }
        return TemplateImpl;
    }());

    var rHex = /[\da-fA-F]/;
    var rOct = /[0-7]/;
    var escapeChar = {
        b: '\b',
        f: '\f',
        n: '\n',
        r: '\r',
        t: '\t',
        v: '\x0B'
    };
    function hexVal(c) {
        var code = c.charCodeAt(0);
        if (code >= 97)
            return code - 87;
        if (code >= 65)
            return code - 55;
        return code - 48;
    }
    function parseStringLiteral(str) {
        var ret = '';
        for (var i = 1; i < str.length - 1; i++) {
            if (str[i] !== '\\') {
                ret += str[i];
                continue;
            }
            if (escapeChar[str[i + 1]] !== undefined) {
                ret += escapeChar[str[++i]];
            }
            else if (str[i + 1] === 'u') {
                var val = 0;
                var j = i + 2;
                while (j <= i + 5 && rHex.test(str[j])) {
                    val = val * 16 + hexVal(str[j++]);
                }
                i = j - 1;
                ret += String.fromCharCode(val);
            }
            else if (!rOct.test(str[i + 1])) {
                ret += str[++i];
            }
            else {
                var j = i + 1;
                var val = 0;
                while (j <= i + 3 && rOct.test(str[j])) {
                    val = val * 8 + hexVal(str[j++]);
                }
                i = j - 1;
                ret += String.fromCharCode(val);
            }
        }
        return ret;
    }

    function isComparable(arg) {
        return arg && isFunction(arg.equals);
    }

    function isTruthy(val) {
        return !isFalsy(val);
    }
    function isFalsy(val) {
        return val === false || undefined === val || val === null;
    }

    var operatorImpls = {
        '==': function (l, r) {
            if (isComparable(l))
                return l.equals(r);
            if (isComparable(r))
                return r.equals(l);
            return l === r;
        },
        '!=': function (l, r) {
            if (isComparable(l))
                return !l.equals(r);
            if (isComparable(r))
                return !r.equals(l);
            return l !== r;
        },
        '>': function (l, r) {
            if (isComparable(l))
                return l.gt(r);
            if (isComparable(r))
                return r.lt(l);
            return l > r;
        },
        '<': function (l, r) {
            if (isComparable(l))
                return l.lt(r);
            if (isComparable(r))
                return r.gt(l);
            return l < r;
        },
        '>=': function (l, r) {
            if (isComparable(l))
                return l.geq(r);
            if (isComparable(r))
                return r.leq(l);
            return l >= r;
        },
        '<=': function (l, r) {
            if (isComparable(l))
                return l.leq(r);
            if (isComparable(r))
                return r.geq(l);
            return l <= r;
        },
        'contains': function (l, r) {
            return l && isFunction(l.indexOf) ? l.indexOf(r) > -1 : false;
        },
        'and': function (l, r) { return isTruthy(l) && isTruthy(r); },
        'or': function (l, r) { return isTruthy(l) || isTruthy(r); }
    };

    var Expression = /** @class */ (function () {
        function Expression(str) {
            this.operands = [];
            var tokenizer = new Tokenizer(str);
            this.postfix = toPostfix(tokenizer.readExpression());
        }
        Expression.prototype.evaluate = function (ctx) {
            var e_1, _a;
            try {
                for (var _b = __values(this.postfix), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var token = _c.value;
                    if (isOperatorToken(token)) {
                        var r = this.operands.pop();
                        var l = this.operands.pop();
                        var result = evalOperatorToken(token, l, r);
                        this.operands.push(result);
                    }
                    else {
                        this.operands.push(evalToken(token, ctx));
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return this.operands[0];
        };
        Expression.prototype.value = function (ctx) {
            return __generator(this, function (_a) {
                return [2 /*return*/, toValue(this.evaluate(ctx))];
            });
        };
        return Expression;
    }());
    function evalToken(token, ctx) {
        assert(ctx, function () { return 'unable to evaluate: context not defined'; });
        if (isPropertyAccessToken(token)) {
            var variable = token.variable.getText();
            var props = token.props.map(function (prop) { return evalToken(prop, ctx); });
            return ctx.get(__spread([variable], props));
        }
        if (isRangeToken(token))
            return evalRangeToken(token, ctx);
        if (isLiteralToken(token))
            return evalLiteralToken(token);
        if (isNumberToken(token))
            return evalNumberToken(token);
        if (isWordToken(token))
            return token.getText();
        if (isQuotedToken(token))
            return evalQuotedToken(token);
    }
    function evalNumberToken(token) {
        var str = token.whole.content + '.' + (token.decimal ? token.decimal.content : '');
        return Number(str);
    }
    function evalQuotedToken(token) {
        return parseStringLiteral(token.getText());
    }
    function evalOperatorToken(token, lhs, rhs) {
        var impl = operatorImpls[token.operator];
        return impl(lhs, rhs);
    }
    function evalLiteralToken(token) {
        return literalValues[token.literal];
    }
    function evalRangeToken(token, ctx) {
        var low = evalToken(token.lhs, ctx);
        var high = evalToken(token.rhs, ctx);
        return range(+low, +high + 1);
    }
    function toPostfix(tokens) {
        var ops, tokens_1, tokens_1_1, token, e_2_1;
        var e_2, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    ops = [];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 10, 11, 12]);
                    tokens_1 = __values(tokens), tokens_1_1 = tokens_1.next();
                    _b.label = 2;
                case 2:
                    if (!!tokens_1_1.done) return [3 /*break*/, 9];
                    token = tokens_1_1.value;
                    if (!isOperatorToken(token)) return [3 /*break*/, 6];
                    _b.label = 3;
                case 3:
                    if (!(ops.length && ops[ops.length - 1].getPrecedence() > token.getPrecedence())) return [3 /*break*/, 5];
                    return [4 /*yield*/, ops.pop()];
                case 4:
                    _b.sent();
                    return [3 /*break*/, 3];
                case 5:
                    ops.push(token);
                    return [3 /*break*/, 8];
                case 6: return [4 /*yield*/, token];
                case 7:
                    _b.sent();
                    _b.label = 8;
                case 8:
                    tokens_1_1 = tokens_1.next();
                    return [3 /*break*/, 2];
                case 9: return [3 /*break*/, 12];
                case 10:
                    e_2_1 = _b.sent();
                    e_2 = { error: e_2_1 };
                    return [3 /*break*/, 12];
                case 11:
                    try {
                        if (tokens_1_1 && !tokens_1_1.done && (_a = tokens_1.return)) _a.call(tokens_1);
                    }
                    finally { if (e_2) throw e_2.error; }
                    return [7 /*endfinally*/];
                case 12:
                    if (!ops.length) return [3 /*break*/, 14];
                    return [4 /*yield*/, ops.pop()];
                case 13:
                    _b.sent();
                    return [3 /*break*/, 12];
                case 14: return [2 /*return*/];
            }
        });
    }

    /**
     * Key-Value Pairs Representing Tag Arguments
     * Example:
     *    For the markup `, foo:'bar', coo:2 reversed %}`,
     *    hash['foo'] === 'bar'
     *    hash['coo'] === 2
     *    hash['reversed'] === undefined
     */
    var Hash = /** @class */ (function () {
        function Hash(markup) {
            var e_1, _a;
            this.hash = {};
            var tokenizer = new Tokenizer(markup);
            try {
                for (var _b = __values(tokenizer.readHashes()), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var hash = _c.value;
                    this.hash[hash.name.content] = hash.value;
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
        Hash.prototype.render = function (ctx) {
            var hash, _a, _b, key;
            var e_2, _c;
            return __generator(this, function (_d) {
                hash = {};
                try {
                    for (_a = __values(Object.keys(this.hash)), _b = _a.next(); !_b.done; _b = _a.next()) {
                        key = _b.value;
                        hash[key] = evalToken(this.hash[key], ctx);
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
                return [2 /*return*/, hash];
            });
        };
        return Hash;
    }());

    var Tag = /** @class */ (function (_super) {
        __extends(Tag, _super);
        function Tag(token, tokens, liquid) {
            var _this = _super.call(this, token) || this;
            _this.name = token.name;
            var impl = liquid.tags.get(token.name);
            _this.impl = Object.create(impl);
            _this.impl.liquid = liquid;
            if (_this.impl.parse) {
                _this.impl.parse(token, tokens);
            }
            return _this;
        }
        Tag.prototype.render = function (ctx, emitter) {
            var hash, impl;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Hash(this.token.args).render(ctx)];
                    case 1:
                        hash = _a.sent();
                        impl = this.impl;
                        if (!isFunction(impl.render)) return [3 /*break*/, 3];
                        return [4 /*yield*/, impl.render(ctx, emitter, hash)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3: return [2 /*return*/];
                }
            });
        };
        Tag.impls = {};
        return Tag;
    }(TemplateImpl));

    function isKeyValuePair(arr) {
        return isArray(arr);
    }

    var Filter = /** @class */ (function () {
        function Filter(name, impl, args) {
            this.name = name;
            this.impl = impl || identify;
            this.args = args;
        }
        Filter.prototype.render = function (value, context) {
            var argv, _a, _b, arg, _c, _d, _e, _f, _g, e_1_1;
            var e_1, _h;
            return __generator(this, function (_j) {
                switch (_j.label) {
                    case 0:
                        argv = [];
                        _j.label = 1;
                    case 1:
                        _j.trys.push([1, 8, 9, 10]);
                        _a = __values(this.args), _b = _a.next();
                        _j.label = 2;
                    case 2:
                        if (!!_b.done) return [3 /*break*/, 7];
                        arg = _b.value;
                        if (!isKeyValuePair(arg)) return [3 /*break*/, 4];
                        _d = (_c = argv).push;
                        _e = [arg[0]];
                        return [4 /*yield*/, evalToken(arg[1], context)];
                    case 3:
                        _d.apply(_c, [_e.concat([_j.sent()])]);
                        return [3 /*break*/, 6];
                    case 4:
                        _g = (_f = argv).push;
                        return [4 /*yield*/, evalToken(arg, context)];
                    case 5:
                        _g.apply(_f, [_j.sent()]);
                        _j.label = 6;
                    case 6:
                        _b = _a.next();
                        return [3 /*break*/, 2];
                    case 7: return [3 /*break*/, 10];
                    case 8:
                        e_1_1 = _j.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 10];
                    case 9:
                        try {
                            if (_b && !_b.done && (_h = _a.return)) _h.call(_a);
                        }
                        finally { if (e_1) throw e_1.error; }
                        return [7 /*endfinally*/];
                    case 10: return [2 /*return*/, this.impl.apply({ context: context }, __spread([value], argv))];
                }
            });
        };
        return Filter;
    }());

    var Value = /** @class */ (function () {
        /**
         * @param str the value to be valuated, eg.: "foobar" | truncate: 3
         */
        function Value(str, filterMap) {
            var _this = this;
            this.filterMap = filterMap;
            this.filters = [];
            var tokenizer = new Tokenizer(str);
            this.initial = tokenizer.readValue();
            this.filters = tokenizer.readFilters().map(function (_a) {
                var name = _a.name, args = _a.args;
                return new Filter(name, _this.filterMap.get(name), args);
            });
        }
        Value.prototype.value = function (ctx) {
            var val, _a, _b, filter, e_1_1;
            var e_1, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, evalToken(this.initial, ctx)];
                    case 1:
                        val = _d.sent();
                        _d.label = 2;
                    case 2:
                        _d.trys.push([2, 7, 8, 9]);
                        _a = __values(this.filters), _b = _a.next();
                        _d.label = 3;
                    case 3:
                        if (!!_b.done) return [3 /*break*/, 6];
                        filter = _b.value;
                        return [4 /*yield*/, filter.render(val, ctx)];
                    case 4:
                        val = _d.sent();
                        _d.label = 5;
                    case 5:
                        _b = _a.next();
                        return [3 /*break*/, 3];
                    case 6: return [3 /*break*/, 9];
                    case 7:
                        e_1_1 = _d.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 9];
                    case 8:
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_1) throw e_1.error; }
                        return [7 /*endfinally*/];
                    case 9: return [2 /*return*/, val];
                }
            });
        };
        return Value;
    }());

    var Output = /** @class */ (function (_super) {
        __extends(Output, _super);
        function Output(token, filters) {
            var _this = _super.call(this, token) || this;
            _this.value = new Value(token.content, filters);
            return _this;
        }
        Output.prototype.render = function (ctx, emitter) {
            var val;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.value.value(ctx)];
                    case 1:
                        val = _a.sent();
                        emitter.write(stringify(toValue(val)));
                        return [2 /*return*/];
                }
            });
        };
        return Output;
    }(TemplateImpl));

    var HTML = /** @class */ (function (_super) {
        __extends(HTML, _super);
        function HTML(token) {
            var _this = _super.call(this, token) || this;
            _this.str = token.getContent();
            return _this;
        }
        HTML.prototype.render = function (ctx, emitter) {
            return __generator(this, function (_a) {
                emitter.write(this.str);
                return [2 /*return*/];
            });
        };
        return HTML;
    }(TemplateImpl));

    var Parser = /** @class */ (function () {
        function Parser(liquid) {
            this.liquid = liquid;
        }
        Parser.prototype.parse = function (tokens) {
            var token;
            var templates = [];
            while ((token = tokens.shift())) {
                templates.push(this.parseToken(token, tokens));
            }
            return templates;
        };
        Parser.prototype.parseToken = function (token, remainTokens) {
            try {
                if (isTagToken(token)) {
                    return new Tag(token, remainTokens, this.liquid);
                }
                if (isOutputToken(token)) {
                    return new Output(token, this.liquid.filters);
                }
                return new HTML(token);
            }
            catch (e) {
                throw new ParseError(e, token);
            }
        };
        Parser.prototype.parseStream = function (tokens) {
            var _this = this;
            return new ParseStream(tokens, function (token, tokens) { return _this.parseToken(token, tokens); });
        };
        return Parser;
    }());

    var assign = {
        parse: function (token) {
            var tokenizer = new Tokenizer(token.args);
            this.key = tokenizer.readWord().content;
            tokenizer.skipBlank();
            assert(tokenizer.peek() === '=', function () { return "illegal token " + token.getText(); });
            tokenizer.advance();
            this.value = tokenizer.remaining();
        },
        render: function (ctx) {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = ctx.bottom();
                        _b = this.key;
                        return [4 /*yield*/, this.liquid._evalValue(this.value, ctx)];
                    case 1:
                        _a[_b] = _c.sent();
                        return [2 /*return*/];
                }
            });
        }
    };

    function toEnumerable(val) {
        if (isArray(val))
            return val;
        if (isString(val) && val.length > 0)
            return [val];
        if (isObject(val))
            return Object.keys(val).map(function (key) { return [key, val[key]]; });
        return [];
    }
    function toArray(val) {
        if (isArray(val))
            return val;
        return [val];
    }

    var ForloopDrop = /** @class */ (function (_super) {
        __extends(ForloopDrop, _super);
        function ForloopDrop(length) {
            var _this = _super.call(this) || this;
            _this.i = 0;
            _this.length = length;
            return _this;
        }
        ForloopDrop.prototype.next = function () {
            this.i++;
        };
        ForloopDrop.prototype.index0 = function () {
            return this.i;
        };
        ForloopDrop.prototype.index = function () {
            return this.i + 1;
        };
        ForloopDrop.prototype.first = function () {
            return this.i === 0;
        };
        ForloopDrop.prototype.last = function () {
            return this.i === this.length - 1;
        };
        ForloopDrop.prototype.rindex = function () {
            return this.length - this.i;
        };
        ForloopDrop.prototype.rindex0 = function () {
            return this.length - this.i - 1;
        };
        ForloopDrop.prototype.valueOf = function () {
            return JSON.stringify(this);
        };
        return ForloopDrop;
    }(Drop));

    var For = {
        type: 'block',
        parse: function (token, remainTokens) {
            var _this = this;
            var toknenizer = new Tokenizer(token.args);
            var variable = toknenizer.readWord();
            var inStr = toknenizer.readWord();
            var collection = toknenizer.readValue();
            assert(variable.size() && inStr.content === 'in' && collection, function () { return "illegal tag: " + token.getText(); });
            this.variable = variable.content;
            this.collection = collection;
            this.hash = new Hash(toknenizer.remaining());
            this.templates = [];
            this.elseTemplates = [];
            var p;
            var stream = this.liquid.parser.parseStream(remainTokens)
                .on('start', function () { return (p = _this.templates); })
                .on('tag:else', function () { return (p = _this.elseTemplates); })
                .on('tag:endfor', function () { return stream.stop(); })
                .on('template', function (tpl) { return p.push(tpl); })
                .on('end', function () {
                throw new Error("tag " + token.getText() + " not closed");
            });
            stream.start();
        },
        render: function (ctx, emitter) {
            var r, collection, hash, offset, limit, scope, collection_1, collection_1_1, item, e_1_1;
            var e_1, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        r = this.liquid.renderer;
                        collection = toEnumerable(evalToken(this.collection, ctx));
                        if (!!collection.length) return [3 /*break*/, 2];
                        return [4 /*yield*/, r.renderTemplates(this.elseTemplates, ctx, emitter)];
                    case 1:
                        _b.sent();
                        return [2 /*return*/];
                    case 2: return [4 /*yield*/, this.hash.render(ctx)];
                    case 3:
                        hash = _b.sent();
                        offset = hash.offset || 0;
                        limit = (hash.limit === undefined) ? collection.length : hash.limit;
                        collection = collection.slice(offset, offset + limit);
                        if ('reversed' in hash)
                            collection.reverse();
                        scope = { forloop: new ForloopDrop(collection.length) };
                        ctx.push(scope);
                        _b.label = 4;
                    case 4:
                        _b.trys.push([4, 9, 10, 11]);
                        collection_1 = __values(collection), collection_1_1 = collection_1.next();
                        _b.label = 5;
                    case 5:
                        if (!!collection_1_1.done) return [3 /*break*/, 8];
                        item = collection_1_1.value;
                        scope[this.variable] = item;
                        return [4 /*yield*/, r.renderTemplates(this.templates, ctx, emitter)];
                    case 6:
                        _b.sent();
                        if (emitter.break) {
                            emitter.break = false;
                            return [3 /*break*/, 8];
                        }
                        emitter.continue = false;
                        scope.forloop.next();
                        _b.label = 7;
                    case 7:
                        collection_1_1 = collection_1.next();
                        return [3 /*break*/, 5];
                    case 8: return [3 /*break*/, 11];
                    case 9:
                        e_1_1 = _b.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 11];
                    case 10:
                        try {
                            if (collection_1_1 && !collection_1_1.done && (_a = collection_1.return)) _a.call(collection_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                        return [7 /*endfinally*/];
                    case 11:
                        ctx.pop();
                        return [2 /*return*/];
                }
            });
        }
    };

    var capture = {
        parse: function (tagToken, remainTokens) {
            var _this = this;
            var tokenizer = new Tokenizer(tagToken.args);
            this.variable = tokenizer.readWord().content;
            assert(this.variable, function () { return tagToken.args + " not valid identifier"; });
            this.templates = [];
            var stream = this.liquid.parser.parseStream(remainTokens);
            stream.on('tag:endcapture', function () { return stream.stop(); })
                .on('template', function (tpl) { return _this.templates.push(tpl); })
                .on('end', function () {
                throw new Error("tag " + tagToken.getText() + " not closed");
            });
            stream.start();
        },
        render: function (ctx) {
            var r, html;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        r = this.liquid.renderer;
                        return [4 /*yield*/, r.renderTemplates(this.templates, ctx)];
                    case 1:
                        html = _a.sent();
                        ctx.bottom()[this.variable] = html;
                        return [2 /*return*/];
                }
            });
        }
    };

    var Case = {
        parse: function (tagToken, remainTokens) {
            var _this = this;
            this.cond = tagToken.args;
            this.cases = [];
            this.elseTemplates = [];
            var p = [];
            var stream = this.liquid.parser.parseStream(remainTokens)
                .on('tag:when', function (token) {
                _this.cases.push({
                    val: token.args,
                    templates: p = []
                });
            })
                .on('tag:else', function () { return (p = _this.elseTemplates); })
                .on('tag:endcase', function () { return stream.stop(); })
                .on('template', function (tpl) { return p.push(tpl); })
                .on('end', function () {
                throw new Error("tag " + tagToken.getText() + " not closed");
            });
            stream.start();
        },
        render: function (ctx, emitter) {
            var r, cond, i, branch, val;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        r = this.liquid.renderer;
                        return [4 /*yield*/, new Expression(this.cond).value(ctx)];
                    case 1:
                        cond = _a.sent();
                        i = 0;
                        _a.label = 2;
                    case 2:
                        if (!(i < this.cases.length)) return [3 /*break*/, 6];
                        branch = this.cases[i];
                        return [4 /*yield*/, new Expression(branch.val).value(ctx)];
                    case 3:
                        val = _a.sent();
                        if (!(val === cond)) return [3 /*break*/, 5];
                        return [4 /*yield*/, r.renderTemplates(branch.templates, ctx, emitter)];
                    case 4:
                        _a.sent();
                        return [2 /*return*/];
                    case 5:
                        i++;
                        return [3 /*break*/, 2];
                    case 6: return [4 /*yield*/, r.renderTemplates(this.elseTemplates, ctx, emitter)];
                    case 7:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }
    };

    var comment = {
        parse: function (tagToken, remainTokens) {
            var stream = this.liquid.parser.parseStream(remainTokens);
            stream
                .on('token', function (token) {
                if (token.name === 'endcomment')
                    stream.stop();
            })
                .on('end', function () {
                throw new Error("tag " + tagToken.getText() + " not closed");
            });
            stream.start();
        }
    };

    var BlockMode;
    (function (BlockMode) {
        /* store rendered html into blocks */
        BlockMode[BlockMode["OUTPUT"] = 0] = "OUTPUT";
        /* output rendered html directly */
        BlockMode[BlockMode["STORE"] = 1] = "STORE";
    })(BlockMode || (BlockMode = {}));
    var BlockMode$1 = BlockMode;

    var include = {
        parse: function (token) {
            var args = token.args;
            var tokenizer = new Tokenizer(args);
            this.file = this.liquid.options.dynamicPartials
                ? tokenizer.readValue()
                : tokenizer.readFileName();
            assert(this.file, function () { return "illegal argument \"" + token.args + "\""; });
            var begin = tokenizer.p;
            var withStr = tokenizer.readWord();
            if (withStr.content === 'with') {
                tokenizer.skipBlank();
                if (tokenizer.peek() !== ':') {
                    this.withVar = tokenizer.readValue();
                }
                else
                    tokenizer.p = begin;
            }
            else
                tokenizer.p = begin;
            this.hash = new Hash(tokenizer.remaining());
        },
        render: function (ctx, emitter) {
            var _a, liquid, hash, withVar, file, renderer, filepath, _b, _c, saved, scope, templates;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _a = this, liquid = _a.liquid, hash = _a.hash, withVar = _a.withVar, file = _a.file;
                        renderer = liquid.renderer;
                        if (!ctx.opts.dynamicPartials) return [3 /*break*/, 5];
                        if (!isQuotedToken(file)) return [3 /*break*/, 2];
                        return [4 /*yield*/, renderer.renderTemplates(liquid.parse(evalQuotedToken(file)), ctx)];
                    case 1:
                        _c = _d.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, evalToken(file, ctx)];
                    case 3:
                        _c = _d.sent();
                        _d.label = 4;
                    case 4:
                        _b = (_c);
                        return [3 /*break*/, 6];
                    case 5:
                        _b = file.getText();
                        _d.label = 6;
                    case 6:
                        filepath = _b;
                        assert(filepath, function () { return "illegal filename \"" + file.getText() + "\":\"" + filepath + "\""; });
                        saved = ctx.saveRegister('blocks', 'blockMode');
                        ctx.setRegister('blocks', {});
                        ctx.setRegister('blockMode', BlockMode$1.OUTPUT);
                        return [4 /*yield*/, hash.render(ctx)];
                    case 7:
                        scope = _d.sent();
                        if (withVar)
                            scope[filepath] = evalToken(withVar, ctx);
                        return [4 /*yield*/, liquid._parseFile(filepath, ctx.opts, ctx.sync)];
                    case 8:
                        templates = _d.sent();
                        ctx.push(scope);
                        return [4 /*yield*/, renderer.renderTemplates(templates, ctx, emitter)];
                    case 9:
                        _d.sent();
                        ctx.pop();
                        ctx.restoreRegister(saved);
                        return [2 /*return*/];
                }
            });
        }
    };

    var render = {
        parse: function (token) {
            var args = token.args;
            var tokenizer = new Tokenizer(args);
            this.file = this.liquid.options.dynamicPartials
                ? tokenizer.readValue()
                : tokenizer.readFileName();
            assert(this.file, function () { return "illegal argument \"" + token.args + "\""; });
            while (!tokenizer.end()) {
                tokenizer.skipBlank();
                var begin = tokenizer.p;
                var keyword = tokenizer.readWord();
                if (keyword.content === 'with' || keyword.content === 'for') {
                    tokenizer.skipBlank();
                    if (tokenizer.peek() !== ':') {
                        var value = tokenizer.readValue();
                        if (value) {
                            var beforeAs = tokenizer.p;
                            var asStr = tokenizer.readWord();
                            var alias = void 0;
                            if (asStr.content === 'as')
                                alias = tokenizer.readWord();
                            else
                                tokenizer.p = beforeAs;
                            this[keyword.content] = { value: value, alias: alias && alias.content };
                            tokenizer.skipBlank();
                            if (tokenizer.peek() === ',')
                                tokenizer.advance();
                            continue;
                        }
                    }
                }
                tokenizer.p = begin;
                break;
            }
            this.hash = new Hash(tokenizer.remaining());
        },
        render: function (ctx, emitter) {
            var _a, liquid, file, hash, renderer, filepath, _b, _c, childCtx, scope, _d, value, alias, _e, value, alias, collection, collection_1, collection_1_1, item, templates, e_1_1, templates;
            var e_1, _f;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        _a = this, liquid = _a.liquid, file = _a.file, hash = _a.hash;
                        renderer = liquid.renderer;
                        if (!ctx.opts.dynamicPartials) return [3 /*break*/, 4];
                        if (!isQuotedToken(file)) return [3 /*break*/, 2];
                        return [4 /*yield*/, renderer.renderTemplates(liquid.parse(evalQuotedToken(file)), ctx)];
                    case 1:
                        _c = _g.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        _c = evalToken(file, ctx);
                        _g.label = 3;
                    case 3:
                        _b = (_c);
                        return [3 /*break*/, 5];
                    case 4:
                        _b = file.getText();
                        _g.label = 5;
                    case 5:
                        filepath = _b;
                        assert(filepath, function () { return "illegal filename \"" + file.getText() + "\":\"" + filepath + "\""; });
                        childCtx = new Context({}, ctx.opts, ctx.sync);
                        return [4 /*yield*/, hash.render(ctx)];
                    case 6:
                        scope = _g.sent();
                        if (this['with']) {
                            _d = this['with'], value = _d.value, alias = _d.alias;
                            scope[alias || filepath] = evalToken(value, ctx);
                        }
                        childCtx.push(scope);
                        if (!this['for']) return [3 /*break*/, 16];
                        _e = this['for'], value = _e.value, alias = _e.alias;
                        collection = evalToken(value, ctx);
                        collection = toEnumerable(collection);
                        scope['forloop'] = new ForloopDrop(collection.length);
                        _g.label = 7;
                    case 7:
                        _g.trys.push([7, 13, 14, 15]);
                        collection_1 = __values(collection), collection_1_1 = collection_1.next();
                        _g.label = 8;
                    case 8:
                        if (!!collection_1_1.done) return [3 /*break*/, 12];
                        item = collection_1_1.value;
                        scope[alias] = item;
                        return [4 /*yield*/, liquid._parseFile(filepath, childCtx.opts, childCtx.sync)];
                    case 9:
                        templates = _g.sent();
                        return [4 /*yield*/, renderer.renderTemplates(templates, childCtx, emitter)];
                    case 10:
                        _g.sent();
                        scope.forloop.next();
                        _g.label = 11;
                    case 11:
                        collection_1_1 = collection_1.next();
                        return [3 /*break*/, 8];
                    case 12: return [3 /*break*/, 15];
                    case 13:
                        e_1_1 = _g.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 15];
                    case 14:
                        try {
                            if (collection_1_1 && !collection_1_1.done && (_f = collection_1.return)) _f.call(collection_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                        return [7 /*endfinally*/];
                    case 15: return [3 /*break*/, 19];
                    case 16: return [4 /*yield*/, liquid._parseFile(filepath, childCtx.opts, childCtx.sync)];
                    case 17:
                        templates = _g.sent();
                        return [4 /*yield*/, renderer.renderTemplates(templates, childCtx, emitter)];
                    case 18:
                        _g.sent();
                        _g.label = 19;
                    case 19: return [2 /*return*/];
                }
            });
        }
    };

    var decrement = {
        parse: function (token) {
            var tokenizer = new Tokenizer(token.args);
            this.variable = tokenizer.readWord().content;
        },
        render: function (context, emitter) {
            var scope = context.environments;
            if (!isNumber(scope[this.variable])) {
                scope[this.variable] = 0;
            }
            emitter.write(stringify(--scope[this.variable]));
        }
    };

    var cycle = {
        parse: function (tagToken) {
            var tokenizer = new Tokenizer(tagToken.args);
            var group = tokenizer.readValue();
            tokenizer.skipBlank();
            this.candidates = [];
            if (group) {
                if (tokenizer.peek() === ':') {
                    this.group = group;
                    tokenizer.advance();
                }
                else
                    this.candidates.push(group);
            }
            while (!tokenizer.end()) {
                var value = tokenizer.readValue();
                if (value)
                    this.candidates.push(value);
                tokenizer.readTo(',');
            }
            assert(this.candidates.length, function () { return "empty candidates: " + tagToken.getText(); });
        },
        render: function (ctx, emitter) {
            var group = evalToken(this.group, ctx);
            var fingerprint = "cycle:" + group + ":" + this.candidates.join(',');
            var groups = ctx.getRegister('cycle');
            var idx = groups[fingerprint];
            if (idx === undefined) {
                idx = groups[fingerprint] = 0;
            }
            var candidate = this.candidates[idx];
            idx = (idx + 1) % this.candidates.length;
            groups[fingerprint] = idx;
            var html = evalToken(candidate, ctx);
            emitter.write(html);
        }
    };

    var If = {
        parse: function (tagToken, remainTokens) {
            var _this = this;
            this.branches = [];
            this.elseTemplates = [];
            var p;
            var stream = this.liquid.parser.parseStream(remainTokens)
                .on('start', function () { return _this.branches.push({
                cond: tagToken.args,
                templates: (p = [])
            }); })
                .on('tag:elsif', function (token) {
                _this.branches.push({
                    cond: token.args,
                    templates: p = []
                });
            })
                .on('tag:else', function () { return (p = _this.elseTemplates); })
                .on('tag:endif', function () { return stream.stop(); })
                .on('template', function (tpl) { return p.push(tpl); })
                .on('end', function () {
                throw new Error("tag " + tagToken.getText() + " not closed");
            });
            stream.start();
        },
        render: function (ctx, emitter) {
            var r, _a, _b, branch, cond, e_1_1;
            var e_1, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        r = this.liquid.renderer;
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 7, 8, 9]);
                        _a = __values(this.branches), _b = _a.next();
                        _d.label = 2;
                    case 2:
                        if (!!_b.done) return [3 /*break*/, 6];
                        branch = _b.value;
                        return [4 /*yield*/, new Expression(branch.cond).value(ctx)];
                    case 3:
                        cond = _d.sent();
                        if (!isTruthy(cond)) return [3 /*break*/, 5];
                        return [4 /*yield*/, r.renderTemplates(branch.templates, ctx, emitter)];
                    case 4:
                        _d.sent();
                        return [2 /*return*/];
                    case 5:
                        _b = _a.next();
                        return [3 /*break*/, 2];
                    case 6: return [3 /*break*/, 9];
                    case 7:
                        e_1_1 = _d.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 9];
                    case 8:
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_1) throw e_1.error; }
                        return [7 /*endfinally*/];
                    case 9: return [4 /*yield*/, r.renderTemplates(this.elseTemplates, ctx, emitter)];
                    case 10:
                        _d.sent();
                        return [2 /*return*/];
                }
            });
        }
    };

    var increment = {
        parse: function (token) {
            var tokenizer = new Tokenizer(token.args);
            this.variable = tokenizer.readWord().content;
        },
        render: function (context, emitter) {
            var scope = context.environments;
            if (!isNumber(scope[this.variable])) {
                scope[this.variable] = 0;
            }
            var val = scope[this.variable];
            scope[this.variable]++;
            emitter.write(stringify(val));
        }
    };

    var layout = {
        parse: function (token, remainTokens) {
            var tokenizer = new Tokenizer(token.args);
            var file = this.liquid.options.dynamicPartials ? tokenizer.readValue() : tokenizer.readFileName();
            assert(file, function () { return "illegal argument \"" + token.args + "\""; });
            this.file = file;
            this.hash = new Hash(tokenizer.remaining());
            this.tpls = this.liquid.parser.parse(remainTokens);
        },
        render: function (ctx, emitter) {
            var _a, liquid, hash, file, renderer, filepath, _b, _c, blocks, html, templates, _d, _e, partial;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        _a = this, liquid = _a.liquid, hash = _a.hash, file = _a.file;
                        renderer = liquid.renderer;
                        if (!ctx.opts.dynamicPartials) return [3 /*break*/, 4];
                        if (!isQuotedToken(file)) return [3 /*break*/, 2];
                        return [4 /*yield*/, renderer.renderTemplates(liquid.parse(evalQuotedToken(file)), ctx)];
                    case 1:
                        _c = _f.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        _c = evalToken(this.file, ctx);
                        _f.label = 3;
                    case 3:
                        _b = (_c);
                        return [3 /*break*/, 5];
                    case 4:
                        _b = file.getText();
                        _f.label = 5;
                    case 5:
                        filepath = _b;
                        assert(filepath, function () { return "illegal filename \"" + file.getText() + "\":\"" + filepath + "\""; });
                        // render the remaining tokens immediately
                        ctx.setRegister('blockMode', BlockMode$1.STORE);
                        blocks = ctx.getRegister('blocks');
                        return [4 /*yield*/, renderer.renderTemplates(this.tpls, ctx)];
                    case 6:
                        html = _f.sent();
                        if (blocks[''] === undefined)
                            blocks[''] = html;
                        return [4 /*yield*/, liquid._parseFile(filepath, ctx.opts, ctx.sync)];
                    case 7:
                        templates = _f.sent();
                        _e = (_d = ctx).push;
                        return [4 /*yield*/, hash.render(ctx)];
                    case 8:
                        _e.apply(_d, [_f.sent()]);
                        ctx.setRegister('blockMode', BlockMode$1.OUTPUT);
                        return [4 /*yield*/, renderer.renderTemplates(templates, ctx)];
                    case 9:
                        partial = _f.sent();
                        ctx.pop();
                        emitter.write(partial);
                        return [2 /*return*/];
                }
            });
        }
    };

    var block = {
        parse: function (token, remainTokens) {
            var _this = this;
            var match = /\w+/.exec(token.args);
            this.block = match ? match[0] : '';
            this.tpls = [];
            var stream = this.liquid.parser.parseStream(remainTokens)
                .on('tag:endblock', function () { return stream.stop(); })
                .on('template', function (tpl) { return _this.tpls.push(tpl); })
                .on('end', function () {
                throw new Error("tag " + token.getText() + " not closed");
            });
            stream.start();
        },
        render: function (ctx, emitter) {
            var blocks, childDefined, r, html, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        blocks = ctx.getRegister('blocks');
                        childDefined = blocks[this.block];
                        r = this.liquid.renderer;
                        if (!(childDefined !== undefined)) return [3 /*break*/, 1];
                        _a = childDefined;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, r.renderTemplates(this.tpls, ctx)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        html = _a;
                        if (ctx.getRegister('blockMode', BlockMode$1.OUTPUT) === BlockMode$1.STORE) {
                            blocks[this.block] = html;
                            return [2 /*return*/];
                        }
                        emitter.write(html);
                        return [2 /*return*/];
                }
            });
        }
    };

    var raw = {
        parse: function (tagToken, remainTokens) {
            var _this = this;
            this.tokens = [];
            var stream = this.liquid.parser.parseStream(remainTokens);
            stream
                .on('token', function (token) {
                if (token.name === 'endraw')
                    stream.stop();
                else
                    _this.tokens.push(token);
            })
                .on('end', function () {
                throw new Error("tag " + tagToken.getText() + " not closed");
            });
            stream.start();
        },
        render: function () {
            return this.tokens.map(function (token) { return token.getText(); }).join('');
        }
    };

    var TablerowloopDrop = /** @class */ (function (_super) {
        __extends(TablerowloopDrop, _super);
        function TablerowloopDrop(length, cols) {
            var _this = _super.call(this, length) || this;
            _this.length = length;
            _this.cols = cols;
            return _this;
        }
        TablerowloopDrop.prototype.row = function () {
            return Math.floor(this.i / this.cols) + 1;
        };
        TablerowloopDrop.prototype.col0 = function () {
            return (this.i % this.cols);
        };
        TablerowloopDrop.prototype.col = function () {
            return this.col0() + 1;
        };
        TablerowloopDrop.prototype.col_first = function () {
            return this.col0() === 0;
        };
        TablerowloopDrop.prototype.col_last = function () {
            return this.col() === this.cols;
        };
        return TablerowloopDrop;
    }(ForloopDrop));

    var tablerow = {
        parse: function (tagToken, remainTokens) {
            var _this = this;
            var tokenizer = new Tokenizer(tagToken.args);
            this.variable = tokenizer.readWord();
            tokenizer.skipBlank();
            var tmp = tokenizer.readWord();
            assert(tmp && tmp.content === 'in', function () { return "illegal tag: " + tagToken.getText(); });
            this.collection = tokenizer.readValue();
            this.hash = new Hash(tokenizer.remaining());
            this.templates = [];
            var p;
            var stream = this.liquid.parser.parseStream(remainTokens)
                .on('start', function () { return (p = _this.templates); })
                .on('tag:endtablerow', function () { return stream.stop(); })
                .on('template', function (tpl) { return p.push(tpl); })
                .on('end', function () {
                throw new Error("tag " + tagToken.getText() + " not closed");
            });
            stream.start();
        },
        render: function (ctx, emitter) {
            var collection, hash, offset, limit, cols, r, tablerowloop, scope, idx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        collection = toEnumerable(evalToken(this.collection, ctx));
                        return [4 /*yield*/, this.hash.render(ctx)];
                    case 1:
                        hash = _a.sent();
                        offset = hash.offset || 0;
                        limit = (hash.limit === undefined) ? collection.length : hash.limit;
                        collection = collection.slice(offset, offset + limit);
                        cols = hash.cols || collection.length;
                        r = this.liquid.renderer;
                        tablerowloop = new TablerowloopDrop(collection.length, cols);
                        scope = { tablerowloop: tablerowloop };
                        ctx.push(scope);
                        idx = 0;
                        _a.label = 2;
                    case 2:
                        if (!(idx < collection.length)) return [3 /*break*/, 5];
                        scope[this.variable.content] = collection[idx];
                        if (tablerowloop.col0() === 0) {
                            if (tablerowloop.row() !== 1)
                                emitter.write('</tr>');
                            emitter.write("<tr class=\"row" + tablerowloop.row() + "\">");
                        }
                        emitter.write("<td class=\"col" + tablerowloop.col() + "\">");
                        return [4 /*yield*/, r.renderTemplates(this.templates, ctx, emitter)];
                    case 3:
                        _a.sent();
                        emitter.write('</td>');
                        _a.label = 4;
                    case 4:
                        idx++, tablerowloop.next();
                        return [3 /*break*/, 2];
                    case 5:
                        if (collection.length)
                            emitter.write('</tr>');
                        ctx.pop();
                        return [2 /*return*/];
                }
            });
        }
    };

    var unless = {
        parse: function (tagToken, remainTokens) {
            var _this = this;
            this.templates = [];
            this.elseTemplates = [];
            var p;
            var stream = this.liquid.parser.parseStream(remainTokens)
                .on('start', function () {
                p = _this.templates;
                _this.cond = tagToken.args;
            })
                .on('tag:else', function () { return (p = _this.elseTemplates); })
                .on('tag:endunless', function () { return stream.stop(); })
                .on('template', function (tpl) { return p.push(tpl); })
                .on('end', function () {
                throw new Error("tag " + tagToken.getText() + " not closed");
            });
            stream.start();
        },
        render: function (ctx, emitter) {
            var r, cond;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        r = this.liquid.renderer;
                        return [4 /*yield*/, new Expression(this.cond).value(ctx)];
                    case 1:
                        cond = _a.sent();
                        return [4 /*yield*/, (isFalsy(cond)
                                ? r.renderTemplates(this.templates, ctx, emitter)
                                : r.renderTemplates(this.elseTemplates, ctx, emitter))];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }
    };

    var Break = {
        render: function (ctx, emitter) {
            emitter.break = true;
        }
    };

    var Continue = {
        render: function (ctx, emitter) {
            emitter.continue = true;
        }
    };

    var tags = {
        assign: assign, 'for': For, capture: capture, 'case': Case, comment: comment, include: include, render: render, decrement: decrement, increment: increment, cycle: cycle, 'if': If, layout: layout, block: block, raw: raw, tablerow: tablerow, unless: unless, 'break': Break, 'continue': Continue
    };

    var escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&#34;',
        "'": '&#39;'
    };
    var unescapeMap = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&#34;': '"',
        '&#39;': "'"
    };
    function escape(str) {
        return stringify(str).replace(/&|<|>|"|'/g, function (m) { return escapeMap[m]; });
    }
    function unescape(str) {
        return String(str).replace(/&(amp|lt|gt|#34|#39);/g, function (m) { return unescapeMap[m]; });
    }
    function escapeOnce(str) {
        return escape(unescape(str));
    }
    function newlineToBr(v) {
        return v.replace(/\n/g, '<br/>');
    }
    function stripHtml(v) {
        return v.replace(/<script.*?<\/script>|<!--.*?-->|<style.*?<\/style>|<.*?>/g, '');
    }

    var abs = Math.abs;
    var atLeast = Math.max;
    var atMost = Math.min;
    var ceil = Math.ceil;
    var dividedBy = function (v, arg) { return v / arg; };
    var floor = Math.floor;
    var minus = function (v, arg) { return v - arg; };
    var modulo = function (v, arg) { return v % arg; };
    var times = function (v, arg) { return v * arg; };
    function round(v, arg) {
        if (arg === void 0) { arg = 0; }
        var amp = Math.pow(10, arg);
        return Math.round(v * amp) / amp;
    }
    function plus(v, arg) {
        return Number(v) + Number(arg);
    }
    function sortNatural(input, property) {
        if (!input || !input.sort)
            return [];
        if (property !== undefined) {
            return __spread(input).sort(function (lhs, rhs) { return caseInsensitiveCompare(lhs[property], rhs[property]); });
        }
        return __spread(input).sort(caseInsensitiveCompare);
    }

    var urlDecode = function (x) { return x.split('+').map(decodeURIComponent).join(' '); };
    var urlEncode = function (x) { return x.split(' ').map(encodeURIComponent).join('+'); };

    var join = function (v, arg) { return v.join(arg === undefined ? ' ' : arg); };
    var last$1 = function (v) { return isArray(v) ? last(v) : ''; };
    var first = function (v) { return isArray(v) ? v[0] : ''; };
    var reverse = function (v) { return __spread(v).reverse(); };
    var sort = function (v, arg) { return v.sort(arg); };
    var size = function (v) { return (v && v.length) || 0; };
    function map(arr, arg) {
        return toArray(arr).map(function (v) { return v[arg]; });
    }
    function concat(v, arg) {
        return toArray(v).concat(arg);
    }
    function slice(v, begin, length) {
        if (length === void 0) { length = 1; }
        begin = begin < 0 ? v.length + begin : begin;
        return v.slice(begin, begin + length);
    }
    function where(arr, property, expected) {
        var _this = this;
        return toArray(arr).filter(function (obj) {
            var value = _this.context.getFromScope(obj, String(property).split('.'));
            return expected === undefined ? isTruthy(value) : value === expected;
        });
    }
    function uniq(arr) {
        var u = {};
        return (arr || []).filter(function (val) {
            if (u.hasOwnProperty(String(val)))
                return false;
            u[String(val)] = true;
            return true;
        });
    }

    var rFormat = /%([-_0^#:]+)?(\d+)?([EO])?(.)/;
    var monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
        'September', 'October', 'November', 'December'
    ];
    var dayNames = [
        'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
    ];
    var monthNamesShort = monthNames.map(abbr);
    var dayNamesShort = dayNames.map(abbr);
    var suffixes = {
        1: 'st',
        2: 'nd',
        3: 'rd',
        'default': 'th'
    };
    function abbr(str) {
        return str.slice(0, 3);
    }
    // prototype extensions
    function daysInMonth(d) {
        var feb = isLeapYear(d) ? 29 : 28;
        return [31, feb, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    }
    function getDayOfYear(d) {
        var num = 0;
        for (var i = 0; i < d.getMonth(); ++i) {
            num += daysInMonth(d)[i];
        }
        return num + d.getDate();
    }
    function getWeekOfYear(d, startDay) {
        // Skip to startDay of this week
        var now = getDayOfYear(d) + (startDay - d.getDay());
        // Find the first startDay of the year
        var jan1 = new Date(d.getFullYear(), 0, 1);
        var then = (7 - jan1.getDay() + startDay);
        return String(Math.floor((now - then) / 7) + 1);
    }
    function isLeapYear(d) {
        var year = d.getFullYear();
        return !!((year & 3) === 0 && (year % 100 || (year % 400 === 0 && year)));
    }
    function getSuffix(d) {
        var str = d.getDate().toString();
        var index = parseInt(str.slice(-1));
        return suffixes[index] || suffixes['default'];
    }
    function century(d) {
        return parseInt(d.getFullYear().toString().substring(0, 2), 10);
    }
    // default to 0
    var padWidths = {
        d: 2,
        e: 2,
        H: 2,
        I: 2,
        j: 3,
        k: 2,
        l: 2,
        L: 3,
        m: 2,
        M: 2,
        S: 2,
        U: 2,
        W: 2
    };
    // default to '0'
    var padChars = {
        a: ' ',
        A: ' ',
        b: ' ',
        B: ' ',
        c: ' ',
        e: ' ',
        k: ' ',
        l: ' ',
        p: ' ',
        P: ' '
    };
    var formatCodes = {
        a: function (d) { return dayNamesShort[d.getDay()]; },
        A: function (d) { return dayNames[d.getDay()]; },
        b: function (d) { return monthNamesShort[d.getMonth()]; },
        B: function (d) { return monthNames[d.getMonth()]; },
        c: function (d) { return d.toLocaleString(); },
        C: function (d) { return century(d); },
        d: function (d) { return d.getDate(); },
        e: function (d) { return d.getDate(); },
        H: function (d) { return d.getHours(); },
        I: function (d) { return String(d.getHours() % 12 || 12); },
        j: function (d) { return getDayOfYear(d); },
        k: function (d) { return d.getHours(); },
        l: function (d) { return String(d.getHours() % 12 || 12); },
        L: function (d) { return d.getMilliseconds(); },
        m: function (d) { return d.getMonth() + 1; },
        M: function (d) { return d.getMinutes(); },
        N: function (d, opts) {
            var width = Number(opts.width) || 9;
            var str = String(d.getMilliseconds()).substr(0, width);
            return padEnd(str, width, '0');
        },
        p: function (d) { return (d.getHours() < 12 ? 'AM' : 'PM'); },
        P: function (d) { return (d.getHours() < 12 ? 'am' : 'pm'); },
        q: function (d) { return getSuffix(d); },
        s: function (d) { return Math.round(d.valueOf() / 1000); },
        S: function (d) { return d.getSeconds(); },
        u: function (d) { return d.getDay() || 7; },
        U: function (d) { return getWeekOfYear(d, 0); },
        w: function (d) { return d.getDay(); },
        W: function (d) { return getWeekOfYear(d, 1); },
        x: function (d) { return d.toLocaleDateString(); },
        X: function (d) { return d.toLocaleTimeString(); },
        y: function (d) { return d.getFullYear().toString().substring(2, 4); },
        Y: function (d) { return d.getFullYear(); },
        z: function (d, opts) {
            var offset = d.getTimezoneOffset();
            var nOffset = Math.abs(offset);
            var h = Math.floor(nOffset / 60);
            var m = nOffset % 60;
            return (offset > 0 ? '-' : '+') +
                padStart(h, 2, '0') +
                (opts.flags[':'] ? ':' : '') +
                padStart(m, 2, '0');
        },
        't': function () { return '\t'; },
        'n': function () { return '\n'; },
        '%': function () { return '%'; }
    };
    formatCodes.h = formatCodes.b;
    function strftime (d, formatStr) {
        var output = '';
        var remaining = formatStr;
        var match;
        while ((match = rFormat.exec(remaining))) {
            output += remaining.slice(0, match.index);
            remaining = remaining.slice(match.index + match[0].length);
            output += format(d, match);
        }
        return output + remaining;
    }
    function format(d, match) {
        var e_1, _a;
        var _b = __read(match, 5), input = _b[0], _c = _b[1], flagStr = _c === void 0 ? '' : _c, width = _b[2], modifier = _b[3], conversion = _b[4];
        var convert = formatCodes[conversion];
        if (!convert)
            return input;
        var flags = {};
        try {
            for (var flagStr_1 = __values(flagStr), flagStr_1_1 = flagStr_1.next(); !flagStr_1_1.done; flagStr_1_1 = flagStr_1.next()) {
                var flag = flagStr_1_1.value;
                flags[flag] = true;
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (flagStr_1_1 && !flagStr_1_1.done && (_a = flagStr_1.return)) _a.call(flagStr_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        var ret = String(convert(d, { flags: flags, width: width, modifier: modifier }));
        var padChar = padChars[conversion] || '0';
        var padWidth = width || padWidths[conversion] || 0;
        if (flags['^'])
            ret = ret.toUpperCase();
        else if (flags['#'])
            ret = changeCase(ret);
        if (flags['_'])
            padChar = ' ';
        else if (flags['0'])
            padChar = '0';
        if (flags['-'])
            padWidth = 0;
        return padStart(ret, padWidth, padChar);
    }

    function date(v, arg) {
        var date = v;
        if (v === 'now' || v === 'today') {
            date = new Date();
        }
        else if (isNumber(v)) {
            date = new Date(v * 1000);
        }
        else if (isString(v)) {
            date = /^\d+$/.test(v) ? new Date(+v * 1000) : new Date(v);
        }
        return isValidDate(date) ? strftime(date, arg) : v;
    }
    function isValidDate(date) {
        return date instanceof Date && !isNaN(date.getTime());
    }

    function Default(v, arg) {
        if (isArray(v) || isString(v))
            return v.length ? v : arg;
        return isFalsy(toValue(v)) ? arg : v;
    }
    function json(v) {
        return JSON.stringify(v);
    }

    /**
     * String related filters
     *
     * * prefer stringify() to String() since `undefined`, `null` should eval ''
     */
    function append(v, arg) {
        assert(arg !== undefined, function () { return 'append expect 2 arguments'; });
        return stringify(v) + stringify(arg);
    }
    function prepend(v, arg) {
        assert(arg !== undefined, function () { return 'prepend expect 2 arguments'; });
        return stringify(arg) + stringify(v);
    }
    function lstrip(v) {
        return stringify(v).replace(/^\s+/, '');
    }
    function downcase(v) {
        return stringify(v).toLowerCase();
    }
    function upcase(str) {
        return stringify(str).toUpperCase();
    }
    function remove(v, arg) {
        return stringify(v).split(arg).join('');
    }
    function removeFirst(v, l) {
        return stringify(v).replace(l, '');
    }
    function rstrip(str) {
        return stringify(str).replace(/\s+$/, '');
    }
    function split(v, arg) {
        return stringify(v).split(arg);
    }
    function strip(v) {
        return stringify(v).trim();
    }
    function stripNewlines(v) {
        return stringify(v).replace(/\n/g, '');
    }
    function capitalize(str) {
        str = stringify(str);
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    function replace(v, pattern, replacement) {
        return stringify(v).split(pattern).join(replacement);
    }
    function replaceFirst(v, arg1, arg2) {
        return stringify(v).replace(arg1, arg2);
    }
    function truncate(v, l, o) {
        if (l === void 0) { l = 50; }
        if (o === void 0) { o = '...'; }
        v = stringify(v);
        if (v.length <= l)
            return v;
        return v.substr(0, l - o.length) + o;
    }
    function truncatewords(v, l, o) {
        if (l === void 0) { l = 15; }
        if (o === void 0) { o = '...'; }
        var arr = v.split(/\s+/);
        var ret = arr.slice(0, l).join(' ');
        if (arr.length >= l)
            ret += o;
        return ret;
    }



    var builtinFilters = /*#__PURE__*/Object.freeze({
        escape: escape,
        escapeOnce: escapeOnce,
        newlineToBr: newlineToBr,
        stripHtml: stripHtml,
        abs: abs,
        atLeast: atLeast,
        atMost: atMost,
        ceil: ceil,
        dividedBy: dividedBy,
        floor: floor,
        minus: minus,
        modulo: modulo,
        times: times,
        round: round,
        plus: plus,
        sortNatural: sortNatural,
        urlDecode: urlDecode,
        urlEncode: urlEncode,
        join: join,
        last: last$1,
        first: first,
        reverse: reverse,
        sort: sort,
        size: size,
        map: map,
        concat: concat,
        slice: slice,
        where: where,
        uniq: uniq,
        date: date,
        Default: Default,
        json: json,
        append: append,
        prepend: prepend,
        lstrip: lstrip,
        downcase: downcase,
        upcase: upcase,
        remove: remove,
        removeFirst: removeFirst,
        rstrip: rstrip,
        split: split,
        strip: strip,
        stripNewlines: stripNewlines,
        capitalize: capitalize,
        replace: replace,
        replaceFirst: replaceFirst,
        truncate: truncate,
        truncatewords: truncatewords
    });

    var TagMap = /** @class */ (function () {
        function TagMap() {
            this.impls = {};
        }
        TagMap.prototype.get = function (name) {
            var impl = this.impls[name];
            assert(impl, function () { return "tag \"" + name + "\" not found"; });
            return impl;
        };
        TagMap.prototype.set = function (name, impl) {
            this.impls[name] = impl;
        };
        return TagMap;
    }());

    var FilterMap = /** @class */ (function () {
        function FilterMap(strictFilters) {
            this.strictFilters = strictFilters;
            this.impls = {};
        }
        FilterMap.prototype.get = function (name) {
            var impl = this.impls[name];
            assert(impl || !this.strictFilters, function () { return "undefined filter: " + name; });
            return impl;
        };
        FilterMap.prototype.set = function (name, impl) {
            this.impls[name] = impl;
        };
        FilterMap.prototype.create = function (name, args) {
            return new Filter(name, this.get(name), args);
        };
        return FilterMap;
    }());

    function mkResolve(value) {
        var ret = {
            then: function (resolve) { return resolve(value); },
            catch: function () { return ret; }
        };
        return ret;
    }
    function mkReject(err) {
        var ret = {
            then: function (resolve, reject) {
                if (reject)
                    return reject(err);
                return ret;
            },
            catch: function (reject) { return reject(err); }
        };
        return ret;
    }
    function isThenable(val) {
        return val && isFunction(val.then);
    }
    function isCustomIterable(val) {
        return val && isFunction(val.next) && isFunction(val.throw) && isFunction(val.return);
    }
    function toThenable(val) {
        if (isThenable(val))
            return val;
        if (isCustomIterable(val))
            return reduce();
        return mkResolve(val);
        function reduce(prev) {
            var state;
            try {
                state = val.next(prev);
            }
            catch (err) {
                return mkReject(err);
            }
            if (state.done)
                return mkResolve(state.value);
            return toThenable(state.value).then(reduce, function (err) {
                var state;
                try {
                    state = val.throw(err);
                }
                catch (e) {
                    return mkReject(e);
                }
                if (state.done)
                    return mkResolve(state.value);
                return reduce(state.value);
            });
        }
    }
    function toValue$1(val) {
        var ret;
        toThenable(val)
            .then(function (x) {
            ret = x;
            return mkResolve(ret);
        })
            .catch(function (err) {
            throw err;
        });
        return ret;
    }

    var Liquid = /** @class */ (function () {
        function Liquid(opts) {
            var _this = this;
            if (opts === void 0) { opts = {}; }
            this.options = applyDefault(normalize(opts));
            this.parser = new Parser(this);
            this.renderer = new Render();
            this.fs = opts.fs || fs;
            this.filters = new FilterMap(this.options.strictFilters);
            this.tags = new TagMap();
            forOwn(tags, function (conf, name) { return _this.registerTag(snakeCase(name), conf); });
            forOwn(builtinFilters, function (handler, name) { return _this.registerFilter(snakeCase(name), handler); });
        }
        Liquid.prototype.parse = function (html, filepath) {
            var tokenizer = new Tokenizer(html, filepath);
            var tokens = tokenizer.readTopLevelTokens(this.options);
            return this.parser.parse(tokens);
        };
        Liquid.prototype._render = function (tpl, scope, opts, sync) {
            var options = __assign({}, this.options, normalize(opts));
            var ctx = new Context(scope, options, sync);
            return this.renderer.renderTemplates(tpl, ctx);
        };
        Liquid.prototype.render = function (tpl, scope, opts) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, toThenable(this._render(tpl, scope, opts, false))];
                });
            });
        };
        Liquid.prototype.renderSync = function (tpl, scope, opts) {
            return toValue$1(this._render(tpl, scope, opts, true));
        };
        Liquid.prototype._parseAndRender = function (html, scope, opts, sync) {
            var tpl = this.parse(html);
            return this._render(tpl, scope, opts, sync);
        };
        Liquid.prototype.parseAndRender = function (html, scope, opts) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, toThenable(this._parseAndRender(html, scope, opts, false))];
                });
            });
        };
        Liquid.prototype.parseAndRenderSync = function (html, scope, opts) {
            return toValue$1(this._parseAndRender(html, scope, opts, true));
        };
        Liquid.prototype._parseFile = function (file, opts, sync) {
            var options, paths, filepath, paths_1, paths_1_1, filepath, cache, tpls, _a, tpl, _b, _c, e_1_1;
            var e_1, _d;
            var _this = this;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        options = __assign({}, this.options, normalize(opts));
                        paths = options.root.map(function (root) { return _this.fs.resolve(root, file, options.extname); });
                        if (this.fs.fallback !== undefined) {
                            filepath = this.fs.fallback(file);
                            if (filepath !== undefined)
                                paths.push(filepath);
                        }
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 13, 14, 15]);
                        paths_1 = __values(paths), paths_1_1 = paths_1.next();
                        _e.label = 2;
                    case 2:
                        if (!!paths_1_1.done) return [3 /*break*/, 12];
                        filepath = paths_1_1.value;
                        cache = options.cache;
                        if (!cache) return [3 /*break*/, 4];
                        return [4 /*yield*/, cache.read(filepath)];
                    case 3:
                        tpls = _e.sent();
                        if (tpls)
                            return [2 /*return*/, tpls];
                        _e.label = 4;
                    case 4:
                        if (!sync) return [3 /*break*/, 5];
                        _a = this.fs.existsSync(filepath);
                        return [3 /*break*/, 7];
                    case 5: return [4 /*yield*/, this.fs.exists(filepath)];
                    case 6:
                        _a = _e.sent();
                        _e.label = 7;
                    case 7:
                        if (!(_a))
                            return [3 /*break*/, 11];
                        _b = this.parse;
                        if (!sync) return [3 /*break*/, 8];
                        _c = this.fs.readFileSync(filepath);
                        return [3 /*break*/, 10];
                    case 8: return [4 /*yield*/, this.fs.readFile(filepath)];
                    case 9:
                        _c = _e.sent();
                        _e.label = 10;
                    case 10:
                        tpl = _b.apply(this, [_c, filepath]);
                        if (cache)
                            cache.write(filepath, tpl);
                        return [2 /*return*/, tpl];
                    case 11:
                        paths_1_1 = paths_1.next();
                        return [3 /*break*/, 2];
                    case 12: return [3 /*break*/, 15];
                    case 13:
                        e_1_1 = _e.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 15];
                    case 14:
                        try {
                            if (paths_1_1 && !paths_1_1.done && (_d = paths_1.return)) _d.call(paths_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                        return [7 /*endfinally*/];
                    case 15: throw this.lookupError(file, options.root);
                }
            });
        };
        Liquid.prototype.parseFile = function (file, opts) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, toThenable(this._parseFile(file, opts, false))];
                });
            });
        };
        Liquid.prototype.parseFileSync = function (file, opts) {
            return toValue$1(this._parseFile(file, opts, true));
        };
        Liquid.prototype.renderFile = function (file, ctx, opts) {
            return __awaiter(this, void 0, void 0, function () {
                var templates;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.parseFile(file, opts)];
                        case 1:
                            templates = _a.sent();
                            return [2 /*return*/, this.render(templates, ctx, opts)];
                    }
                });
            });
        };
        Liquid.prototype.renderFileSync = function (file, ctx, opts) {
            var options = normalize(opts);
            var templates = this.parseFileSync(file, options);
            return this.renderSync(templates, ctx, opts);
        };
        Liquid.prototype._evalValue = function (str, ctx) {
            var value = new Value(str, this.filters);
            return value.value(ctx);
        };
        Liquid.prototype.evalValue = function (str, ctx) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, toThenable(this._evalValue(str, ctx))];
                });
            });
        };
        Liquid.prototype.evalValueSync = function (str, ctx) {
            return toValue$1(this._evalValue(str, ctx));
        };
        Liquid.prototype.registerFilter = function (name, filter) {
            this.filters.set(name, filter);
        };
        Liquid.prototype.registerTag = function (name, tag) {
            this.tags.set(name, tag);
        };
        Liquid.prototype.plugin = function (plugin) {
            return plugin.call(this, Liquid);
        };
        Liquid.prototype.express = function () {
            var self = this; // eslint-disable-line
            return function (filePath, ctx, callback) {
                var opts = { root: __spread(normalizeStringArray(this.root), self.options.root) };
                self.renderFile(filePath, ctx, opts).then(function (html) { return callback(null, html); }, callback);
            };
        };
        Liquid.prototype.lookupError = function (file, roots) {
            var err = new Error('ENOENT');
            err.message = "ENOENT: Failed to lookup \"" + file + "\" in \"" + roots + "\"";
            err.code = 'ENOENT';
            return err;
        };
        /**
         * @deprecated use parseFile instead
         */
        Liquid.prototype.getTemplate = function (file, opts) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.parseFile(file, opts)];
                });
            });
        };
        /**
         * @deprecated use parseFileSync instead
         */
        Liquid.prototype.getTemplateSync = function (file, opts) {
            return this.parseFileSync(file, opts);
        };
        return Liquid;
    }());

    exports.AssertionError = AssertionError;
    exports.Context = Context;
    exports.Drop = Drop;
    exports.Emitter = Emitter;
    exports.Expression = Expression;
    exports.Hash = Hash;
    exports.Liquid = Liquid;
    exports.ParseError = ParseError;
    exports.ParseStream = ParseStream;
    exports.TagToken = TagToken;
    exports.Token = Token;
    exports.TokenizationError = TokenizationError;
    exports.Tokenizer = Tokenizer;
    exports.TypeGuards = typeGuards;
    exports.assert = assert;
    exports.evalQuotedToken = evalQuotedToken;
    exports.evalToken = evalToken;
    exports.isFalsy = isFalsy;
    exports.isTruthy = isTruthy;

    Object.defineProperty(exports, '__esModule', { value: true });

}));


},{}]},{},[1]);
