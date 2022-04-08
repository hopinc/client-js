module.exports = {
	extends: ['xo', 'xo-typescript'],
	plugins: ['@typescript-eslint'],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaFeatures: {jsx: true},
		ecmaVersion: 12,
		sourceType: 'module',
		project: './tsconfig.json',
	},
	ignorePatterns: ['**/*.js', '**/dist/**/*'],
	rules: {
		// Rules that we don't need/unnecessary
		'@typescript-eslint/triple-slash-reference': 'off',
	},
};
