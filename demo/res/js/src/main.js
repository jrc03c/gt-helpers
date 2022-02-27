const Vue = require("vue/dist/vue.min.js")
const gt = require("../../../..")
const GTEditorComponent = require("./gt-editor.js")
const papa = require("papaparse")

function downloadTextAsCSV(text, filename) {
  let a = document.createElement("a")
  a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(text)
  a.download = filename
  a.dispatchEvent(new MouseEvent("click"))
}

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
        const out = gt.program.extractQuestions(self.newSource)

        const raw = papa.unparse(
          out.values.map(row => {
            const temp = {}

            row.forEach((value, i) => {
              temp[out.columns[i]] = value
            })

            return temp
          }),
          {
            quotes: false,
            quoteChar: '"',
            escapeChar: '"',
            delimiter: ",",
            header: true,
            newline: "\r\n",
            skipEmptyLines: false,
            columns: out.columns,
          }
        )

        downloadTextAsCSV(raw, "questions.csv")
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
