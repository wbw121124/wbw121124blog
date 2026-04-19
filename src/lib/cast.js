// AST 节点类型枚举
const ast_type = {
	ROOT: 0, STRING: 1, KEYWORD: 2, NUMBER: 3, FUNCTION: 4,
	CLASS: 5, PREPROCESSOR_KEYWORD: 6, EMPTY: 7, BRACKET: 8,
	DEFINE: 9, OPERATOR: 10, COMMENT: 11, UNKNOWN: 12
};

// C++ 标准枚举
const CppStandard = {
	CPP98: 0,
	CPP11: 1,
	CPP14: 2,
	CPP17: 3,
	CPP20: 4,
	CPP23: 5
};

// AST 节点类
class ASTNode {
	constructor() {
		this.type = ast_type.EMPTY;
		this.word = '';
		this.father = null;
		this.children = [];
	}
}

// C++ 标准管理器
class CppStandardManager {
	constructor(standard = CppStandard.CPP14) {
		this.currentStandard = standard;
		this.standardNames = {
			[CppStandard.CPP98]: "C++98",
			[CppStandard.CPP11]: "C++11",
			[CppStandard.CPP14]: "C++14",
			[CppStandard.CPP17]: "C++17",
			[CppStandard.CPP20]: "C++20",
			[CppStandard.CPP23]: "C++23"
		};
	}

	setStandard(standard) {
		this.currentStandard = standard;
	}

	getStandard() {
		return this.currentStandard;
	}

	getStandardName(standard = null) {
		return this.standardNames[standard || this.currentStandard];
	}

	getSupportedStandards() {
		return [CppStandard.CPP98, CppStandard.CPP11, CppStandard.CPP14,
		CppStandard.CPP17, CppStandard.CPP20, CppStandard.CPP23];
	}
}

// 关键字管理器
class KeywordManager {
	constructor(standardManager) {
		this.standardManager = standardManager;

		// 基础关键字
		this.baseKeywords = [
			"int", "bool", "long", "double", "float", "char", "void",
			"const", "enum", "class", "struct", "unsigned", "signed",
			"short", "auto", "volatile", "mutable", "using", "namespace",
			"template", "typename", "public", "protected", "private", "friend",
			"new", "return", "break", "if", "else", "continue", "switch",
			"do", "while", "for", "case", "default", "goto", "try", "catch",
			"throw", "delete", "static", "extern", "register", "inline",
			"virtual", "explicit", "NULL", "true", "false", "operator"
		];

		// C++11 新增关键字
		this.cpp11Keywords = [
			"alignas", "alignof", "char16_t", "char32_t", "constexpr", "decltype",
			"final", "noexcept", "nullptr", "override", "static_assert", "thread_local"
		];

		// C++14 新增关键字（无新增）
		this.cpp14Keywords = [];

		// C++17 新增关键字
		this.cpp17Keywords = ["inline"];

		// C++20 新增关键字
		this.cpp20Keywords = [
			"concept", "consteval", "constinit", "co_await", "co_return", "co_yield",
			"char8_t", "requires"
		];

		// C++23 新增关键字
		this.cpp23Keywords = [];

		// MinGW 特定关键字
		this.mingwKeywords = [
			"__attribute__", "__declspec", "__stdcall", "__cdecl", "__fastcall",
			"__thiscall", "__vectorcall", "__asm", "__inline", "__forceinline",
			"__MINGW32__", "__MINGW64__", "__GNUC__", "__GNUG__", "__cplusplus"
		];

		this.allKeywords = new Set();
		this.updateKeywords();
	}

	updateKeywords() {
		this.allKeywords.clear();

		// 添加基础关键字
		this.baseKeywords.forEach(kw => this.allKeywords.add(kw));

		// 根据C++版本添加关键字
		const currentStd = this.standardManager.getStandard();

		if (currentStd >= CppStandard.CPP11) {
			this.cpp11Keywords.forEach(kw => this.allKeywords.add(kw));
		}
		if (currentStd >= CppStandard.CPP17) {
			this.cpp17Keywords.forEach(kw => this.allKeywords.add(kw));
		}
		if (currentStd >= CppStandard.CPP20) {
			this.cpp20Keywords.forEach(kw => this.allKeywords.add(kw));
		}
		if (currentStd >= CppStandard.CPP23) {
			this.cpp23Keywords.forEach(kw => this.allKeywords.add(kw));
		}

		// 添加 MinGW 关键字
		this.mingwKeywords.forEach(kw => this.allKeywords.add(kw));
	}

	isKeyword(word) {
		return this.allKeywords.has(word);
	}

	setStandard(standard) {
		this.standardManager.setStandard(standard);
		this.updateKeywords();
	}
}

// 类管理器
class ClassManager {
	constructor() {
		this.classes = new Set([
			"short", "inline", "int", "bool", "long", "double", "float",
			"char", "void", "const", "unsigned", "signed", "auto"
		]);
	}

	insert(s) {
		this.classes.add(s);
	}

