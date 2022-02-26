const Vue = require("vue/dist/vue.min.js")
const gt = require("../../../..")
const GTEditorComponent = require("./gt-editor.js")
const { Series } = require("@jrc03c/js-math-tools")

const app = new Vue({
  el: "#app",
  components: { GTEditorComponent },

  data: {
    message: "",
    source: "",
    newSource: "",
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
    downloadCSV() {
      const self = this

      if (self.newSource.trim().length === 0) {
        self.message = "Please enter some GT code first."
        self.$refs.message.classList.add("is-active")
        return
      }

      try {
        let out = gt.program.extractQuestions(self.newSource)

        if (out instanceof Series) {
          out = out.toDataFrame().transpose()
        }

        out.toCSV("questions.csv", false)
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
        let out = gt.program.extractQuestions(self.newSource)

        if (out instanceof Series) {
          out = out.toDataFrame().transpose()
        }

        out.index = out.index.map(v => v.replaceAll("row", "question"))
        out.toJSON("questions.json", 0)
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
