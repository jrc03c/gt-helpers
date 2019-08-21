let mathjs = require("mathjs")

let gt = {
	string: {
		stripPunctuation: function(string){
			let valid = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890 "
			let out = ""

			for (let i=0; i<string.length; i++){
				let char = string[i]
				if (valid.includes(char)) out += char
			}

			return out
		},

		toCamelCase: function(string){
			let array = gt.string.stripPunctuation(string).split(" ")
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
			mathjs.config({randomSeed: seed})
			let out = array.slice()

			for (let i=0; i<out.length; i++){
				let j = Math.floor(mathjs.random() * out.length)
				let k = Math.floor(mathjs.random() * out.length)
				let buffer = out[j]
				out[j] = out[k]
				out[k] = buffer
			}

			return out
		},

		toSet: function(array){
			let out = []

			array.forEach(function(item){
				if (out.indexOf(item) < 0){
					out.push(item)
				}
			})

			return out
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
					pairs.push(`"` + key + `"->` + val)
				})

				return "{" + pairs.join(",") + "}"
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
	},
}

module.exports = gt
