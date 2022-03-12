const { DataFrame, Series, isArray } = require("@jrc03c/js-math-tools")
const { Liquid } = require("liquidjs")
const liquid = new Liquid()
const { stringifyArray } = require("./helpers.js")

if (!String.prototype.replaceAll) {
  String.prototype.replaceAll = function (a, b) {
    const self = this
    return self.split(a).join(b)
  }
}

function getIndentation(text) {
  return text.split(/[^\s]/g)[0]
}

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
    toAssociation(obj) {
      function recursiveParse(obj) {
        const type = typeof obj

        if (type === "string") return JSON.stringify(obj)
        if (type === "number") return obj
        if (type === "boolean") return JSON.stringify(obj.toString())
        if (type === "function") return JSON.stringify("<function>")
        if (type === "undefined") return JSON.stringify("undefined")
        if (obj === null) return JSON.stringify("null")

        const pairs = []

        Object.keys(obj).forEach(key => {
          const val = recursiveParse(obj[key])
          pairs.push(`"` + key + `" -> ` + val)
        })

        return "{ " + pairs.join(", ") + " }"
      }

      return recursiveParse(obj)
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
              return stringifyArray(value)
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
