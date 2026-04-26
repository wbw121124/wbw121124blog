// postcss-escape-content.js
export default () => {
	return {
		postcssPlugin: 'escape-content',
		Declaration(decl) {
			if (decl.prop === 'content') {
				decl.value = decl.value.replace(/[\u0080-\uffff]/g, (char) => {
					return '\\' + char.charCodeAt(0).toString(16).padStart(4, '0');
				});
			}
		}
	}
};