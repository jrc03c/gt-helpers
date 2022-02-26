// adapted from:
// https://github.com/willfind/research-guidedtrack-web/blob/master/app/javascript/components/editor/editor/research-guidedTrackMode.js

const ace = require("brace")
const { TextHighlightRules } = ace.acequire("ace/mode/text_highlight_rules")
const { Mode } = ace.acequire("ace/mode/text")

class CustomHighlightRules extends TextHighlightRules {
  constructor() {
    super()

    var url = /http(?:s)?:\/\/[\w\-.]+\.[a-zA-Z]{2,}(?:\/[^\s\]]+)?\/?/
    var lineEnd = "\\s*$"
    var keywordStart = "^\\t*\\*"
    var colon = "(:\\s*)"
    var colonOrLineEnd = "(:\\s*|\\s*$)"
    var identifier = "[a-zA-Z][a-zA-Z0-9_]*"
    var identifierCaptured = "(" + identifier + ")"
    var number = "-?(?:\\d+(?:\\.\\d+)?|\\.\\d+)"

    var keyword = [
      "question",
      "randomize",
      "everytime",
      "goto",
      "group",
      "image",
      "video",
      "url",
      "caption",
      "position",
      "maintain",
      "clear",
      "type",
      "label",
      "name",
      "other",
      "blank",
      "button",
      "list",
      "style",
      "header",
      "tags",
      "summary",
      "program",
      "settings",
      "back",
      "login",
      "required",
      "email",
      "subject",
      "body",
      "to",
      "tip",
      "console",
      "quit",
      "return",
      "audio",
      "hide",
      "start",
      "before",
      "after",
      "repeat",
      "progress",
      "chart",
      "icon",
      "navigation",
      "experiment",
      "xaxis",
      "yaxis",
      "share",
      "description",
      "picture",
      "title",
      "classes",
      "shuffle",
      "color",
      "trendline",
      "multiple",
      "confirm",
      "menu",
      "date",
      "time",
      "cancel",
      "identifier",
      "service",
      "path",
      "method",
      "success",
      "error",
      "trigger",
      "events",
      "startup",
      "reset",
      "page",
      "throwaway",
      "switch",
      "component",
      "click",
      "html",
      "purchase",
      "frequency",
      "history",
      "management",
      "status",
      "database",
      "what",
    ].join("|")

    var captureKeyword = function (keyword) {
      return "(" + keywordStart + keyword + ")"
    }

    var embeddingOperatorClass = "keyword.operator"