	isClass(s) {
		return this.classes.has(s);
	}
}

// 宏定义管理器
class DefineManager {
	constructor() {
		this.defines = new Set();
	}

	insert(s) {
		this.defines.add(s);
	}

	erase(s) {
		this.defines.delete(s);
	}

	isDefine(s) {
		return this.defines.has(s);
	}
}

// 主转换类
class ToCast {
	constructor() {
		this.root = null;
		this.brackets = new Map();
		this.file = '';
		this.cppStandard = new CppStandardManager(CppStandard.CPP14);
		this.keywords = new KeywordManager(this.cppStandard);
		this.classes = new ClassManager();
		this.defines = new DefineManager();
		this.hljsClassMap = {
			[ast_type.KEYWORD]: 'hljs-keyword',
			[ast_type.STRING]: 'hljs-string',
			[ast_type.COMMENT]: 'hljs-comment',
			[ast_type.NUMBER]: 'hljs-number',
			[ast_type.FUNCTION]: 'hljs-built_in',
			[ast_type.CLASS]: 'hljs-type',
			[ast_type.PREPROCESSOR_KEYWORD]: 'hljs-meta',
			[ast_type.DEFINE]: 'hljs-symbol',
			[ast_type.OPERATOR]: 'hljs-operator'
		};
	}

	// 处理注释
	comment(pos, f, fa, r) {
		let cur = null;
		if (f) {
			cur = new ASTNode();
			cur.father = fa;
			cur.type = ast_type.COMMENT;
			fa.children.push(cur);
		}

		if (this.file[pos] === '/' && pos + 1 < r && this.file[pos + 1] === '/') {
			if (f) cur.word += this.file[pos];
			pos++;
			if (pos >= r) return pos;

			let ff = this.file[pos] === '\\';
			while (pos < r && (this.file[pos] !== '\n' || ff)) {
				if (ff) ff = false;
				else if (this.file[pos] === '\\') ff = true;
				if (f) cur.word += this.file[pos];
				pos++;
			}
			pos--;
		} else if (this.file[pos] === '/' && pos + 1 < r && this.file[pos + 1] === '*') {
			if (f) {
				cur.word += this.file[pos];
				cur.word += this.file[pos + 1];
			}
			pos += 2;
			if (pos >= r) return pos;

			while (pos + 1 < r && !(this.file[pos] === '*' && this.file[pos + 1] === '/')) {
				if (f) cur.word += this.file[pos];
				pos++;
			}
			if (pos + 1 < r) {
				if (f) {
					cur.word += this.file[pos];
					cur.word += this.file[pos + 1];
				}
				pos++;
			}
		}
		return pos;
	}

	// 处理字符串
	string(pos, f, fa, r) {
		let cur = null;
		if (f) {
			cur = new ASTNode();
			cur.father = fa;
			cur.type = ast_type.STRING;
			fa.children.push(cur);
		}

		const tmp = this.file[pos];
		let ff = false;
		if (f) cur.word += this.file[pos];
		pos++;

		while (pos < r && (this.file[pos] !== tmp || ff)) {
			if (f) cur.word += this.file[pos];
			if (ff) ff = false;
			else if (this.file[pos] === '\\') ff = true;
			pos++;
		}
		if (pos < r && f) cur.word += this.file[pos];
		return pos;
	}

	// 处理预处理器关键字
	preprocessorKeyword(pos, f, fa, r) {
		let cur = null;
		if (f) {
			cur = new ASTNode();
			cur.father = fa;
			cur.type = ast_type.PREPROCESSOR_KEYWORD;
			fa.children.push(cur);
		}

		if (f) cur.word += this.file[pos];
		pos++;
		let ff = false;

		while (pos < r && (this.file[pos] !== '\n' || ff)) {
			if (f) cur.word += this.file[pos];
			if (ff) ff = false;
			else if (this.file[pos] === '\\') ff = true;
			pos++;
			if (pos >= r) return pos;
		}

		if (f) {
			const words = cur.word.trim().split(/\s+/);
			if (words[0] === '#define' && words[1]) {
				this.defines.insert(words[1]);
			} else if (words[0] === '#undef' && words[1]) {
				this.defines.erase(words[1]);
			}
		}
		pos--;
		return pos;
	}

