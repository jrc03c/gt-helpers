const Vue = require("vue/dist/vue.min.js")
const lodash = require("lodash")
const { GuidedTrackMode } = require("./gt-mode.js")
const ace = require("brace")
require("brace/mode/javascript")
require("brace/mode/html")
require("brace/mode/css")
require("brace/theme/tomorrow")

module.exports = Vue.component("gt-editor", {
  props: ["code"],

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

    let maxLines = 5
    editor.setOption("minLines", maxLines)
    editor.setOption("maxLines", maxLines)
    Vue.set(self, "editor", editor)
    self.$el.classList.add("language-gt")

    let interval = setInterval(() => {
      const currentHeight = document.body.getBoundingClientRect().height

      if (currentHeight + 21 < window.innerHeight) {
        maxLines++
        editor.setOption("minLines", maxLines)
        editor.setOption("maxLines", maxLines)
        editor.resize()
      } else {
        clearInterval(interval)
      }
    }, 1)

    editor.on(
      "change",
      lodash.debounce(() => {
        self.$emit("updated", editor.getValue())
      }, 100)
    )
  },

  beforeDestroy() {
    const self = this
    self.editor.destroy()
  },
})
