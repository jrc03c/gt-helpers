const { createApp } = require("vue")
const { saveCSV } = require("@jrc03c/js-csv-helpers")
const gt = require("../../../..")
const GTEditorComponent = require("./gt-editor")

function downloadTextAsJSON(text, filename) {
	const a = document.createElement("a")
	a.href = `data:application/json;charset=utf-8,${encodeURIComponent(text)}`
	a.download = filename
	a.dispatchEvent(new MouseEvent("click"))
}

const app = createApp({
	components: {
		"gt-editor": GTEditorComponent,
	},

	template: /* html */ `
		<div class="notification is-danger floating-notification" ref="message">
			<button
				@click="$refs.message.classList.remove('is-active')"
				class="delete"></button>

			{{ message }}
		</div>

		<gt-editor :code="source" @updated="onSourceUpdate"></gt-editor>

		<p>
			<button @click="downloadCSV" class="button">Download CSV</button>
			<button @click="downloadJSON" class="button">Download JSON</button>
		</p>
	`,

	data() {
		return {
			message: "",
			source: "",
			newSource: "",
		}
	},

	watch: {
		newSource() {
			const self = this

			if (self.newSource.trim().length > 0) {
				self.$refs.message.classList.remove("is-active")
			}
		},
	},

	methods: {
		async downloadCSV() {
			const self = this

			if (self.newSource.trim().length === 0) {
				self.message = "Please enter some GT code first."
				self.$refs.message.classList.add("is-active")
				return
			}

			try {
				const out = gt.program.extractQuestions(self.newSource)
				await saveCSV("questions.csv", out)
			} catch (e) {
				self.message = e
			}
		},

		downloadJSON() {
			const self = this

			if (self.newSource.trim().length === 0) {
				self.message = "Please enter some GT code first."
				self.$refs.message.classList.add("is-active")
				return
			}

			try {
				const out = gt.program.extractQuestions(self.newSource)
				out.index = out.index.map(v => v.replaceAll("row", "question"))
				const obj = out.toObject(0)

				Object.keys(obj).forEach(key => {
					const item = obj[key]

					if (item.answers) {
						try {
							item.answers = JSON.parse(item.answers)
						} catch (e) {}
					}

					obj[key] = item
				})

				downloadTextAsJSON(JSON.stringify(obj, null, 2), "questions.json")
			} catch (e) {
				self.message = e
			}
		},

		onSourceUpdate(newSource) {
			const self = this
			self.newSource = newSource
		},
	},

	async mounted() {
		const self = this
		const response = await fetch("sample.gt")
		self.source = await response.text()
		self.newSource = self.source
	},
})

app.mount("#app")
