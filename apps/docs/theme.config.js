// theme.config.js
export default {
	projectLink: 'https://github.com/hopinc/hop-js',
	docsRepositoryBase:
		'https://github.com/hopinc/hop-js/tree/master/apps/docs/pages',
	titleSuffix: ' — Hop JS Client SDK',
	nextLinks: true,
	prevLinks: true,
	search: true,
	customSearch: null,
	darkMode: true,
	footer: true,
	footerText: `MIT ${new Date().getFullYear()} © Hop, Inc.`,
	footerEditLink: 'Edit this page on GitHub',
	logo: <span>Hop</span>,
	unstable_faviconGlyph: '👋',
	head: (
		<>
			<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			<meta name="description" content="Hop: the realtime engine" />
			<meta name="og:title" content="Hop: the realtime engine" />
		</>
	),
};