	// 运行解析
	run(ff = false, l = 0, r = -1, root = null) {
		if (r === -1) r = this.file.length;
		if (root === null) root = this.root;

		let pos = l;

		// 预处理括号
		if (ff) {
			const st = [];
			pos = l;

			while (pos < r) {
				if (this.file[pos] === '#' && (pos === 0 || this.file[pos - 1] === '\n')) {
					pos = this.preprocessorKeyword(pos, false, null, r);
				} else if (this.file[pos] === '/' && pos + 1 < r &&
					(this.file[pos + 1] === '/' || this.file[pos + 1] === '*')) {
					pos = this.comment(pos, false, null, r);
				} else if (this.file[pos] === '"' || this.file[pos] === "'") {
					pos = this.string(pos, false, null, r);
				} else if (this.file[pos] === '(' || this.file[pos] === '[' || this.file[pos] === '{') {
					st.push(pos);
				} else if (this.file[pos] === ')' || this.file[pos] === ']' || this.file[pos] === '}') {
					const back = st.pop();
					this.brackets.set(pos, back);
					this.brackets.set(back, pos);
				}
				pos++;
			}
			pos = l;
		}

		let isclass = false, istypedef = false, isdef = false;

		while (pos < r) {
			if (this.file[pos] === '#' && (pos === 0 || this.file[pos - 1] === '\n')) {
				pos = this.preprocessorKeyword(pos, true, root, r);
			} else if (this.file[pos] === '/' && pos + 1 < r &&
				(this.file[pos + 1] === '/' || this.file[pos + 1] === '*')) {
				pos = this.comment(pos, true, root, r);
			} else if (this.file[pos] === '"' || this.file[pos] === "'") {
				pos = this.string(pos, true, root, r);
			} else if (this.file[pos] === ' ' || this.file[pos] === '\t' || this.file[pos] === '\n') {
				const cur = new ASTNode();
				cur.father = root;
				cur.type = ast_type.EMPTY;
				cur.word = this.file[pos];
				root.children.push(cur);
			} else {
				const cur = new ASTNode();
				cur.father = root;
				cur.type = ast_type.UNKNOWN;
				cur.word = this.file[pos];
				root.children.push(cur);

				if (this.file[pos] === ';') istypedef = false;

				// 括号和运算符
				const brackets = '(){}[]';
				const operators = '+-*/=^&|:;\'"<>%!~?.,';

				if (brackets.includes(this.file[pos]) || operators.includes(this.file[pos])) {
					if (brackets.includes(this.file[pos])) {
						cur.type = ast_type.BRACKET;
						if ('([{'.includes(this.file[pos])) {
							const endPos = this.brackets.get(pos);
							if (endPos) {
								pos = this.run(false, pos + 1, endPos, cur) - 1;
							}
						}
					} else {
						cur.type = ast_type.OPERATOR;
					}
					pos++;
					continue;
				}

				pos++;

				// 获取下一个字符
				while (pos < r && !(' \t\n"\'(){}[]'.includes(this.file[pos]) ||
					operators.includes(this.file[pos]))) {
					cur.word += this.file[pos];
					pos++;
				}

				// 判断类型
				if (cur.word.length > 0 && cur.word[0] >= '0' && cur.word[0] <= '9') {
					cur.type = ast_type.NUMBER;
				} else {
					if (pos < r && this.file[pos] === '(') {
						cur.type = ast_type.FUNCTION;
					}

					if (isdef) isdef = false;

					if (this.defines.isDefine(cur.word)) {
						cur.type = ast_type.DEFINE;
					} else if (this.classes.isClass(cur.word)) {
						cur.type = ast_type.CLASS;
						isclass = false;
						isdef = true;
					} else if (['class', 'struct', 'new', 'enum'].includes(cur.word)) {
						isclass = true;
						cur.type = ast_type.KEYWORD;
					} else if (cur.word === 'typedef') {
						istypedef = true;
						cur.type = ast_type.KEYWORD;
					} else if (this.keywords.isKeyword(cur.word)) {
						cur.type = ast_type.KEYWORD;
					} else if (isclass) {
						this.classes.insert(cur.word);
						cur.type = ast_type.CLASS;
						isclass = false;
					} else if (istypedef) {
						this.classes.insert(cur.word);
						cur.type = ast_type.CLASS;
					}
				}
				pos--;
			}
			pos++;
		}
		return pos;
	}

	// 生成 Highlight.js HTML
	toHighlightJS(code) {
		this.file = code;
		this.root = new ASTNode();
		this.root.type = ast_type.ROOT;
		this.brackets.clear();

		this.run(true);

		return this.generateHTML(this.root);
	}

	// 生成HTML - 修复版本
	generateHTML(node) {
		let result = '';

		if (node.type !== ast_type.ROOT && node.type !== ast_type.EMPTY) {
			const hljsClass = this.hljsClassMap[node.type];
			if (hljsClass) {
				result += `<span class="${hljsClass}">${this.escapeHTML(node.word)}</span>`;
			} else {
				result += this.escapeHTML(node.word);
			}
		} else if (node.type === ast_type.EMPTY) {
			result += node.word;
		}

		for (const child of node.children) {
			result += this.generateHTML(child);
		}

		return result;
	}

	// HTML转义
	escapeHTML(text) {
		if (!text) return '';
		return text.replace(/[&<>]/g, function (c) {
			if (c === '&') return '&amp;';
			if (c === '<') return '&lt;';
			if (c === '>') return '&gt;';
			return c;
		});
	}

	// 清空
	clear() {
		this.root = null;
		this.brackets.clear();
		this.file = '';
	}
}

export default ToCast;