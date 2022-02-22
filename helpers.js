const { isArray, isString } = require("@jrc03c/js-math-tools")

function stringifyArray(x) {
  return `[${x
    .map(item => {
      if (isArray(item)) {
        return stringifyArray(item)
      } else if (isString(item)) {
        return `"${item}"`
      } else {
        return item
      }
    })
    .join(", ")}]`
}

module.exports = { stringifyArray }
