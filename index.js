const { Liquid } = require("liquidjs")
const liquid = new Liquid()

if (!String.prototype.replaceAll) {
  String.prototype.replaceAll = function (a, b) {
    const self = this
    return self.split(a).join(b)
  }
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
    // `build` is the old function;
    // it's used to replace {$ variable $} with dict.variable;
    // you should probably use the new `liquidBuild` function instead!
    build(template, dict) {
      // variable syntax: {$ variable $}
      let out = template
      const rx = /\{\$ ?(.*?) ?\$\}/g
      placeholders = template.match(rx)

      if (!placeholders) return out

      placeholders.forEach(placeholder => {
        const abbrev = placeholder
          .split(" ")
          .join("")
          .replace("{$", "")
          .replace("$}", "")

        if (!dict[abbrev]) throw "No definition for " + abbrev + "."
        out = out.replaceAll(placeholder, dict[abbrev])
      })

      return out
    },

    async liquidBuild(template, dict) {
      return await liquid.parseAndRender(template, dict)
    },
  },
}

try {
  module.exports = gt
} catch (e) {}

try {
  window.gt = gt
} catch (e) {}
