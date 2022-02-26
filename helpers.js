const { isArray, isString } = require("@jrc03c/js-math-tools")

function stringifyArray(x) {
  return `[${x
    .map(value => {
      if (isArray(value)) {
        return stringifyArray(value)
      } else if (isString(value)) {
        return `'${value}'`
      } else {
        return JSON.stringify(value)
      }
    })
    .join(", ")}]`
}

module.exports = { stringifyArray }
