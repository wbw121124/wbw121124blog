import postcssImport from 'postcss-import'
import postcssNesting from 'postcss-nesting'
import autoprefixer from 'autoprefixer'
import postcssFontDisplay from 'postcss-font-display'
import tailwindcss from '@tailwindcss/postcss'
import postcssEscapeContent from './lib/postcss-escape-content.js';

export default {
	plugins: [
		tailwindcss(),
		postcssImport(),
		postcssEscapeContent(),
		postcssNesting(),
		autoprefixer(),
		postcssFontDisplay({ display: 'swap', replace: true }),
	]
}