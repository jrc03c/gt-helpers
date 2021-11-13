let { Liquid } = require("liquidjs")
let liquid = new Liquid()

if (!String.prototype.replaceAll) {
  String.prototype.replaceAll = function (a, b) {
    const self = this
    return self.split(a).join(b)
  }
}

let gt = {
  date: {
    toGTDateObject(date) {
      let out = {
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
        let type = typeof obj

        if (type === "string") return JSON.stringify(obj)
        if (type === "number") return obj

        let pairs = []

        Object.keys(obj).forEach(key => {
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

      placeholders.forEach(placeholder => {
        let abbrev = placeholder
          .split(" ")
          .join("")
          .replace("{$", "")
          .replace("$}", "")

        if (!variableDict[abbrev]) throw "No definition for " + abbrev + "."
        out = out.replaceAll(placeholder, variableDict[abbrev])
      })

      return out
    },

    async liquidBuild(templateString, variableDict) {
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
