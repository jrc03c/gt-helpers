// adapted from:
// https://github.com/willfind/research-guidedtrack-web/blob/master/app/javascript/components/editor/editor/research-guidedTrackMode.js

const ace = require("brace")
const { Mode } = ace.acequire("ace/mode/text")
const { TextHighlightRules } = ace.acequire("ace/mode/text_highlight_rules")

class CustomHighlightRules extends TextHighlightRules {
	constructor() {
		super()

		const url = /http(?:s)?:\/\/[\w\-.]+\.[a-zA-Z]{2,}(?:\/[^\s\]]+)?\/?/
		const lineEnd = "\\s*$"
		const keywordStart = "^\\t*\\*"
		const colon = "(:\\s*)"
		const colonOrLineEnd = "(:\\s*|\\s*$)"
		const identifier = "[a-zA-Z][a-zA-Z0-9_]*"
		const identifierCaptured = "(" + identifier + ")"
		const number = "-?(?:\\d+(?:\\.\\d+)?|\\.\\d+)"

		const keyword = [
			"after",
			"audio",
			"back",
			"before",
			"blank",
			"body",
			"button",
			"cancel",
			"caption",
			"chart",
			"classes",
			"clear",
			"click",
			"color",
			"component",
			"confirm",
			"console",
			"database",
			"date",
			"description",
			"email",
			"error",
			"events",
			"everytime",
			"experiment",
			"frequency",
			"goto",
			"group",
			"header",
			"hide",
			"history",
			"html",
			"icon",
			"identifier",
			"image",
			"label",
			"list",
			"login",
			"maintain",
			"management",
			"menu",
			"method",
			"multiple",
			"name",
			"navigation",
			"other",
			"page",
			"path",
			"picture",
			"position",
			"program",
			"progress",
			"purchase",
			"question",
			"quit",
			"randomize",
			"repeat",
			"required",
			"reset",
			"return",
			"service",
			"settings",
			"share",
			"shuffle",
			"start",
			"startup",
			"status",
			"style",
			"subject",
			"success",
			"summary",
			"switch",
			"tags",
			"throwaway",
			"time",
			"tip",
			"title",
			"to",
			"trendline",
			"trigger",
			"type",
			"url",
			"video",
			"what",
			"xaxis",
			"yaxis",
		].join("|")

		function captureKeyword(keyword) {
			return "(" + keywordStart + keyword + ")"
		}

		const embeddingOperatorClass = "keyword.operator"

		function embeddedExpressionStartToken(nextState) {
			return { token: embeddingOperatorClass, regex: /\{/, next: nextState }
		}

		function expressionWithTerminator(terminatorRegex, nextState) {
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

		function keywordWithInlineExpression(keyword) {
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