    var embeddedExpressionStartToken = function (nextState) {
      return { token: embeddingOperatorClass, regex: /\{/, next: nextState }
    }

    var expressionWithTerminator = function (terminatorRegex, nextState) {
      return [
        {
          token: embeddingOperatorClass,
          regex: terminatorRegex,
          next: nextState,
        },
        { token: "constant.numeric", regex: number },
        { token: "variable", regex: identifier },
        { token: "string", regex: /"[^"]*"/ },
        { token: "keyword.operator", regex: /[+-/*=^]/ }, //*/
        { token: "keyword.operator", regex: /[<>](?:=)?/ },
        { token: "keyword.operator", regex: /(and|or|not|in)\W/ },
        { token: "keyword.operator", regex: /[[\]]/ },
        { token: "keyword.operator", regex: /[()]/ },
        { token: "keyword.operator", regex: /[{}]/ },
      ]
    }

    var keywordWithInlineExpression = function (keyword) {
      return {
        token: ["keyword", "keyword.operator"],
        regex: captureKeyword(keyword) + colonOrLineEnd,
        next: "expression",
      }
    }

    this.$rules = {
      start: [
        //*settings
        {
          token: "keyword",
          regex: keywordStart + "(?:" + keyword + ")" + lineEnd,
        },
        // *question: How are you?
        {
          token: ["keyword", "keyword.operator"],
          regex: "(" + keywordStart + "(?:" + keyword + "))" + colon,
          next: "inline-text",
        },
        // *points: hide
        {
          token: ["keyword", "keyword.operator", "constant.character"],
          regex: captureKeyword("points") + colon + "(\\s*hide)" + lineEnd,
        },
        // *points: 2 type
        {
          token: [
            "keyword",
            "keyword.operator",
            "constant.numeric",
            "variable",
          ],
          regex:
            captureKeyword("points") +
            colon +
            "(\\s*" +
            number +
            ")(\\s+" +
            identifier +
            ")?" +
            lineEnd,
        },
        // *set: visited
        {
          token: ["keyword", "keyword.operator", "variable"],
          regex: captureKeyword("set") + colon + identifierCaptured + lineEnd,
        },
        // *save: answer
        {
          token: ["keyword", "keyword.operator", "variable"],
          regex: captureKeyword("save") + colon + identifierCaptured + lineEnd,
        },
        // *if: visited and points >= 10
        keywordWithInlineExpression("if"),
        // *while: not quit
        keywordWithInlineExpression("while"),
        // *data: [["a", 1], ["b", 2]]
        keywordWithInlineExpression("data"),
        // *answers: ["One", "Two", "Three"]
        keywordWithInlineExpression("answers"),
        // *min: 4.32 * 5 - 3
        keywordWithInlineExpression("min"),
        // *max: 10.32 / 3
        keywordWithInlineExpression("max"),
        // *ticks: [[1.5, "littler"], [2.5, "bigger"]]
        keywordWithInlineExpression("ticks"),
        // *opacity: 0.2 + my_preference
        keywordWithInlineExpression("opacity"),
        // *when: calendar::now + 1.days
        keywordWithInlineExpression("when"),
        // *every: 1.day
        keywordWithInlineExpression("every"),
        // *until: calendar::now + 1.days
        keywordWithInlineExpression("until"),
        // *countdown: 1.hour
        keywordWithInlineExpression("countdown"),
        // *send: { "some" -> "data" }
        keywordWithInlineExpression("send"),
        // *with: {"a" -> {"b" -> "c"}}
        keywordWithInlineExpression("with"),
        // *default: ["one", "two", "three"]
        keywordWithInlineExpression("default"),
        // *wait: 1.minute + 5.seconds
        keywordWithInlineExpression("wait"),

        {
          token: "comment",
          regex: /^\s*--/,
          next: "comment-body",
        },

        // >> x = 3
        {
          token: ["keyword", "console-command"],
          regex: /^\s*>>/,
          next: "console-command",
        },

        // *rollovers: ["One", "Two", "Three"]
        {
          token: ["keyword", "keyword.operator"],
          regex: captureKeyword("rollovers") + colon,
          next: "expression",
        },
        {
          token: "keyword",
          regex: keywordStart + "(?:rollovers)" + lineEnd,
        },

        // *for: key, value in expression
        {
          token: ["keyword", "keyword.operator"],
          regex: captureKeyword("for") + colon,
          next: "for-identifiers",
        },

        embeddedExpressionStartToken("embedded-expression"),

        { token: "string", regex: url },
        { token: embeddingOperatorClass, regex: /\[/, next: "link" },
      ],

      // -- TODO: task
      // -- normal comment
      "comment-body": [
        { defaultToken: "comment" },
        {
          token: "constant.language.bold",
          regex: /[A-Z]+:/,
        },
        { token: "comment", regex: "$", next: "start" },
      ],

      "inline-text": [
        { defaultToken: "constant.character" },
        { token: "text", regex: "$", next: "start" },
        embeddedExpressionStartToken("expression-embedded-in-inline-text"),
      ],

      "console-command": [
        { token: "text", regex: "$", next: "start" },
        { token: "variable", regex: /.+\s*(?==)/, next: "expression" },
        {
          token: ["variable"],
          regex: "\\w+(?=\\.)",
          next: "mutator-method-target",
        },
      ],

      "mutator-method-target": expressionWithTerminator(
        "\\.",
        "mutator-method"
      ),

      "mutator-method": [
        {
          token: "variable",
          regex: identifier + "$",
          next: "start",
        },
        {
          token: "variable",
          regex: identifier,
          next: "expression",
        },
      ],

      link: [
        { defaultToken: "keyword" },
        { token: embeddingOperatorClass, regex: /\]/, next: "start" },
        { token: embeddingOperatorClass, regex: /\|/ },
        { token: "string", regex: url },
        embeddedExpressionStartToken("expression-embedded-in-link"),
      ],

      "for-identifiers": expressionWithTerminator(" in ", "expression"),

      expression: expressionWithTerminator("$", "start"),

      "embedded-expression": expressionWithTerminator(/\}/, "start"),

      "expression-embedded-in-inline-text": expressionWithTerminator(
        /\}(?=[^$])/,
        "inline-text"
      ).concat([{ token: embeddingOperatorClass, regex: /$/, next: "start" }]),

      "expression-embedded-in-link": expressionWithTerminator(/\}/, "link"),
    }
  }
}

class GuidedTrackMode extends Mode {
  constructor() {
    super()

    this.lineCommentStart = "--"
    this.HighlightRules = CustomHighlightRules
  }
}

module.exports = {
  CustomHighlightRules,
  GuidedTrackMode,
}
