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
