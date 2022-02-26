const Vue = require("vue/dist/vue.min.js")
const gt = require("../../../..")

const app = new Vue({
  el: "#app",

  data: {
    message: "",
    source: "",
  },

  methods: {
    downloadCSV() {
      const self = this

      try {
        gt.program.extractQuestions(self.source).toCSV("questions.csv", false)
      } catch (e) {
        self.message = e
      }
    },

    downloadJSON() {
      const self = this

      try {
        const df = gt.program.extractQuestions(self.source)
        df.index = df.index.map(v => v.replaceAll("row", "question"))
        df.toJSON("questions.json", 0)
      } catch (e) {
        self.message = e
      }
    },
  },

  async mounted() {
    const self = this
    const response = await fetch("sample.gt")
    self.source = await response.text()
  },
})
