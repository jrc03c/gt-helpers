const { DataFrame, isArray, set, sort } = require("@jrc03c/js-math-tools")
const { Liquid } = require("liquidjs")
const liquid = new Liquid()

if (!String.prototype.replaceAll) {
  String.prototype.replaceAll = function (a, b) {
    const self = this
    return self.split(a).join(b)
  }
}

const gt = {
  SHOULD_SHOW_WARNINGS: true,

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
      if (gt.SHOULD_SHOW_WARNINGS) {
        console.warn(
          "WARNING: The `gt.program.extractQuestions` function is highly experimental and may not always work correctly!"
        )
      }

      const otherKeywords = [
        "audio",
        "back",
        "body",
        "button",
        "caption",
        "chart",
        "classes",
        "clear",
        "click",
        "component",
        "data",
        "database",
        "email",
        "error",
        "events",
        "every",
        "everytime",
        "experiment",
        "for",
        "frequency",
        "goto",
        "group",
        "hide",
        "html",
        "identifier",
        "if",
        "image",
        "label",
        "list",
        "login",
        "maintain",
        "management",
        "menu",
        "method",
        "name",
        "navigation",
        "page",
        "path",
        "points",
        "program",
        "progress",
        "purchase",
        "quit",
        "randomize",
        "repeat",
        "required",
        "reset",
        "return",
        "send",
        "service",
        "set",
        "settings",
        "share",
        "start",
        "status",
        "subject",
        "success",
        "summary",
        "switch",
        "to",
        "trendline",
        "trigger",
        "until",
        "video",
        "wait",
        "what",
        "when",
        "while",
        "with",
        "xaxis",
        "yaxis",
      ]

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

      let indentation = ""
      let temp = {}
      const lines = text.split("\n")
      const questions = []

      lines.forEach(line => {
        if (line.includes("*question:")) {
          if (Object.keys(temp).length > 0) {
            questions.push(temp)
            indentation = ""
            temp = {}
          }

          indentation = line.split("*")[0] + "\t"
          temp.question = line.split(":").slice(1).join(":").trim()
        } else {
          const matches = line.split(/[^\s]/g)
          if (!matches) return

          if (matches[0].includes(" ")) {
            throw new Error(
              "Your GT program's indentation includes spaces! GT programs should only be indented with tabs."
            )
          }

          if (matches[0] === indentation) {
            line = line.trim()

            if (line.length === 0) return

            const firstWord = line
              .split(" ")[0]
              .replaceAll("*", "")
              .replaceAll(":", "")
              .trim()

            if (line.startsWith(">>")) {
              return
            } else if (
              line.startsWith("*") &&
              questionKeywords.some(keyword => keyword.match(firstWord))
            ) {
              const parts = line.split(":")
              const key = parts[0].replaceAll("*", "").trim()
              const value = parts.slice(1).join(":").trim()

              if (value.length > 0) {
                try {
                  temp[key] = JSON.parse(value)
                } catch (e) {
                  temp[key] = value
                }
              } else {
                temp[key] = true
              }
            } else {
              if (otherKeywords.some(keyword => keyword.match(firstWord))) {
                return
              }

              if (!temp.question) {
                return
              }

              if (!temp.answers) {
                temp.answers = []
              }

              if (isArray(temp.answers)) {
                temp.answers.push(line)
              }
            }
          }
        }
      })

      if (Object.keys(temp).length > 0) {
        questions.push(temp)
      }

      if (questions.length === 0) {
        return new DataFrame()
      }

      const values = questions.map(question => {
        return questionKeywords.map(col => {
          if (question[col]) {
            if (isArray(question[col])) {
              return question[col].join(" | ")
            } else {
              return question[col]
            }
          } else {
            return null
          }
        })
      })

      const out = new DataFrame(values)
      out.columns = questionKeywords

      return out.get(
        null,
        ["question"].concat(questionKeywords.filter(col => col !== "question"))
      )
    },
  },
}

if (typeof module !== "undefined") {
  module.exports = gt
}

if (typeof window !== "undefined") {
  window.gt = gt
}
