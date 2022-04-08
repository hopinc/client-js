module.exports = {
	extends: ['xo-space', 'xo-typescript'],
	plugins: ['@typescript-eslint'],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaFeatures: {jsx: true},
		ecmaVersion: 12,
		sourceType: 'module',
		project: './tsconfig.json',
	},
	ignorePatterns: ['**/*.js'],
};
