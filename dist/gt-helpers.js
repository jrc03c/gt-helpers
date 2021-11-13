(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
let tools = require("@jrc03c/js-math-tools")
let Liquid = require("liquidjs").Liquid
let liquid = new Liquid()

let gt = {
  date: {
    toGTDateObject: function (date) {
      let out = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hour: date.getHours(),
        minute: date.getMinutes(),
      }

      return out
    },
  },

  string: {
    stripPunctuation: function (string) {
      let valid =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890 \t\n\r"
      let out = ""

      for (let i = 0; i < string.length; i++) {
        let char = string[i]
        if (valid.includes(char)) out += char
      }

      while (out.includes("\t")) out = out.replace("\t", " ")
      while (out.includes("\n")) out = out.replace("\n", " ")
      while (out.includes("\r")) out = out.replace("\r", " ")
      while (out.includes("  ")) out = out.replace("  ", " ")

      return out
    },

    toCamelCase: function (string) {
      let array = gt.string
        .stripPunctuation(string)
        .split(" ")
        .filter(s => s.length > 0)
      let out = array[0].toLowerCase()

      for (let i = 1; i < array.length; i++) {
        let s = array[i]
        out += s[0].toUpperCase() + s.slice(1, s.length).toLowerCase()
      }

      return out
    },
  },

  array: {
    shuffle: function (array, seed) {
      tools.math.seed(seed)
      return tools.math.shuffle(array)
    },

    toSet: function (array) {
      return tools.math.set(array)
    },
  },

  object: {
    toAssociation(obj) {
      function recursiveParse(obj) {
        let type = typeof obj

        if (type === "string") return JSON.stringify(obj)
        if (type === "number") return obj

        let pairs = []

        Object.keys(obj).forEach(function (key) {
          let val = recursiveParse(obj[key])
          pairs.push(`"` + key + `" -> ` + val)
        })

        return "{" + pairs.join(", ") + "}"
      }

      return recursiveParse(obj)
    },
  },

  template: {
    build: function (templateString, variableDict) {
      // variable syntax: {$ variable $}
      let out = templateString
      let rx = /\{\$ ?(.*?) ?\$\}/g
      placeholders = templateString.match(rx)

      if (!placeholders) return out

      placeholders.forEach(function (placeholder) {
        let abbrev = placeholder
          .split(" ")
          .join("")
          .replace("{$", "")
          .replace("$}", "")
        if (!variableDict[abbrev]) throw "No definition for " + abbrev + "."

        while (out.includes(placeholder)) {
          out = out.replace(placeholder, variableDict[abbrev])
        }
      })

      return out
    },

    liquidBuild: async function (templateString, variableDict) {
      return await liquid.parseAndRender(templateString, variableDict)
    },
  },
}

try {
  module.exports = gt
} catch (e) {}

