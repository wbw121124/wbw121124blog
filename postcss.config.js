import postcssImport from 'postcss-import'
import postcssNesting from 'postcss-nesting'
import autoprefixer from 'autoprefixer'
import postcssFontDisplay from 'postcss-font-display'
import tailwindcss from '@tailwindcss/postcss'

export default {
	plugins: [
		tailwindcss(),
		postcssImport(),
		postcssNesting(),
		autoprefixer(),
		postcssFontDisplay({ display: 'swap', replace: true }),
	]
}