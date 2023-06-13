const { GuidedTrackMode } = require("./gt-mode.js")
const lodash = require("lodash")

const ace = require("brace")
require("brace/mode/css")
require("brace/mode/html")
require("brace/mode/javascript")
require("brace/theme/tomorrow")

module.exports = {
	name: "gt-editor",

	props: {
		code: {
			type: String,
			required: true,
			default: () => "",
		},
	},

	template: /* html */ `
    <div class="gt-editor">
      <div class="gt-editor-inner" ref="editor">
      </div>
    </div>
  `,

	data() {
		return {
			readOnly: false,
			editor: null,
		}
	},

	watch: {
		code() {
			const self = this
			self.onCodeChange()
		},
	},

	methods: {
		onCodeChange() {
			const self = this
			self.editor.setValue(self.code)
			self.editor.clearSelection()
			self.editor.scrollToLine(0)
		},
	},

	mounted() {
		const self = this

		const editor = ace.edit(self.$refs.editor)
		editor.setTheme("ace/theme/tomorrow")
		editor.setReadOnly(self.readOnly)
		editor.renderer.setOption("printMargin", false)

		const session = editor.getSession()
		session.setMode(new GuidedTrackMode())
		session.setUseSoftTabs(false)
		session.setValue(self.code)
		session.setUseWrapMode(true)
		session.setWrapLimitRange()

		this.editor = editor
		self.$el.classList.add("language-gt")

		editor.on(
			"change",
			lodash.debounce(() => {
				self.$emit("updated", editor.getValue())
			}, 100)
		)
	},

	unmounted() {
		const self = this
		self.editor.destroy()
	},
}
