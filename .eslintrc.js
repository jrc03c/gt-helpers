module.exports = {
	env: {
		browser: true,
		commonjs: true,
		es2021: true,
		jest: true,
		node: true,
	},
	extends: "eslint:recommended",
	overrides: [],
	parserOptions: {
		ecmaVersion: "latest",
	},
	rules: {
		"no-empty": [
			"error",
			{
				allowEmptyCatch: true,
			},
		],
	},
}
