const Vue = require("vue/dist/vue.min.js")
const { GuidedTrackMode } = require("./gt-mode.js")
const ace = require("brace")
require("brace/mode/javascript")
require("brace/mode/html")
require("brace/mode/css")
require("brace/theme/tomorrow")
const makeKey = require("@jrc03c/make-key")
const pause = require("./pause.js")

function iterableToArray(iter) {
	const out = []
	for (v of iter) out.push(v)
	return out
}

const modeDict = {
	"language-css": "ace/mode/css",
	"language-js": "ace/mode/javascript",
	"language-javascript": "ace/mode/javascript",
	"language-html": "ace/mode/html",
}

async function run() {
	const pres = iterableToArray(document.getElementsByTagName("pre"))

	for (let i = 0; i < pres.length; i++) {
		const pre = pres[i]

		let watchInterval = setInterval(async () => {
			const rect = pre.getBoundingClientRect()
			if (rect.top > window.innerHeight || rect.top + rect.height < 0) return
			clearInterval(watchInterval)

			const code = pre.textContent

			const codeClass = (() => {
				const children = iterableToArray(pre.getElementsByTagName("code"))
				const firstChild = children[0]
				const classes = iterableToArray(firstChild.classList)

				if (classes.length === 0) {
					return "language-gt"
				} else {
					return classes.filter(c => c.includes("language-"))[0]
				}
			})()

			const div = document.createElement("div")
			div.id = makeKey(8)
			const container = pre.parentElement
			container.replaceChild(div, pre)

			await pause(10)

			const app = new Vue({
				el: div,

				data: {
					readOnly: true,
					editor: null,
					id: div.id,
				},

				template: /*html*/ `
					<div class="gt-editor">
						<div class="gt-editor-inner" ref="editor">
						</div>
					</div>
				`,

				mounted() {
					const self = this

					const editor = ace.edit(self.$refs.editor)
					editor.setTheme("ace/theme/tomorrow")
					editor.setReadOnly(self.readOnly)
					editor.renderer.setOption("printMargin", false)

					const session = editor.getSession()

					if (codeClass === "language-gt") {
						session.setMode(new GuidedTrackMode())
					} else {
						session.setMode(modeDict[codeClass])

						// if js, disable warnings about semicolons
						if (codeClass === "language-js") {
							session.$worker.send("changeOptions", [{ asi: true }])
						}
					}

					session.setUseSoftTabs(false)
					session.setValue(code)
					session.setUseWrapMode(true)
					session.setWrapLimitRange()

					let maxLines = 0
					const width = container.getBoundingClientRect().width
					const charsPerLine = width / 12

					code.split("\n").forEach(line => {
						maxLines += Math.max(1, Math.ceil(line.length / charsPerLine))
					})

					editor.setOption("maxLines", maxLines)
					Vue.set(self, "editor", editor)

					setTimeout(() => {
						editor.resize()
						self.$el.classList.add(codeClass)
					}, 100)
				},
			})
		}, 100)

		await pause(10)
	}
}

run()
