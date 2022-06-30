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
		'@typescript-eslint/triple-slash-reference': 'off',
		'@typescript-eslint/ban-types': 'off',
		'@typescript-eslint/naming-convention': 'off',
		'@typescript-eslint/indent': 'off',
		'@typescript-eslint/quotes': 'off',
		'operator-linebreak': 'off',
		'jsx-quotes': 'off',
	},
};