try {
  window.gt = gt
} catch (e) {}

},{"@jrc03c/js-math-tools":38,"liquidjs":92}],2:[function(require,module,exports){
const isNumber = require("./is-number.js")
const vectorize = require("./vectorize.js")

function abs(x) {
  try {
    if (!isNumber(x)) return NaN
    return Math.abs(x)
  } catch (e) {
    return NaN
  }
}

module.exports = vectorize(abs)

},{"./is-number.js":46,"./vectorize.js":89}],3:[function(require,module,exports){
const isNumber = require("./is-number.js")
const vectorize = require("./vectorize.js")

function add() {
  try {
    let out = 0
    const x = Object.values(arguments)

    for (let i = 0; i < x.length; i++) {
      if (!isNumber(x[i])) return NaN
      out += x[i]
    }

    return out
  } catch (e) {
    return NaN
  }
}

module.exports = vectorize(add)

},{"./is-number.js":46,"./vectorize.js":89}],4:[function(require,module,exports){
const assert = require("./assert.js")
const isUndefined = require("./is-undefined.js")
const isArray = require("./is-array.js")
const isNumber = require("./is-number.js")
const shape = require("./shape.js")
const transpose = require("./transpose.js")

function append(a, b, axis = 0) {
  assert(
    !isUndefined(a),
    "You must pass two arrays into the `append` function!"
  )

  assert(
    !isUndefined(b),
    "You must pass two arrays into the `append` function!"
  )

  assert(isArray(a), "You must pass two arrays into the `append` function!")
  assert(isArray(b), "You must pass two arrays into the `append` function!")

  assert(
    isNumber(axis),
    "The `axis` argument to the `append` function must be 0 or 1!"
  )

  assert(
    axis >= 0 && axis < 2,
    "The `axis` argument to the `append` function must be 0 or 1!"
  )

  assert(
    parseInt(axis) === axis,
    "The `axis` argument to the `append` function must be 0 or 1!"
  )

  const aShape = shape(a)
  const bShape = shape(b)

  assert(
    aShape.length === bShape.length,
    "The two arrays passed into the `append` function must have the same number of dimensions!"
  )

  assert(
    aShape.length < 3 && bShape.length < 3,
    "The two arrays passed into the `append` function must be 1- or 2-dimensional!"
  )

  for (let i = 0; i < aShape.length; i++) {
    if (i !== axis) {
      assert(
        aShape[i] === bShape[i],
        `The two arrays passed into the \`append\` function must have the same shapes along all axes *except* the axis along which they're being appended! (${aShape[i]} != ${bShape[i]})`
      )
    }
  }

  assert(
    axis < aShape.length,
    "The axis argument you passed into the `append` function is out of bounds for the array!"
  )

  if (aShape.length === 0) {
    return []
  } else if (aShape.length === 1) {
    return a.concat(b)
  } else if (aShape.length === 2) {
    if (axis === 0) {
      const out = []
      for (let i = 0; i < aShape[0]; i++) out.push(a[i])
      for (let i = 0; i < bShape[0]; i++) out.push(b[i])
      return out
    } else if (axis === 1) {
      return transpose(append(transpose(a), transpose(b), 0))
    }
  }
}

module.exports = append

},{"./assert.js":11,"./is-array.js":42,"./is-number.js":46,"./is-undefined.js":48,"./shape.js":73,"./transpose.js":86}],5:[function(require,module,exports){
const vectorize = require("./vectorize.js")

function apply(x, fn) {
  try {
    return fn(x)
  } catch (e) {
    return NaN
  }
}

module.exports = vectorize(apply)

},{"./vectorize.js":89}],6:[function(require,module,exports){
const isNumber = require("./is-number.js")
const vectorize = require("./vectorize.js")

function arccos(x) {
  try {
    if (!isNumber(x)) return NaN
    return Math.acos(x)
  } catch (e) {
    return NaN
  }
}

module.exports = vectorize(arccos)

},{"./is-number.js":46,"./vectorize.js":89}],7:[function(require,module,exports){
const isNumber = require("./is-number.js")
const vectorize = require("./vectorize.js")

function arcsin(x) {
  try {
    if (!isNumber(x)) return NaN
    return Math.asin(x)
  } catch (e) {
    return NaN
  }
}

module.exports = vectorize(arcsin)

},{"./is-number.js":46,"./vectorize.js":89}],8:[function(require,module,exports){
const isNumber = require("./is-number.js")
const vectorize = require("./vectorize.js")

function arctan(x) {
  try {
    if (!isNumber(x)) return NaN
    return Math.atan(x)
  } catch (e) {
    return NaN
  }
}

module.exports = vectorize(arctan)

},{"./is-number.js":46,"./vectorize.js":89}],9:[function(require,module,exports){
const indexOf = require("./index-of.js")
const max = require("./max.js")

function argmax(x) {
  try {
    return indexOf(x, max(x))
  } catch (e) {
    return NaN
  }
}

module.exports = argmax

},{"./index-of.js":37,"./max.js":52}],10:[function(require,module,exports){
const indexOf = require("./index-of.js")
const min = require("./min.js")

function argmin(x) {
  try {
    return indexOf(x, min(x))
  } catch (e) {
    return NaN
  }
}

module.exports = argmin

},{"./index-of.js":37,"./min.js":55}],11:[function(require,module,exports){
module.exports = function (isTrue, message) {
  if (!isTrue) throw new Error(message)
}

},{}],12:[function(require,module,exports){
const isNumber = require("./is-number.js")
const vectorize = require("./vectorize.js")

function ceil(x) {
  try {
    if (!isNumber(x)) return NaN
    return Math.ceil(x)
  } catch (e) {
    return NaN
  }
}

module.exports = vectorize(ceil)

},{"./is-number.js":46,"./vectorize.js":89}],13:[function(require,module,exports){
const isUndefined = require("./is-undefined.js")
const abs = require("./abs.js")
const vectorize = require("./vectorize.js")
const isNumber = require("./is-number.js")

function chop(x, threshold) {
  try {
    if (!isNumber(x)) return NaN

    if (isUndefined(threshold)) {
      threshold = 1e-10
    } else if (!isNumber(threshold)) {
      return NaN
    }

    return abs(x) < threshold ? 0 : x
  } catch (e) {
    return NaN
  }
}

module.exports = vectorize(chop)

},{"./abs.js":2,"./is-number.js":46,"./is-undefined.js":48,"./vectorize.js":89}],14:[function(require,module,exports){
const isNumber = require("./is-number.js")
const vectorize = require("./vectorize.js")

function clamp(x, a, b) {
  try {
    if (!isNumber(x)) return NaN
    if (!isNumber(a)) return NaN
    if (!isNumber(b)) return NaN

    if (x < a) return a
    if (x > b) return b
    return x
  } catch (e) {
    return NaN
  }
}

module.exports = vectorize(clamp)

},{"./is-number.js":46,"./vectorize.js":89}],15:[function(require,module,exports){
const mean = require("./mean.js")
const variance = require("./variance.js")

function cohensd(arr1, arr2) {
  try {
    const m1 = mean(arr1)
    const m2 = mean(arr2)
    const s = Math.sqrt((variance(arr1) + variance(arr2)) / 2)
    return (m1 - m2) / s
  } catch (e) {
    return NaN
  }
}

module.exports = cohensd

},{"./mean.js":53,"./variance.js":88}],16:[function(require,module,exports){
const isArray = require("./is-array.js")
const isNumber = require("./is-number.js")
const assert = require("./assert.js")

function combine(arr, r) {
  assert(isArray(arr), "The `combine` function only works on arrays!")
  assert(isNumber(r), "`r` must be a whole number!")

  if (r > arr.length) {
    return [arr]
  }

  if (r <= 0) {
    return [[]]
  }

  assert(r === parseInt(r), "`r` must be a whole number!")

  if (arr.length < 2) return arr
  const out = []

  arr.forEach((item, i) => {
    assert(
      !isArray(item),
      "It is not recommended to get combinations of arrays of arrays. Weird things happen, and I haven't figured out how to account for such a scenario yet. A possible workaround is: convert each sub-array to a string (using `JSON.stringify`), get the combinations using the array of strings, and then convert each string in each combination back to a sub-array (using `JSON.parse`)."
    )

    const after = arr.slice(i + 1)
    if (after.length < r - 1) return
    const children = combine(after, r - 1)

    children.forEach(child => {
      out.push([item].concat(child))
    })
  })

  return out
}

module.exports = combine

},{"./assert.js":11,"./is-array.js":42,"./is-number.js":46}],17:[function(require,module,exports){
const assert = require("./assert.js")
const isUndefined = require("./is-undefined.js")
const isArray = require("./is-array.js")

function copy(x) {
  if (typeof x === "object") {
    if (isUndefined(x)) {
      return x
    } else if (isArray(x)) {
      return x.map(copy)
    } else {
      const out = {}

      Object.keys(x).forEach(function (key) {
        out[key] = copy(x[key])
      })

      return out
    }
  } else {
    return x
  }
}

module.exports = copy

},{"./assert.js":11,"./is-array.js":42,"./is-undefined.js":48}],18:[function(require,module,exports){
const covariance = require("./covariance.js")
const std = require("./std.js")

function correl(x, y) {
  try {
    return covariance(x, y) / (std(x) * std(y))
  } catch (e) {
    return NaN
  }
}

module.exports = correl

},{"./covariance.js":21,"./std.js":80}],19:[function(require,module,exports){
const isNumber = require("./is-number.js")
const vectorize = require("./vectorize.js")

function cos(x) {
  try {
    if (!isNumber(x)) return NaN
    return Math.cos(x)
  } catch (e) {
    return NaN
  }
}

module.exports = vectorize(cos)

},{"./is-number.js":46,"./vectorize.js":89}],20:[function(require,module,exports){
const assert = require("./assert.js")
const isUndefined = require("./is-undefined.js")
const isArray = require("./is-array.js")
const flatten = require("./flatten.js")
const isEqual = require("./is-equal.js")
const set = require("./set.js")

function count(arr, items) {
  assert(
    !isUndefined(arr),
    "You must pass an array and some items to count into the `count` function!"
  )

  assert(
    isArray(arr),
    "You must pass an array and some items to count into the `count` function!"
  )

  // NOTE: This currently flattens the array that's passed in, which means that it's not possible to count occurrences of arrays within arrays! I'm not sure whether this is desirable behavior or not, so I'm just making a note of it for now. It's not trivial to count occurrences of identical objects, so maybe this function should refuse to operate on objects!
  const temp = flatten(arr)
  items = isUndefined(items) ? set(arr) : items

  if (isArray(items)) {
    return flatten(items).map(function (item1) {
      const c = temp.filter(item2 => isEqual(item1, item2)).length
      return { item: item1, count: c }
    })
  } else {
    return temp.filter(other => other === items).length
  }
}

module.exports = count

},{"./assert.js":11,"./flatten.js":32,"./is-array.js":42,"./is-equal.js":44,"./is-undefined.js":48,"./set.js":72}],21:[function(require,module,exports){
const mean = require("./mean.js")
const isUndefined = require("./is-undefined.js")

function covariance(x, y) {
  try {
    const mx = mean(x)
    const my = mean(y)
    const n = Math.max(x.length, y.length)
    let out = 0

    for (let i = 0; i < n; i++) {
      if (isUndefined(x[i])) return NaN
      if (isUndefined(y[i])) return NaN
      out += (x[i] - mx) * (y[i] - my)
    }

    return out / x.length
  } catch (e) {
    return NaN
  }
}

module.exports = covariance

},{"./is-undefined.js":48,"./mean.js":53}],22:[function(require,module,exports){
(function (process){(function (){
const assert = require("./assert.js")
const isArray = require("./is-array.js")
const isUndefined = require("./is-undefined.js")
const shape = require("./shape.js")
const transpose = require("./transpose.js")
const range = require("./range.js")
const isNumber = require("./is-number.js")
const isString = require("./is-string.js")
const apply = require("./apply.js")
const isFunction = require("./is-function.js")
const ndarray = require("./ndarray.js")
const copy = require("./copy.js")
const Series = require("./series.js")
const flatten = require("./flatten.js")
const isEqual = require("./is-equal.js")
const max = require("./max.js")
const min = require("./min.js")
const set = require("./set.js")
const isBoolean = require("./is-boolean.js")
const { random } = require("./random.js")
const sort = require("./sort.js")
const dropNaN = require("./drop-nan.js")

function makeKey(n) {
  const alpha = "abcdefghijklmnopqrstuvwxyz1234567890"
  let out = ""
  for (let i = 0; i < n; i++)
    out += alpha[parseInt(Math.random() * alpha.length)]
  return out
}

function isInteger(x) {
  return isNumber(x) && parseInt(x) === x
}

function isWholeNumber(x) {
  return isInteger(x) && x >= 0
}

function isObject(x) {
  return x instanceof Object && !isArray(x)
}

function isDataFrame(x) {
  return x instanceof DataFrame
}

function isSeries(x) {
  return x instanceof Series
}

function quote(s) {
  let pattern = /"(.*?)"/g
  let matches = s.match(pattern)
  let out = s.slice()

  if (matches) {
    matches.forEach(item => {
      out = out.replace(item, `“${item.substring(1, item.length - 1)}”`)
    })
  }

  pattern = /'(.*?)'/g
  matches = s.match(pattern)

  if (matches) {
    matches.forEach(item => {
      out = out.replace(item, `‘${item.substring(1, item.length - 1)}’`)
    })
  }

  return `"${out}"`
}

function leftPad(x, maxLength) {
  assert(isNumber(x), "The `leftPad` function only works on numbers!")
  let out = x.toString()
  while (out.length < maxLength) out = "0" + out
  return out
}

class DataFrame {
  constructor(data) {
    const self = this

    Object.defineProperty(self, "_values", {
      value: [],
      configurable: true,
      enumerable: false,
      writable: true,
    })

    Object.defineProperty(self, "values", {
      configurable: true,
      enumerable: true,

      get() {
        return self._values
      },

      set(x) {
        assert(isArray(x), "The new values must be a 2-dimensional array!")

        const dataShape = shape(x)

        assert(
          dataShape.length === 2,
          "The new array of values must be 2-dimensional!"
        )

        if (dataShape[0] < self._index.length) {
          self._index = self._index.slice(0, dataShape[0])
        } else if (dataShape[0] > self._index.length) {
          self._index = self._index.concat(
            range(self._index.length, dataShape[0]).map(i => {
              return "row" + leftPad(i, (dataShape[0] - 1).toString().length)
            })
          )
        }

        if (dataShape[1] < self._columns.length) {
          self._columns = self._columns.slice(0, dataShape[1])
        } else if (dataShape[1] > self._columns.length) {
          self._columns = self._columns.concat(
            range(self._columns.length, dataShape[1]).map(i => {
              return "col" + leftPad(i, (dataShape[1] - 1).toString().length)
            })
          )
        }

        self._values = x
      },
    })

    Object.defineProperty(self, "_columns", {
      value: [],
      configurable: true,
      enumerable: false,
      writable: true,
    })

    Object.defineProperty(self, "columns", {
      configurable: true,
      enumerable: true,

      get() {
        return self._columns
      },

      set(x) {
        assert(
          isArray(x),
          "The new columns list must be a 1-dimensional array of strings!"
        )

        assert(
          x.length === self.shape[1],
          "The new columns list must be the same length as the old columns list!"
        )

        assert(
          shape(x).length === 1,
          "The new columns list must be a 1-dimensional array of strings!"
        )

        x = x.map(v => {
          if (typeof v === "string") return v
          return JSON.stringify(v) || v.toString()
        })

        self._columns = x
      },
    })

    Object.defineProperty(self, "_index", {
      value: [],
      configurable: true,
      enumerable: false,
      writable: true,
    })

    Object.defineProperty(self, "index", {
      configurable: true,
      enumerable: true,

      get() {
        return self._index
      },

      set(x) {
        assert(
          isArray(x),
          "The new index must be a 1-dimensional array of strings!"
        )

        assert(
          x.length === self.shape[0],
          "The new index must be the same length as the old index!"
        )

        assert(
          shape(x).length === 1,
          "The new index must be a 1-dimensional array of strings!"
        )

        x = x.map(v => {
          if (typeof v === "string") return v
          return JSON.stringify(v) || v.toString()
        })

        self._index = x
      },
    })

    assert(
      isUndefined(data) || data instanceof Object,
      "The `data` passed into the constructor of a DataFrame must be either (1) an object where the key-value pairs are (respectively) column names and 1-dimensional arrays of values, or (2) a 2-dimensional array of values."
    )

    if (data) {
      if (isArray(data)) {
        const dataShape = shape(data)

        assert(
          dataShape.length === 2,
          "The `data` array passed into the constructor of a DataFrame must be 2-dimensional!"
        )

        self.values = data
      } else {
        self._columns = Object.keys(data)
        const temp = []

        self._columns.forEach(col => {
          const values = data[col]
          temp.push(values)
        })

        self._values = transpose(temp)

        const dataShape = shape(self.values)

        self._index = range(0, dataShape[0]).map(i => {
          return "row" + leftPad(i, (dataShape[0] - 1).toString().length)
        })
      }
    }
  }

  static async fromCSV(path, options) {
    options = options || {}
    let raw

    // browser
    try {
      const response = await fetch(path)
      raw = await response.text()
    } catch (e) {}

    // node
    try {
      const fs = require("fs")
      const encoding = options.encoding || "utf8"
      raw = fs.readFileSync(path, encoding)
    } catch (e) {}

    const lines = raw.split("\n").filter(line => line.length > 0)

    let out = lines.map(line => {
      const dict = {}
      const quotePattern = /"(.*?)"/g
      const matches = line.match(quotePattern) || []

      matches.forEach(match => {
        const key = makeKey(32)
        line = line.replaceAll(match, key)
        dict[key] = match
      })

      const values = line.split(",")

      return values.map((value, i) => {
        value = dict[value] || value

        try {
          let parsedValue = JSON.parse(value)
          if (isArray(parsedValue)) return value
          return parsedValue
        } catch (e) {
          return value
        }
      })
    })

    const valuesPerRow = max(out.map(line => line.length))

    out = out.map(line => {
      line.length = valuesPerRow
      return line
    })

    let columns, index
    const hasHeaderRow = isBoolean(options.hasHeaderRow)
      ? options.hasHeaderRow
      : true
    const hasIndexColumn = isBoolean(options.hasIndexColumn)
      ? options.hasIndexColumn
      : false

    if (hasHeaderRow) {
      columns = out.shift()
    }

    if (hasIndexColumn) {
      index = out.map(row => row.shift())
      if (columns) columns.shift()
    }

    out = new DataFrame(out)
    if (columns) out.columns = columns
    if (index) out.index = index
    return out
  }

  get shape() {
    const self = this
    return shape(self.values)
  }

  get rows() {
    const self = this
    return self.index
  }

  set rows(rows) {
    const self = this
    self.index = rows
  }

  isEmpty() {
    const self = this
    return set(self.values).filter(v => !isUndefined(v)).length === 0
  }

  clear() {
    const self = this
    const out = new DataFrame(ndarray(self.shape))
    out.columns = self.columns.slice()
    out.index = self.index.slice()
    return out
  }

  get(rows, cols) {
    const self = this

    if (isString(rows) || isNumber(rows)) rows = [rows]
    if (isString(cols) || isNumber(cols)) cols = [cols]

    const types = set((rows || []).concat(cols || []).map(v => typeof v))

    assert(
      types.length <= 2,
      "Only whole numbers and/or strings are allowed in `get` arrays!"
    )

    if (types.length === 1) {
      assert(
        types[0] === "string" || types[0] === "number",
        "Only whole numbers and/or strings are allowed in `get` arrays!"
      )
    }

    if (types.length === 2) {
      assert(
        types.indexOf("string") > -1,
        "Only whole numbers and/or strings are allowed in `get` arrays!"
      )

      assert(
        types.indexOf("number") > -1,
        "Only whole numbers and/or strings are allowed in `get` arrays!"
      )
    }

    if (!isUndefined(rows)) {
      rows = rows.map(r => {
        if (typeof r === "string") {
          assert(self.index.indexOf(r) > -1, `Row "${r}" does not exist!`)
          return r
        }

        if (typeof r === "number") {
          assert(r >= 0, `Index ${r} is out of bounds!`)
          assert(parseInt(r) === r, `Row numbers must be integers!`)
          assert(r < self.index.length, `Index ${r} is out of bounds!`)
          return self.index[r]
        }
      })
    }

    if (!isUndefined(cols)) {
      cols = cols.map(c => {
        if (typeof c === "string") {
          assert(self.columns.indexOf(c) > -1, `Column "${c}" does not exist!`)
          return c
        }

        if (typeof c === "number") {
          assert(c >= 0, `Column ${c} is out of bounds!`)
          assert(parseInt(c) === c, `Column numbers must be integers!`)
          assert(c < self.columns.length, `Column ${c} is out of bounds!`)
          return self.columns[c]
        }
      })
    }

    return self.getSubsetByNames(rows, cols)
  }

  getSubsetByNames(rows, cols) {
    const self = this

    if (isUndefined(rows)) rows = self.index
    if (isUndefined(cols)) cols = self.columns
    if (typeof rows === "string") rows = [rows]
    if (typeof cols === "string") cols = [cols]

    assert(
      isArray(rows) && isArray(cols),
      "The `rows` and `cols` parameters must be 1-dimensional arrays of strings."
    )

    assert(
      shape(rows).length === 1 && shape(cols).length === 1,
      "The `rows` and `cols` parameters must be 1-dimensional arrays of strings."
    )

    assert(
      rows.length > 0,
      "The `rows` array must contain at least one row name."
    )

    assert(
      cols.length > 0,
      "The `cols` array must contain at least one column name."
    )

    rows.forEach(row => {
      assert(
        isString(row),
        "The `rows` and `cols` parameters must be 1-dimensional arrays of strings."
      )

      assert(
        self.index.indexOf(row) > -1,
        `The row name "${row}" does not exist in the list of rows.`
      )
    })

    cols.forEach(col => {
      assert(
        isString(col),
        "The `rows` and `cols` parameters must be 1-dimensional arrays of strings."
      )

      assert(
        self.columns.indexOf(col) > -1,
        `The column name "${col}" does not exist in the list of columns.`
      )
    })

    const values = rows.map(row => {
      return cols.map(col => {
        return self.values[self.index.indexOf(row)][self.columns.indexOf(col)]
      })
    })

    if (rows.length === 1 && cols.length === 1) {
      return flatten(values)[0]
    }

    if (rows.length === 1) {
      const out = new Series(flatten(values))
      out.name = rows[0]
      out.index = cols
      return out
    }

    if (cols.length === 1) {
      const out = new Series(flatten(values))
      out.name = cols[0]
      out.index = rows
      return out
    }

    const out = new DataFrame(values)
    out.columns = cols
    out.index = rows
    return out
  }

  getSubsetByIndices(rowIndices, colIndices) {
    const self = this
    const dataShape = self.shape

    if (isUndefined(rowIndices)) rowIndices = range(0, dataShape[0])
    if (isUndefined(colIndices)) colIndices = range(0, dataShape[1])
    if (typeof rowIndices === "number") rowIndices = [rowIndices]
    if (typeof colIndices === "number") colIndices = [colIndices]

    assert(
      isArray(rowIndices) && isArray(colIndices),
      "The `rowIndices` and `colIndices` parameters must be 1-dimensional arrays of whole numbers."
    )

    assert(
      shape(rowIndices).length === 1 && shape(colIndices).length === 1,
      "The `rowIndices` and `colIndices` parameters must be 1-dimensional arrays of whole numbers."
    )

    assert(
      rowIndices.length > 0,
      "The `rowIndices` array must contain at least one index."
    )

    assert(
      colIndices.length > 0,
      "The `colIndices` array must contain at least one index."
    )

    rowIndices.forEach(rowIndex => {
      assert(
        isWholeNumber(rowIndex),
        "The `rowIndices` and `colIndices` parameters must be 1-dimensional arrays of whole numbers."
      )

      assert(
        rowIndex < self.index.length,
        `The row index ${rowIndex} is out of bounds.`
      )
    })

    colIndices.forEach(colIndex => {
      assert(
        isWholeNumber(colIndex),
        "The `rowIndices` and `colIndices` parameters must be 1-dimensional arrays of whole numbers."
      )

      assert(
        colIndex < self.columns.length,
        `The column index ${colIndex} is out of bounds.`
      )
    })

    const rows = rowIndices.map(i => self.index[i])
    const cols = colIndices.map(i => self.columns[i])
    return self.getSubsetByNames(rows, cols)
  }

  loc(rows, cols) {
    const self = this
    return self.getSubsetByNames(rows, cols)
  }

  iloc(rowIndices, colIndices) {
    const self = this
    return self.getSubsetByIndices(rowIndices, colIndices)
  }

  transpose() {
    const self = this
    const out = new DataFrame(transpose(self.values))
    out.columns = self.index
    out.index = self.columns
    return out
  }

  get T() {
    const self = this
    return self.transpose()
  }

  resetIndex() {
    const self = this
    const out = self.copy()

    out.index = range(0, self.shape[0]).map(i => {
      return "row" + leftPad(i, (out.index.length - 1).toString().length)
    })

    return out
  }

  copy() {
    const self = this
    if (self.isEmpty()) return new DataFrame()
    const out = new DataFrame(copy(self.values))
    out.columns = self.columns.slice()
    out.index = self.index.slice()
    return out
  }

  assign(p1, p2) {
    let name, obj

    if (isUndefined(p2)) {
      obj = p1

      assert(
        !isArray(obj),
        "When using only one parameter for the `assign` method, the parameter must be an object or a Series."
      )
    } else {
      name = p1
      obj = p2

      assert(
        isString(name),
        "When using two parameters for the `assign` method, the first parameter must be a string."
      )

      assert(
        isSeries(obj) || (isArray(obj) && shape(obj).length === 1),
        "When using two parameters for the `assign` method, the second parameter must be a Series or a 1-dimensional array."
      )
    }

    assert(
      isObject(obj) ||
        isSeries(obj) ||
        (isArray(obj) && shape(obj).length === 1),
      "An object, Series, or 1-dimensional array must be passed into the `assign` method."
    )

    const self = this

    if (isSeries(obj)) {
      const temp = {}

      assert(
        self.isEmpty() || isEqual(obj.index, self.index),
        "The index of the new data does not match the index of the DataFrame."
      )

      temp[name || obj.name] = obj.values
      return self.assign(temp)
    } else if (isArray(obj)) {
      const temp = {}
      temp[name || "data"] = obj
      return self.assign(temp)
    } else {
      let out = self.copy()
      let outShape = out.shape

      Object.keys(obj).forEach(col => {
        const values = obj[col]

        assert(
          isArray(values),
          "Each key-value pair must be (respectively) a string and a 1-dimensional array of values."
        )

        assert(
          shape(values).length === 1,
          "Each key-value pair must be (respectively) a string and a 1-dimensional array of values."
        )

        if (out.isEmpty()) {
          out.values = transpose([values])
          out.columns = [col]
          outShape = out.shape
        } else {
          assert(
            values.length === outShape[0],
            `Column "${col}" in the new data is not the same length as the other columns in the original DataFrame.`
          )

          let colIndex = out.columns.indexOf(col)

          if (colIndex < 0) {
            out.columns.push(col)
            colIndex = out.columns.indexOf(col)
          }

          out.values.forEach((row, i) => {
            row[colIndex] = values[i]
          })
        }
      })

      return out
    }
  }

  apply(fn, axis) {
    axis = axis || 0

    assert(
      isFunction(fn),
      "The first parameter to the `apply` method must be a function."
    )

    assert(
      axis === 0 || axis === 1,
      "The second parameter to the `apply` method (the `axis`) must be 0 or 1."
    )

    const self = this

    if (axis === 0) {
      const temp = transpose(self.values)

      const newValues = temp.map((col, i) => {
        return fn(col, self.columns[i])
      })

      if (shape(newValues).length === 1) {
        const out = new Series(newValues)
        out.index = copy(self.columns)
        return out
      } else {
        const out = new DataFrame(transpose(newValues))
        out.index = copy(self.index)
        out.columns = copy(self.columns)
        return out
      }
    } else if (axis === 1) {
      const newValues = self.values.map((row, i) => {
        return fn(row, self.index[i])
      })

      if (shape(newValues).length === 1) {
        const out = new Series(newValues)
        out.index = copy(self.index)
        return out
      } else {
        const out = new DataFrame(newValues)
        out.index = copy(self.index)
        out.columns = copy(self.columns)
        return out
      }
    }
  }

  map(fn, axis) {
    const self = this
    return self.apply(fn, axis)
  }

  dropMissing(axis, condition, threshold) {
    axis = axis || 0

    assert(
      axis === 0 || axis === 1,
      "The first parameter of the `dropMissing` method (the `axis`) must be 0 or 1."
    )

    threshold = threshold || 0

    assert(
      isWholeNumber(threshold),
      "The third parameter of the `dropMissing` method (the `threshold`) should be a whole number (meaning that data should be dropped if it contains more than `threshold` null values)."
    )

    condition = threshold > 0 ? "none" : condition || "any"

    assert(
      condition === "any" || condition === "all" || condition === "none",
      "The second parameter of the `dropMissing` method (the `condition` parameter, which indicates the condition under which data should be dropped) should be 'any' or 'all' (meaning that if 'any' of the data contains null values, then it should be dropped; or that if 'all' of the data contains null values, then it should be dropped)."
    )

    function helper(values) {
      if (threshold > 0) {
        let count = 0

        for (let i = 0; i < values.length; i++) {
          const value = values[i]
          if (isUndefined(value)) count++
          if (count >= threshold) return []
        }
      } else if (condition === "any") {
        for (let i = 0; i < values.length; i++) {
          const value = values[i]
          if (isUndefined(value)) return []
        }
      } else if (condition === "all") {
        for (let i = 0; i < values.length; i++) {
          const value = values[i]
          if (!isUndefined(value)) return values
        }

        return []
      }

      return values
    }

    const self = this
    let out = self.copy()
    const tempID = Math.random().toString()

    if (axis === 0) {
      out = out.assign(tempID, out.index)

      const newValues = out.values.map(helper).filter(row => row.length > 0)

      if (shape(newValues).length < 2) return new DataFrame()

      out.values = newValues

      let newIndex = out.get(null, tempID)
      if (isUndefined(newIndex)) return new DataFrame()
      if (isString(newIndex)) newIndex = [newIndex]
      if (isSeries(newIndex)) newIndex = newIndex.values
      out.index = newIndex
      out = out.drop(null, tempID)
    } else if (axis === 1) {
      out = out.transpose()
      out = out.assign(tempID, out.index)

      const newValues = out.values.map(helper).filter(col => col.length > 0)

      if (shape(newValues).length < 2) return new DataFrame()

      out.values = newValues

      let newIndex = out.get(null, tempID)
      if (isUndefined(newIndex)) return new DataFrame()
      if (isString(newIndex)) newIndex = [newIndex]
      if (isSeries(newIndex)) newIndex = newIndex.values
      out.index = newIndex
      out = out.drop(null, tempID)
      out = out.transpose()
    }

    return out
  }

  dropNaN(axis, condition, threshold) {
    axis = axis || 0

    assert(
      axis === 0 || axis === 1,
      "The first parameter of the `dropNaN` method (the `axis`) must be 0 or 1."
    )

    threshold = threshold || 0

    assert(
      isWholeNumber(threshold),
      "The third parameter of the `dropNaN` method (the `threshold`) should be a whole number (meaning that data should be dropped if it contains more than `threshold` NaN values)."
    )

    condition = threshold > 0 ? "none" : condition || "any"

    assert(
      condition === "any" || condition === "all" || condition === "none",
      "The second parameter of the `dropNaN` method (the `condition` parameter, which indicates the condition under which data should be dropped) should be 'any' or 'all' (meaning that if 'any' of the data contains NaN values, then it should be dropped; or that if 'all' of the data contains NaN values, then it should be dropped)."
    )

    function helper(values) {
      const numericalValues = dropNaN(values)
      if (threshold > 0)
        return values.length - numericalValues.length < threshold
      if (condition === "any") return numericalValues.length === values.length
      if (condition === "all") return numericalValues.length > 0
      return true
    }

    const self = this
    let out = self.copy()
    const tempID = Math.random().toString()

    if (axis === 0) {
      const rowsToKeep = out.index.filter(row => {
        const values = out.get(row, null).values
        return helper(values)
      })

      if (rowsToKeep.length > 0) return out.get(rowsToKeep, null)
      else return new DataFrame()
    } else if (axis === 1) {
      const colsToKeep = out.columns.filter(col => {
        const values = out.get(null, col).values
        return helper(values)
      })

      if (colsToKeep.length > 0) return out.get(null, colsToKeep)
      else return new DataFrame()
    }

    return out
  }

  drop(rows, cols) {
    const self = this

    if (isUndefined(rows)) rows = []
    if (isUndefined(cols)) cols = []
    if (isString(rows) || isNumber(rows)) rows = [rows]
    if (isString(cols) || isNumber(cols)) cols = [cols]

    assert(
      isArray(rows),
      "The `drop` method only works on 1-dimensional arrays of numerical indices and/or strings."
    )

    assert(
      isArray(cols),
      "The `drop` method only works on 1-dimensional arrays of numerical indices and/or strings."
    )

    assert(
      shape(rows).length === 1,
      "The `drop` method only works on 1-dimensional arrays of numerical indices and/or strings."
    )

    assert(
      shape(cols).length === 1,
      "The `drop` method only works on 1-dimensional arrays of numerical indices and/or strings."
    )

    let outIndex, outColumns

    self.index.forEach((row, i) => {
      if (rows.indexOf(row) < 0 && rows.indexOf(i) < 0) {
        if (!outIndex) outIndex = []
        outIndex.push(row)
      }
    })

    self.columns.forEach((col, i) => {
      if (cols.indexOf(col) < 0 && cols.indexOf(i) < 0) {
        if (!outColumns) outColumns = []
        outColumns.push(col)
      }
    })

    let out = self.get(outIndex, outColumns)

    if (isSeries(out)) {
      let temp = new DataFrame()
      temp = temp.assign(out)
      if (self.index.indexOf(out.name) > -1) temp = temp.transpose()
      out = temp
    }

    return out
  }

  dropColumns(columns) {
    const self = this
    return self.drop(null, columns)
  }

  dropRows(rows) {
    const self = this
    return self.drop(rows, null)
  }

  toObject() {
    const self = this
    const out = {}

    self.values.forEach((row, i) => {
      const temp = {}

      row.forEach((value, j) => {
        temp[self.columns[j]] = value
      })

      out[self.index[i]] = temp
    })

    return out
  }

  toCSVString(options) {
    const self = this
    options = isUndefined(options) ? {} : options

    const hasHeaderRow = isBoolean(options.hasHeaderRow)
      ? options.hasHeaderRow
      : true
    const hasIndexColumn = isBoolean(options.hasIndexColumn)
      ? options.hasIndexColumn
      : false

    let index, columns, out

    if (hasHeaderRow && hasIndexColumn) {
      index = ["(index)"].concat(copy(self.index))
      columns = copy(self.columns)

      out = [columns].concat(self.values).map((row, i) => {
        return [index[i]].concat(row)
      })
    } else if (!hasHeaderRow && hasIndexColumn) {
      index = copy(self.index)

      out = self.values.map((row, i) => {
        return [index[i]].concat(row)
      })
    } else if (hasHeaderRow && !hasIndexColumn) {
      columns = copy(self.columns)
      out = [columns].concat(self.values)
    } else if (!hasHeaderRow && !hasIndexColumn) {
      out = self.values
    }

    out = out
      .map((row, i) => {
        return row
          .map(value => {
            if (isString(value)) {
              return quote(value)
            } else {
              return value
            }
          })
          .join(",")
      })
      .join("\n")

    return out
  }

  toCSV(filename, options) {
    const self = this
    const out = self.toCSVString(options)

    // browser
    try {
      let newFilename = filename

      if (filename.includes("/")) {
        const parts = filename.split("/")
        newFilename = parts[parts.length - 1]
      }

      const a = document.createElement("a")
      a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(out)}`
      a.download = newFilename
      a.dispatchEvent(new MouseEvent("click"))
    } catch (e) {}

    // node
    try {
      const fs = require("fs")
      const path = require("path")
      fs.writeFileSync(path.resolve(filename), out, "utf8")
    } catch (e) {}

    return self
  }

  print() {
    const self = this

    if (isEqual(self.shape, [0])) {
      console.table({})
      return self
    }

    const maxRows = typeof window === "undefined" ? 20 : 10
    const halfMaxRows = parseInt(maxRows / 2)
    const maxColumns =
      typeof window === "undefined"
        ? Math.floor(process.stdout.columns / 24) - 1
        : 10
    const halfMaxColumns = parseInt(maxColumns / 2)

    const tempRows =
      maxRows > self.index.length
        ? null
        : range(0, halfMaxRows).concat(
            range(self.index.length - halfMaxRows, self.index.length)
          )

    const tempColumns =
      maxColumns > self.columns.length
        ? null
        : range(0, halfMaxColumns).concat(
            range(self.columns.length - halfMaxColumns, self.columns.length)
          )

    let temp = self.get(tempRows, tempColumns)

    if (temp instanceof Series) {
      if (self.shape[0] === 1) {
        // data is row-shaped
        temp = new DataFrame([temp.values])
        temp.index = self.index
        temp.columns = new Series(self.columns).get(tempColumns).values
      } else if (self.shape[1] === 1) {
        // data is column-shaped
        temp = new DataFrame([temp.values]).transpose()
        temp.index = new Series(self.index).get(tempRows).values
        temp.columns = self.columns
      }
    }

    if (maxRows <= self.index.length) {
      temp._index.splice(halfMaxRows, 0, "...")
      temp._values.splice(
        halfMaxRows,
        0,
        range(0, temp.columns.length).map(i => "...")
      )
    }

    if (maxColumns <= self.columns.length) {
      temp._columns.splice(halfMaxColumns, 0, "...")

      temp._values = temp._values.map(row => {
        row.splice(halfMaxColumns, 0, "...")
        return row
      })
    }

    console.table(temp.toObject())
    return self
  }

  sort(cols, directions) {
    const self = this

    // temporarily assign index as column in dataframe
    let out = self.copy()
    const indexID = random().toString()
    out = out.assign(indexID, out.index)

    if (isUndefined(cols)) {
      cols = [indexID]
      directions = [true]
    }

    if (isNumber(cols) || isString(cols)) {
      cols = [cols]

      if (isBoolean(directions) || isString(directions))
        directions = [directions]
    }

    assert(
      isArray(cols),
      "The first parameter of the `sort` method must be (1) a string or index representing a column name or index, respectively; (2) a 1-dimensional array of strings and/or indices; or (3) null."
    )

    assert(
      shape(cols).length === 1,
      "The first parameter of the `sort` method must be (1) a string or index representing a column name or index, respectively; (2) a 1-dimensional array of strings and/or indices; or (3) null."
    )

    if (isUndefined(directions))
      directions = range(0, cols.length).map(i => true)

    assert(
      isArray(directions),
      "The second parameter of the `sort` method must be (1) a string or boolean representing the sort direction ('ascending' / 'descending', or true / false); (2) a 1-dimensional array of strings and/or booleans; or (3) null."
    )

    assert(
      shape(directions).length === 1,
      "The second parameter of the `sort` method must be (1) a string or boolean representing the sort direction ('ascending' / 'descending', or true / false); (2) a 1-dimensional array of strings and/or booleans; or (3) null."
    )

    assert(
      cols.length === directions.length,
      "The arrays passed into the `sort` method must be equal in length."
    )

    // convert all columns to indices
    cols = cols.map(col => {
      assert(
        isString(col) || isNumber(col),
        "Column references can either be column names (as strings) or column indices (as whole numbers)."
      )

      if (isString(col)) {
        const index = out.columns.indexOf(col)
        assert(index > -1, `The column "${col}" does not exist!`)
        return index
      }

      if (isNumber(col)) {
        assert(parseInt(col) === col, "Column indices must be whole numbers!")
        assert(col >= 0, `The column index ${col} is out of bounds!`)
        assert(col < out.columns.length, `The index ${col} is out of bounds!`)
        return col
      }
    })

    // convert all directions to booleans
    directions = directions.map(dir => {
      assert(
        isString(dir) || isBoolean(dir),
        "Direction references can either be strings ('ascending' or 'descending') or booleans (true or false)."
      )

      if (isString(dir)) {
        const value = dir.trim().toLowerCase()

        assert(
          value === "ascending" || value === "descending",
          "Direction references can either be strings ('ascending' or 'descending') or booleans (true or false)."
        )

        return value === "ascending"
      }

      if (isBoolean(dir)) {
        return dir
      }
    })

    // sort
    out.values = sort(out.values, (a, b) => {
      let counter = 0

      while (a[cols[counter]] === b[cols[counter]] && counter < cols.length) {
        counter++
      }

      const isAscending = directions[counter]
      if (a[cols[counter]] === b[cols[counter]]) return 0
      if (a[cols[counter]] < b[cols[counter]]) return isAscending ? -1 : 1
      if (a[cols[counter]] > b[cols[counter]]) return isAscending ? 1 : -1
    })

    out.index = flatten(out.get(null, indexID).values)
    out = out.dropColumns(indexID)
    return out
  }

  sortByIndex() {
    const self = this
    return self.sort()
  }

  filter(fn, axis) {
    assert(
      isFunction(fn),
      "The `filter` method takes a single parameter: a function that is used to filter the values."
    )

    if (isUndefined(axis)) axis = 0

    assert(
      axis === 0 || axis === 1,
      "The `axis` parameter to the `filter` method must be 0 or 1."
    )

    const self = this
    let out = self.copy()
    if (out.isEmpty()) return out

    const index = copy(out.index)
    const columns = copy(out.columns)

    if (axis === 0) {
      const indexID = Math.random().toString()
      out = out.assign(indexID, out.index)

      let newValues = out.values.filter((row, i) => {
        const shouldKeep = fn(row, i, out)
        if (!shouldKeep) index.splice(i, 1)
        return shouldKeep
      })

      if (flatten(newValues).length === 0) return new DataFrame()
      if (shape(newValues).length === 1) newValues = [newValues]

      out.values = newValues
      out.index = out.get(null, indexID).values
      out = out.drop(null, indexID)
    } else if (axis === 1) {
      out = out.transpose()

      const columnsID = Math.random().toString()
      out = out.assign(columnsID, out.index)

      let newValues = out.values.filter((row, i) => {
        const shouldKeep = fn(row, i, out)
        if (!shouldKeep) columns.splice(i, 1)
        return shouldKeep
      })

      if (flatten(newValues).length === 0) return new DataFrame()
      if (shape(newValues).length === 1) newValues = [newValues]

      out.values = newValues
      out.index = out.get(null, columnsID).values
      out = out.drop(null, columnsID)
      out = out.transpose()
    }

    return out
  }

  shuffle(axis) {
    if (isUndefined(axis)) axis = 0

    assert(
      axis === 0 || axis === 1,
      "The `axis` parameter to the `shuffle` must be 0, 1, or undefined."
    )

    const self = this

    return self.get(
      axis === 0 ? shuffle(self.index) : null,
      axis === 1 ? shuffle(self.columns) : null
    )
  }
}

module.exports = DataFrame

}).call(this)}).call(this,require('_process'))
},{"./apply.js":5,"./assert.js":11,"./copy.js":17,"./drop-nan.js":30,"./flatten.js":32,"./is-array.js":42,"./is-boolean.js":43,"./is-equal.js":44,"./is-function.js":45,"./is-number.js":46,"./is-string.js":47,"./is-undefined.js":48,"./max.js":52,"./min.js":55,"./ndarray.js":58,"./random.js":64,"./range.js":65,"./series.js":70,"./set.js":72,"./shape.js":73,"./sort.js":78,"./transpose.js":86,"_process":95,"fs":93,"path":94}],23:[function(require,module,exports){
const assert = require("./assert.js")
const isArray = require("./is-array.js")
const flatten = require("./flatten.js")

function diff(a, b) {
  assert(isArray(a), "You must pass two arrays into the `diff` function!")
  assert(isArray(b), "You must pass two arrays into the `diff` function!")

  const aTemp = flatten(a)
  const bTemp = flatten(b)
  const out = []

  aTemp.forEach(item => {
    if (bTemp.indexOf(item) < 0) out.push(item)
  })

  return out
}

module.exports = diff

},{"./assert.js":11,"./flatten.js":32,"./is-array.js":42}],24:[function(require,module,exports){
const pow = require("./pow.js")
const sum = require("./sum.js")
const sqrt = require("./sqrt.js")
const subtract = require("./subtract.js")

function distance(a, b) {
  try {
    return sqrt(sum(pow(subtract(a, b), 2)))
  } catch (e) {
    return NaN
  }
}

module.exports = distance

},{"./pow.js":62,"./sqrt.js":79,"./subtract.js":82,"./sum.js":83}],25:[function(require,module,exports){
const scale = require("./scale.js")
const pow = require("./pow.js")

function divide(a, b) {
  return scale(a, pow(b, -1))
}

module.exports = divide

},{"./pow.js":62,"./scale.js":69}],26:[function(require,module,exports){
const assert = require("./assert.js")
const isUndefined = require("./is-undefined.js")
const isArray = require("./is-array.js")
const isNumber = require("./is-number.js")
const isEqual = require("./is-equal.js")
const flatten = require("./flatten.js")
const shape = require("./shape.js")
const sum = require("./sum.js")
const scale = require("./scale.js")
const transpose = require("./transpose.js")

function dot(a, b) {
  assert(
    !isUndefined(a) && !isUndefined(b),
    "You must pass two arrays of numbers into the `dot` function!"
  )

  assert(
    isArray(a) && isArray(b),
    "You must pass two arrays of numbers into the `dot` function!"
  )

  flatten(a)
    .concat(flatten(b))
    .forEach(v => {
      assert(
        isNumber(v),
        "One of the arrays you passed into the `dot` function contains non-numerical values!"
      )
    })

  const aShape = shape(a)
  const bShape = shape(b)

  assert(
    aShape.length <= 2 && bShape.length <= 2,
    "I'm not smart enough to know how to get the dot-product of arrays that have more than 2 dimensions. Sorry for the inconvenience! Please only pass 1- or 2-dimensional arrays into the `dot` function!"
  )

  assert(
    aShape[aShape.length - 1] === bShape[0],
    `There's a dimension misalignment in the two arrays you passed into the \`dot\` function. (${
      aShape[aShape.length - 1]
    } !== ${bShape[0]})`
  )

  if (aShape.length === 1 && bShape.length === 1) {
    return sum(scale(a, b))
  } else if (aShape.length === 1 && bShape.length === 2) {
    return transpose(b).map(col => dot(a, col))
  } else if (aShape.length === 2 && bShape.length === 1) {
    return a.map(row => dot(row, b))
  } else if (aShape.length === 2 && bShape.length === 2) {
    const bTranspose = transpose(b)
    const out = []

    for (let i = 0; i < a.length; i++) {
      const row = []

      for (let j = 0; j < bTranspose.length; j++) {
        row.push(dot(a[i], bTranspose[j]))
      }

      out.push(row)
    }

    return out
  }
}

module.exports = dot

},{"./assert.js":11,"./flatten.js":32,"./is-array.js":42,"./is-equal.js":44,"./is-number.js":46,"./is-undefined.js":48,"./scale.js":69,"./shape.js":73,"./sum.js":83,"./transpose.js":86}],27:[function(require,module,exports){
const assert = require("./assert.js")
const isUndefined = require("./is-undefined.js")
const isArray = require("./is-array.js")
const max = require("./max.js")
const shape = require("./shape.js")

function dropMissingPairwise(a, b) {
  assert(
    isArray(a) && isArray(b),
    "The two items passed into the `dropMissingPairwise` function must be arrays!"
  )

  assert(
    shape(a).length === 1 && shape(b).length === 1,
    "The `dropMissingPairwise` function only works on one-dimensional arrays!"
  )

  const aOut = []
  const bOut = []

  for (let i = 0; i < max([a.length, b.length]); i++) {
    if (!isUndefined(a[i]) && !isUndefined(b[i])) {
      aOut.push(a[i])
      bOut.push(b[i])
    }
  }

  return [aOut, bOut]
}

module.exports = dropMissingPairwise

},{"./assert.js":11,"./is-array.js":42,"./is-undefined.js":48,"./max.js":52,"./shape.js":73}],28:[function(require,module,exports){
const assert = require("./assert.js")
const isArray = require("./is-array.js")
const isUndefined = require("./is-undefined.js")
const shape = require("./shape.js")

function dropMissing(x) {
  assert(
    isArray(x),
    "The value passed into the `dropMissing` function must be a one-dimensional array!"
  )

  assert(
    shape(x).length === 1,
    "The value passed into the `dropMissing` function must be a one-dimensional array!"
  )

  return x.filter(v => !isUndefined(v))
}

module.exports = dropMissing

},{"./assert.js":11,"./is-array.js":42,"./is-undefined.js":48,"./shape.js":73}],29:[function(require,module,exports){
const assert = require("./assert.js")
const isUndefined = require("./is-undefined.js")
const isArray = require("./is-array.js")
const isNumber = require("./is-number.js")
const max = require("./max.js")
const shape = require("./shape.js")

function dropNaNPairwise(a, b) {
  assert(
    isArray(a) && isArray(b),
    "The two items passed into the `dropNaNPairwise` function must be arrays!"
  )

  assert(
    shape(a).length === 1 && shape(b).length === 1,
    "The `dropNaNPairwise` function only works on one-dimensional arrays!"
  )

  const aOut = []
  const bOut = []

  for (let i = 0; i < max([a.length, b.length]); i++) {
    if (
      !isUndefined(a[i]) &&
      isNumber(a[i]) &&
      !isUndefined(b[i]) &&
      isNumber(b[i])
    ) {
      aOut.push(a[i])
      bOut.push(b[i])
    }
  }

  return [aOut, bOut]
}

module.exports = dropNaNPairwise

},{"./assert.js":11,"./is-array.js":42,"./is-number.js":46,"./is-undefined.js":48,"./max.js":52,"./shape.js":73}],30:[function(require,module,exports){
const assert = require("./assert.js")
const isArray = require("./is-array.js")
const isUndefined = require("./is-undefined.js")
const isNumber = require("./is-number.js")
const shape = require("./shape.js")

function dropNaN(x) {
  assert(
    isArray(x),
    "The value passed into the `dropNaN` function must be a one-dimensional array!"
  )

  assert(
    shape(x).length === 1,
    "The value passed into the `dropNaN` function must be a one-dimensional array"
  )

  return x.filter(v => !isUndefined(v) && isNumber(v))
}

module.exports = dropNaN

},{"./assert.js":11,"./is-array.js":42,"./is-number.js":46,"./is-undefined.js":48,"./shape.js":73}],31:[function(require,module,exports){
const vectorize = require("./vectorize.js")

function factorial(n) {
  try {
    if (n !== parseInt(n)) return NaN
    if (n <= 1) return 1
    return n * factorial(n - 1)
  } catch (e) {
    return NaN
  }
}

module.exports = vectorize(factorial)

},{"./vectorize.js":89}],32:[function(require,module,exports){
const assert = require("./assert.js")
const isUndefined = require("./is-undefined.js")
const isArray = require("./is-array.js")

function flatten(arr) {
  assert(
    !isUndefined(arr),
    "You must pass one array into the `flatten` function!"
  )

  assert(isArray(arr), "The `flatten` function only works on arrays!")

  let out = []

  arr.forEach(function (value) {
    if (isArray(value)) {
      out = out.concat(flatten(value))
    } else {
      out.push(value)
    }
  })

  return out
}

module.exports = flatten

},{"./assert.js":11,"./is-array.js":42,"./is-undefined.js":48}],33:[function(require,module,exports){
const isNumber = require("./is-number.js")
const vectorize = require("./vectorize.js")

function float(x) {
  try {
    const out = JSON.parse(x)
    if (isNumber(out)) return out
    return NaN
  } catch (e) {
    return NaN
  }
}

module.exports = vectorize(float)

},{"./is-number.js":46,"./vectorize.js":89}],34:[function(require,module,exports){
const isNumber = require("./is-number.js")
const vectorize = require("./vectorize.js")

function floor(x) {
  try {
    if (!isNumber(x)) return NaN
    return Math.floor(x)
  } catch (e) {
    return NaN
  }
}

module.exports = vectorize(floor)

},{"./is-number.js":46,"./vectorize.js":89}],35:[function(require,module,exports){
const assert = require("./assert.js")
const isUndefined = require("./is-undefined.js")
const isArray = require("./is-array.js")
const isNumber = require("./is-number.js")
const shape = require("./shape.js")
const int = require("./int.js")

function getValueAt(x, index) {
  assert(
    !isUndefined(x),
    "You must pass an array and an index into the `getValueAt` function!"
  )

  assert(
    isArray(x),
    "You must pass an array and an index into the `getValueAt` function!"
  )

  assert(
    isNumber(index) || isArray(index),
    "The index passed into the `getValueAt` function must be a positive integer or a one-dimensional array of positive integers!"
  )

  if (isArray(index)) {
    assert(
      shape(index).length === 1,
      "The index passed into the `getValueAt` function must be a positive integer or a one-dimensional array of positive integers!"
    )

    index.forEach(value => {
      assert(
        isNumber(value) && int(value) === value,
        "The index passed into the `getValueAt` function must be a positive integer or a one-dimensional array of positive integers!"
      )
    })

    assert(
      index.length <= shape(x).length,
      "The index passed into the `getValueAt` function has too many dimensions!"
    )
  }

  if (isNumber(index)) {
    assert(index < x.length, `The index ${index} is out of bounds!`)
    return x[index]
  } else {
    if (index.length > 1) {
      assert(index[0] < x.length, `The index ${index[0]} is out of bounds!`)
      return getValueAt(x[index[0]], index.slice(1))
    } else {
      return getValueAt(x, index[0])
    }
  }
}

module.exports = getValueAt

},{"./assert.js":11,"./int.js":39,"./is-array.js":42,"./is-number.js":46,"./is-undefined.js":48,"./shape.js":73}],36:[function(require,module,exports){
const assert = require("./assert.js")
const isUndefined = require("./is-undefined.js")
const isNumber = require("./is-number.js")
const zeros = require("./zeros.js")

function identity(size) {
  assert(
    !isUndefined(size),
    "You must pass an integer greater than 0 (representing the size) into the `identity` function!"
  )

  assert(
    isNumber(size),
    "You must pass an integer greater than 0 (representing the size) into the `identity` function!"
  )

  assert(
    parseInt(size) === size,
    "You must pass an integer greater than 0 (representing the size) into the `identity` function!"
  )

  assert(
    size > 0,
    "You must pass an integer greater than 0 (representing the size) into the `identity` function!"
  )

  const out = zeros([size, size])
  for (let i = 0; i < size; i++) out[i][i] = 1
  return out
}

module.exports = identity

},{"./assert.js":11,"./is-number.js":46,"./is-undefined.js":48,"./zeros.js":91}],37:[function(require,module,exports){
const assert = require("./assert.js")
const isUndefined = require("./is-undefined.js")
const isArray = require("./is-array.js")
const shape = require("./shape.js")
const isEqual = require("./is-equal.js")

function indexOf(x, v, requireIdentity) {
  assert(
    !isUndefined(x),
    "You must pass an array and a value into the `indexOf` function!"
  )

  assert(
    isArray(x),
    "You must pass an array and a value into the `indexOf` function!"
  )

  if (shape(x).length === 1 || (isArray(v) && isEqual(shape(x[0]), shape(v)))) {
    for (let i = 0; i < x.length; i++) {
      const value = x[i]

      if (isEqual(value, v) && (requireIdentity ? value === v : true)) {
        return [i]
      }
    }

    return null
  } else {
    for (let i = 0; i < x.length; i++) {
      const row = x[i]
      const index = indexOf(row, v)
      if (index) return [i].concat(index)
    }
  }

  return null
}

module.exports = indexOf

},{"./assert.js":11,"./is-array.js":42,"./is-equal.js":44,"./is-undefined.js":48,"./shape.js":73}],38:[function(require,module,exports){
(function (global){(function (){
let out = {
  abs: require("./abs.js"),
  add: require("./add.js"),
  append: require("./append.js"),
  apply: require("./apply.js"),
  arccos: require("./arccos.js"),
  arcsin: require("./arcsin.js"),
  arctan: require("./arctan.js"),
  argmax: require("./argmax.js"),
  argmin: require("./argmin.js"),
  assert: require("./assert.js"),
  ceil: require("./ceil.js"),
  chop: require("./chop.js"),
  clamp: require("./clamp.js"),
  cohensd: require("./cohens-d.js"),
  combine: require("./combine.js"),
  copy: require("./copy.js"),
  correl: require("./correl.js"),
  cos: require("./cos.js"),
  count: require("./count.js"),
  covariance: require("./covariance.js"),
  DataFrame: require("./dataframe.js"),
  diff: require("./diff.js"),
  distance: require("./distance.js"),
  divide: require("./divide.js"),
  dot: require("./dot.js"),
  dropMissing: require("./drop-missing.js"),
  dropMissingPairwise: require("./drop-missing-pairwise.js"),
  dropNaN: require("./drop-nan.js"),
  dropNaNPairwise: require("./drop-nan-pairwise.js"),
  factorial: require("./factorial.js"),
  flatten: require("./flatten.js"),
  float: require("./float.js"),
  floor: require("./floor.js"),
  getValueAt: require("./get-value-at.js"),
  identity: require("./identity.js"),
  indexOf: require("./index-of.js"),
  int: require("./int.js"),
  intersect: require("./intersect.js"),
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
  multiply: require("./multiply.js"),
  ndarray: require("./ndarray.js"),
  normal: require("./normal.js"),
  ones: require("./ones.js"),
  permute: require("./permute.js"),
  pow: require("./pow.js"),
  print: require("./print.js"),
  random: require("./random.js").random,
  range: require("./range.js"),
  reshape: require("./reshape.js"),
  reverse: require("./reverse.js"),
  round: require("./round.js"),
  scale: require("./scale.js"),
  seed: require("./random.js").seed,
  Series: require("./series.js"),
  set: require("./set.js"),
  setValueAt: require("./set-value-at.js"),
  shape: require("./shape.js"),
  shuffle: require("./shuffle.js"),
  sign: require("./sign.js"),
  sin: require("./sin.js"),
  slice: require("./slice.js"),
  sort: require("./sort.js"),
  sqrt: require("./sqrt.js"),
  std: require("./std.js"),
  stdev: require("./stdev.js"),
  subtract: require("./subtract.js"),
  sum: require("./sum.js"),
  tan: require("./tan.js"),
  time: require("./time.js").timeSync,
  timeSync: require("./time.js").timeSync,
  timeAsync: require("./time.js").timeAsync,
  transpose: require("./transpose.js"),
  union: require("./union.js"),
  variance: require("./variance.js"),
  vectorize: require("./vectorize.js"),
  where: require("./where.js"),
  zeros: require("./zeros.js"),

  dump: function () {
    Object.keys(out).forEach(key => {
      global[key] = out[key]
    })
  },
}

if (typeof module !== "undefined") {
  module.exports = out
}

if (typeof window !== "undefined") {
  window.JSMathTools = out
}

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./abs.js":2,"./add.js":3,"./append.js":4,"./apply.js":5,"./arccos.js":6,"./arcsin.js":7,"./arctan.js":8,"./argmax.js":9,"./argmin.js":10,"./assert.js":11,"./ceil.js":12,"./chop.js":13,"./clamp.js":14,"./cohens-d.js":15,"./combine.js":16,"./copy.js":17,"./correl.js":18,"./cos.js":19,"./count.js":20,"./covariance.js":21,"./dataframe.js":22,"./diff.js":23,"./distance.js":24,"./divide.js":25,"./dot.js":26,"./drop-missing-pairwise.js":27,"./drop-missing.js":28,"./drop-nan-pairwise.js":29,"./drop-nan.js":30,"./factorial.js":31,"./flatten.js":32,"./float.js":33,"./floor.js":34,"./get-value-at.js":35,"./identity.js":36,"./index-of.js":37,"./int.js":39,"./intersect.js":40,"./inverse.js":41,"./is-array.js":42,"./is-boolean.js":43,"./is-equal.js":44,"./is-function.js":45,"./is-number.js":46,"./is-string.js":47,"./is-undefined.js":48,"./lerp.js":49,"./log.js":50,"./map.js":51,"./max.js":52,"./mean.js":53,"./median.js":54,"./min.js":55,"./mode.js":56,"./multiply.js":57,"./ndarray.js":58,"./normal.js":59,"./ones.js":60,"./permute.js":61,"./pow.js":62,"./print.js":63,"./random.js":64,"./range.js":65,"./reshape.js":66,"./reverse.js":67,"./round.js":68,"./scale.js":69,"./series.js":70,"./set-value-at.js":71,"./set.js":72,"./shape.js":73,"./shuffle.js":74,"./sign.js":75,"./sin.js":76,"./slice.js":77,"./sort.js":78,"./sqrt.js":79,"./std.js":80,"./stdev.js":81,"./subtract.js":82,"./sum.js":83,"./tan.js":84,"./time.js":85,"./transpose.js":86,"./union.js":87,"./variance.js":88,"./vectorize.js":89,"./where.js":90,"./zeros.js":91}],39:[function(require,module,exports){
const isNumber = require("./is-number.js")
const vectorize = require("./vectorize.js")

function int(x) {
  try {
    const out = JSON.parse(x)
    if (isNumber(out)) return parseInt(out)
    return NaN
  } catch (e) {
    return NaN
  }
}

module.exports = vectorize(int)

},{"./is-number.js":46,"./vectorize.js":89}],40:[function(require,module,exports){
const isArray = require("./is-array.js")
const flatten = require("./flatten.js")
const union = require("./union.js")

function intersect() {
  const arrays = Object.values(arguments).map(v => {
    if (isArray(v)) return flatten(v)
    return [v]
  })

  const out = []
  const allValues = union(arrays)

  allValues.forEach(value => {
    for (let i = 0; i < arrays.length; i++) {
      if (arrays[i].indexOf(value) < 0) {
        return
      }
    }

    out.push(value)
  })

  return out
}

module.exports = intersect

},{"./flatten.js":32,"./is-array.js":42,"./union.js":87}],41:[function(require,module,exports){
const assert = require("./assert.js")
const isUndefined = require("./is-undefined.js")
const isArray = require("./is-array.js")
const isNumber = require("./is-number.js")
const flatten = require("./flatten.js")
const shape = require("./shape.js")
const slice = require("./slice.js")
const dot = require("./dot.js")
const add = require("./add.js")
const scale = require("./scale.js")
const append = require("./append.js")
const range = require("./range.js")

function inverse(x) {
  assert(
    !isUndefined(x),
    "You must pass a square 2D array into the `inverse` function!"
  )

  assert(
    isArray(x),
    "You must pass a square 2D array into the `inverse` function!"
  )

  flatten(x).forEach(v =>
    assert(
      isNumber(v),
      "The array passed into the `inverse` function must contain only numbers!"
    )
  )

  const xShape = shape(x)

  assert(
    xShape.length === 2,
    "The array passed into the `inverse` function must be exactly two-dimensional and square!"
  )

  assert(
    xShape[0] === xShape[1],
    "The array passed into the `inverse` function must be exactly two-dimensional and square!"
  )

  assert(
    xShape[0] >= 0,
    "The array passed into the `inverse` function must be exactly two-dimensional and square!"
  )

  // https://en.wikipedia.org/wiki/Invertible_matrix#Blockwise_inversion
  if (xShape[0] === 0) {
    return x
  } else if (xShape[0] === 1) {
    assert(x[0][0] !== 0, "This matrix cannot be inverted!")
    return 1 / x[0][0]
  } else if (xShape[0] === 2) {
    const a = x[0][0]
    const b = x[0][1]
    const c = x[1][0]
    const d = x[1][1]

    const det = a * d - b * c
    assert(det !== 0, "This matrix cannot be inverted!")

    const out = [
      [d, -b],
      [-c, a],
    ]

    return scale(out, 1 / det)
  } else if (xShape[0] > 1) {
    const times = (a, b) =>
      isNumber(a) || isNumber(b) ? scale(a, b) : dot(a, b)

    for (let divider = 1; divider < xShape[0] - 1; divider++) {
      try {
        const A = slice(x, [range(0, divider), range(0, divider)])
        const B = slice(x, [range(0, divider), range(divider, xShape[0])])
        const C = slice(x, [range(divider, xShape[0]), range(0, divider)])
        const D = slice(x, [
          range(divider, xShape[0]),
          range(divider, xShape[0]),
        ])

        const AInv = inverse(A)
        const CompInv = inverse(add(D, times(-1, times(times(C, AInv), B))))

        const topLeft = add(
          AInv,
          times(times(times(times(AInv, B), CompInv), C), AInv)
        )
        const topRight = times(-1, times(times(AInv, B), CompInv))
        const bottomLeft = times(-1, times(times(CompInv, C), AInv))
        const bottomRight = CompInv

        const out = append(
          append(topLeft, topRight, 1),
          append(bottomLeft, bottomRight, 1),
          0
        )

        return out
      } catch (e) {}
    }

    assert(false, "This matrix cannot be inverted!")
  }
}

module.exports = inverse

},{"./add.js":3,"./append.js":4,"./assert.js":11,"./dot.js":26,"./flatten.js":32,"./is-array.js":42,"./is-number.js":46,"./is-undefined.js":48,"./range.js":65,"./scale.js":69,"./shape.js":73,"./slice.js":77}],42:[function(require,module,exports){
function isArray(obj) {
  return obj instanceof Array
}

module.exports = isArray

},{}],43:[function(require,module,exports){
function isBoolean(x) {
  return typeof x === "boolean"
}

module.exports = isBoolean

},{}],44:[function(require,module,exports){
const isArray = require("./is-array.js")

function isEqual(a, b) {
  const aType = typeof a
  const bType = typeof b
  if (aType !== bType) return false

  if (aType === "undefined") return true
  if (aType === "boolean") return a === b
  if (aType === "number" || aType === "bigint") return a === b
  if (aType === "string") return a === b
  if (aType === "function") return a === b

  if (aType === "object") {
    if (a === null || b === null) {
      return a === null && b === null
    } else {
      const aKeys = Object.keys(a)
      const bKeys = Object.keys(b)
      if (aKeys.length !== bKeys.length) return false

      for (let i = 0; i < aKeys.length; i++) {
        const key = aKeys[i]
        if (!b.hasOwnProperty(key)) return false
        if (!isEqual(a[key], b[key])) return false
      }

      return true
    }
  }
}

module.exports = isEqual

},{"./is-array.js":42}],45:[function(require,module,exports){
function isFunction(fn) {
  return typeof fn === "function"
}

module.exports = isFunction

},{}],46:[function(require,module,exports){
function isNumber(x) {
  return typeof x === "number" && !isNaN(x)
}

module.exports = isNumber

},{}],47:[function(require,module,exports){
function isString(s) {
  return typeof s === "string"
}

module.exports = isString

},{}],48:[function(require,module,exports){
function isUndefined(x) {
  return x === null || typeof x === "undefined"
}

module.exports = isUndefined

},{}],49:[function(require,module,exports){
const vectorize = require("./vectorize.js")
const isNumber = require("./is-number.js")

function lerp(a, b, f) {
  try {
    if (!isNumber(a)) return NaN
    if (!isNumber(b)) return NaN
    if (!isNumber(f)) return NaN

    return f * (b - a) + a
  } catch (e) {
    return NaN
  }
}

module.exports = vectorize(lerp)

},{"./is-number.js":46,"./vectorize.js":89}],50:[function(require,module,exports){
const isNumber = require("./is-number.js")
const isUndefined = require("./is-undefined.js")
const vectorize = require("./vectorize.js")

function log(x, base) {
  try {
    base = isUndefined(base) ? Math.E : base
    if (!isNumber(x)) return NaN
    if (!isNumber(base)) return NaN
    return Math.log(x) / Math.log(base)
  } catch (e) {
    return NaN
  }
}

module.exports = vectorize(log)

},{"./is-number.js":46,"./is-undefined.js":48,"./vectorize.js":89}],51:[function(require,module,exports){
const isNumber = require("./is-number.js")
const vectorize = require("./vectorize.js")

function map(x, a, b, c, d) {
  try {
    if (!isNumber(x)) return NaN
    if (!isNumber(a)) return NaN
    if (!isNumber(b)) return NaN
    if (!isNumber(c)) return NaN
    if (!isNumber(d)) return NaN

    return ((d - c) * (x - a)) / (b - a) + c
  } catch (e) {
    return NaN
  }
}

module.exports = vectorize(map)

},{"./is-number.js":46,"./vectorize.js":89}],52:[function(require,module,exports){
const flatten = require("./flatten.js")
const isNumber = require("./is-number.js")

function max(arr) {
  try {
    const temp = flatten(arr)
    let out = -Infinity

    for (let i = 0; i < temp.length; i++) {
      if (!isNumber(temp[i])) return NaN
      if (temp[i] > out) out = temp[i]
    }

    return out === -Infinity ? NaN : out
  } catch (e) {
    return NaN
  }
}

module.exports = max

},{"./flatten.js":32,"./is-number.js":46}],53:[function(require,module,exports){
const isNumber = require("./is-number.js")
const flatten = require("./flatten.js")

function mean(arr) {
  try {
    const temp = flatten(arr)
    let out = 0

    for (let i = 0; i < temp.length; i++) {
      if (!isNumber(temp[i])) return NaN
      out += temp[i]
    }

    return out / temp.length
  } catch (e) {
    return NaN
  }
}

module.exports = mean

},{"./flatten.js":32,"./is-number.js":46}],54:[function(require,module,exports){
const assert = require("./assert.js")
const isUndefined = require("./is-undefined.js")
const isArray = require("./is-array.js")
const isNumber = require("./is-number.js")
const flatten = require("./flatten.js")
const sort = require("./sort.js")
const dropNaN = require("./drop-nan.js")

function median(arr) {
  try {
    let flattenedArr = flatten(arr)
    let temp = dropNaN(flattenedArr)
    if (temp.length === 0) return NaN
    if (temp.length < flattenedArr.length) return NaN
    temp = sort(temp)

    let out

    if (temp.length % 2 === 0) {
      out = (temp[temp.length / 2 - 1] + temp[temp.length / 2]) / 2
    } else {
      out = temp[Math.floor(temp.length / 2)]
    }

    return out
  } catch (e) {
    return NaN
  }
}

module.exports = median

},{"./assert.js":11,"./drop-nan.js":30,"./flatten.js":32,"./is-array.js":42,"./is-number.js":46,"./is-undefined.js":48,"./sort.js":78}],55:[function(require,module,exports){
const flatten = require("./flatten.js")
const isNumber = require("./is-number.js")

function min(arr) {
  try {
    const temp = flatten(arr)
    let out = Infinity

    for (let i = 0; i < temp.length; i++) {
      if (!isNumber(temp[i])) return NaN
      if (temp[i] < out) out = temp[i]
    }

    return out === Infinity ? NaN : out
  } catch (e) {
    return NaN
  }
}

module.exports = min

},{"./flatten.js":32,"./is-number.js":46}],56:[function(require,module,exports){
const flatten = require("./flatten.js")
const count = require("./count.js")
const set = require("./set.js")
const sort = require("./sort.js")

function mode(arr) {
  try {
    if (arr.length === 0) return NaN

    const temp = flatten(arr)
    if (temp.length === 0) return NaN

    const counts = {}
    const tempSet = set(temp)

    tempSet.forEach(item => {
      counts[item] = count(temp, item)
    })

    const sortedTempSet = sort(tempSet, (a, b) => counts[b] - counts[a])
    const mostCountedItem = sortedTempSet[0]

    const out = sort(
      sortedTempSet.filter(item => counts[item] === counts[mostCountedItem])
    )

    if (out.length === 1) return out[0]
    return out
  } catch (e) {
    return NaN
  }
}

module.exports = mode

},{"./count.js":20,"./flatten.js":32,"./set.js":72,"./sort.js":78}],57:[function(require,module,exports){
const isNumber = require("./is-number.js")
const vectorize = require("./vectorize.js")

function multiply() {
  try {
    let out = 1
    const x = Object.values(arguments)

    for (let i = 0; i < x.length; i++) {
      if (!isNumber(x[i])) return NaN
      out *= x[i]
    }

    return out
  } catch (e) {
    return NaN
  }
}

module.exports = vectorize(multiply)

},{"./is-number.js":46,"./vectorize.js":89}],58:[function(require,module,exports){
const assert = require("./assert.js")
const isUndefined = require("./is-undefined.js")
const isArray = require("./is-array.js")
const isNumber = require("./is-number.js")
const flatten = require("./flatten.js")

const error =
  "You must pass a natural number or a one-dimensional array of natural numbers into the `ndarray` function!"

function ndarray(shape, shouldSkipChecks) {
  if (!shouldSkipChecks) {
    assert(!isUndefined(shape), error)
    if (!isArray(shape)) shape = [shape]
    shape = flatten(shape)

    assert(shape.length > 0, error)

    shape.forEach(x => {
      assert(isNumber(x), error)
      assert(parseInt(x) === x, error)
      assert(x >= 0, error)
    })
  }

  if (shape.length === 1) {
    const out = []
    for (let i = 0; i < shape[0]; i++) out.push(undefined)
    return out
  } else {
    const out = []

    for (let i = 0; i < shape[0]; i++) {
      out.push(ndarray(shape.slice(1), true))
    }

    return out
  }
}

module.exports = ndarray

},{"./assert.js":11,"./flatten.js":32,"./is-array.js":42,"./is-number.js":46,"./is-undefined.js":48}],59:[function(require,module,exports){
const isUndefined = require("./is-undefined.js")
const ndarray = require("./ndarray.js")
const apply = require("./apply.js")
const { random } = require("./random.js")
const reshape = require("./reshape.js")
const isNumber = require("./is-number.js")

function helper() {
  const u1 = random()
  const u2 = random()
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

function normal(shape) {
  if (isUndefined(shape)) return helper()

  if (isNumber(shape)) shape = [shape]
  const out = []
  let n = 1
  shape.forEach(v => (n *= v))
  for (let i = 0; i < n; i++) out.push(helper())
  return reshape(out, shape)
}

module.exports = normal

},{"./apply.js":5,"./is-number.js":46,"./is-undefined.js":48,"./ndarray.js":58,"./random.js":64,"./reshape.js":66}],60:[function(require,module,exports){
const ndarray = require("./ndarray.js")
const apply = require("./apply.js")
const reshape = require("./reshape.js")
const isNumber = require("./is-number.js")

function ones(shape) {
  if (isNumber(shape)) shape = [shape]
  const out = []
  let n = 1
  shape.forEach(v => (n *= v))
  for (let i = 0; i < n; i++) out.push(1)
  return reshape(out, shape)
}

module.exports = ones

},{"./apply.js":5,"./is-number.js":46,"./ndarray.js":58,"./reshape.js":66}],61:[function(require,module,exports){
const isArray = require("./is-array.js")
const isNumber = require("./is-number.js")
const assert = require("./assert.js")
const isUndefined = require("./is-undefined.js")

function permute(arr, r) {
  assert(isArray(arr), "The `permute` function only works on arrays!")
  if (isUndefined(r)) r = arr.length
  assert(isNumber(r), "`r` must be a whole number!")

  if (r > arr.length) {
    return permute(arr)
  }

  if (r <= 0) {
    return [[]]
  }

  assert(r === parseInt(r), "`r` must be a whole number!")

  if (arr.length < 2) return arr
  const out = []

  arr.forEach((item, i) => {
    assert(
      !isArray(item),
      "It is not recommended to permute arrays of arrays. Weird things happen, and I haven't figured out how to account for such a scenario yet. A possible workaround is: convert each sub-array to a string (using `JSON.stringify`), get the permutations using the array of strings, and then convert each string in each combination back to a sub-array (using `JSON.parse`)."
    )

    const before = arr.slice(0, i)
    const after = arr.slice(i + 1)
    const others = before.concat(after)
    const children = permute(others, r - 1)

    children.forEach(child => {
      out.push([item].concat(child))
    })
  })

  return out
}

module.exports = permute

},{"./assert.js":11,"./is-array.js":42,"./is-number.js":46,"./is-undefined.js":48}],62:[function(require,module,exports){
const isNumber = require("./is-number.js")
const vectorize = require("./vectorize.js")

function pow(x, p) {
  try {
    if (!isNumber(x)) return NaN
    if (!isNumber(p)) return NaN
    return Math.pow(x, p)
  } catch (e) {
    return NaN
  }
}

module.exports = vectorize(pow)

},{"./is-number.js":46,"./vectorize.js":89}],63:[function(require,module,exports){
let isArray = require("./is-array.js")
let shape = require("./shape.js")
let DataFrame = require("./dataframe.js")
let Series = require("./series.js")

function print(){
  Object.keys(arguments).forEach(key => {
    let x = arguments[key]

    if (isArray(x)){
      let xShape = shape(x)

      if (xShape.length === 1){
        new Series(x).print()
      } else if (xShape.length == 2){
        new DataFrame(x).print()
      } else {
        console.log(x)
      }
    } else if (x instanceof DataFrame || x instanceof Series){
      x.print()
    } else {
      console.log(x)
    }
  })
}

module.exports = print

},{"./dataframe.js":22,"./is-array.js":42,"./series.js":70,"./shape.js":73}],64:[function(require,module,exports){
const ndarray = require("./ndarray.js")
const apply = require("./apply.js")
const isUndefined = require("./is-undefined.js")
const assert = require("./assert.js")
const isNumber = require("./is-number.js")
const copy = require("./copy.js")
const reshape = require("./reshape.js")

// This is an implementation of the xoroshiro256++ algorithm:
// https://prng.di.unimi.it/xoshiro256plusplus.c
// It also includes the splitmix64 function for seeding from:
// https://rosettacode.org/wiki/Pseudo-random_numbers/Splitmix64

const MAX = Math.pow(2, 64)
const s = []
seed(parseInt(Math.random() * MAX))

function splitmix64(state, n) {
  state = uint(state)

  function helper() {
    state += uint("0x9e3779b97f4a7c15")
    let z = copy(state)
    z = (z ^ (z >> 30n)) * uint("0xbf58476d1ce4e5b9")
    z = (z ^ (z >> 27n)) * uint("0x94d049bb133111eb")
    return z ^ (z >> 31n)
  }

  const out = []
  for (let i = 0; i < n; i++) out.push(helper())
  return out
}

function uint(x) {
  return BigInt.asUintN(64, BigInt(x))
}

function rotl(x, k) {
  x = uint(x)
  k = BigInt(k)
  return uint(uint(x << k) | uint(x >> uint(64n - k)))
}

function seed(val) {
  if (!isUndefined(val)) {
    assert(
      isNumber(val),
      "If passing a value into the `seed` function, then that value must be an integer!"
    )

    const temp = splitmix64(parseInt(val), 4)
    s[0] = temp[0]
    s[1] = temp[1]
    s[2] = temp[2]
    s[3] = temp[3]
  } else {
    return copy(s)
  }
}

function next() {
  const result = uint(rotl(s[0] + s[3], 23) + s[0])
  const t = uint(s[1] << 17n)
  s[2] = uint(s[2] ^ s[0])
  s[3] = uint(s[3] ^ s[1])
  s[1] = uint(s[1] ^ s[2])
  s[0] = uint(s[0] ^ s[3])
  s[2] = uint(s[2] ^ t)
  s[3] = rotl(s[3], 45)
  return parseInt(result) / MAX
}

function random(shape) {
  if (isUndefined(shape)) return next()

  if (isNumber(shape)) shape = [shape]
  const out = []
  let n = 1
  shape.forEach(v => (n *= v))
  for (let i = 0; i < n; i++) out.push(next())
  return reshape(out, shape)
}

module.exports = { random, seed }

},{"./apply.js":5,"./assert.js":11,"./copy.js":17,"./is-number.js":46,"./is-undefined.js":48,"./ndarray.js":58,"./reshape.js":66}],65:[function(require,module,exports){
const assert = require("./assert.js")
const isUndefined = require("./is-undefined.js")
const isNumber = require("./is-number.js")
const reverse = require("./reverse.js")

function range(a, b, step = 1) {
  assert(
    !isUndefined(a) && !isUndefined(b) && !isUndefined(step),
    "You must pass two numbers and optionally a step value to the `range` function!"
  )

  assert(
    isNumber(a) && isNumber(b) && isNumber(step),
    "You must pass two numbers and optionally a step value to the `range` function!"
  )

  assert(
    step > 0,
    "The step value must be greater than 0! (NOTE: The step value is a magnitude; it does not indicate direction.)"
  )

  let shouldReverse = false

  if (a > b) {
    shouldReverse = true
    let buffer = a
    a = b + step
    b = buffer + step
  }

  let out = []
  for (let i = a; i < b; i += step) out.push(i)
  if (shouldReverse) out = reverse(out)
  return out
}

module.exports = range

},{"./assert.js":11,"./is-number.js":46,"./is-undefined.js":48,"./reverse.js":67}],66:[function(require,module,exports){
const assert = require("./assert.js")
const isArray = require("./is-array.js")
const isNumber = require("./is-number.js")
const shape = require("./shape.js")
const flatten = require("./flatten.js")
const product = x => x.reduce((a, b) => a * b)

function reshape(x, newShape) {
  assert(
    isArray(x),
    "The first argument passed into the `reshape` function must be an array!"
  )

  if (isNumber(newShape)) newShape = [newShape]

  assert(
    isArray(newShape),
    "The second argument passed into the `reshape` function must be a whole number or a one-dimensional array of whole numbers!"
  )

  assert(
    shape(newShape).length === 1,
    "The first argument passed into the `reshape` function must be a whole number or a one-dimensional array of whole numbers!"
  )

  newShape.forEach(v => {
    assert(
      isNumber(v) && parseInt(v) === v && v > 0,
      "The first argument passed into the `reshape` function must be a whole number or a one-dimensional array of whole numbers!"
    )
  })

  if (newShape.length <= 1) return flatten(x)

  let temp = flatten(x)

  assert(
    product(newShape) === temp.length,
    "The new shape doesn't match the number of values available in `x` (the first argument passed into the `reshape` function)!"
  )

  let out = []
  let step = parseInt(temp.length / newShape[0])

  for (let i = 0; i < newShape[0]; i++) {
    let row = temp.slice(i * step, (i + 1) * step)
    out.push(reshape(row, newShape.slice(1)))
  }

  return out
}

module.exports = reshape

},{"./assert.js":11,"./flatten.js":32,"./is-array.js":42,"./is-number.js":46,"./shape.js":73}],67:[function(require,module,exports){
const assert = require("./assert.js")
const isUndefined = require("./is-undefined.js")
const isArray = require("./is-array.js")

function reverse(arr) {
  assert(
    !isUndefined(arr),
    "You must pass an array into the `reverse` function!"
  )

  assert(isArray(arr), "You must pass an array into the `reverse` function!")

  const out = []
  for (let i = arr.length - 1; i >= 0; i--) out.push(arr[i])
  return out
}

module.exports = reverse

},{"./assert.js":11,"./is-array.js":42,"./is-undefined.js":48}],68:[function(require,module,exports){
const isNumber = require("./is-number.js")
const vectorize = require("./vectorize.js")

function round(x) {
  try {
    if (!isNumber(x)) return NaN
    return Math.round(x)
  } catch (e) {
    return NaN
  }
}

module.exports = vectorize(round)

},{"./is-number.js":46,"./vectorize.js":89}],69:[function(require,module,exports){
const multiply = require("./multiply.js")

function scale(a, b) {
  return multiply(a, b)
}

module.exports = scale

},{"./multiply.js":57}],70:[function(require,module,exports){
const assert = require("./assert.js")
const isArray = require("./is-array.js")
const isUndefined = require("./is-undefined.js")
const shape = require("./shape.js")
const transpose = require("./transpose.js")
const range = require("./range.js")
const isNumber = require("./is-number.js")
const isString = require("./is-string.js")
const apply = require("./apply.js")
const isFunction = require("./is-function.js")
const ndarray = require("./ndarray.js")
const copy = require("./copy.js")
const set = require("./set.js")
const reverse = require("./reverse.js")
const sort = require("./sort.js")
const isBoolean = require("./is-boolean.js")

function isInteger(x) {
  return isNumber(x) && parseInt(x) === x
}

function isWholeNumber(x) {
  return isInteger(x) && x >= 0
}

function isObject(x) {
  return x instanceof Object && !isArray(x) && x !== null
}

function isDataFrame(x) {
  return x instanceof DataFrame
}

function isSeries(x) {
  return x instanceof Series
}

function leftPad(x, maxLength) {
  assert(isNumber(x), "The `leftPad` function only works on numbers!")
  let out = x.toString()
  while (out.length < maxLength) out = "0" + out
  return out
}

class Series {
  constructor(data) {
    const self = this
    self.name = "data"

    Object.defineProperty(self, "_values", {
      value: [],
      configurable: true,
      enumerable: false,
      writable: true,
    })

    Object.defineProperty(self, "values", {
      configurable: true,
      enumerable: true,

      get() {
        return self._values
      },

      set(x) {
        assert(isArray(x), "The new values must be a 1-dimensional array!")

        const dataShape = shape(x)

        assert(
          dataShape.length === 1,
          "The new array of values must be 1-dimensional!"
        )

        if (dataShape[0] < self._index.length) {
          self._index = self._index.slice(0, dataShape[0])
        } else if (dataShape[0] > self._index.length) {
          self._index = self._index.concat(
            range(self._index.length, dataShape[0]).map(i => {
              return "row" + leftPad(i, (x.length - 1).toString().length)
            })
          )
        }

        self._values = x
      },
    })

    Object.defineProperty(self, "_index", {
      value: [],
      configurable: true,
      enumerable: false,
      writable: true,
    })

    Object.defineProperty(self, "index", {
      configurable: true,
      enumerable: true,

      get() {
        return self._index
      },

      set(x) {
        assert(
          isArray(x),
          "The new index must be a 1-dimensional array of strings!"
        )

        assert(
          x.length === self.shape[0],
          "The new index must be the same length as the old index!"
        )

        assert(
          shape(x).length === 1,
          "The new index must be a 1-dimensional array of strings!"
        )

        x.forEach(value => {
          assert(isString(value), "All of the row names must be strings!")
        })

        self._index = x
      },
    })

    if (data) {
      const dataShape = shape(data)

      assert(
        dataShape.length === 1,
        "The `data` array passed into the constructor of a DataFrame must be 1-dimensional!"
      )

      self.values = data
    }
  }

  get shape() {
    const self = this
    return shape(self.values)
  }

  isEmpty() {
    const self = this
    return self.values.filter(v => !isUndefined(v)).length === 0
  }

  clear() {
    const self = this
    const out = self.copy()
    out.values = ndarray(out.shape)
    out.index = self.index
    return out
  }

  get(indices) {
    const self = this

    if (isString(indices) || isNumber(indices)) indices = [indices]

    const types = set((indices || []).map(v => typeof v))

    assert(
      types.length <= 2,
      "Only whole numbers and/or strings are allowed in `get` arrays!"
    )

    if (types.length === 1) {
      assert(
        types[0] === "string" || types[0] === "number",
        "Only whole numbers and/or strings are allowed in `get` arrays!"
      )
    }

    if (types.length === 2) {
      assert(
        types.indexOf("string") > -1,
        "Only whole numbers and/or strings are allowed in `get` arrays!"
      )

      assert(
        types.indexOf("number") > -1,
        "Only whole numbers and/or strings are allowed in `get` arrays!"
      )
    }

    if (!isUndefined(indices)) {
      indices = indices.map(i => {
        if (typeof i === "string") {
          assert(self.index.indexOf(i) > -1, `Index "${i}" does not exist!`)
          return i
        }

        if (typeof i === "number") {
          assert(i >= 0, `Index ${i} is out of bounds!`)
          assert(parseInt(i) === i, `Indices must be integers!`)
          assert(i < self.index.length, `Index ${i} is out of bounds!`)
          return self.index[i]
        }
      })
    }

    return self.getSubsetByNames(indices)
  }

  getSubsetByNames(indices) {
    const self = this

    if (isUndefined(indices)) indices = self.index

    assert(
      isArray(indices),
      "The `indices` array must be a 1-dimensional array of strings."
    )

    assert(
      shape(indices).length === 1,
      "The `indices` array must be a 1-dimensional array of strings."
    )

    assert(
      indices.length > 0,
      "The `indices` array must contain at least one index name."
    )

    indices.forEach(name => {
      assert(isString(name), "The `indices` array must contain only strings.")

      assert(
        self.index.indexOf(name) > -1,
        `The name "${name}" does not exist in the index.`
      )
    })

    const values = indices.map(name => {
      return self.values[self.index.indexOf(name)]
    })

    if (values.length === 1) return values[0]

    const out = new Series(values)
    out.index = indices
    out.name = self.name
    return out
  }

  getSubsetByIndices(indices) {
    const self = this
    const dataShape = self.shape

    if (isUndefined(indices)) indices = range(0, dataShape[0])

    assert(
      isArray(indices),
      "The `indices` array must be 1-dimensional array of whole numbers."
    )

    assert(
      shape(indices).length === 1,
      "The `indices` array must be a 1-dimensional array of whole numbers."
    )

    assert(
      indices.length > 0,
      "The `indices` array must contain at least one index."
    )

    indices.forEach(index => {
      assert(
        isWholeNumber(index),
        "The `indices` array must be a 1-dimensional array of whole numbers."
      )

      assert(
        index < self.index.length,
        `The row index ${index} is out of bounds.`
      )
    })

    const rows = indices.map(i => self.index[i])
    return self.getSubsetByNames(rows)
  }

  loc(indices) {
    const self = this
    return self.getSubsetByNames(indices)
  }

  iloc(indices) {
    const self = this
    return self.getSubsetByIndices(indices)
  }

  reverse() {
    const self = this
    const out = new Series(reverse(self.values))
    out.index = reverse(self.index)
    out.name = self.name
    return out
  }

  resetIndex() {
    const self = this
    const out = self.copy()

    out.index = range(0, self.shape[0]).map(i => {
      return "row" + leftPad(i, (out.index.length - 1).toString().length)
    })

    return out
  }

  copy() {
    const self = this
    const out = new Series(copy(self.values))
    out.index = self.index.slice()
    out.name = self.name
    return out
  }

  apply(fn) {
    assert(
      isFunction(fn),
      "The parameter to the `apply` method must be a function."
    )

    const self = this
    const out = self.copy()
    out.values = out.values.map((v, i) => fn(v, out.index[i]))
    return out
  }

  dropMissing(condition, threshold) {
    const self = this
    const out = self.copy()
    const outIndex = []

    out.values = out.values.filter((v, i) => {
      if (isUndefined(v)) {
        return false
      } else {
        outIndex.push(out.index[i])
        return true
      }
    })

    out.index = outIndex
    return out
  }

  toObject() {
    const self = this
    const out = {}
    out[self.name] = {}

    self.index.forEach((index, i) => {
      out[self.name][index] = self.values[i]
    })

    return out
  }

  print() {
    const self = this
    let temp = self.copy()
    const maxRows = typeof window === "undefined" ? 20 : 10

    if (temp.index.length > maxRows) {
      temp = temp.get(
        range(0, maxRows / 2).concat(
          range(temp.index.length - maxRows / 2, temp.index.length)
        )
      )

      const tempIndex = copy(temp.index)
      tempIndex.splice(parseInt(tempIndex.length / 2), 0, "...")
      temp.values.push("...")
      temp.index.push("...")
      temp = temp.get(tempIndex)
    }

    const out = {}

    temp.values.forEach((value, i) => {
      const obj = {}
      obj[temp.name] = value
      out[temp.index[i]] = obj
    })

    console.table(out)
    return self
  }

  sort(direction) {
    assert(
      isBoolean(direction) || isString(direction) || isUndefined(direction),
      "The `sort` method can take an optional parameter that's either a string representing a direction ('ascending' or 'descending') or a boolean representing whether or not the direction is ascending (true or false)."
    )

    let isAscending = true

    if (isUndefined(direction)) {
      isAscending = true
    }

    if (isString(direction)) {
      direction = direction.trim().toLowerCase()

      assert(
        direction === "ascending" || direction === "descending",
        "The `sort` method can take an optional parameter that's either a string representing a direction ('ascending' or 'descending') or a boolean representing whether or not the direction is ascending (true or false)."
      )

      isAscending = direction === "ascending"
    }

    if (isBoolean(direction)) {
      isAscending = direction
    }

    const self = this
    let temp = transpose([self.values, self.index])

    temp = transpose(
      sort(temp, (a, b) => {
        if (a[0] === b[0]) return 0
        if (a[0] < b[0]) return isAscending ? -1 : 1
        if (a[0] > b[0]) return isAscending ? 1 : -1
      })
    )

    const out = new Series(temp[0])
    out.index = temp[1]
    out.name = self.name
    return out
  }

  sortByIndex() {
    const self = this
    let temp = transpose([self.values, self.index])

    temp = transpose(
      sort(temp, (a, b) => {
        if (a[1] === b[1]) return 0
        if (a[1] < b[1]) return -1
        if (a[1] > b[1]) return 1
      })
    )

    const out = new Series(temp[0])
    out.index = temp[1]
    out.name = self.name
    return out
  }

  filter(fn) {
    const self = this
    let out = self.copy()
    const index = copy(out.index)
    const indicesToRemove = []

    const newValues = out.values.filter((value, i) => {
      const shouldKeep = fn(value, i, out.values)
      if (!shouldKeep) indicesToRemove.push(out.index[i])
      return shouldKeep
    })

    indicesToRemove.forEach(i => {
      index.splice(index.indexOf(i), 1)
    })

    if (newValues.length === 0) {
      out = new Series()
      out.name = self.name
      return out
    }

    out.values = newValues
    out.index = index
    return out
  }
}

module.exports = Series

},{"./apply.js":5,"./assert.js":11,"./copy.js":17,"./is-array.js":42,"./is-boolean.js":43,"./is-function.js":45,"./is-number.js":46,"./is-string.js":47,"./is-undefined.js":48,"./ndarray.js":58,"./range.js":65,"./reverse.js":67,"./set.js":72,"./shape.js":73,"./sort.js":78,"./transpose.js":86}],71:[function(require,module,exports){
const assert = require("./assert.js")
const isNumber = require("./is-number.js")
const isArray = require("./is-array.js")
const copy = require("./copy.js")

function setValueAt(x, index, value) {
  assert(
    isArray(x),
    "The first argument passed into the `setValueAt` function must be an array!"
  )

  if (isNumber(index)) index = [index]

  assert(
    isArray(index),
    "The second argument passed into the `setValueAt` function must be an integer or an array of integers!"
  )

  let out = copy(x)
  let temp = out

  for (let i = 0; i < index.length - 1; i++) {
    temp = temp[index[i]]
  }

  temp[index[index.length - 1]] = value
  return out
}

module.exports = setValueAt

},{"./assert.js":11,"./copy.js":17,"./is-array.js":42,"./is-number.js":46}],72:[function(require,module,exports){
const assert = require("./assert.js")
const isUndefined = require("./is-undefined.js")
const isArray = require("./is-array.js")
const flatten = require("./flatten.js")

function set(arr) {
  assert(!isUndefined(arr), "You must pass an array into the `set` function!")
  assert(isArray(arr), "You must pass an array into the `set` function!")

  const out = []
  const temp = {}

  flatten(arr).forEach(item => {
    const key =
      typeof item === "undefined"
        ? "undefined"
        : typeof item === "function"
        ? item.toString()
        : JSON.stringify(item)

    if (!temp[key]) out.push(item)
    temp[key] = true
  })

  return out
}

module.exports = set

},{"./assert.js":11,"./flatten.js":32,"./is-array.js":42,"./is-undefined.js":48}],73:[function(require,module,exports){
const assert = require("./assert.js")
const isUndefined = require("./is-undefined.js")
const isArray = require("./is-array.js")
const max = require("./max.js")

function shape(arr) {
  assert(!isUndefined(arr), "You must pass an array into the `shape` function!")
  assert(isArray(arr), "You must pass an array into the `shape` function!")

  let out = [arr.length]
  const childrenAreArrays = arr.map(x => isArray(x))

  if (childrenAreArrays.indexOf(true) > -1) {
    assert(
      childrenAreArrays.indexOf(false) < 0,
      "The array passed into the `shape` function has some children that are not themselves arrays!"
    )

    const lengths = arr.map(x => x.length)
    const maxLength = max(lengths)

    lengths.forEach(function (length) {
      assert(
        length === maxLength,
        "The array passed into the `shape` function has some children of inconsistent length!"
      )
    })

    out = out.concat(shape(arr[0]))
  }

  return out
}

module.exports = shape

},{"./assert.js":11,"./is-array.js":42,"./is-undefined.js":48,"./max.js":52}],74:[function(require,module,exports){
const assert = require("./assert.js")
const isUndefined = require("./is-undefined.js")
const isArray = require("./is-array.js")
const floor = require("./floor.js")
const { random } = require("./random.js")

function shuffle(arr) {
  assert(
    !isUndefined(arr),
    "You must pass an array into the `shuffle` function!"
  )

  assert(isArray(arr), "You must pass an array into the `shuffle` function!")

  const out = []
  let temp = arr.slice()

  for (let i = 0; i < arr.length; i++) {
    const index = parseInt(random() * temp.length)
    out.push(temp.splice(index, 1)[0])
  }

  return out
}

module.exports = shuffle

},{"./assert.js":11,"./floor.js":34,"./is-array.js":42,"./is-undefined.js":48,"./random.js":64}],75:[function(require,module,exports){
const isNumber = require("./is-number.js")
const vectorize = require("./vectorize.js")

function sign(x) {
  try {
    if (!isNumber(x)) return NaN
    if (x < 0) return -1
    if (x > 0) return 1
    return 0
  } catch (e) {
    return NaN
  }
}

module.exports = vectorize(sign)

},{"./is-number.js":46,"./vectorize.js":89}],76:[function(require,module,exports){
const isNumber = require("./is-number.js")
const vectorize = require("./vectorize.js")

function sin(x) {
  try {
    if (!isNumber(x)) return NaN
    return Math.sin(x)
  } catch (e) {
    return NaN
  }
}

module.exports = vectorize(sin)

},{"./is-number.js":46,"./vectorize.js":89}],77:[function(require,module,exports){
const assert = require("./assert.js")
const isUndefined = require("./is-undefined.js")
const isNumber = require("./is-number.js")
const isArray = require("./is-array.js")
const range = require("./range.js")
const flatten = require("./flatten.js")
const shape = require("./shape.js")
const floor = require("./floor.js")

function slice(arr, indices) {
  assert(!isUndefined(arr), "You must pass an array into the `slice` function!")
  assert(isArray(arr), "You must pass an array into the `slice` function!")

  if (isUndefined(indices)) return arr.slice()

  assert(
    isArray(indices),
    "The indices passed into the `slice` function must be a one-dimensional array of integers or null values."
  )

  flatten(indices).forEach(idx => {
    assert(
      isUndefined(idx) || (isNumber(idx) && floor(idx) === idx),
      "The indices passed into the `slice` function must be a one-dimensional array of integers or null values."
    )
  })

  let idx = indices[0]
  if (isUndefined(idx)) idx = range(0, arr.length)
  if (isNumber(idx)) idx = [idx]

  const out = []

  idx.forEach(i => {
    assert(i < arr.length, "Index out of bounds in the `slice` function!")
    if (i < 0) i += arr.length

    const item = arr[i]

    if (isArray(item)) {
      out.push(slice(arr[i], indices.slice(1, indices.length)))
    } else {
      out.push(arr[i])
    }
  })

  // if (shape(out).indexOf(1) > -1) out = flatten(out)

  return out
}

module.exports = slice

},{"./assert.js":11,"./flatten.js":32,"./floor.js":34,"./is-array.js":42,"./is-number.js":46,"./is-undefined.js":48,"./range.js":65,"./shape.js":73}],78:[function(require,module,exports){
const assert = require("./assert.js")
const isUndefined = require("./is-undefined.js")
const isArray = require("./is-array.js")
const isFunction = require("./is-function.js")

function alphaSort(a, b) {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

function sort(arr, fn) {
  if (isUndefined(fn)) fn = alphaSort

  assert(!isUndefined(arr), "You must pass an array into the `sort` function!")
  assert(isArray(arr), "You must pass an array into the `sort` function!")

  assert(
    isFunction(fn),
    "The second parameter of the `sort` function must be a comparison function!"
  )

  const out = arr.slice()
  out.sort(fn)
  return out
}

module.exports = sort

},{"./assert.js":11,"./is-array.js":42,"./is-function.js":45,"./is-undefined.js":48}],79:[function(require,module,exports){
const isNumber = require("./is-number.js")
const vectorize = require("./vectorize.js")

function sqrt(x) {
  try {
    if (!isNumber(x)) return NaN
    return Math.sqrt(x)
  } catch (e) {
    return NaN
  }
}

module.exports = vectorize(sqrt)

},{"./is-number.js":46,"./vectorize.js":89}],80:[function(require,module,exports){
const sqrt = require("./sqrt.js")
const variance = require("./variance.js")

function std(arr) {
  try {
    return sqrt(variance(arr))
  } catch (e) {
    return NaN
  }
}

module.exports = std

},{"./sqrt.js":79,"./variance.js":88}],81:[function(require,module,exports){
const std = require("./std.js")

function stdev(x) {
  return std(x)
}

module.exports = stdev

},{"./std.js":80}],82:[function(require,module,exports){
const add = require("./add.js")
const scale = require("./scale.js")

function subtract(a, b) {
  return add(a, scale(b, -1))
}

module.exports = subtract

},{"./add.js":3,"./scale.js":69}],83:[function(require,module,exports){
const add = require("./add.js")
const flatten = require("./flatten.js")

function sum(arr) {
  try {
    return add(...flatten(arr))
  } catch (e) {
    return NaN
  }
}

module.exports = sum

},{"./add.js":3,"./flatten.js":32}],84:[function(require,module,exports){
const isNumber = require("./is-number.js")
const vectorize = require("./vectorize.js")

function tan(x) {
  try {
    if (!isNumber(x)) return NaN
    return Math.tan(x)
  } catch (e) {
    return NaN
  }
}

module.exports = vectorize(tan)

},{"./is-number.js":46,"./vectorize.js":89}],85:[function(require,module,exports){
const isFunction = require("./is-function.js")

function timeSync(fn, args) {
  assert(isFunction(fn), "`fn` must be a function!")

  const start = new Date()

  if (args) {
    fn(...args)
  } else {
    fn()
  }

  return new Date() - start
}

async function timeAsync(fn, args) {
  assert(isFunction(fn), "`fn` must be a function!")

  const start = new Date()

  if (args) {
    await fn(...args)
  } else {
    await fn()
  }

  return new Date() - start
}

module.exports = { timeSync, timeAsync }

},{"./is-function.js":45}],86:[function(require,module,exports){
const assert = require("./assert.js")
const isUndefined = require("./is-undefined.js")
const isArray = require("./is-array.js")
const shape = require("./shape.js")
const reverse = require("./reverse.js")
const ndarray = require("./ndarray.js")

function transpose(arr) {
  assert(
    !isUndefined(arr),
    "You must pass an array into the `transpose` function!"
  )

  assert(isArray(arr), "You must pass an array into the `transpose` function!")

  const theShape = shape(arr)

  assert(
    theShape.length <= 2,
    "I'm not smart enough to know how to transpose arrays that have more than 2 dimensions. Sorry for the inconvenience! Please only pass 1- or 2-dimensional arrays into the `transpose` function!"
  )

  if (theShape.length === 1) {
    return reverse(arr)
  } else if (theShape.length === 2) {
    const out = ndarray(reverse(theShape))

    for (let row = 0; row < theShape[0]; row++) {
      for (let col = 0; col < theShape[1]; col++) {
        out[col][row] = arr[row][col]
      }
    }

    return out
  }
}

module.exports = transpose

},{"./assert.js":11,"./is-array.js":42,"./is-undefined.js":48,"./ndarray.js":58,"./reverse.js":67,"./shape.js":73}],87:[function(require,module,exports){
const assert = require("./assert.js")
const set = require("./set.js")

function union() {
  return set([...arguments])
}

module.exports = union

},{"./assert.js":11,"./set.js":72}],88:[function(require,module,exports){
const mean = require("./mean.js")
const flatten = require("./flatten.js")
const isNumber = require("./is-number.js")

function variance(arr) {
  try {
    const temp = flatten(arr)
    const m = mean(temp)
    let out = 0

    for (let i = 0; i < temp.length; i++) {
      if (!isNumber(temp[i])) return NaN
      out += (temp[i] - m) * (temp[i] - m)
    }

    return out / temp.length
  } catch (e) {
    return NaN
  }
}

module.exports = variance

},{"./flatten.js":32,"./is-number.js":46,"./mean.js":53}],89:[function(require,module,exports){
const assert = require("./assert.js")
const isUndefined = require("./is-undefined.js")
const isArray = require("./is-array.js")
const max = require("./max.js")
const isFunction = require("./is-function.js")

function vectorize(fn) {
  assert(
    !isUndefined(fn),
    "You must pass a function into the `vectorize` function!"
  )

  assert(
    isFunction(fn),
    "You must pass a function into the `vectorize` function!"
  )

  return function temp() {
    const atLeastOneArgumentIsAnArray =
      Object.keys(arguments)
        .map(key => isArray(arguments[key]))
        .indexOf(true) > -1

    if (atLeastOneArgumentIsAnArray) {
      const out = []
      const lengths = Object.keys(arguments)
        .filter(key => isArray(arguments[key]))
        .map(key => arguments[key].length)
      const maxLength = max(lengths)

      lengths.forEach(length => {
        assert(
          length === maxLength,
          `If using arrays for all arguments to this function, then the arrays must all have equal length!`
        )
      })

      for (let i = 0; i < maxLength; i++) {
        const args = Object.keys(arguments).map(key => {
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

},{"./assert.js":11,"./is-array.js":42,"./is-function.js":45,"./is-undefined.js":48,"./max.js":52}],90:[function(require,module,exports){
const assert = require("./assert.js")
const isArray = require("./is-array.js")
const isFunction = require("./is-function.js")
const apply = require("./apply.js")
const indexOf = require("./index-of.js")
const setValueAt = require("./set-value-at.js")
const flatten = require("./flatten.js")

function where(x, fn) {
  assert(
    isArray(x),
    "The first argument passed into the `where` function must be an array!"
  )

  assert(
    isFunction(fn),
    "The second argument passed into the `where` function must be a function!"
  )

  const n = flatten(x).length
  let temp = apply(x, fn)
  const out = []
  let count = 0
  let isDone = false

  while (!isDone) {
    const idx = indexOf(temp, true)

    if (idx) {
      out[count] = idx
      temp = setValueAt(temp, idx, null)
      count++
    } else {
      isDone = true
    }
  }

  if (count === 0) return null
  return out
}

module.exports = where

},{"./apply.js":5,"./assert.js":11,"./flatten.js":32,"./index-of.js":37,"./is-array.js":42,"./is-function.js":45,"./set-value-at.js":71}],91:[function(require,module,exports){
const ndarray = require("./ndarray.js")
const apply = require("./apply.js")
const isNumber = require("./is-number.js")
const reshape = require("./reshape.js")

function zeros(shape) {
  if (isNumber(shape)) shape = [shape]
  const out = []
  let n = 1
  shape.forEach(v => (n *= v))
  for (let i = 0; i < n; i++) out.push(0)
  return reshape(out, shape)
}

module.exports = zeros

},{"./apply.js":5,"./is-number.js":46,"./ndarray.js":58,"./reshape.js":66}],92:[function(require,module,exports){
/*
 * liquidjs@9.28.4, https://github.com/harttle/liquidjs
 * (c) 2016-2021 harttle
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
    function isString(value) {
        return typeof value === 'string';
    }
    function isFunction(value) {
        return typeof value === 'function';
    }
    function escapeRegex(str) {
        return str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    }
    function stringify(value) {
        value = toValue(value);
        if (isString(value))
            return value;
        if (isNil(value))
            return '';
        return String(value);
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
        return value == null;
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
    function dirname(filepath) {
        return domResolve(filepath, '.');
    }
    var sep = '/';

    var fs = /*#__PURE__*/Object.freeze({
        resolve: resolve,
        readFile: readFile,
        readFileSync: readFileSync,
        exists: exists,
        existsSync: existsSync,
        dirname: dirname,
        sep: sep
    });

    function isComparable(arg) {
        return arg && isFunction(arg.equals);
    }

    function isTruthy(val, ctx) {
        return !isFalsy(val, ctx);
    }
    function isFalsy(val, ctx) {
        if (ctx.opts.jsTruthy) {
            return !val;
        }
        else {
            return val === false || undefined === val || val === null;
        }
    }

    var defaultOperators = {
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
        'and': function (l, r, ctx) { return isTruthy(l, ctx) && isTruthy(r, ctx); },
        'or': function (l, r, ctx) { return isTruthy(l, ctx) || isTruthy(r, ctx); }
    };

    // **DO NOT CHANGE THIS FILE**
    //
    // This file is generated by bin/character-gen.js
    // bitmask character types to boost performance
    var TYPES = [0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 4, 4, 4, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 2, 8, 0, 0, 0, 0, 8, 0, 0, 0, 64, 0, 65, 0, 0, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 0, 0, 2, 2, 2, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0];
    var IDENTIFIER = 1;
    var BLANK = 4;
    var QUOTE = 8;
    var INLINE_BLANK = 16;
    var NUMBER = 32;
    var SIGN = 64;
    TYPES[160] = TYPES[5760] = TYPES[6158] = TYPES[8192] = TYPES[8193] = TYPES[8194] = TYPES[8195] = TYPES[8196] = TYPES[8197] = TYPES[8198] = TYPES[8199] = TYPES[8200] = TYPES[8201] = TYPES[8202] = TYPES[8232] = TYPES[8233] = TYPES[8239] = TYPES[8287] = TYPES[12288] = BLANK;

    function createTrie(operators) {
        var e_1, _a;
        var trie = {};
        try {
            for (var _b = __values(Object.entries(operators)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), name_1 = _d[0], handler = _d[1];
                var node = trie;
                for (var i = 0; i < name_1.length; i++) {
                    var c = name_1[i];
                    node[c] = node[c] || {};
                    if (i === name_1.length - 1 && (TYPES[name_1.charCodeAt(i)] & IDENTIFIER)) {
                        node[c].needBoundary = true;
                    }
                    node = node[c];
                }
                node.handler = handler;
                node.end = true;
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return trie;
    }

    var defaultOptions = {
        root: ['.'],
        layouts: ['.'],
        partials: ['.'],
        relativeReference: true,
        cache: undefined,
        extname: '',
        fs: fs,
        dynamicPartials: true,
        jsTruthy: false,
        trimTagRight: false,
        trimTagLeft: false,
        trimOutputRight: false,
        trimOutputLeft: false,
        greedy: true,
        tagDelimiterLeft: '{%',
        tagDelimiterRight: '%}',
        outputDelimiterLeft: '{{',
        outputDelimiterRight: '}}',
        preserveTimezones: false,
        strictFilters: false,
        strictVariables: false,
        lenientIf: false,
        globals: {},
        keepOutputType: false,
        operators: defaultOperators,
        operatorsTrie: createTrie(defaultOperators)
    };
    function normalize(options) {
        if (options.hasOwnProperty('operators')) {
            options.operatorsTrie = createTrie(options.operators);
        }
        if (options.hasOwnProperty('root')) {
            if (!options.hasOwnProperty('partials'))
                options.partials = options.root;
            if (!options.hasOwnProperty('layouts'))
                options.layouts = options.root;
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
        options = __assign({}, defaultOptions, options);
        if (!options.fs.dirname && options.relativeReference) {
            console.warn('[LiquidJS] `fs.dirname` is required for relativeReference, set relativeReference to `false` to suppress this warning, or provide implementation for `fs.dirname`');
            options.relativeReference = false;
        }
        options.root = normalizeDirectoryList(options.root);
        options.partials = normalizeDirectoryList(options.partials);
        options.layouts = normalizeDirectoryList(options.layouts);
        return options;
    }
    function normalizeDirectoryList(value) {
        var list = [];
        if (isArray(value))
            list = value;
        if (isString(value))
            list = [value];
        return list;
    }

    var LiquidError = /** @class */ (function (_super) {
        __extends(LiquidError, _super);
        function LiquidError(err, token) {
            var _this = _super.call(this, err.message) || this;
            _this.originalError = err;
            _this.token = token;
            _this.context = '';
            return _this;
        }
        LiquidError.prototype.update = function () {
            var err = this.originalError;
            this.context = mkContext(this.token);
            this.message = mkMessage(err.message, this.token);
            this.stack = this.message + '\n' + this.context +
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
            return obj.name === 'RenderError';
        };
        return RenderError;
    }(LiquidError));
    var UndefinedVariableError = /** @class */ (function (_super) {
        __extends(UndefinedVariableError, _super);
        function UndefinedVariableError(err, token) {
            var _this = _super.call(this, err, token) || this;
            _this.name = 'UndefinedVariableError';
            _this.message = err.message;
            _super.prototype.update.call(_this);
            return _this;
        }
        return UndefinedVariableError;
    }(LiquidError));
    // only used internally; raised where we don't have token information,
    // so it can't be an UndefinedVariableError.
    var InternalUndefinedVariableError = /** @class */ (function (_super) {
        __extends(InternalUndefinedVariableError, _super);
        function InternalUndefinedVariableError(variableName) {
            var _this = _super.call(this, "undefined variable: " + variableName) || this;
            _this.name = 'InternalUndefinedVariableError';
            _this.variableName = variableName;
            return _this;
        }
        return InternalUndefinedVariableError;
    }(Error));
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

    var Context = /** @class */ (function () {
        function Context(env, opts, sync) {
            if (env === void 0) { env = {}; }
            if (opts === void 0) { opts = defaultOptions; }
            if (sync === void 0) { sync = false; }
            /**
             * insert a Context-level empty scope,
             * for tags like {% capture %} {% assign %} to operate
             */
            this.scopes = [{}];
            this.registers = {};
            this.sync = sync;
            this.opts = opts;
            this.globals = opts.globals;
            this.environments = env;
        }
        Context.prototype.getRegister = function (key) {
            return (this.registers[key] = this.registers[key] || {});
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
                    throw new InternalUndefinedVariableError(path);
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
        if (isFunction(obj[key]))
            return obj[key]();
        if (obj instanceof Drop) {
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

    function assert(predicate, message) {
        if (!predicate) {
            var msg = typeof message === 'function'
                ? message()
                : (message || "expect " + predicate + " to be true");
            throw new AssertionError(msg);
        }
    }

    var LookupType;
    (function (LookupType) {
        LookupType["Partials"] = "partials";
        LookupType["Layouts"] = "layouts";
        LookupType["Root"] = "root";
    })(LookupType || (LookupType = {}));
    var Loader = /** @class */ (function () {
        function Loader(options) {
            this.options = options;
            if (options.relativeReference) {
                var sep = options.fs.sep;
                assert(sep, '`fs.sep` is required for relative reference');
                var rRelativePath_1 = new RegExp(['.' + sep, '..' + sep, './', '../'].map(function (prefix) { return escapeRegex(prefix); }).join('|'));
                this.shouldLoadRelative = function (referencedFile) { return rRelativePath_1.test(referencedFile); };
            }
            else {
                this.shouldLoadRelative = function (referencedFile) { return false; };
            }
            this.contains = this.options.fs.contains || (function () { return true; });
        }
        Loader.prototype.lookup = function (file, type, sync, currentFile) {
            var fs, dirs, _a, _b, filepath, _c, e_1_1;
            var e_1, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        fs = this.options.fs;
                        dirs = this.options[type];
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 8, 9, 10]);
                        _a = __values(this.candidates(file, dirs, currentFile, type !== LookupType.Root)), _b = _a.next();
                        _e.label = 2;
                    case 2:
                        if (!!_b.done) return [3 /*break*/, 7];
                        filepath = _b.value;
                        if (!sync) return [3 /*break*/, 3];
                        _c = fs.existsSync(filepath);
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, fs.exists(filepath)];
                    case 4:
                        _c = _e.sent();
                        _e.label = 5;
                    case 5:
                        if (_c)
                            return [2 /*return*/, filepath];
                        _e.label = 6;
                    case 6:
                        _b = _a.next();
                        return [3 /*break*/, 2];
                    case 7: return [3 /*break*/, 10];
                    case 8:
                        e_1_1 = _e.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 10];
                    case 9:
                        try {
                            if (_b && !_b.done && (_d = _a.return)) _d.call(_a);
                        }
                        finally { if (e_1) throw e_1.error; }
                        return [7 /*endfinally*/];
                    case 10: throw this.lookupError(file, dirs);
                }
            });
        };
        Loader.prototype.candidates = function (file, dirs, currentFile, enforceRoot) {
            var _a, fs, extname, referenced, dirs_1, dirs_1_1, dir, e_2_1, dirs_2, dirs_2_1, dir, referenced, e_3_1, filepath;
            var e_2, _b, e_3, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _a = this.options, fs = _a.fs, extname = _a.extname;
                        if (!(this.shouldLoadRelative(file) && currentFile)) return [3 /*break*/, 8];
                        referenced = fs.resolve(this.dirname(currentFile), file, extname);
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 6, 7, 8]);
                        dirs_1 = __values(dirs), dirs_1_1 = dirs_1.next();
                        _d.label = 2;
                    case 2:
                        if (!!dirs_1_1.done) return [3 /*break*/, 5];
                        dir = dirs_1_1.value;
                        if (!(!enforceRoot || this.contains(dir, referenced))) return [3 /*break*/, 4];
                        // the relatively referenced file is within one of root dirs
                        return [4 /*yield*/, referenced];
                    case 3:
                        // the relatively referenced file is within one of root dirs
                        _d.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        dirs_1_1 = dirs_1.next();
                        return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 8];
                    case 6:
                        e_2_1 = _d.sent();
                        e_2 = { error: e_2_1 };
                        return [3 /*break*/, 8];
                    case 7:
                        try {
                            if (dirs_1_1 && !dirs_1_1.done && (_b = dirs_1.return)) _b.call(dirs_1);
                        }
                        finally { if (e_2) throw e_2.error; }
                        return [7 /*endfinally*/];
                    case 8:
                        _d.trys.push([8, 13, 14, 15]);
                        dirs_2 = __values(dirs), dirs_2_1 = dirs_2.next();
                        _d.label = 9;
                    case 9:
                        if (!!dirs_2_1.done) return [3 /*break*/, 12];
                        dir = dirs_2_1.value;
                        referenced = fs.resolve(dir, file, extname);
                        if (!(!enforceRoot || this.contains(dir, referenced))) return [3 /*break*/, 11];
                        return [4 /*yield*/, referenced];
                    case 10:
                        _d.sent();
                        _d.label = 11;
                    case 11:
                        dirs_2_1 = dirs_2.next();
                        return [3 /*break*/, 9];
                    case 12: return [3 /*break*/, 15];
                    case 13:
                        e_3_1 = _d.sent();
                        e_3 = { error: e_3_1 };
                        return [3 /*break*/, 15];
                    case 14:
                        try {
                            if (dirs_2_1 && !dirs_2_1.done && (_c = dirs_2.return)) _c.call(dirs_2);
                        }
                        finally { if (e_3) throw e_3.error; }
                        return [7 /*endfinally*/];
                    case 15:
                        if (!(fs.fallback !== undefined)) return [3 /*break*/, 17];
                        filepath = fs.fallback(file);
                        if (!(filepath !== undefined)) return [3 /*break*/, 17];
                        return [4 /*yield*/, filepath];
                    case 16:
                        _d.sent();
                        _d.label = 17;
                    case 17: return [2 /*return*/];
                }
            });
        };
        Loader.prototype.dirname = function (path) {
            var fs = this.options.fs;
            assert(fs.dirname, '`fs.dirname` is required for relative reference');
            return fs.dirname(path);
        };
        Loader.prototype.lookupError = function (file, roots) {
            var err = new Error('ENOENT');
            err.message = "ENOENT: Failed to lookup \"" + file + "\" in \"" + roots + "\"";
            err.code = 'ENOENT';
            return err;
        };
        return Loader;
    }());

    var SimpleEmitter = /** @class */ (function () {
        function SimpleEmitter() {
            this.buffer = '';
        }
        SimpleEmitter.prototype.write = function (html) {
            this.buffer += stringify(html);
        };
        return SimpleEmitter;
    }());

    var StreamedEmitter = /** @class */ (function () {
        function StreamedEmitter() {
            this.buffer = '';
            this.stream = null;
            throw new Error('streaming not supported in browser');
        }
        return StreamedEmitter;
    }());

    function createResolvedThenable(value) {
        var ret = {
            then: function (resolve) { return resolve(value); },
            catch: function () { return ret; }
        };
        return ret;
    }
    function createRejectedThenable(err) {
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
    function isAsyncIterator(val) {
        return val && isFunction(val.next) && isFunction(val.throw) && isFunction(val.return);
    }
    // convert an async iterator to a thenable (Promise compatible)
    function toThenable(val) {
        if (isThenable(val))
            return val;
        if (isAsyncIterator(val))
            return reduce();
        return createResolvedThenable(val);
        function reduce(prev) {
            var state;
            try {
                state = val.next(prev);
            }
            catch (err) {
                return createRejectedThenable(err);
            }
            if (state.done)
                return createResolvedThenable(state.value);
            return toThenable(state.value).then(reduce, function (err) {
                var state;
                try {
                    state = val.throw(err);
                }
                catch (e) {
                    return createRejectedThenable(e);
                }
                if (state.done)
                    return createResolvedThenable(state.value);
                return reduce(state.value);
            });
        }
    }
    function toPromise(val) {
        return Promise.resolve(toThenable(val));
    }
    // get the value of async iterator in synchronous manner
    function toValue$1(val) {
        var ret;
        toThenable(val)
            .then(function (x) {
            ret = x;
            return createResolvedThenable(ret);
        })
            .catch(function (err) {
            throw err;
        });
        return ret;
    }

    var KeepingTypeEmitter = /** @class */ (function () {
        function KeepingTypeEmitter() {
            this.buffer = '';
        }
        KeepingTypeEmitter.prototype.write = function (html) {
            html = toValue(html);
            // This will only preserve the type if the value is isolated.
            // I.E:
            // {{ my-port }} -> 42
            // {{ my-host }}:{{ my-port }} -> 'host:42'
            if (typeof html !== 'string' && this.buffer === '') {
                this.buffer = html;
            }
            else {
                this.buffer = stringify(this.buffer) + stringify(html);
            }
        };
        return KeepingTypeEmitter;
    }());

    var Render = /** @class */ (function () {
        function Render() {
        }
        Render.prototype.renderTemplatesToNodeStream = function (templates, ctx) {
            var _this = this;
            var emitter = new StreamedEmitter();
            Promise.resolve().then(function () { return toThenable(_this.renderTemplates(templates, ctx, emitter)); })
                .then(function () { return emitter.end(); }, function (err) { return emitter.error(err); });
            return emitter.stream;
        };
        Render.prototype.renderTemplates = function (templates, ctx, emitter) {
            var templates_1, templates_1_1, tpl, html, e_1, err, e_2_1;
            var e_2, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!emitter) {
                            emitter = ctx.opts.keepOutputType ? new KeepingTypeEmitter() : new SimpleEmitter();
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 8, 9, 10]);
                        templates_1 = __values(templates), templates_1_1 = templates_1.next();
                        _b.label = 2;
                    case 2:
                        if (!!templates_1_1.done) return [3 /*break*/, 7];
                        tpl = templates_1_1.value;
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, tpl.render(ctx, emitter)
                            // if not, it'll return an `html`, write to the emitter for it
                        ];
                    case 4:
                        html = _b.sent();
                        // if not, it'll return an `html`, write to the emitter for it
                        html && emitter.write(html);
                        if (emitter['break'] || emitter['continue'])
                            return [3 /*break*/, 7];
                        return [3 /*break*/, 6];
                    case 5:
                        e_1 = _b.sent();
                        err = RenderError.is(e_1) ? e_1 : new RenderError(e_1, tpl);
                        throw err;
                    case 6:
                        templates_1_1 = templates_1.next();
                        return [3 /*break*/, 2];
                    case 7: return [3 /*break*/, 10];
                    case 8:
                        e_2_1 = _b.sent();
                        e_2 = { error: e_2_1 };
                        return [3 /*break*/, 10];
                    case 9:
                        try {
                            if (templates_1_1 && !templates_1_1.done && (_a = templates_1.return)) _a.call(templates_1);
                        }
                        finally { if (e_2) throw e_2.error; }
                        return [7 /*endfinally*/];
                    case 10: return [2 /*return*/, emitter.buffer];
                }
            });
        };
        return Render;
    }());

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
    })(exports.TokenKind || (exports.TokenKind = {}));

    function isDelimitedToken(val) {
        return !!(getKind(val) & exports.TokenKind.Delimited);
    }
    function isOperatorToken(val) {
        return getKind(val) === exports.TokenKind.Operator;
    }
    function isHTMLToken(val) {
        return getKind(val) === exports.TokenKind.HTML;
    }
    function isOutputToken(val) {
        return getKind(val) === exports.TokenKind.Output;
    }
    function isTagToken(val) {
        return getKind(val) === exports.TokenKind.Tag;
    }
    function isQuotedToken(val) {
        return getKind(val) === exports.TokenKind.Quoted;
    }
    function isLiteralToken(val) {
        return getKind(val) === exports.TokenKind.Literal;
    }
    function isNumberToken(val) {
        return getKind(val) === exports.TokenKind.Number;
    }
    function isPropertyAccessToken(val) {
        return getKind(val) === exports.TokenKind.PropertyAccess;
    }
    function isWordToken(val) {
        return getKind(val) === exports.TokenKind.Word;
    }
    function isRangeToken(val) {
        return getKind(val) === exports.TokenKind.Range;
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
            return h ? (h.call(this, arg), true) : false;
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

    var NullDrop = /** @class */ (function (_super) {
        __extends(NullDrop, _super);
        function NullDrop() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        NullDrop.prototype.equals = function (value) {
            return isNil(toValue(value));
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

    var EmptyDrop = /** @class */ (function (_super) {
        __extends(EmptyDrop, _super);
        function EmptyDrop() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        EmptyDrop.prototype.equals = function (value) {
            if (value instanceof EmptyDrop)
                return false;
            value = toValue(value);
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

    var nil = new NullDrop();
    var literalValues = {
        'true': true,
        'false': false,
        'nil': nil,
        'null': nil,
        'empty': new EmptyDrop(),
        'blank': new BlankDrop()
    };

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

    var Expression = /** @class */ (function () {
        function Expression(tokens) {
            this.postfix = __spread(toPostfix(tokens));
        }
        Expression.prototype.evaluate = function (ctx, lenient) {
            var operands, _a, _b, token, r, l, result, _c, _d, e_1_1;
            var e_1, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        assert(ctx, 'unable to evaluate: context not defined');
                        operands = [];
                        _f.label = 1;
                    case 1:
                        _f.trys.push([1, 9, 10, 11]);
                        _a = __values(this.postfix), _b = _a.next();
                        _f.label = 2;
                    case 2:
                        if (!!_b.done) return [3 /*break*/, 8];
                        token = _b.value;
                        if (!isOperatorToken(token)) return [3 /*break*/, 5];
                        return [4 /*yield*/, operands.pop()];
                    case 3:
                        r = _f.sent();
                        return [4 /*yield*/, operands.pop()];
                    case 4:
                        l = _f.sent();
                        result = evalOperatorToken(ctx.opts.operators, token, l, r, ctx);
                        operands.push(result);
                        return [3 /*break*/, 7];
                    case 5:
                        _d = (_c = operands).push;
                        return [4 /*yield*/, evalToken(token, ctx, lenient && this.postfix.length === 1)];
                    case 6:
                        _d.apply(_c, [_f.sent()]);
                        _f.label = 7;
                    case 7:
                        _b = _a.next();
                        return [3 /*break*/, 2];
                    case 8: return [3 /*break*/, 11];
                    case 9:
                        e_1_1 = _f.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 11];
                    case 10:
                        try {
                            if (_b && !_b.done && (_e = _a.return)) _e.call(_a);
                        }
                        finally { if (e_1) throw e_1.error; }
                        return [7 /*endfinally*/];
                    case 11: return [2 /*return*/, operands[0]];
                }
            });
        };
        return Expression;
    }());
    function evalToken(token, ctx, lenient) {
        if (lenient === void 0) { lenient = false; }
        if (isPropertyAccessToken(token))
            return evalPropertyAccessToken(token, ctx, lenient);
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
    function evalPropertyAccessToken(token, ctx, lenient) {
        var props = token.props.map(function (prop) { return evalToken(prop, ctx, false); });
        try {
            return ctx.get(__spread([token.propertyName], props));
        }
        catch (e) {
            if (lenient && e.name === 'InternalUndefinedVariableError')
                return null;
            throw (new UndefinedVariableError(e, token));
        }
    }
    function evalNumberToken(token) {
        var str = token.whole.content + '.' + (token.decimal ? token.decimal.content : '');
        return Number(str);
    }
    function evalQuotedToken(token) {
        return parseStringLiteral(token.getText());
    }
    function evalOperatorToken(operators, token, lhs, rhs, ctx) {
        var impl = operators[token.operator];
        return impl(lhs, rhs, ctx);
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

    function whiteSpaceCtrl(tokens, options) {
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

    var NumberToken = /** @class */ (function (_super) {
        __extends(NumberToken, _super);
        function NumberToken(whole, decimal) {
            var _this = _super.call(this, exports.TokenKind.Number, whole.input, whole.begin, decimal ? decimal.end : whole.end, whole.file) || this;
            _this.whole = whole;
            _this.decimal = decimal;
            return _this;
        }
        return NumberToken;
    }(Token));

    var IdentifierToken = /** @class */ (function (_super) {
        __extends(IdentifierToken, _super);
        function IdentifierToken(input, begin, end, file) {
            var _this = _super.call(this, exports.TokenKind.Word, input, begin, end, file) || this;
            _this.input = input;
            _this.begin = begin;
            _this.end = end;
            _this.file = file;
            _this.content = _this.getText();
            return _this;
        }
        IdentifierToken.prototype.isNumber = function (allowSign) {
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
        return IdentifierToken;
    }(Token));

    var LiteralToken = /** @class */ (function (_super) {
        __extends(LiteralToken, _super);
        function LiteralToken(input, begin, end, file) {
            var _this = _super.call(this, exports.TokenKind.Literal, input, begin, end, file) || this;
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
            var _this = _super.call(this, exports.TokenKind.Operator, input, begin, end, file) || this;
            _this.input = input;
            _this.begin = begin;
            _this.end = end;
            _this.file = file;
            _this.operator = _this.getText();
            return _this;
        }
        OperatorToken.prototype.getPrecedence = function () {
            var key = this.getText();
            return key in precedence ? precedence[key] : 1;
        };
        return OperatorToken;
    }(Token));

    var PropertyAccessToken = /** @class */ (function (_super) {
        __extends(PropertyAccessToken, _super);
        function PropertyAccessToken(variable, props, end) {
            var _this = _super.call(this, exports.TokenKind.PropertyAccess, variable.input, variable.begin, end, variable.file) || this;
            _this.variable = variable;
            _this.props = props;
            _this.propertyName = _this.variable instanceof IdentifierToken
                ? _this.variable.getText()
                : parseStringLiteral(_this.variable.getText());
            return _this;
        }
        return PropertyAccessToken;
    }(Token));

    var FilterToken = /** @class */ (function (_super) {
        __extends(FilterToken, _super);
        function FilterToken(name, args, input, begin, end, file) {
            var _this = _super.call(this, exports.TokenKind.Filter, input, begin, end, file) || this;
            _this.name = name;
            _this.args = args;
            return _this;
        }
        return FilterToken;
    }(Token));

    var HashToken = /** @class */ (function (_super) {
        __extends(HashToken, _super);
        function HashToken(input, begin, end, name, value, file) {
            var _this = _super.call(this, exports.TokenKind.Hash, input, begin, end, file) || this;
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
            var _this = _super.call(this, exports.TokenKind.Quoted, input, begin, end, file) || this;
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
            var _this = _super.call(this, exports.TokenKind.HTML, input, begin, end, file) || this;
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

    var RangeToken = /** @class */ (function (_super) {
        __extends(RangeToken, _super);
        function RangeToken(input, begin, end, lhs, rhs, file) {
            var _this = _super.call(this, exports.TokenKind.Range, input, begin, end, file) || this;
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
            _this = _super.call(this, exports.TokenKind.Output, value, input, begin, end, trimOutputLeft, trimOutputRight, file) || this;
            return _this;
        }
        return OutputToken;
    }(DelimitedToken));

    function matchOperator(str, begin, trie, end) {
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
        if (info['needBoundary'] && (TYPES[str.charCodeAt(i)] & IDENTIFIER))
            return -1;
        return i;
    }

    var Tokenizer = /** @class */ (function () {
        function Tokenizer(input, trie, file) {
            if (file === void 0) { file = ''; }
            this.input = input;
            this.trie = trie;
            this.file = file;
            this.p = 0;
            this.rawBeginAt = -1;
            this.N = input.length;
        }
        Tokenizer.prototype.readExpression = function () {
            return new Expression(this.readExpressionTokens());
        };
        Tokenizer.prototype.readExpressionTokens = function () {
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
            var end = matchOperator(this.input, this.p, this.trie, this.p + 8);
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
            var name = this.readIdentifier();
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
            if (this.rawBeginAt > -1)
                return this.readEndrawOrRawContent(options);
            if (this.match(tagDelimiterLeft))
                return this.readTagToken(options);
            if (this.match(outputDelimiterLeft))
                return this.readOutputToken(options);
            return this.readHTMLToken(options);
        };
        Tokenizer.prototype.readHTMLToken = function (options) {
            var begin = this.p;
            while (this.p < this.N) {
                var tagDelimiterLeft = options.tagDelimiterLeft, outputDelimiterLeft = options.outputDelimiterLeft;
                if (this.match(tagDelimiterLeft))
                    break;
                if (this.match(outputDelimiterLeft))
                    break;
                ++this.p;
            }
            return new HTMLToken(this.input, begin, this.p, this.file);
        };
        Tokenizer.prototype.readTagToken = function (options) {
            if (options === void 0) { options = defaultOptions; }
            var _a = this, file = _a.file, input = _a.input;
            var begin = this.p;
            if (this.readToDelimiter(options.tagDelimiterRight) === -1) {
                throw this.mkError("tag " + this.snapshot(begin) + " not closed", begin);
            }
            var token = new TagToken(input, begin, this.p, options, file);
            if (token.name === 'raw')
                this.rawBeginAt = begin;
            return token;
        };
        Tokenizer.prototype.readToDelimiter = function (delimiter) {
            while (this.p < this.N) {
                if ((this.peekType() & QUOTE)) {
                    this.readQuoted();
                    continue;
                }
                ++this.p;
                if (this.rmatch(delimiter))
                    return this.p;
            }
            return -1;
        };
        Tokenizer.prototype.readOutputToken = function (options) {
            if (options === void 0) { options = defaultOptions; }
            var _a = this, file = _a.file, input = _a.input;
            var outputDelimiterRight = options.outputDelimiterRight;
            var begin = this.p;
            if (this.readToDelimiter(outputDelimiterRight) === -1) {
                throw this.mkError("output " + this.snapshot(begin) + " not closed", begin);
            }
            return new OutputToken(input, begin, this.p, options, file);
        };
        Tokenizer.prototype.readEndrawOrRawContent = function (options) {
            var tagDelimiterLeft = options.tagDelimiterLeft, tagDelimiterRight = options.tagDelimiterRight;
            var begin = this.p;
            var leftPos = this.readTo(tagDelimiterLeft) - tagDelimiterLeft.length;
            while (this.p < this.N) {
                if (this.readIdentifier().getText() !== 'endraw') {
                    leftPos = this.readTo(tagDelimiterLeft) - tagDelimiterLeft.length;
                    continue;
                }
                while (this.p <= this.N) {
                    if (this.rmatch(tagDelimiterRight)) {
                        var end = this.p;
                        if (begin === leftPos) {
                            this.rawBeginAt = -1;
                            return new TagToken(this.input, begin, end, options, this.file);
                        }
                        else {
                            this.p = leftPos;
                            return new HTMLToken(this.input, begin, leftPos, this.file);
                        }
                    }
                    if (this.rmatch(tagDelimiterLeft))
                        break;
                    this.p++;
                }
            }
            throw this.mkError("raw " + this.snapshot(this.rawBeginAt) + " not closed", begin);
        };
        Tokenizer.prototype.mkError = function (msg, begin) {
            return new TokenizationError(msg, new IdentifierToken(this.input, begin, this.N, this.file));
        };
        Tokenizer.prototype.snapshot = function (begin) {
            if (begin === void 0) { begin = this.p; }
            return JSON.stringify(ellipsis(this.input.slice(begin), 16));
        };
        /**
         * @deprecated
         */
        Tokenizer.prototype.readWord = function () {
            console.warn('Tokenizer#readWord() will be removed, use #readIdentifier instead');
            return this.readIdentifier();
        };
        Tokenizer.prototype.readIdentifier = function () {
            this.skipBlank();
            var begin = this.p;
            while (this.peekType() & IDENTIFIER)
                ++this.p;
            return new IdentifierToken(this.input, begin, this.p, this.file);
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
            var name = this.readIdentifier();
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
                if (this.rmatch(end))
                    return this.p;
            }
            return -1;
        };
        Tokenizer.prototype.readValue = function () {
            var value = this.readQuoted() || this.readRange();
            if (value)
                return value;
            if (this.peek() === '[') {
                this.p++;
                var prop = this.readQuoted();
                if (!prop)
                    return;
                if (this.peek() !== ']')
                    return;
                this.p++;
                return new PropertyAccessToken(prop, [], this.p);
            }
            var variable = this.readIdentifier();
            if (!variable.size())
                return;
            var isNumber = variable.isNumber(true);
            var props = [];
            while (true) {
                if (this.peek() === '[') {
                    isNumber = false;
                    this.p++;
                    var prop = this.readValue() || new IdentifierToken(this.input, this.p, this.p, this.file);
                    this.readTo(']');
                    props.push(prop);
                }
                else if (this.peek() === '.' && this.peek(1) !== '.') { // skip range syntax
                    this.p++;
                    var prop = this.readIdentifier();
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
            return new IdentifierToken(this.input, begin, this.p, this.file);
        };
        Tokenizer.prototype.match = function (word) {
            for (var i = 0; i < word.length; i++) {
                if (word[i] !== this.input[this.p + i])
                    return false;
            }
            return true;
        };
        Tokenizer.prototype.rmatch = function (pattern) {
            for (var i = 0; i < pattern.length; i++) {
                if (pattern[pattern.length - 1 - i] !== this.input[this.p - 1 - i])
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

    var TagToken = /** @class */ (function (_super) {
        __extends(TagToken, _super);
        function TagToken(input, begin, end, options, file) {
            var _this = this;
            var trimTagLeft = options.trimTagLeft, trimTagRight = options.trimTagRight, tagDelimiterLeft = options.tagDelimiterLeft, tagDelimiterRight = options.tagDelimiterRight;
            var value = input.slice(begin + tagDelimiterLeft.length, end - tagDelimiterRight.length);
            _this = _super.call(this, exports.TokenKind.Tag, value, input, begin, end, trimTagLeft, trimTagRight, file) || this;
            var tokenizer = new Tokenizer(_this.content, options.operatorsTrie);
            _this.name = tokenizer.readIdentifier().getText();
            if (!_this.name)
                throw new TokenizationError("illegal tag syntax", _this);
            tokenizer.skipBlank();
            _this.args = tokenizer.remaining();
            return _this;
        }
        return TagToken;
    }(DelimitedToken));

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
            var tokenizer = new Tokenizer(markup, {});
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
            var hash, _a, _b, key, _c, _d, _e, e_2_1;
            var e_2, _f;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        hash = {};
                        _g.label = 1;
                    case 1:
                        _g.trys.push([1, 8, 9, 10]);
                        _a = __values(Object.keys(this.hash)), _b = _a.next();
                        _g.label = 2;
                    case 2:
                        if (!!_b.done) return [3 /*break*/, 7];
                        key = _b.value;
                        _c = hash;
                        _d = key;
                        if (!(this.hash[key] === undefined)) return [3 /*break*/, 3];
                        _e = true;
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, evalToken(this.hash[key], ctx)];
                    case 4:
                        _e = _g.sent();
                        _g.label = 5;
                    case 5:
                        _c[_d] = _e;
                        _g.label = 6;
                    case 6:
                        _b = _a.next();
                        return [3 /*break*/, 2];
                    case 7: return [3 /*break*/, 10];
                    case 8:
                        e_2_1 = _g.sent();
                        e_2 = { error: e_2_1 };
                        return [3 /*break*/, 10];
                    case 9:
                        try {
                            if (_b && !_b.done && (_f = _a.return)) _f.call(_a);
                        }
                        finally { if (e_2) throw e_2.error; }
                        return [7 /*endfinally*/];
                    case 10: return [2 /*return*/, hash];
                }
            });
        };
        return Hash;
    }());

    function isKeyValuePair(arr) {
        return isArray(arr);
    }

    var Filter = /** @class */ (function () {
        function Filter(name, impl, args, liquid) {
            this.name = name;
            this.impl = impl || identify;
            this.args = args;
            this.liquid = liquid;
        }
        Filter.prototype.render = function (value, context) {
            var e_1, _a;
            var argv = [];
            try {
                for (var _b = __values(this.args), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var arg = _c.value;
                    if (isKeyValuePair(arg))
                        argv.push([arg[0], evalToken(arg[1], context)]);
                    else
                        argv.push(evalToken(arg, context));
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return this.impl.apply({ context: context, liquid: this.liquid }, __spread([value], argv));
        };
        return Filter;
    }());

    var Value = /** @class */ (function () {
        /**
         * @param str the value to be valuated, eg.: "foobar" | truncate: 3
         */
        function Value(str, liquid) {
            this.filters = [];
            var tokenizer = new Tokenizer(str, liquid.options.operatorsTrie);
            this.initial = tokenizer.readExpression();
            this.filters = tokenizer.readFilters().map(function (_a) {
                var name = _a.name, args = _a.args;
                return new Filter(name, liquid.filters.get(name), args, liquid);
            });
        }
        Value.prototype.value = function (ctx, lenient) {
            var val, _a, _b, filter, e_1_1;
            var e_1, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        lenient = lenient || (ctx.opts.lenientIf && this.filters.length > 0 && this.filters[0].name === 'default');
                        return [4 /*yield*/, this.initial.evaluate(ctx, lenient)];
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
        return Tag;
    }(TemplateImpl));

    var Output = /** @class */ (function (_super) {
        __extends(Output, _super);
        function Output(token, liquid) {
            var _this = _super.call(this, token) || this;
            _this.value = new Value(token.content, liquid);
            return _this;
        }
        Output.prototype.render = function (ctx, emitter) {
            var val;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.value.value(ctx, false)];
                    case 1:
                        val = _a.sent();
                        emitter.write(val);
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
            this.cache = this.liquid.options.cache;
            this.fs = this.liquid.options.fs;
            this.parseFile = this.cache ? this._parseFileCached : this._parseFile;
            this.loader = new Loader(this.liquid.options);
        }
        Parser.prototype.parse = function (html, filepath) {
            var tokenizer = new Tokenizer(html, this.liquid.options.operatorsTrie, filepath);
            var tokens = tokenizer.readTopLevelTokens(this.liquid.options);
            return this.parseTokens(tokens);
        };
        Parser.prototype.parseTokens = function (tokens) {
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
                    return new Output(token, this.liquid);
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
        Parser.prototype._parseFileCached = function (file, sync, type, currentFile) {
            var key, tpls, task, e_1;
            if (type === void 0) { type = LookupType.Root; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = this.loader.shouldLoadRelative(file)
                            ? currentFile + ',' + file
                            : type + ':' + file;
                        return [4 /*yield*/, this.cache.read(key)];
                    case 1:
                        tpls = _a.sent();
                        if (tpls)
                            return [2 /*return*/, tpls];
                        task = toThenable(this._parseFile(file, sync, type, currentFile));
                        this.cache.write(key, task);
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, task];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4:
                        e_1 = _a.sent();
                        // remove cached task if failed
                        this.cache.remove(key);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        };
        Parser.prototype._parseFile = function (file, sync, type, currentFile) {
            var filepath, _a, _b, _c;
            if (type === void 0) { type = LookupType.Root; }
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, this.loader.lookup(file, type, sync, currentFile)];
                    case 1:
                        filepath = _d.sent();
                        _b = (_a = this.liquid).parse;
                        if (!sync) return [3 /*break*/, 2];
                        _c = this.fs.readFileSync(filepath);
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, this.fs.readFile(filepath)];
                    case 3:
                        _c = _d.sent();
                        _d.label = 4;
                    case 4: return [2 /*return*/, _b.apply(_a, [_c, filepath])];
                }
            });
        };
        return Parser;
    }());

    var assign = {
        parse: function (token) {
            var tokenizer = new Tokenizer(token.args, this.liquid.options.operatorsTrie);
            this.key = tokenizer.readIdentifier().content;
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
        function ForloopDrop(length, collection, variable) {
            var _this = _super.call(this) || this;
            _this.i = 0;
            _this.length = length;
            _this.name = variable + "-" + collection;
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

    var MODIFIERS = ['offset', 'limit', 'reversed'];
    var For = {
        type: 'block',
        parse: function (token, remainTokens) {
            var _this = this;
            var tokenizer = new Tokenizer(token.args, this.liquid.options.operatorsTrie);
            var variable = tokenizer.readIdentifier();
            var inStr = tokenizer.readIdentifier();
            var collection = tokenizer.readValue();
            assert(variable.size() && inStr.content === 'in' && collection, function () { return "illegal tag: " + token.getText(); });
            this.variable = variable.content;
            this.collection = collection;
            this.hash = new Hash(tokenizer.remaining());
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
            var r, collection, _a, hash, modifiers, scope, collection_1, collection_1_1, item, e_1_1;
            var e_1, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        r = this.liquid.renderer;
                        _a = toEnumerable;
                        return [4 /*yield*/, evalToken(this.collection, ctx)];
                    case 1:
                        collection = _a.apply(void 0, [_c.sent()]);
                        if (!!collection.length) return [3 /*break*/, 3];
                        return [4 /*yield*/, r.renderTemplates(this.elseTemplates, ctx, emitter)];
                    case 2:
                        _c.sent();
                        return [2 /*return*/];
                    case 3: return [4 /*yield*/, this.hash.render(ctx)];
                    case 4:
                        hash = _c.sent();
                        modifiers = this.liquid.options.orderedFilterParameters
                            ? Object.keys(hash).filter(function (x) { return MODIFIERS.includes(x); })
                            : MODIFIERS.filter(function (x) { return hash[x] !== undefined; });
                        collection = modifiers.reduce(function (collection, modifier) {
                            if (modifier === 'offset')
                                return offset(collection, hash['offset']);
                            if (modifier === 'limit')
                                return limit(collection, hash['limit']);
                            return reversed(collection);
                        }, collection);
                        scope = { forloop: new ForloopDrop(collection.length, this.collection.getText(), this.variable) };
                        ctx.push(scope);
                        _c.label = 5;
                    case 5:
                        _c.trys.push([5, 10, 11, 12]);
                        collection_1 = __values(collection), collection_1_1 = collection_1.next();
                        _c.label = 6;
                    case 6:
                        if (!!collection_1_1.done) return [3 /*break*/, 9];
                        item = collection_1_1.value;
                        scope[this.variable] = item;
                        return [4 /*yield*/, r.renderTemplates(this.templates, ctx, emitter)];
                    case 7:
                        _c.sent();
                        if (emitter['break']) {
                            emitter['break'] = false;
                            return [3 /*break*/, 9];
                        }
                        emitter['continue'] = false;
                        scope.forloop.next();
                        _c.label = 8;
                    case 8:
                        collection_1_1 = collection_1.next();
                        return [3 /*break*/, 6];
                    case 9: return [3 /*break*/, 12];
                    case 10:
                        e_1_1 = _c.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 12];
                    case 11:
                        try {
                            if (collection_1_1 && !collection_1_1.done && (_b = collection_1.return)) _b.call(collection_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                        return [7 /*endfinally*/];
                    case 12:
                        ctx.pop();
                        return [2 /*return*/];
                }
            });
        }
    };
    function reversed(arr) {
        return __spread(arr).reverse();
    }
    function offset(arr, count) {
        return arr.slice(count);
    }
    function limit(arr, count) {
        return arr.slice(0, count);
    }

    var capture = {
        parse: function (tagToken, remainTokens) {
            var _this = this;
            var tokenizer = new Tokenizer(tagToken.args, this.liquid.options.operatorsTrie);
            this.variable = readVariableName(tokenizer);
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
    function readVariableName(tokenizer) {
        var word = tokenizer.readIdentifier().content;
        if (word)
            return word;
        var quoted = tokenizer.readQuoted();
        if (quoted)
            return evalQuotedToken(quoted);
    }

    var Case = {
        parse: function (tagToken, remainTokens) {
            var _this = this;
            this.cond = new Value(tagToken.args, this.liquid);
            this.cases = [];
            this.elseTemplates = [];
            var p = [];
            var stream = this.liquid.parser.parseStream(remainTokens)
                .on('tag:when', function (token) {
                p = [];
                var tokenizer = new Tokenizer(token.args, _this.liquid.options.operatorsTrie);
                while (!tokenizer.end()) {
                    var value = tokenizer.readValue();
                    _this.cases.push({
                        val: value,
                        templates: p
                    });
                    tokenizer.readTo(',');
                }
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
            var r, cond, _a, _b, _c, branch, val, e_1_1;
            var e_1, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        r = this.liquid.renderer;
                        _a = toValue;
                        return [4 /*yield*/, this.cond.value(ctx, ctx.opts.lenientIf)];
                    case 1:
                        cond = _a.apply(void 0, [_e.sent()]);
                        _e.label = 2;
                    case 2:
                        _e.trys.push([2, 7, 8, 9]);
                        _b = __values(this.cases), _c = _b.next();
                        _e.label = 3;
                    case 3:
                        if (!!_c.done) return [3 /*break*/, 6];
                        branch = _c.value;
                        val = evalToken(branch.val, ctx, ctx.opts.lenientIf);
                        if (!(val === cond)) return [3 /*break*/, 5];
                        return [4 /*yield*/, r.renderTemplates(branch.templates, ctx, emitter)];
                    case 4:
                        _e.sent();
                        return [2 /*return*/];
                    case 5:
                        _c = _b.next();
                        return [3 /*break*/, 3];
                    case 6: return [3 /*break*/, 9];
                    case 7:
                        e_1_1 = _e.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 9];
                    case 8:
                        try {
                            if (_c && !_c.done && (_d = _b.return)) _d.call(_b);
                        }
                        finally { if (e_1) throw e_1.error; }
                        return [7 /*endfinally*/];
                    case 9: return [4 /*yield*/, r.renderTemplates(this.elseTemplates, ctx, emitter)];
                    case 10:
                        _e.sent();
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

    var render = {
        parseFilePath: parseFilePath,
        renderFilePath: renderFilePath,
        parse: function (token) {
            var args = token.args;
            var tokenizer = new Tokenizer(args, this.liquid.options.operatorsTrie);
            this['file'] = this.parseFilePath(tokenizer, this.liquid);
            this['currentFile'] = token.file;
            while (!tokenizer.end()) {
                tokenizer.skipBlank();
                var begin = tokenizer.p;
                var keyword = tokenizer.readIdentifier();
                if (keyword.content === 'with' || keyword.content === 'for') {
                    tokenizer.skipBlank();
                    // can be normal key/value pair, like "with: true"
                    if (tokenizer.peek() !== ':') {
                        var value = tokenizer.readValue();
                        // can be normal key, like "with,"
                        if (value) {
                            var beforeAs = tokenizer.p;
                            var asStr = tokenizer.readIdentifier();
                            var alias = void 0;
                            if (asStr.content === 'as')
                                alias = tokenizer.readIdentifier();
                            else
                                tokenizer.p = beforeAs;
                            this[keyword.content] = { value: value, alias: alias && alias.content };
                            tokenizer.skipBlank();
                            if (tokenizer.peek() === ',')
                                tokenizer.advance();
                            // matched!
                            continue;
                        }
                    }
                }
                /**
                 * restore cursor if with/for not matched
                 */
                tokenizer.p = begin;
                break;
            }
            this.hash = new Hash(tokenizer.remaining());
        },
        render: function (ctx, emitter) {
            var _a, liquid, hash, filepath, childCtx, scope, _b, _c, _d, value, alias, _e, value, alias, collection, collection_1, collection_1_1, item, templates, e_1_1, templates;
            var e_1, _f;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        _a = this, liquid = _a.liquid, hash = _a.hash;
                        return [4 /*yield*/, this.renderFilePath(this['file'], ctx, liquid)];
                    case 1:
                        filepath = _g.sent();
                        assert(filepath, function () { return "illegal filename \"" + filepath + "\""; });
                        childCtx = new Context({}, ctx.opts, ctx.sync);
                        scope = childCtx.bottom();
                        _b = __assign;
                        _c = [scope];
                        return [4 /*yield*/, hash.render(ctx)];
                    case 2:
                        _b.apply(void 0, _c.concat([_g.sent()]));
                        if (this['with']) {
                            _d = this['with'], value = _d.value, alias = _d.alias;
                            scope[alias || filepath] = evalToken(value, ctx);
                        }
                        if (!this['for']) return [3 /*break*/, 12];
                        _e = this['for'], value = _e.value, alias = _e.alias;
                        collection = evalToken(value, ctx);
                        collection = toEnumerable(collection);
                        scope['forloop'] = new ForloopDrop(collection.length, value.getText(), alias);
                        _g.label = 3;
                    case 3:
                        _g.trys.push([3, 9, 10, 11]);
                        collection_1 = __values(collection), collection_1_1 = collection_1.next();
                        _g.label = 4;
                    case 4:
                        if (!!collection_1_1.done) return [3 /*break*/, 8];
                        item = collection_1_1.value;
                        scope[alias] = item;
                        return [4 /*yield*/, liquid._parsePartialFile(filepath, childCtx.sync, this['currentFile'])];
                    case 5:
                        templates = _g.sent();
                        return [4 /*yield*/, liquid.renderer.renderTemplates(templates, childCtx, emitter)];
                    case 6:
                        _g.sent();
                        scope['forloop'].next();
                        _g.label = 7;
                    case 7:
                        collection_1_1 = collection_1.next();
                        return [3 /*break*/, 4];
                    case 8: return [3 /*break*/, 11];
                    case 9:
                        e_1_1 = _g.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 11];
                    case 10:
                        try {
                            if (collection_1_1 && !collection_1_1.done && (_f = collection_1.return)) _f.call(collection_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                        return [7 /*endfinally*/];
                    case 11: return [3 /*break*/, 15];
                    case 12: return [4 /*yield*/, liquid._parsePartialFile(filepath, childCtx.sync, this['currentFile'])];
                    case 13:
                        templates = _g.sent();
                        return [4 /*yield*/, liquid.renderer.renderTemplates(templates, childCtx, emitter)];
                    case 14:
                        _g.sent();
                        _g.label = 15;
                    case 15: return [2 /*return*/];
                }
            });
        }
    };
    /**
     * @return null for "none",
     * @return Template[] for quoted with tags and/or filters
     * @return Token for expression (not quoted)
     * @throws TypeError if cannot read next token
     */
    function parseFilePath(tokenizer, liquid) {
        if (liquid.options.dynamicPartials) {
            var file = tokenizer.readValue();
            if (file === undefined)
                throw new TypeError("illegal argument \"" + tokenizer.input + "\"");
            if (file.getText() === 'none')
                return null;
            if (isQuotedToken(file)) {
                // for filenames like "files/{{file}}", eval as liquid template
                var tpls = liquid.parse(evalQuotedToken(file));
                // for filenames like "files/file.liquid", extract the string directly
                if (tpls.length === 1 && isHTMLToken(tpls[0].token))
                    return tpls[0].token.getContent();
                return tpls;
            }
            return file;
        }
        var filepath = tokenizer.readFileName().getText();
        return filepath === 'none' ? null : filepath;
    }
    function renderFilePath(file, ctx, liquid) {
        if (typeof file === 'string')
            return file;
        if (Array.isArray(file))
            return liquid.renderer.renderTemplates(file, ctx);
        return evalToken(file, ctx);
    }

    var include = {
        parseFilePath: parseFilePath,
        renderFilePath: renderFilePath,
        parse: function (token) {
            var args = token.args;
            var tokenizer = new Tokenizer(args, this.liquid.options.operatorsTrie);
            this['file'] = this.parseFilePath(tokenizer, this.liquid);
            this['currentFile'] = token.file;
            var begin = tokenizer.p;
            var withStr = tokenizer.readIdentifier();
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
            var _a, liquid, hash, withVar, renderer, filepath, saved, scope, templates;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this, liquid = _a.liquid, hash = _a.hash, withVar = _a.withVar;
                        renderer = liquid.renderer;
                        return [4 /*yield*/, this.renderFilePath(this['file'], ctx, liquid)];
                    case 1:
                        filepath = _b.sent();
                        assert(filepath, function () { return "illegal filename \"" + filepath + "\""; });
                        saved = ctx.saveRegister('blocks', 'blockMode');
                        ctx.setRegister('blocks', {});
                        ctx.setRegister('blockMode', BlockMode$1.OUTPUT);
                        return [4 /*yield*/, hash.render(ctx)];
                    case 2:
                        scope = _b.sent();
                        if (withVar)
                            scope[filepath] = evalToken(withVar, ctx);
                        return [4 /*yield*/, liquid._parsePartialFile(filepath, ctx.sync, this['currentFile'])];
                    case 3:
                        templates = _b.sent();
                        ctx.push(scope);
                        return [4 /*yield*/, renderer.renderTemplates(templates, ctx, emitter)];
                    case 4:
                        _b.sent();
                        ctx.pop();
                        ctx.restoreRegister(saved);
                        return [2 /*return*/];
                }
            });
        }
    };

    var decrement = {
        parse: function (token) {
            var tokenizer = new Tokenizer(token.args, this.liquid.options.operatorsTrie);
            this.variable = tokenizer.readIdentifier().content;
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
            var tokenizer = new Tokenizer(tagToken.args, this.liquid.options.operatorsTrie);
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
            this.liquid.parser.parseStream(remainTokens)
                .on('start', function () { return _this.branches.push({
                predicate: new Value(tagToken.args, _this.liquid),
                templates: (p = [])
            }); })
                .on('tag:elsif', function (token) { return _this.branches.push({
                predicate: new Value(token.args, _this.liquid),
                templates: (p = [])
            }); })
                .on('tag:else', function () { return (p = _this.elseTemplates); })
                .on('tag:endif', function () { this.stop(); })
                .on('template', function (tpl) { return p.push(tpl); })
                .on('end', function () { throw new Error("tag " + tagToken.getText() + " not closed"); })
                .start();
        },
        render: function (ctx, emitter) {
            var r, _a, _b, _c, predicate, templates, value, e_1_1;
            var e_1, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        r = this.liquid.renderer;
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 7, 8, 9]);
                        _a = __values(this.branches), _b = _a.next();
                        _e.label = 2;
                    case 2:
                        if (!!_b.done) return [3 /*break*/, 6];
                        _c = _b.value, predicate = _c.predicate, templates = _c.templates;
                        return [4 /*yield*/, predicate.value(ctx, ctx.opts.lenientIf)];
                    case 3:
                        value = _e.sent();
                        if (!isTruthy(value, ctx)) return [3 /*break*/, 5];
                        return [4 /*yield*/, r.renderTemplates(templates, ctx, emitter)];
                    case 4:
                        _e.sent();
                        return [2 /*return*/];
                    case 5:
                        _b = _a.next();
                        return [3 /*break*/, 2];
                    case 6: return [3 /*break*/, 9];
                    case 7:
                        e_1_1 = _e.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 9];
                    case 8:
                        try {
                            if (_b && !_b.done && (_d = _a.return)) _d.call(_a);
                        }
                        finally { if (e_1) throw e_1.error; }
                        return [7 /*endfinally*/];
                    case 9: return [4 /*yield*/, r.renderTemplates(this.elseTemplates, ctx, emitter)];
                    case 10:
                        _e.sent();
                        return [2 /*return*/];
                }
            });
        }
    };

    var increment = {
        parse: function (token) {
            var tokenizer = new Tokenizer(token.args, this.liquid.options.operatorsTrie);
            this.variable = tokenizer.readIdentifier().content;
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
        parseFilePath: parseFilePath,
        renderFilePath: renderFilePath,
        parse: function (token, remainTokens) {
            var tokenizer = new Tokenizer(token.args, this.liquid.options.operatorsTrie);
            this['file'] = this.parseFilePath(tokenizer, this.liquid);
            this['currentFile'] = token.file;
            this.hash = new Hash(tokenizer.remaining());
            this.tpls = this.liquid.parser.parseTokens(remainTokens);
        },
        render: function (ctx, emitter) {
            var _a, liquid, hash, file, renderer, filepath, templates, html, blocks, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _a = this, liquid = _a.liquid, hash = _a.hash, file = _a.file;
                        renderer = liquid.renderer;
                        if (!(file === null)) return [3 /*break*/, 2];
                        ctx.setRegister('blockMode', BlockMode$1.OUTPUT);
                        return [4 /*yield*/, renderer.renderTemplates(this.tpls, ctx, emitter)];
                    case 1:
                        _d.sent();
                        return [2 /*return*/];
                    case 2: return [4 /*yield*/, this.renderFilePath(this['file'], ctx, liquid)];
                    case 3:
                        filepath = _d.sent();
                        assert(filepath, function () { return "illegal filename \"" + filepath + "\""; });
                        return [4 /*yield*/, liquid._parseLayoutFile(filepath, ctx.sync, this['currentFile'])
                            // render remaining contents and store rendered results
                        ];
                    case 4:
                        templates = _d.sent();
                        // render remaining contents and store rendered results
                        ctx.setRegister('blockMode', BlockMode$1.STORE);
                        return [4 /*yield*/, renderer.renderTemplates(this.tpls, ctx)];
                    case 5:
                        html = _d.sent();
                        blocks = ctx.getRegister('blocks');
                        // set whole content to anonymous block if anonymous doesn't specified
                        if (blocks[''] === undefined)
                            blocks[''] = function (parent, emitter) { return emitter.write(html); };
                        ctx.setRegister('blockMode', BlockMode$1.OUTPUT);
                        // render the layout file use stored blocks
                        _c = (_b = ctx).push;
                        return [4 /*yield*/, hash.render(ctx)];
                    case 6:
                        // render the layout file use stored blocks
                        _c.apply(_b, [_d.sent()]);
                        return [4 /*yield*/, renderer.renderTemplates(templates, ctx, emitter)];
                    case 7:
                        _d.sent();
                        ctx.pop();
                        return [2 /*return*/];
                }
            });
        }
    };

    var BlockDrop = /** @class */ (function (_super) {
        __extends(BlockDrop, _super);
        function BlockDrop(
        // the block render from layout template
        superBlockRender) {
            if (superBlockRender === void 0) { superBlockRender = function () { return ''; }; }
            var _this = _super.call(this) || this;
            _this.superBlockRender = superBlockRender;
            return _this;
        }
        /**
         * Provide parent access in child block by
         * {{ block.super }}
         */
        BlockDrop.prototype.super = function () {
            return this.superBlockRender();
        };
        return BlockDrop;
    }(Drop));

    var block = {
        parse: function (token, remainTokens) {
            var _this = this;
            var match = /\w+/.exec(token.args);
            this.block = match ? match[0] : '';
            this.tpls = [];
            this.liquid.parser.parseStream(remainTokens)
                .on('tag:endblock', function () { this.stop(); })
                .on('template', function (tpl) { return _this.tpls.push(tpl); })
                .on('end', function () { throw new Error("tag " + token.getText() + " not closed"); })
                .start();
        },
        render: function (ctx, emitter) {
            var blockRender;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        blockRender = this.getBlockRender(ctx);
                        if (!(ctx.getRegister('blockMode') === BlockMode$1.STORE)) return [3 /*break*/, 1];
                        ctx.getRegister('blocks')[this.block] = blockRender;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, blockRender(new BlockDrop(), emitter)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        },
        getBlockRender: function (ctx) {
            var _a = this, liquid = _a.liquid, tpls = _a.tpls;
            var renderChild = ctx.getRegister('blocks')[this.block];
            var renderCurrent = function (superBlock, emitter) {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            // add {{ block.super }} support when rendering
                            ctx.push({ block: superBlock });
                            return [4 /*yield*/, liquid.renderer.renderTemplates(tpls, ctx, emitter)];
                        case 1:
                            _a.sent();
                            ctx.pop();
                            return [2 /*return*/];
                    }
                });
            };
            return renderChild
                ? function (superBlock, emitter) { return renderChild(new BlockDrop(function () { return renderCurrent(superBlock, emitter); }), emitter); }
                : renderCurrent;
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
        function TablerowloopDrop(length, cols, collection, variable) {
            var _this = _super.call(this, length, collection, variable) || this;
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
            var tokenizer = new Tokenizer(tagToken.args, this.liquid.options.operatorsTrie);
            var variable = tokenizer.readIdentifier();
            tokenizer.skipBlank();
            var tmp = tokenizer.readIdentifier();
            assert(tmp && tmp.content === 'in', function () { return "illegal tag: " + tagToken.getText(); });
            this.variable = variable.content;
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
            var collection, _a, hash, offset, limit, cols, r, tablerowloop, scope, idx;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = toEnumerable;
                        return [4 /*yield*/, evalToken(this.collection, ctx)];
                    case 1:
                        collection = _a.apply(void 0, [_b.sent()]);
                        return [4 /*yield*/, this.hash.render(ctx)];
                    case 2:
                        hash = _b.sent();
                        offset = hash.offset || 0;
                        limit = (hash.limit === undefined) ? collection.length : hash.limit;
                        collection = collection.slice(offset, offset + limit);
                        cols = hash.cols || collection.length;
                        r = this.liquid.renderer;
                        tablerowloop = new TablerowloopDrop(collection.length, cols, this.collection.getText(), this.variable);
                        scope = { tablerowloop: tablerowloop };
                        ctx.push(scope);
                        idx = 0;
                        _b.label = 3;
                    case 3:
                        if (!(idx < collection.length)) return [3 /*break*/, 6];
                        scope[this.variable] = collection[idx];
                        if (tablerowloop.col0() === 0) {
                            if (tablerowloop.row() !== 1)
                                emitter.write('</tr>');
                            emitter.write("<tr class=\"row" + tablerowloop.row() + "\">");
                        }
                        emitter.write("<td class=\"col" + tablerowloop.col() + "\">");
                        return [4 /*yield*/, r.renderTemplates(this.templates, ctx, emitter)];
                    case 4:
                        _b.sent();
                        emitter.write('</td>');
                        _b.label = 5;
                    case 5:
                        idx++, tablerowloop.next();
                        return [3 /*break*/, 3];
                    case 6:
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
            this.branches = [];
            this.elseTemplates = [];
            var p;
            this.liquid.parser.parseStream(remainTokens)
                .on('start', function () { return _this.branches.push({
                predicate: new Value(tagToken.args, _this.liquid),
                test: isFalsy,
                templates: (p = [])
            }); })
                .on('tag:elsif', function (token) { return _this.branches.push({
                predicate: new Value(token.args, _this.liquid),
                test: isTruthy,
                templates: (p = [])
            }); })
                .on('tag:else', function () { return (p = _this.elseTemplates); })
                .on('tag:endunless', function () { this.stop(); })
                .on('template', function (tpl) { return p.push(tpl); })
                .on('end', function () { throw new Error("tag " + tagToken.getText() + " not closed"); })
                .start();
        },
        render: function (ctx, emitter) {
            var r, _a, _b, _c, predicate, test_1, templates, value, e_1_1;
            var e_1, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        r = this.liquid.renderer;
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 7, 8, 9]);
                        _a = __values(this.branches), _b = _a.next();
                        _e.label = 2;
                    case 2:
                        if (!!_b.done) return [3 /*break*/, 6];
                        _c = _b.value, predicate = _c.predicate, test_1 = _c.test, templates = _c.templates;
                        return [4 /*yield*/, predicate.value(ctx, ctx.opts.lenientIf)];
                    case 3:
                        value = _e.sent();
                        if (!test_1(value, ctx)) return [3 /*break*/, 5];
                        return [4 /*yield*/, r.renderTemplates(templates, ctx, emitter)];
                    case 4:
                        _e.sent();
                        return [2 /*return*/];
                    case 5:
                        _b = _a.next();
                        return [3 /*break*/, 2];
                    case 6: return [3 /*break*/, 9];
                    case 7:
                        e_1_1 = _e.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 9];
                    case 8:
                        try {
                            if (_b && !_b.done && (_d = _a.return)) _d.call(_a);
                        }
                        finally { if (e_1) throw e_1.error; }
                        return [7 /*endfinally*/];
                    case 9: return [4 /*yield*/, r.renderTemplates(this.elseTemplates, ctx, emitter)];
                    case 10:
                        _e.sent();
                        return [2 /*return*/];
                }
            });
        }
    };

    var Break = {
        render: function (ctx, emitter) {
            emitter['break'] = true;
        }
    };

    var Continue = {
        render: function (ctx, emitter) {
            emitter['continue'] = true;
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
        return v.replace(/\n/g, '<br />\n');
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
    function sort(arr, property) {
        var _this = this;
        var getValue = function (obj) { return property ? _this.context.getFromScope(obj, property.split('.')) : obj; };
        return toArray(arr).sort(function (lhs, rhs) {
            lhs = getValue(lhs);
            rhs = getValue(rhs);
            return lhs < rhs ? -1 : (lhs > rhs ? 1 : 0);
        });
    }
    var size = function (v) { return (v && v.length) || 0; };
    function map(arr, property) {
        var _this = this;
        return toArray(arr).map(function (obj) { return _this.context.getFromScope(obj, property.split('.')); });
    }
    function compact(arr) {
        return toArray(arr).filter(function (x) { return !isNil(x); });
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
            return expected === undefined ? isTruthy(value, _this.context) : value === expected;
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
            var nOffset = Math.abs(d.getTimezoneOffset());
            var h = Math.floor(nOffset / 60);
            var m = nOffset % 60;
            return (d.getTimezoneOffset() > 0 ? '-' : '+') +
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

    // one minute in milliseconds
    var OneMinute = 60000;
    var hostTimezoneOffset = new Date().getTimezoneOffset();
    var ISO8601_TIMEZONE_PATTERN = /([zZ]|([+-])(\d{2}):(\d{2}))$/;
    /**
     * A date implementation with timezone info, just like Ruby date
     *
     * Implementation:
     * - create a Date offset by it's timezone difference, avoiding overriding a bunch of methods
     * - rewrite getTimezoneOffset() to trick strftime
     */
    var TimezoneDate = /** @class */ (function (_super) {
        __extends(TimezoneDate, _super);
        function TimezoneDate(init, timezoneOffset) {
            var _this = this;
            if (init instanceof TimezoneDate)
                return init;
            var diff = (hostTimezoneOffset - timezoneOffset) * OneMinute;
            var time = new Date(init).getTime() + diff;
            _this = _super.call(this, time) || this;
            _this.timezoneOffset = timezoneOffset;
            return _this;
        }
        TimezoneDate.prototype.getTimezoneOffset = function () {
            return this.timezoneOffset;
        };
        /**
         * Create a Date object fixed to it's declared Timezone. Both
         * - 2021-08-06T02:29:00.000Z and
         * - 2021-08-06T02:29:00.000+08:00
         * will always be displayed as
         * - 2021-08-06 02:29:00
         * regardless timezoneOffset in JavaScript realm
         *
         * The implementation hack:
         * Instead of calling `.getMonth()`/`.getUTCMonth()` respect to `preserveTimezones`,
         * we create a different Date to trick strftime, it's both simpler and more performant.
         * Given that a template is expected to be parsed fewer times than rendered.
         */
        TimezoneDate.createDateFixedToTimezone = function (dateString) {
            var m = dateString.match(ISO8601_TIMEZONE_PATTERN);
            // representing a UTC timestamp
            if (m && m[1] === 'Z') {
                return new TimezoneDate(+new Date(dateString), 0);
            }
            // has a timezone specified
            if (m && m[2] && m[3] && m[4]) {
                var _a = __read(m, 5), sign = _a[2], hours = _a[3], minutes = _a[4];
                var delta = (sign === '+' ? -1 : 1) * (parseInt(hours, 10) * 60 + parseInt(minutes, 10));
                return new TimezoneDate(+new Date(dateString), delta);
            }
            return new Date(dateString);
        };
        return TimezoneDate;
    }(Date));

    function date(v, arg) {
        var opts = this.context.opts;
        var date;
        if (v === 'now' || v === 'today') {
            date = new Date();
        }
        else if (isNumber(v)) {
            date = new Date(v * 1000);
        }
        else if (isString(v)) {
            if (/^\d+$/.test(v)) {
                date = new Date(+v * 1000);
            }
            else if (opts.preserveTimezones) {
                date = TimezoneDate.createDateFixedToTimezone(v);
            }
            else {
                date = new Date(v);
            }
        }
        else {
            date = v;
        }
        if (!isValidDate(date))
            return v;
        if (opts.hasOwnProperty('timezoneOffset')) {
            date = new TimezoneDate(date, opts.timezoneOffset);
        }
        return strftime(date, arg);
    }
    function isValidDate(date) {
        return date instanceof Date && !isNaN(date.getTime());
    }

    function Default(v, arg) {
        if (isArray(v) || isString(v))
            return v.length ? v : arg;
        return isFalsy(toValue(v), this.context) ? arg : v;
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
        assert(arguments.length === 2, 'append expect 2 arguments');
        return stringify(v) + stringify(arg);
    }
    function prepend(v, arg) {
        assert(arguments.length === 2, 'prepend expect 2 arguments');
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
        return stringify(v).split(String(arg)).join('');
    }
    function removeFirst(v, l) {
        return stringify(v).replace(String(l), '');
    }
    function rstrip(str) {
        return stringify(str).replace(/\s+$/, '');
    }
    function split(v, arg) {
        return stringify(v).split(String(arg));
    }
    function strip(v) {
        return stringify(v).trim();
    }
    function stripNewlines(v) {
        return stringify(v).replace(/\n/g, '');
    }
    function capitalize(str) {
        str = stringify(str);
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
    function replace(v, pattern, replacement) {
        return stringify(v).split(String(pattern)).join(replacement);
    }
    function replaceFirst(v, arg1, arg2) {
        return stringify(v).replace(String(arg1), arg2);
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
        compact: compact,
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
        function FilterMap(strictFilters, liquid) {
            this.strictFilters = strictFilters;
            this.liquid = liquid;
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
            return new Filter(name, this.get(name), args, this.liquid);
        };
        return FilterMap;
    }());

    var version = '9.28.4';
    var Liquid = /** @class */ (function () {
        function Liquid(opts) {
            var _this = this;
            if (opts === void 0) { opts = {}; }
            this.options = normalize(opts);
            this.parser = new Parser(this);
            this.renderer = new Render();
            this.filters = new FilterMap(this.options.strictFilters, this);
            this.tags = new TagMap();
            forOwn(tags, function (conf, name) { return _this.registerTag(snakeCase(name), conf); });
            forOwn(builtinFilters, function (handler, name) { return _this.registerFilter(snakeCase(name), handler); });
        }
        Liquid.prototype.parse = function (html, filepath) {
            return this.parser.parse(html, filepath);
        };
        Liquid.prototype._render = function (tpl, scope, sync) {
            var ctx = new Context(scope, this.options, sync);
            return this.renderer.renderTemplates(tpl, ctx);
        };
        Liquid.prototype.render = function (tpl, scope) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, toPromise(this._render(tpl, scope, false))];
                });
            });
        };
        Liquid.prototype.renderSync = function (tpl, scope) {
            return toValue$1(this._render(tpl, scope, true));
        };
        Liquid.prototype.renderToNodeStream = function (tpl, scope) {
            var ctx = new Context(scope, this.options);
            return this.renderer.renderTemplatesToNodeStream(tpl, ctx);
        };
        Liquid.prototype._parseAndRender = function (html, scope, sync) {
            var tpl = this.parse(html);
            return this._render(tpl, scope, sync);
        };
        Liquid.prototype.parseAndRender = function (html, scope) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, toPromise(this._parseAndRender(html, scope, false))];
                });
            });
        };
        Liquid.prototype.parseAndRenderSync = function (html, scope) {
            return toValue$1(this._parseAndRender(html, scope, true));
        };
        Liquid.prototype._parsePartialFile = function (file, sync, currentFile) {
            return this.parser.parseFile(file, sync, LookupType.Partials, currentFile);
        };
        Liquid.prototype._parseLayoutFile = function (file, sync, currentFile) {
            return this.parser.parseFile(file, sync, LookupType.Layouts, currentFile);
        };
        Liquid.prototype.parseFile = function (file) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, toPromise(this.parser.parseFile(file, false))];
                });
            });
        };
        Liquid.prototype.parseFileSync = function (file) {
            return toValue$1(this.parser.parseFile(file, true));
        };
        Liquid.prototype.renderFile = function (file, ctx) {
            return __awaiter(this, void 0, void 0, function () {
                var templates;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.parseFile(file)];
                        case 1:
                            templates = _a.sent();
                            return [2 /*return*/, this.render(templates, ctx)];
                    }
                });
            });
        };
        Liquid.prototype.renderFileSync = function (file, ctx) {
            var templates = this.parseFileSync(file);
            return this.renderSync(templates, ctx);
        };
        Liquid.prototype.renderFileToNodeStream = function (file, scope) {
            return __awaiter(this, void 0, void 0, function () {
                var templates;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.parseFile(file)];
                        case 1:
                            templates = _a.sent();
                            return [2 /*return*/, this.renderToNodeStream(templates, scope)];
                    }
                });
            });
        };
        Liquid.prototype._evalValue = function (str, ctx) {
            var value = new Value(str, this);
            return value.value(ctx, false);
        };
        Liquid.prototype.evalValue = function (str, ctx) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, toPromise(this._evalValue(str, ctx))];
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
            var firstCall = true;
            return function (filePath, ctx, callback) {
                var _a, _b, _c;
                if (firstCall) {
                    firstCall = false;
                    var dirs = normalizeDirectoryList(this.root);
                    (_a = self.options.root).unshift.apply(_a, __spread(dirs));
                    (_b = self.options.layouts).unshift.apply(_b, __spread(dirs));
                    (_c = self.options.partials).unshift.apply(_c, __spread(dirs));
                }
                self.renderFile(filePath, ctx).then(function (html) { return callback(null, html); }, callback);
            };
        };
        return Liquid;
    }());

    exports.AssertionError = AssertionError;
    exports.Context = Context;
    exports.Drop = Drop;
    exports.Expression = Expression;
    exports.Hash = Hash;
    exports.InternalUndefinedVariableError = InternalUndefinedVariableError;
    exports.Liquid = Liquid;
    exports.LiquidError = LiquidError;
    exports.ParseError = ParseError;
    exports.ParseStream = ParseStream;
    exports.RenderError = RenderError;
    exports.TagToken = TagToken;
    exports.Token = Token;
    exports.TokenizationError = TokenizationError;
    exports.Tokenizer = Tokenizer;
    exports.TypeGuards = typeGuards;
    exports.UndefinedVariableError = UndefinedVariableError;
    exports.Value = Value;
    exports.assert = assert;
    exports.createTrie = createTrie;
    exports.defaultOperators = defaultOperators;
    exports.evalQuotedToken = evalQuotedToken;
    exports.evalToken = evalToken;
    exports.isFalsy = isFalsy;
    exports.isTruthy = isTruthy;
    exports.toPromise = toPromise;
    exports.toThenable = toThenable;
    exports.toValue = toValue;
    exports.version = version;

    Object.defineProperty(exports, '__esModule', { value: true });

}));


},{}],93:[function(require,module,exports){

},{}],94:[function(require,module,exports){
(function (process){(function (){
// 'path' module extracted from Node.js v8.11.1 (only the posix part)
// transplited with Babel

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

function assertPath(path) {
  if (typeof path !== 'string') {
    throw new TypeError('Path must be a string. Received ' + JSON.stringify(path));
  }
}

// Resolves . and .. elements in a path with directory names
function normalizeStringPosix(path, allowAboveRoot) {
  var res = '';
  var lastSegmentLength = 0;
  var lastSlash = -1;
  var dots = 0;
  var code;
  for (var i = 0; i <= path.length; ++i) {
    if (i < path.length)
      code = path.charCodeAt(i);
    else if (code === 47 /*/*/)
      break;
    else
      code = 47 /*/*/;
    if (code === 47 /*/*/) {
      if (lastSlash === i - 1 || dots === 1) {
        // NOOP
      } else if (lastSlash !== i - 1 && dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 /*.*/ || res.charCodeAt(res.length - 2) !== 46 /*.*/) {
          if (res.length > 2) {
            var lastSlashIndex = res.lastIndexOf('/');
            if (lastSlashIndex !== res.length - 1) {
              if (lastSlashIndex === -1) {
                res = '';
                lastSegmentLength = 0;
              } else {
                res = res.slice(0, lastSlashIndex);
                lastSegmentLength = res.length - 1 - res.lastIndexOf('/');
              }
              lastSlash = i;
              dots = 0;
              continue;
            }
          } else if (res.length === 2 || res.length === 1) {
            res = '';
            lastSegmentLength = 0;
            lastSlash = i;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          if (res.length > 0)
            res += '/..';
          else
            res = '..';
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0)
          res += '/' + path.slice(lastSlash + 1, i);
        else
          res = path.slice(lastSlash + 1, i);
        lastSegmentLength = i - lastSlash - 1;
      }
      lastSlash = i;
      dots = 0;
    } else if (code === 46 /*.*/ && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}

function _format(sep, pathObject) {
  var dir = pathObject.dir || pathObject.root;
  var base = pathObject.base || (pathObject.name || '') + (pathObject.ext || '');
  if (!dir) {
    return base;
  }
  if (dir === pathObject.root) {
    return dir + base;
  }
  return dir + sep + base;
}

var posix = {
  // path.resolve([from ...], to)
  resolve: function resolve() {
    var resolvedPath = '';
    var resolvedAbsolute = false;
    var cwd;

    for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
      var path;
      if (i >= 0)
        path = arguments[i];
      else {
        if (cwd === undefined)
          cwd = process.cwd();
        path = cwd;
      }

      assertPath(path);

      // Skip empty entries
      if (path.length === 0) {
        continue;
      }

      resolvedPath = path + '/' + resolvedPath;
      resolvedAbsolute = path.charCodeAt(0) === 47 /*/*/;
    }

    // At this point the path should be resolved to a full absolute path, but
    // handle relative paths to be safe (might happen when process.cwd() fails)

    // Normalize the path
    resolvedPath = normalizeStringPosix(resolvedPath, !resolvedAbsolute);

    if (resolvedAbsolute) {
      if (resolvedPath.length > 0)
        return '/' + resolvedPath;
      else
        return '/';
    } else if (resolvedPath.length > 0) {
      return resolvedPath;
    } else {
      return '.';
    }
  },

  normalize: function normalize(path) {
    assertPath(path);

    if (path.length === 0) return '.';

    var isAbsolute = path.charCodeAt(0) === 47 /*/*/;
    var trailingSeparator = path.charCodeAt(path.length - 1) === 47 /*/*/;

    // Normalize the path
    path = normalizeStringPosix(path, !isAbsolute);

    if (path.length === 0 && !isAbsolute) path = '.';
    if (path.length > 0 && trailingSeparator) path += '/';

    if (isAbsolute) return '/' + path;
    return path;
  },

  isAbsolute: function isAbsolute(path) {
    assertPath(path);
    return path.length > 0 && path.charCodeAt(0) === 47 /*/*/;
  },

  join: function join() {
    if (arguments.length === 0)
      return '.';
    var joined;
    for (var i = 0; i < arguments.length; ++i) {
      var arg = arguments[i];
      assertPath(arg);
      if (arg.length > 0) {
        if (joined === undefined)
          joined = arg;
        else
          joined += '/' + arg;
      }
    }
    if (joined === undefined)
      return '.';
    return posix.normalize(joined);
  },

  relative: function relative(from, to) {
    assertPath(from);
    assertPath(to);

    if (from === to) return '';

    from = posix.resolve(from);
    to = posix.resolve(to);

    if (from === to) return '';

    // Trim any leading backslashes
    var fromStart = 1;
    for (; fromStart < from.length; ++fromStart) {
      if (from.charCodeAt(fromStart) !== 47 /*/*/)
        break;
    }
    var fromEnd = from.length;
    var fromLen = fromEnd - fromStart;

    // Trim any leading backslashes
    var toStart = 1;
    for (; toStart < to.length; ++toStart) {
      if (to.charCodeAt(toStart) !== 47 /*/*/)
        break;
    }
    var toEnd = to.length;
    var toLen = toEnd - toStart;

    // Compare paths to find the longest common path from root
    var length = fromLen < toLen ? fromLen : toLen;
    var lastCommonSep = -1;
    var i = 0;
    for (; i <= length; ++i) {
      if (i === length) {
        if (toLen > length) {
          if (to.charCodeAt(toStart + i) === 47 /*/*/) {
            // We get here if `from` is the exact base path for `to`.
            // For example: from='/foo/bar'; to='/foo/bar/baz'
            return to.slice(toStart + i + 1);
          } else if (i === 0) {
            // We get here if `from` is the root
            // For example: from='/'; to='/foo'
            return to.slice(toStart + i);
          }
        } else if (fromLen > length) {
          if (from.charCodeAt(fromStart + i) === 47 /*/*/) {
            // We get here if `to` is the exact base path for `from`.
            // For example: from='/foo/bar/baz'; to='/foo/bar'
            lastCommonSep = i;
          } else if (i === 0) {
            // We get here if `to` is the root.
            // For example: from='/foo'; to='/'
            lastCommonSep = 0;
          }
        }
        break;
      }
      var fromCode = from.charCodeAt(fromStart + i);
      var toCode = to.charCodeAt(toStart + i);
      if (fromCode !== toCode)
        break;
      else if (fromCode === 47 /*/*/)
        lastCommonSep = i;
    }

    var out = '';
    // Generate the relative path based on the path difference between `to`
    // and `from`
    for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
      if (i === fromEnd || from.charCodeAt(i) === 47 /*/*/) {
        if (out.length === 0)
          out += '..';
        else
          out += '/..';
      }
    }

    // Lastly, append the rest of the destination (`to`) path that comes after
    // the common path parts
    if (out.length > 0)
      return out + to.slice(toStart + lastCommonSep);
    else {
      toStart += lastCommonSep;
      if (to.charCodeAt(toStart) === 47 /*/*/)
        ++toStart;
      return to.slice(toStart);
    }
  },

  _makeLong: function _makeLong(path) {
    return path;
  },

  dirname: function dirname(path) {
    assertPath(path);
    if (path.length === 0) return '.';
    var code = path.charCodeAt(0);
    var hasRoot = code === 47 /*/*/;
    var end = -1;
    var matchedSlash = true;
    for (var i = path.length - 1; i >= 1; --i) {
      code = path.charCodeAt(i);
      if (code === 47 /*/*/) {
          if (!matchedSlash) {
            end = i;
            break;
          }
        } else {
        // We saw the first non-path separator
        matchedSlash = false;
      }
    }

    if (end === -1) return hasRoot ? '/' : '.';
    if (hasRoot && end === 1) return '//';
    return path.slice(0, end);
  },

  basename: function basename(path, ext) {
    if (ext !== undefined && typeof ext !== 'string') throw new TypeError('"ext" argument must be a string');
    assertPath(path);

    var start = 0;
    var end = -1;
    var matchedSlash = true;
    var i;

    if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
      if (ext.length === path.length && ext === path) return '';
      var extIdx = ext.length - 1;
      var firstNonSlashEnd = -1;
      for (i = path.length - 1; i >= 0; --i) {
        var code = path.charCodeAt(i);
        if (code === 47 /*/*/) {
            // If we reached a path separator that was not part of a set of path
            // separators at the end of the string, stop now
            if (!matchedSlash) {
              start = i + 1;
              break;
            }
          } else {
          if (firstNonSlashEnd === -1) {
            // We saw the first non-path separator, remember this index in case
            // we need it if the extension ends up not matching
            matchedSlash = false;
            firstNonSlashEnd = i + 1;
          }
          if (extIdx >= 0) {
            // Try to match the explicit extension
            if (code === ext.charCodeAt(extIdx)) {
              if (--extIdx === -1) {
                // We matched the extension, so mark this as the end of our path
                // component
                end = i;
              }
            } else {
              // Extension does not match, so our result is the entire path
              // component
              extIdx = -1;
              end = firstNonSlashEnd;
            }
          }
        }
      }

      if (start === end) end = firstNonSlashEnd;else if (end === -1) end = path.length;
      return path.slice(start, end);
    } else {
      for (i = path.length - 1; i >= 0; --i) {
        if (path.charCodeAt(i) === 47 /*/*/) {
            // If we reached a path separator that was not part of a set of path
            // separators at the end of the string, stop now
            if (!matchedSlash) {
              start = i + 1;
              break;
            }
          } else if (end === -1) {
          // We saw the first non-path separator, mark this as the end of our
          // path component
          matchedSlash = false;
          end = i + 1;
        }
      }

      if (end === -1) return '';
      return path.slice(start, end);
    }
  },

  extname: function extname(path) {
    assertPath(path);
    var startDot = -1;
    var startPart = 0;
    var end = -1;
    var matchedSlash = true;
    // Track the state of characters (if any) we see before our first dot and
    // after any path separator we find
    var preDotState = 0;
    for (var i = path.length - 1; i >= 0; --i) {
      var code = path.charCodeAt(i);
      if (code === 47 /*/*/) {
          // If we reached a path separator that was not part of a set of path
          // separators at the end of the string, stop now
          if (!matchedSlash) {
            startPart = i + 1;
            break;
          }
          continue;
        }
      if (end === -1) {
        // We saw the first non-path separator, mark this as the end of our
        // extension
        matchedSlash = false;
        end = i + 1;
      }
      if (code === 46 /*.*/) {
          // If this is our first dot, mark it as the start of our extension
          if (startDot === -1)
            startDot = i;
          else if (preDotState !== 1)
            preDotState = 1;
      } else if (startDot !== -1) {
        // We saw a non-dot and non-path separator before our dot, so we should
        // have a good chance at having a non-empty extension
        preDotState = -1;
      }
    }

    if (startDot === -1 || end === -1 ||
        // We saw a non-dot character immediately before the dot
        preDotState === 0 ||
        // The (right-most) trimmed path component is exactly '..'
        preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
      return '';
    }
    return path.slice(startDot, end);
  },

  format: function format(pathObject) {
    if (pathObject === null || typeof pathObject !== 'object') {
      throw new TypeError('The "pathObject" argument must be of type Object. Received type ' + typeof pathObject);
    }
    return _format('/', pathObject);
  },

  parse: function parse(path) {
    assertPath(path);

    var ret = { root: '', dir: '', base: '', ext: '', name: '' };
    if (path.length === 0) return ret;
    var code = path.charCodeAt(0);
    var isAbsolute = code === 47 /*/*/;
    var start;
    if (isAbsolute) {
      ret.root = '/';
      start = 1;
    } else {
      start = 0;
    }
    var startDot = -1;
    var startPart = 0;
    var end = -1;
    var matchedSlash = true;
    var i = path.length - 1;

    // Track the state of characters (if any) we see before our first dot and
    // after any path separator we find
    var preDotState = 0;

    // Get non-dir info
    for (; i >= start; --i) {
      code = path.charCodeAt(i);
      if (code === 47 /*/*/) {
          // If we reached a path separator that was not part of a set of path
          // separators at the end of the string, stop now
          if (!matchedSlash) {
            startPart = i + 1;
            break;
          }
          continue;
        }
      if (end === -1) {
        // We saw the first non-path separator, mark this as the end of our
        // extension
        matchedSlash = false;
        end = i + 1;
      }
      if (code === 46 /*.*/) {
          // If this is our first dot, mark it as the start of our extension
          if (startDot === -1) startDot = i;else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
        // We saw a non-dot and non-path separator before our dot, so we should
        // have a good chance at having a non-empty extension
        preDotState = -1;
      }
    }

    if (startDot === -1 || end === -1 ||
    // We saw a non-dot character immediately before the dot
    preDotState === 0 ||
    // The (right-most) trimmed path component is exactly '..'
    preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
      if (end !== -1) {
        if (startPart === 0 && isAbsolute) ret.base = ret.name = path.slice(1, end);else ret.base = ret.name = path.slice(startPart, end);
      }
    } else {
      if (startPart === 0 && isAbsolute) {
        ret.name = path.slice(1, startDot);
        ret.base = path.slice(1, end);
      } else {
        ret.name = path.slice(startPart, startDot);
        ret.base = path.slice(startPart, end);
      }
      ret.ext = path.slice(startDot, end);
    }

    if (startPart > 0) ret.dir = path.slice(0, startPart - 1);else if (isAbsolute) ret.dir = '/';

    return ret;
  },

  sep: '/',
  delimiter: ':',
  win32: null,
  posix: null
};

posix.posix = posix;

module.exports = posix;

}).call(this)}).call(this,require('_process'))
},{"_process":95}],95:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[1]);
