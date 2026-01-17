// tailwind.config.js
export default {
	content: [
		'./index.html',
		'./src/**/*.{vue,js,ts,jsx,tsx,md}',
		'./components/**/*.{vue,js,ts,jsx,tsx,md}',
		'./layouts/**/*.{vue,js,ts,jsx,tsx,md}'
	],
	darkMode: 'class',
	theme: {
		container: {
			center: true,
			padding: '1rem'
		},
		extend: {
			colors: {
				primary: {
					DEFAULT: '#0ea5a4',
					50: '#f2fdfa',
					100: '#e6fbfa',
					200: '#bfefee',
					300: '#96e3e2',
					400: '#5fd1cc',
					500: '#2bbfb8',
					600: '#0ea5a4',
					700: '#0b7e74',
					800: '#085c54',
					900: '#063f39'
				}
			},
			fontFamily: {
				sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
			}
		}
	},
	plugins: []
}