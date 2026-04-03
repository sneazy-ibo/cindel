var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/picomatch/lib/constants.js
var require_constants = __commonJS({
  "node_modules/picomatch/lib/constants.js"(exports, module) {
    "use strict";
    var WIN_SLASH = "\\\\/";
    var WIN_NO_SLASH = `[^${WIN_SLASH}]`;
    var DOT_LITERAL = "\\.";
    var PLUS_LITERAL = "\\+";
    var QMARK_LITERAL = "\\?";
    var SLASH_LITERAL = "\\/";
    var ONE_CHAR = "(?=.)";
    var QMARK = "[^/]";
    var END_ANCHOR = `(?:${SLASH_LITERAL}|$)`;
    var START_ANCHOR = `(?:^|${SLASH_LITERAL})`;
    var DOTS_SLASH = `${DOT_LITERAL}{1,2}${END_ANCHOR}`;
    var NO_DOT = `(?!${DOT_LITERAL})`;
    var NO_DOTS = `(?!${START_ANCHOR}${DOTS_SLASH})`;
    var NO_DOT_SLASH = `(?!${DOT_LITERAL}{0,1}${END_ANCHOR})`;
    var NO_DOTS_SLASH = `(?!${DOTS_SLASH})`;
    var QMARK_NO_DOT = `[^.${SLASH_LITERAL}]`;
    var STAR = `${QMARK}*?`;
    var SEP = "/";
    var POSIX_CHARS = {
      DOT_LITERAL,
      PLUS_LITERAL,
      QMARK_LITERAL,
      SLASH_LITERAL,
      ONE_CHAR,
      QMARK,
      END_ANCHOR,
      DOTS_SLASH,
      NO_DOT,
      NO_DOTS,
      NO_DOT_SLASH,
      NO_DOTS_SLASH,
      QMARK_NO_DOT,
      STAR,
      START_ANCHOR,
      SEP
    };
    var WINDOWS_CHARS = {
      ...POSIX_CHARS,
      SLASH_LITERAL: `[${WIN_SLASH}]`,
      QMARK: WIN_NO_SLASH,
      STAR: `${WIN_NO_SLASH}*?`,
      DOTS_SLASH: `${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$)`,
      NO_DOT: `(?!${DOT_LITERAL})`,
      NO_DOTS: `(?!(?:^|[${WIN_SLASH}])${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$))`,
      NO_DOT_SLASH: `(?!${DOT_LITERAL}{0,1}(?:[${WIN_SLASH}]|$))`,
      NO_DOTS_SLASH: `(?!${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$))`,
      QMARK_NO_DOT: `[^.${WIN_SLASH}]`,
      START_ANCHOR: `(?:^|[${WIN_SLASH}])`,
      END_ANCHOR: `(?:[${WIN_SLASH}]|$)`,
      SEP: "\\"
    };
    var POSIX_REGEX_SOURCE = {
      alnum: "a-zA-Z0-9",
      alpha: "a-zA-Z",
      ascii: "\\x00-\\x7F",
      blank: " \\t",
      cntrl: "\\x00-\\x1F\\x7F",
      digit: "0-9",
      graph: "\\x21-\\x7E",
      lower: "a-z",
      print: "\\x20-\\x7E ",
      punct: "\\-!\"#$%&'()\\*+,./:;<=>?@[\\]^_`{|}~",
      space: " \\t\\r\\n\\v\\f",
      upper: "A-Z",
      word: "A-Za-z0-9_",
      xdigit: "A-Fa-f0-9"
    };
    module.exports = {
      MAX_LENGTH: 1024 * 64,
      POSIX_REGEX_SOURCE,
      // regular expressions
      REGEX_BACKSLASH: /\\(?![*+?^${}(|)[\]])/g,
      REGEX_NON_SPECIAL_CHARS: /^[^@![\].,$*+?^{}()|\\/]+/,
      REGEX_SPECIAL_CHARS: /[-*+?.^${}(|)[\]]/,
      REGEX_SPECIAL_CHARS_BACKREF: /(\\?)((\W)(\3*))/g,
      REGEX_SPECIAL_CHARS_GLOBAL: /([-*+?.^${}(|)[\]])/g,
      REGEX_REMOVE_BACKSLASH: /(?:\[.*?[^\\]\]|\\(?=.))/g,
      // Replace globs with equivalent patterns to reduce parsing time.
      REPLACEMENTS: {
        __proto__: null,
        "***": "*",
        "**/**": "**",
        "**/**/**": "**"
      },
      // Digits
      CHAR_0: 48,
      /* 0 */
      CHAR_9: 57,
      /* 9 */
      // Alphabet chars.
      CHAR_UPPERCASE_A: 65,
      /* A */
      CHAR_LOWERCASE_A: 97,
      /* a */
      CHAR_UPPERCASE_Z: 90,
      /* Z */
      CHAR_LOWERCASE_Z: 122,
      /* z */
      CHAR_LEFT_PARENTHESES: 40,
      /* ( */
      CHAR_RIGHT_PARENTHESES: 41,
      /* ) */
      CHAR_ASTERISK: 42,
      /* * */
      // Non-alphabetic chars.
      CHAR_AMPERSAND: 38,
      /* & */
      CHAR_AT: 64,
      /* @ */
      CHAR_BACKWARD_SLASH: 92,
      /* \ */
      CHAR_CARRIAGE_RETURN: 13,
      /* \r */
      CHAR_CIRCUMFLEX_ACCENT: 94,
      /* ^ */
      CHAR_COLON: 58,
      /* : */
      CHAR_COMMA: 44,
      /* , */
      CHAR_DOT: 46,
      /* . */
      CHAR_DOUBLE_QUOTE: 34,
      /* " */
      CHAR_EQUAL: 61,
      /* = */
      CHAR_EXCLAMATION_MARK: 33,
      /* ! */
      CHAR_FORM_FEED: 12,
      /* \f */
      CHAR_FORWARD_SLASH: 47,
      /* / */
      CHAR_GRAVE_ACCENT: 96,
      /* ` */
      CHAR_HASH: 35,
      /* # */
      CHAR_HYPHEN_MINUS: 45,
      /* - */
      CHAR_LEFT_ANGLE_BRACKET: 60,
      /* < */
      CHAR_LEFT_CURLY_BRACE: 123,
      /* { */
      CHAR_LEFT_SQUARE_BRACKET: 91,
      /* [ */
      CHAR_LINE_FEED: 10,
      /* \n */
      CHAR_NO_BREAK_SPACE: 160,
      /* \u00A0 */
      CHAR_PERCENT: 37,
      /* % */
      CHAR_PLUS: 43,
      /* + */
      CHAR_QUESTION_MARK: 63,
      /* ? */
      CHAR_RIGHT_ANGLE_BRACKET: 62,
      /* > */
      CHAR_RIGHT_CURLY_BRACE: 125,
      /* } */
      CHAR_RIGHT_SQUARE_BRACKET: 93,
      /* ] */
      CHAR_SEMICOLON: 59,
      /* ; */
      CHAR_SINGLE_QUOTE: 39,
      /* ' */
      CHAR_SPACE: 32,
      /*   */
      CHAR_TAB: 9,
      /* \t */
      CHAR_UNDERSCORE: 95,
      /* _ */
      CHAR_VERTICAL_LINE: 124,
      /* | */
      CHAR_ZERO_WIDTH_NOBREAK_SPACE: 65279,
      /* \uFEFF */
      /**
       * Create EXTGLOB_CHARS
       */
      extglobChars(chars) {
        return {
          "!": { type: "negate", open: "(?:(?!(?:", close: `))${chars.STAR})` },
          "?": { type: "qmark", open: "(?:", close: ")?" },
          "+": { type: "plus", open: "(?:", close: ")+" },
          "*": { type: "star", open: "(?:", close: ")*" },
          "@": { type: "at", open: "(?:", close: ")" }
        };
      },
      /**
       * Create GLOB_CHARS
       */
      globChars(win32) {
        return win32 === true ? WINDOWS_CHARS : POSIX_CHARS;
      }
    };
  }
});

// node_modules/picomatch/lib/utils.js
var require_utils = __commonJS({
  "node_modules/picomatch/lib/utils.js"(exports) {
    "use strict";
    var {
      REGEX_BACKSLASH,
      REGEX_REMOVE_BACKSLASH,
      REGEX_SPECIAL_CHARS,
      REGEX_SPECIAL_CHARS_GLOBAL
    } = require_constants();
    exports.isObject = (val) => val !== null && typeof val === "object" && !Array.isArray(val);
    exports.hasRegexChars = (str) => REGEX_SPECIAL_CHARS.test(str);
    exports.isRegexChar = (str) => str.length === 1 && exports.hasRegexChars(str);
    exports.escapeRegex = (str) => str.replace(REGEX_SPECIAL_CHARS_GLOBAL, "\\$1");
    exports.toPosixSlashes = (str) => str.replace(REGEX_BACKSLASH, "/");
    exports.isWindows = () => {
      if (typeof navigator !== "undefined" && navigator.platform) {
        const platform = navigator.platform.toLowerCase();
        return platform === "win32" || platform === "windows";
      }
      if (typeof process !== "undefined" && process.platform) {
        return process.platform === "win32";
      }
      return false;
    };
    exports.removeBackslashes = (str) => {
      return str.replace(REGEX_REMOVE_BACKSLASH, (match) => {
        return match === "\\" ? "" : match;
      });
    };
    exports.escapeLast = (input, char, lastIdx) => {
      const idx = input.lastIndexOf(char, lastIdx);
      if (idx === -1) return input;
      if (input[idx - 1] === "\\") return exports.escapeLast(input, char, idx - 1);
      return `${input.slice(0, idx)}\\${input.slice(idx)}`;
    };
    exports.removePrefix = (input, state = {}) => {
      let output = input;
      if (output.startsWith("./")) {
        output = output.slice(2);
        state.prefix = "./";
      }
      return output;
    };
    exports.wrapOutput = (input, state = {}, options = {}) => {
      const prepend = options.contains ? "" : "^";
      const append = options.contains ? "" : "$";
      let output = `${prepend}(?:${input})${append}`;
      if (state.negated === true) {
        output = `(?:^(?!${output}).*$)`;
      }
      return output;
    };
    exports.basename = (path, { windows } = {}) => {
      const segs = path.split(windows ? /[\\/]/ : "/");
      const last = segs[segs.length - 1];
      if (last === "") {
        return segs[segs.length - 2];
      }
      return last;
    };
  }
});

// node_modules/picomatch/lib/scan.js
var require_scan = __commonJS({
  "node_modules/picomatch/lib/scan.js"(exports, module) {
    "use strict";
    var utils = require_utils();
    var {
      CHAR_ASTERISK,
      /* * */
      CHAR_AT,
      /* @ */
      CHAR_BACKWARD_SLASH,
      /* \ */
      CHAR_COMMA,
      /* , */
      CHAR_DOT,
      /* . */
      CHAR_EXCLAMATION_MARK,
      /* ! */
      CHAR_FORWARD_SLASH,
      /* / */
      CHAR_LEFT_CURLY_BRACE,
      /* { */
      CHAR_LEFT_PARENTHESES,
      /* ( */
      CHAR_LEFT_SQUARE_BRACKET,
      /* [ */
      CHAR_PLUS,
      /* + */
      CHAR_QUESTION_MARK,
      /* ? */
      CHAR_RIGHT_CURLY_BRACE,
      /* } */
      CHAR_RIGHT_PARENTHESES,
      /* ) */
      CHAR_RIGHT_SQUARE_BRACKET
      /* ] */
    } = require_constants();
    var isPathSeparator = (code) => {
      return code === CHAR_FORWARD_SLASH || code === CHAR_BACKWARD_SLASH;
    };
    var depth = (token) => {
      if (token.isPrefix !== true) {
        token.depth = token.isGlobstar ? Infinity : 1;
      }
    };
    var scan = (input, options) => {
      const opts = options || {};
      const length = input.length - 1;
      const scanToEnd = opts.parts === true || opts.scanToEnd === true;
      const slashes = [];
      const tokens = [];
      const parts = [];
      let str = input;
      let index = -1;
      let start = 0;
      let lastIndex = 0;
      let isBrace = false;
      let isBracket = false;
      let isGlob = false;
      let isExtglob = false;
      let isGlobstar = false;
      let braceEscaped = false;
      let backslashes = false;
      let negated = false;
      let negatedExtglob = false;
      let finished = false;
      let braces = 0;
      let prev;
      let code;
      let token = { value: "", depth: 0, isGlob: false };
      const eos = () => index >= length;
      const peek = () => str.charCodeAt(index + 1);
      const advance = () => {
        prev = code;
        return str.charCodeAt(++index);
      };
      while (index < length) {
        code = advance();
        let next;
        if (code === CHAR_BACKWARD_SLASH) {
          backslashes = token.backslashes = true;
          code = advance();
          if (code === CHAR_LEFT_CURLY_BRACE) {
            braceEscaped = true;
          }
          continue;
        }
        if (braceEscaped === true || code === CHAR_LEFT_CURLY_BRACE) {
          braces++;
          while (eos() !== true && (code = advance())) {
            if (code === CHAR_BACKWARD_SLASH) {
              backslashes = token.backslashes = true;
              advance();
              continue;
            }
            if (code === CHAR_LEFT_CURLY_BRACE) {
              braces++;
              continue;
            }
            if (braceEscaped !== true && code === CHAR_DOT && (code = advance()) === CHAR_DOT) {
              isBrace = token.isBrace = true;
              isGlob = token.isGlob = true;
              finished = true;
              if (scanToEnd === true) {
                continue;
              }
              break;
            }
            if (braceEscaped !== true && code === CHAR_COMMA) {
              isBrace = token.isBrace = true;
              isGlob = token.isGlob = true;
              finished = true;
              if (scanToEnd === true) {
                continue;
              }
              break;
            }
            if (code === CHAR_RIGHT_CURLY_BRACE) {
              braces--;
              if (braces === 0) {
                braceEscaped = false;
                isBrace = token.isBrace = true;
                finished = true;
                break;
              }
            }
          }
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
        if (code === CHAR_FORWARD_SLASH) {
          slashes.push(index);
          tokens.push(token);
          token = { value: "", depth: 0, isGlob: false };
          if (finished === true) continue;
          if (prev === CHAR_DOT && index === start + 1) {
            start += 2;
            continue;
          }
          lastIndex = index + 1;
          continue;
        }
        if (opts.noext !== true) {
          const isExtglobChar = code === CHAR_PLUS || code === CHAR_AT || code === CHAR_ASTERISK || code === CHAR_QUESTION_MARK || code === CHAR_EXCLAMATION_MARK;
          if (isExtglobChar === true && peek() === CHAR_LEFT_PARENTHESES) {
            isGlob = token.isGlob = true;
            isExtglob = token.isExtglob = true;
            finished = true;
            if (code === CHAR_EXCLAMATION_MARK && index === start) {
              negatedExtglob = true;
            }
            if (scanToEnd === true) {
              while (eos() !== true && (code = advance())) {
                if (code === CHAR_BACKWARD_SLASH) {
                  backslashes = token.backslashes = true;
                  code = advance();
                  continue;
                }
                if (code === CHAR_RIGHT_PARENTHESES) {
                  isGlob = token.isGlob = true;
                  finished = true;
                  break;
                }
              }
              continue;
            }
            break;
          }
        }
        if (code === CHAR_ASTERISK) {
          if (prev === CHAR_ASTERISK) isGlobstar = token.isGlobstar = true;
          isGlob = token.isGlob = true;
          finished = true;
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
        if (code === CHAR_QUESTION_MARK) {
          isGlob = token.isGlob = true;
          finished = true;
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
        if (code === CHAR_LEFT_SQUARE_BRACKET) {
          while (eos() !== true && (next = advance())) {
            if (next === CHAR_BACKWARD_SLASH) {
              backslashes = token.backslashes = true;
              advance();
              continue;
            }
            if (next === CHAR_RIGHT_SQUARE_BRACKET) {
              isBracket = token.isBracket = true;
              isGlob = token.isGlob = true;
              finished = true;
              break;
            }
          }
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
        if (opts.nonegate !== true && code === CHAR_EXCLAMATION_MARK && index === start) {
          negated = token.negated = true;
          start++;
          continue;
        }
        if (opts.noparen !== true && code === CHAR_LEFT_PARENTHESES) {
          isGlob = token.isGlob = true;
          if (scanToEnd === true) {
            while (eos() !== true && (code = advance())) {
              if (code === CHAR_LEFT_PARENTHESES) {
                backslashes = token.backslashes = true;
                code = advance();
                continue;
              }
              if (code === CHAR_RIGHT_PARENTHESES) {
                finished = true;
                break;
              }
            }
            continue;
          }
          break;
        }
        if (isGlob === true) {
          finished = true;
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
      }
      if (opts.noext === true) {
        isExtglob = false;
        isGlob = false;
      }
      let base = str;
      let prefix = "";
      let glob = "";
      if (start > 0) {
        prefix = str.slice(0, start);
        str = str.slice(start);
        lastIndex -= start;
      }
      if (base && isGlob === true && lastIndex > 0) {
        base = str.slice(0, lastIndex);
        glob = str.slice(lastIndex);
      } else if (isGlob === true) {
        base = "";
        glob = str;
      } else {
        base = str;
      }
      if (base && base !== "" && base !== "/" && base !== str) {
        if (isPathSeparator(base.charCodeAt(base.length - 1))) {
          base = base.slice(0, -1);
        }
      }
      if (opts.unescape === true) {
        if (glob) glob = utils.removeBackslashes(glob);
        if (base && backslashes === true) {
          base = utils.removeBackslashes(base);
        }
      }
      const state = {
        prefix,
        input,
        start,
        base,
        glob,
        isBrace,
        isBracket,
        isGlob,
        isExtglob,
        isGlobstar,
        negated,
        negatedExtglob
      };
      if (opts.tokens === true) {
        state.maxDepth = 0;
        if (!isPathSeparator(code)) {
          tokens.push(token);
        }
        state.tokens = tokens;
      }
      if (opts.parts === true || opts.tokens === true) {
        let prevIndex;
        for (let idx = 0; idx < slashes.length; idx++) {
          const n = prevIndex ? prevIndex + 1 : start;
          const i = slashes[idx];
          const value = input.slice(n, i);
          if (opts.tokens) {
            if (idx === 0 && start !== 0) {
              tokens[idx].isPrefix = true;
              tokens[idx].value = prefix;
            } else {
              tokens[idx].value = value;
            }
            depth(tokens[idx]);
            state.maxDepth += tokens[idx].depth;
          }
          if (idx !== 0 || value !== "") {
            parts.push(value);
          }
          prevIndex = i;
        }
        if (prevIndex && prevIndex + 1 < input.length) {
          const value = input.slice(prevIndex + 1);
          parts.push(value);
          if (opts.tokens) {
            tokens[tokens.length - 1].value = value;
            depth(tokens[tokens.length - 1]);
            state.maxDepth += tokens[tokens.length - 1].depth;
          }
        }
        state.slashes = slashes;
        state.parts = parts;
      }
      return state;
    };
    module.exports = scan;
  }
});

// node_modules/picomatch/lib/parse.js
var require_parse = __commonJS({
  "node_modules/picomatch/lib/parse.js"(exports, module) {
    "use strict";
    var constants = require_constants();
    var utils = require_utils();
    var {
      MAX_LENGTH,
      POSIX_REGEX_SOURCE,
      REGEX_NON_SPECIAL_CHARS,
      REGEX_SPECIAL_CHARS_BACKREF,
      REPLACEMENTS
    } = constants;
    var expandRange = (args, options) => {
      if (typeof options.expandRange === "function") {
        return options.expandRange(...args, options);
      }
      args.sort();
      const value = `[${args.join("-")}]`;
      try {
        new RegExp(value);
      } catch (ex) {
        return args.map((v) => utils.escapeRegex(v)).join("..");
      }
      return value;
    };
    var syntaxError = (type, char) => {
      return `Missing ${type}: "${char}" - use "\\\\${char}" to match literal characters`;
    };
    var parse = (input, options) => {
      if (typeof input !== "string") {
        throw new TypeError("Expected a string");
      }
      input = REPLACEMENTS[input] || input;
      const opts = { ...options };
      const max = typeof opts.maxLength === "number" ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;
      let len = input.length;
      if (len > max) {
        throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
      }
      const bos = { type: "bos", value: "", output: opts.prepend || "" };
      const tokens = [bos];
      const capture = opts.capture ? "" : "?:";
      const PLATFORM_CHARS = constants.globChars(opts.windows);
      const EXTGLOB_CHARS = constants.extglobChars(PLATFORM_CHARS);
      const {
        DOT_LITERAL,
        PLUS_LITERAL,
        SLASH_LITERAL,
        ONE_CHAR,
        DOTS_SLASH,
        NO_DOT,
        NO_DOT_SLASH,
        NO_DOTS_SLASH,
        QMARK,
        QMARK_NO_DOT,
        STAR,
        START_ANCHOR
      } = PLATFORM_CHARS;
      const globstar = (opts2) => {
        return `(${capture}(?:(?!${START_ANCHOR}${opts2.dot ? DOTS_SLASH : DOT_LITERAL}).)*?)`;
      };
      const nodot = opts.dot ? "" : NO_DOT;
      const qmarkNoDot = opts.dot ? QMARK : QMARK_NO_DOT;
      let star = opts.bash === true ? globstar(opts) : STAR;
      if (opts.capture) {
        star = `(${star})`;
      }
      if (typeof opts.noext === "boolean") {
        opts.noextglob = opts.noext;
      }
      const state = {
        input,
        index: -1,
        start: 0,
        dot: opts.dot === true,
        consumed: "",
        output: "",
        prefix: "",
        backtrack: false,
        negated: false,
        brackets: 0,
        braces: 0,
        parens: 0,
        quotes: 0,
        globstar: false,
        tokens
      };
      input = utils.removePrefix(input, state);
      len = input.length;
      const extglobs = [];
      const braces = [];
      const stack = [];
      let prev = bos;
      let value;
      const eos = () => state.index === len - 1;
      const peek = state.peek = (n = 1) => input[state.index + n];
      const advance = state.advance = () => input[++state.index] || "";
      const remaining = () => input.slice(state.index + 1);
      const consume = (value2 = "", num = 0) => {
        state.consumed += value2;
        state.index += num;
      };
      const append = (token) => {
        state.output += token.output != null ? token.output : token.value;
        consume(token.value);
      };
      const negate = () => {
        let count = 1;
        while (peek() === "!" && (peek(2) !== "(" || peek(3) === "?")) {
          advance();
          state.start++;
          count++;
        }
        if (count % 2 === 0) {
          return false;
        }
        state.negated = true;
        state.start++;
        return true;
      };
      const increment = (type) => {
        state[type]++;
        stack.push(type);
      };
      const decrement = (type) => {
        state[type]--;
        stack.pop();
      };
      const push = (tok) => {
        if (prev.type === "globstar") {
          const isBrace = state.braces > 0 && (tok.type === "comma" || tok.type === "brace");
          const isExtglob = tok.extglob === true || extglobs.length && (tok.type === "pipe" || tok.type === "paren");
          if (tok.type !== "slash" && tok.type !== "paren" && !isBrace && !isExtglob) {
            state.output = state.output.slice(0, -prev.output.length);
            prev.type = "star";
            prev.value = "*";
            prev.output = star;
            state.output += prev.output;
          }
        }
        if (extglobs.length && tok.type !== "paren") {
          extglobs[extglobs.length - 1].inner += tok.value;
        }
        if (tok.value || tok.output) append(tok);
        if (prev && prev.type === "text" && tok.type === "text") {
          prev.output = (prev.output || prev.value) + tok.value;
          prev.value += tok.value;
          return;
        }
        tok.prev = prev;
        tokens.push(tok);
        prev = tok;
      };
      const extglobOpen = (type, value2) => {
        const token = { ...EXTGLOB_CHARS[value2], conditions: 1, inner: "" };
        token.prev = prev;
        token.parens = state.parens;
        token.output = state.output;
        const output = (opts.capture ? "(" : "") + token.open;
        increment("parens");
        push({ type, value: value2, output: state.output ? "" : ONE_CHAR });
        push({ type: "paren", extglob: true, value: advance(), output });
        extglobs.push(token);
      };
      const extglobClose = (token) => {
        let output = token.close + (opts.capture ? ")" : "");
        let rest;
        if (token.type === "negate") {
          let extglobStar = star;
          if (token.inner && token.inner.length > 1 && token.inner.includes("/")) {
            extglobStar = globstar(opts);
          }
          if (extglobStar !== star || eos() || /^\)+$/.test(remaining())) {
            output = token.close = `)$))${extglobStar}`;
          }
          if (token.inner.includes("*") && (rest = remaining()) && /^\.[^\\/.]+$/.test(rest)) {
            const expression = parse(rest, { ...options, fastpaths: false }).output;
            output = token.close = `)${expression})${extglobStar})`;
          }
          if (token.prev.type === "bos") {
            state.negatedExtglob = true;
          }
        }
        push({ type: "paren", extglob: true, value, output });
        decrement("parens");
      };
      if (opts.fastpaths !== false && !/(^[*!]|[/()[\]{}"])/.test(input)) {
        let backslashes = false;
        let output = input.replace(REGEX_SPECIAL_CHARS_BACKREF, (m, esc, chars, first, rest, index) => {
          if (first === "\\") {
            backslashes = true;
            return m;
          }
          if (first === "?") {
            if (esc) {
              return esc + first + (rest ? QMARK.repeat(rest.length) : "");
            }
            if (index === 0) {
              return qmarkNoDot + (rest ? QMARK.repeat(rest.length) : "");
            }
            return QMARK.repeat(chars.length);
          }
          if (first === ".") {
            return DOT_LITERAL.repeat(chars.length);
          }
          if (first === "*") {
            if (esc) {
              return esc + first + (rest ? star : "");
            }
            return star;
          }
          return esc ? m : `\\${m}`;
        });
        if (backslashes === true) {
          if (opts.unescape === true) {
            output = output.replace(/\\/g, "");
          } else {
            output = output.replace(/\\+/g, (m) => {
              return m.length % 2 === 0 ? "\\\\" : m ? "\\" : "";
            });
          }
        }
        if (output === input && opts.contains === true) {
          state.output = input;
          return state;
        }
        state.output = utils.wrapOutput(output, state, options);
        return state;
      }
      while (!eos()) {
        value = advance();
        if (value === "\0") {
          continue;
        }
        if (value === "\\") {
          const next = peek();
          if (next === "/" && opts.bash !== true) {
            continue;
          }
          if (next === "." || next === ";") {
            continue;
          }
          if (!next) {
            value += "\\";
            push({ type: "text", value });
            continue;
          }
          const match = /^\\+/.exec(remaining());
          let slashes = 0;
          if (match && match[0].length > 2) {
            slashes = match[0].length;
            state.index += slashes;
            if (slashes % 2 !== 0) {
              value += "\\";
            }
          }
          if (opts.unescape === true) {
            value = advance();
          } else {
            value += advance();
          }
          if (state.brackets === 0) {
            push({ type: "text", value });
            continue;
          }
        }
        if (state.brackets > 0 && (value !== "]" || prev.value === "[" || prev.value === "[^")) {
          if (opts.posix !== false && value === ":") {
            const inner = prev.value.slice(1);
            if (inner.includes("[")) {
              prev.posix = true;
              if (inner.includes(":")) {
                const idx = prev.value.lastIndexOf("[");
                const pre = prev.value.slice(0, idx);
                const rest2 = prev.value.slice(idx + 2);
                const posix = POSIX_REGEX_SOURCE[rest2];
                if (posix) {
                  prev.value = pre + posix;
                  state.backtrack = true;
                  advance();
                  if (!bos.output && tokens.indexOf(prev) === 1) {
                    bos.output = ONE_CHAR;
                  }
                  continue;
                }
              }
            }
          }
          if (value === "[" && peek() !== ":" || value === "-" && peek() === "]") {
            value = `\\${value}`;
          }
          if (value === "]" && (prev.value === "[" || prev.value === "[^")) {
            value = `\\${value}`;
          }
          if (opts.posix === true && value === "!" && prev.value === "[") {
            value = "^";
          }
          prev.value += value;
          append({ value });
          continue;
        }
        if (state.quotes === 1 && value !== '"') {
          value = utils.escapeRegex(value);
          prev.value += value;
          append({ value });
          continue;
        }
        if (value === '"') {
          state.quotes = state.quotes === 1 ? 0 : 1;
          if (opts.keepQuotes === true) {
            push({ type: "text", value });
          }
          continue;
        }
        if (value === "(") {
          increment("parens");
          push({ type: "paren", value });
          continue;
        }
        if (value === ")") {
          if (state.parens === 0 && opts.strictBrackets === true) {
            throw new SyntaxError(syntaxError("opening", "("));
          }
          const extglob = extglobs[extglobs.length - 1];
          if (extglob && state.parens === extglob.parens + 1) {
            extglobClose(extglobs.pop());
            continue;
          }
          push({ type: "paren", value, output: state.parens ? ")" : "\\)" });
          decrement("parens");
          continue;
        }
        if (value === "[") {
          if (opts.nobracket === true || !remaining().includes("]")) {
            if (opts.nobracket !== true && opts.strictBrackets === true) {
              throw new SyntaxError(syntaxError("closing", "]"));
            }
            value = `\\${value}`;
          } else {
            increment("brackets");
          }
          push({ type: "bracket", value });
          continue;
        }
        if (value === "]") {
          if (opts.nobracket === true || prev && prev.type === "bracket" && prev.value.length === 1) {
            push({ type: "text", value, output: `\\${value}` });
            continue;
          }
          if (state.brackets === 0) {
            if (opts.strictBrackets === true) {
              throw new SyntaxError(syntaxError("opening", "["));
            }
            push({ type: "text", value, output: `\\${value}` });
            continue;
          }
          decrement("brackets");
          const prevValue = prev.value.slice(1);
          if (prev.posix !== true && prevValue[0] === "^" && !prevValue.includes("/")) {
            value = `/${value}`;
          }
          prev.value += value;
          append({ value });
          if (opts.literalBrackets === false || utils.hasRegexChars(prevValue)) {
            continue;
          }
          const escaped = utils.escapeRegex(prev.value);
          state.output = state.output.slice(0, -prev.value.length);
          if (opts.literalBrackets === true) {
            state.output += escaped;
            prev.value = escaped;
            continue;
          }
          prev.value = `(${capture}${escaped}|${prev.value})`;
          state.output += prev.value;
          continue;
        }
        if (value === "{" && opts.nobrace !== true) {
          increment("braces");
          const open = {
            type: "brace",
            value,
            output: "(",
            outputIndex: state.output.length,
            tokensIndex: state.tokens.length
          };
          braces.push(open);
          push(open);
          continue;
        }
        if (value === "}") {
          const brace = braces[braces.length - 1];
          if (opts.nobrace === true || !brace) {
            push({ type: "text", value, output: value });
            continue;
          }
          let output = ")";
          if (brace.dots === true) {
            const arr = tokens.slice();
            const range = [];
            for (let i = arr.length - 1; i >= 0; i--) {
              tokens.pop();
              if (arr[i].type === "brace") {
                break;
              }
              if (arr[i].type !== "dots") {
                range.unshift(arr[i].value);
              }
            }
            output = expandRange(range, opts);
            state.backtrack = true;
          }
          if (brace.comma !== true && brace.dots !== true) {
            const out = state.output.slice(0, brace.outputIndex);
            const toks = state.tokens.slice(brace.tokensIndex);
            brace.value = brace.output = "\\{";
            value = output = "\\}";
            state.output = out;
            for (const t of toks) {
              state.output += t.output || t.value;
            }
          }
          push({ type: "brace", value, output });
          decrement("braces");
          braces.pop();
          continue;
        }
        if (value === "|") {
          if (extglobs.length > 0) {
            extglobs[extglobs.length - 1].conditions++;
          }
          push({ type: "text", value });
          continue;
        }
        if (value === ",") {
          let output = value;
          const brace = braces[braces.length - 1];
          if (brace && stack[stack.length - 1] === "braces") {
            brace.comma = true;
            output = "|";
          }
          push({ type: "comma", value, output });
          continue;
        }
        if (value === "/") {
          if (prev.type === "dot" && state.index === state.start + 1) {
            state.start = state.index + 1;
            state.consumed = "";
            state.output = "";
            tokens.pop();
            prev = bos;
            continue;
          }
          push({ type: "slash", value, output: SLASH_LITERAL });
          continue;
        }
        if (value === ".") {
          if (state.braces > 0 && prev.type === "dot") {
            if (prev.value === ".") prev.output = DOT_LITERAL;
            const brace = braces[braces.length - 1];
            prev.type = "dots";
            prev.output += value;
            prev.value += value;
            brace.dots = true;
            continue;
          }
          if (state.braces + state.parens === 0 && prev.type !== "bos" && prev.type !== "slash") {
            push({ type: "text", value, output: DOT_LITERAL });
            continue;
          }
          push({ type: "dot", value, output: DOT_LITERAL });
          continue;
        }
        if (value === "?") {
          const isGroup = prev && prev.value === "(";
          if (!isGroup && opts.noextglob !== true && peek() === "(" && peek(2) !== "?") {
            extglobOpen("qmark", value);
            continue;
          }
          if (prev && prev.type === "paren") {
            const next = peek();
            let output = value;
            if (prev.value === "(" && !/[!=<:]/.test(next) || next === "<" && !/<([!=]|\w+>)/.test(remaining())) {
              output = `\\${value}`;
            }
            push({ type: "text", value, output });
            continue;
          }
          if (opts.dot !== true && (prev.type === "slash" || prev.type === "bos")) {
            push({ type: "qmark", value, output: QMARK_NO_DOT });
            continue;
          }
          push({ type: "qmark", value, output: QMARK });
          continue;
        }
        if (value === "!") {
          if (opts.noextglob !== true && peek() === "(") {
            if (peek(2) !== "?" || !/[!=<:]/.test(peek(3))) {
              extglobOpen("negate", value);
              continue;
            }
          }
          if (opts.nonegate !== true && state.index === 0) {
            negate();
            continue;
          }
        }
        if (value === "+") {
          if (opts.noextglob !== true && peek() === "(" && peek(2) !== "?") {
            extglobOpen("plus", value);
            continue;
          }
          if (prev && prev.value === "(" || opts.regex === false) {
            push({ type: "plus", value, output: PLUS_LITERAL });
            continue;
          }
          if (prev && (prev.type === "bracket" || prev.type === "paren" || prev.type === "brace") || state.parens > 0) {
            push({ type: "plus", value });
            continue;
          }
          push({ type: "plus", value: PLUS_LITERAL });
          continue;
        }
        if (value === "@") {
          if (opts.noextglob !== true && peek() === "(" && peek(2) !== "?") {
            push({ type: "at", extglob: true, value, output: "" });
            continue;
          }
          push({ type: "text", value });
          continue;
        }
        if (value !== "*") {
          if (value === "$" || value === "^") {
            value = `\\${value}`;
          }
          const match = REGEX_NON_SPECIAL_CHARS.exec(remaining());
          if (match) {
            value += match[0];
            state.index += match[0].length;
          }
          push({ type: "text", value });
          continue;
        }
        if (prev && (prev.type === "globstar" || prev.star === true)) {
          prev.type = "star";
          prev.star = true;
          prev.value += value;
          prev.output = star;
          state.backtrack = true;
          state.globstar = true;
          consume(value);
          continue;
        }
        let rest = remaining();
        if (opts.noextglob !== true && /^\([^?]/.test(rest)) {
          extglobOpen("star", value);
          continue;
        }
        if (prev.type === "star") {
          if (opts.noglobstar === true) {
            consume(value);
            continue;
          }
          const prior = prev.prev;
          const before = prior.prev;
          const isStart = prior.type === "slash" || prior.type === "bos";
          const afterStar = before && (before.type === "star" || before.type === "globstar");
          if (opts.bash === true && (!isStart || rest[0] && rest[0] !== "/")) {
            push({ type: "star", value, output: "" });
            continue;
          }
          const isBrace = state.braces > 0 && (prior.type === "comma" || prior.type === "brace");
          const isExtglob = extglobs.length && (prior.type === "pipe" || prior.type === "paren");
          if (!isStart && prior.type !== "paren" && !isBrace && !isExtglob) {
            push({ type: "star", value, output: "" });
            continue;
          }
          while (rest.slice(0, 3) === "/**") {
            const after = input[state.index + 4];
            if (after && after !== "/") {
              break;
            }
            rest = rest.slice(3);
            consume("/**", 3);
          }
          if (prior.type === "bos" && eos()) {
            prev.type = "globstar";
            prev.value += value;
            prev.output = globstar(opts);
            state.output = prev.output;
            state.globstar = true;
            consume(value);
            continue;
          }
          if (prior.type === "slash" && prior.prev.type !== "bos" && !afterStar && eos()) {
            state.output = state.output.slice(0, -(prior.output + prev.output).length);
            prior.output = `(?:${prior.output}`;
            prev.type = "globstar";
            prev.output = globstar(opts) + (opts.strictSlashes ? ")" : "|$)");
            prev.value += value;
            state.globstar = true;
            state.output += prior.output + prev.output;
            consume(value);
            continue;
          }
          if (prior.type === "slash" && prior.prev.type !== "bos" && rest[0] === "/") {
            const end = rest[1] !== void 0 ? "|$" : "";
            state.output = state.output.slice(0, -(prior.output + prev.output).length);
            prior.output = `(?:${prior.output}`;
            prev.type = "globstar";
            prev.output = `${globstar(opts)}${SLASH_LITERAL}|${SLASH_LITERAL}${end})`;
            prev.value += value;
            state.output += prior.output + prev.output;
            state.globstar = true;
            consume(value + advance());
            push({ type: "slash", value: "/", output: "" });
            continue;
          }
          if (prior.type === "bos" && rest[0] === "/") {
            prev.type = "globstar";
            prev.value += value;
            prev.output = `(?:^|${SLASH_LITERAL}|${globstar(opts)}${SLASH_LITERAL})`;
            state.output = prev.output;
            state.globstar = true;
            consume(value + advance());
            push({ type: "slash", value: "/", output: "" });
            continue;
          }
          state.output = state.output.slice(0, -prev.output.length);
          prev.type = "globstar";
          prev.output = globstar(opts);
          prev.value += value;
          state.output += prev.output;
          state.globstar = true;
          consume(value);
          continue;
        }
        const token = { type: "star", value, output: star };
        if (opts.bash === true) {
          token.output = ".*?";
          if (prev.type === "bos" || prev.type === "slash") {
            token.output = nodot + token.output;
          }
          push(token);
          continue;
        }
        if (prev && (prev.type === "bracket" || prev.type === "paren") && opts.regex === true) {
          token.output = value;
          push(token);
          continue;
        }
        if (state.index === state.start || prev.type === "slash" || prev.type === "dot") {
          if (prev.type === "dot") {
            state.output += NO_DOT_SLASH;
            prev.output += NO_DOT_SLASH;
          } else if (opts.dot === true) {
            state.output += NO_DOTS_SLASH;
            prev.output += NO_DOTS_SLASH;
          } else {
            state.output += nodot;
            prev.output += nodot;
          }
          if (peek() !== "*") {
            state.output += ONE_CHAR;
            prev.output += ONE_CHAR;
          }
        }
        push(token);
      }
      while (state.brackets > 0) {
        if (opts.strictBrackets === true) throw new SyntaxError(syntaxError("closing", "]"));
        state.output = utils.escapeLast(state.output, "[");
        decrement("brackets");
      }
      while (state.parens > 0) {
        if (opts.strictBrackets === true) throw new SyntaxError(syntaxError("closing", ")"));
        state.output = utils.escapeLast(state.output, "(");
        decrement("parens");
      }
      while (state.braces > 0) {
        if (opts.strictBrackets === true) throw new SyntaxError(syntaxError("closing", "}"));
        state.output = utils.escapeLast(state.output, "{");
        decrement("braces");
      }
      if (opts.strictSlashes !== true && (prev.type === "star" || prev.type === "bracket")) {
        push({ type: "maybe_slash", value: "", output: `${SLASH_LITERAL}?` });
      }
      if (state.backtrack === true) {
        state.output = "";
        for (const token of state.tokens) {
          state.output += token.output != null ? token.output : token.value;
          if (token.suffix) {
            state.output += token.suffix;
          }
        }
      }
      return state;
    };
    parse.fastpaths = (input, options) => {
      const opts = { ...options };
      const max = typeof opts.maxLength === "number" ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;
      const len = input.length;
      if (len > max) {
        throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
      }
      input = REPLACEMENTS[input] || input;
      const {
        DOT_LITERAL,
        SLASH_LITERAL,
        ONE_CHAR,
        DOTS_SLASH,
        NO_DOT,
        NO_DOTS,
        NO_DOTS_SLASH,
        STAR,
        START_ANCHOR
      } = constants.globChars(opts.windows);
      const nodot = opts.dot ? NO_DOTS : NO_DOT;
      const slashDot = opts.dot ? NO_DOTS_SLASH : NO_DOT;
      const capture = opts.capture ? "" : "?:";
      const state = { negated: false, prefix: "" };
      let star = opts.bash === true ? ".*?" : STAR;
      if (opts.capture) {
        star = `(${star})`;
      }
      const globstar = (opts2) => {
        if (opts2.noglobstar === true) return star;
        return `(${capture}(?:(?!${START_ANCHOR}${opts2.dot ? DOTS_SLASH : DOT_LITERAL}).)*?)`;
      };
      const create = (str) => {
        switch (str) {
          case "*":
            return `${nodot}${ONE_CHAR}${star}`;
          case ".*":
            return `${DOT_LITERAL}${ONE_CHAR}${star}`;
          case "*.*":
            return `${nodot}${star}${DOT_LITERAL}${ONE_CHAR}${star}`;
          case "*/*":
            return `${nodot}${star}${SLASH_LITERAL}${ONE_CHAR}${slashDot}${star}`;
          case "**":
            return nodot + globstar(opts);
          case "**/*":
            return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${slashDot}${ONE_CHAR}${star}`;
          case "**/*.*":
            return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${slashDot}${star}${DOT_LITERAL}${ONE_CHAR}${star}`;
          case "**/.*":
            return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${DOT_LITERAL}${ONE_CHAR}${star}`;
          default: {
            const match = /^(.*?)\.(\w+)$/.exec(str);
            if (!match) return;
            const source2 = create(match[1]);
            if (!source2) return;
            return source2 + DOT_LITERAL + match[2];
          }
        }
      };
      const output = utils.removePrefix(input, state);
      let source = create(output);
      if (source && opts.strictSlashes !== true) {
        source += `${SLASH_LITERAL}?`;
      }
      return source;
    };
    module.exports = parse;
  }
});

// node_modules/picomatch/lib/picomatch.js
var require_picomatch = __commonJS({
  "node_modules/picomatch/lib/picomatch.js"(exports, module) {
    "use strict";
    var scan = require_scan();
    var parse = require_parse();
    var utils = require_utils();
    var constants = require_constants();
    var isObject = (val) => val && typeof val === "object" && !Array.isArray(val);
    var picomatch2 = (glob, options, returnState = false) => {
      if (Array.isArray(glob)) {
        const fns = glob.map((input) => picomatch2(input, options, returnState));
        const arrayMatcher = (str) => {
          for (const isMatch of fns) {
            const state2 = isMatch(str);
            if (state2) return state2;
          }
          return false;
        };
        return arrayMatcher;
      }
      const isState = isObject(glob) && glob.tokens && glob.input;
      if (glob === "" || typeof glob !== "string" && !isState) {
        throw new TypeError("Expected pattern to be a non-empty string");
      }
      const opts = options || {};
      const posix = opts.windows;
      const regex = isState ? picomatch2.compileRe(glob, options) : picomatch2.makeRe(glob, options, false, true);
      const state = regex.state;
      delete regex.state;
      let isIgnored = () => false;
      if (opts.ignore) {
        const ignoreOpts = { ...options, ignore: null, onMatch: null, onResult: null };
        isIgnored = picomatch2(opts.ignore, ignoreOpts, returnState);
      }
      const matcher = (input, returnObject = false) => {
        const { isMatch, match, output } = picomatch2.test(input, regex, options, { glob, posix });
        const result = { glob, state, regex, posix, input, output, match, isMatch };
        if (typeof opts.onResult === "function") {
          opts.onResult(result);
        }
        if (isMatch === false) {
          result.isMatch = false;
          return returnObject ? result : false;
        }
        if (isIgnored(input)) {
          if (typeof opts.onIgnore === "function") {
            opts.onIgnore(result);
          }
          result.isMatch = false;
          return returnObject ? result : false;
        }
        if (typeof opts.onMatch === "function") {
          opts.onMatch(result);
        }
        return returnObject ? result : true;
      };
      if (returnState) {
        matcher.state = state;
      }
      return matcher;
    };
    picomatch2.test = (input, regex, options, { glob, posix } = {}) => {
      if (typeof input !== "string") {
        throw new TypeError("Expected input to be a string");
      }
      if (input === "") {
        return { isMatch: false, output: "" };
      }
      const opts = options || {};
      const format = opts.format || (posix ? utils.toPosixSlashes : null);
      let match = input === glob;
      let output = match && format ? format(input) : input;
      if (match === false) {
        output = format ? format(input) : input;
        match = output === glob;
      }
      if (match === false || opts.capture === true) {
        if (opts.matchBase === true || opts.basename === true) {
          match = picomatch2.matchBase(input, regex, options, posix);
        } else {
          match = regex.exec(output);
        }
      }
      return { isMatch: Boolean(match), match, output };
    };
    picomatch2.matchBase = (input, glob, options) => {
      const regex = glob instanceof RegExp ? glob : picomatch2.makeRe(glob, options);
      return regex.test(utils.basename(input));
    };
    picomatch2.isMatch = (str, patterns, options) => picomatch2(patterns, options)(str);
    picomatch2.parse = (pattern, options) => {
      if (Array.isArray(pattern)) return pattern.map((p) => picomatch2.parse(p, options));
      return parse(pattern, { ...options, fastpaths: false });
    };
    picomatch2.scan = (input, options) => scan(input, options);
    picomatch2.compileRe = (state, options, returnOutput = false, returnState = false) => {
      if (returnOutput === true) {
        return state.output;
      }
      const opts = options || {};
      const prepend = opts.contains ? "" : "^";
      const append = opts.contains ? "" : "$";
      let source = `${prepend}(?:${state.output})${append}`;
      if (state && state.negated === true) {
        source = `^(?!${source}).*$`;
      }
      const regex = picomatch2.toRegex(source, options);
      if (returnState === true) {
        regex.state = state;
      }
      return regex;
    };
    picomatch2.makeRe = (input, options = {}, returnOutput = false, returnState = false) => {
      if (!input || typeof input !== "string") {
        throw new TypeError("Expected a non-empty string");
      }
      let parsed = { negated: false, fastpaths: true };
      if (options.fastpaths !== false && (input[0] === "." || input[0] === "*")) {
        parsed.output = parse.fastpaths(input, options);
      }
      if (!parsed.output) {
        parsed = parse(input, options);
      }
      return picomatch2.compileRe(parsed, options, returnOutput, returnState);
    };
    picomatch2.toRegex = (source, options) => {
      try {
        const opts = options || {};
        return new RegExp(source, opts.flags || (opts.nocase ? "i" : ""));
      } catch (err) {
        if (options && options.debug === true) throw err;
        return /$^/;
      }
    };
    picomatch2.constants = constants;
    module.exports = picomatch2;
  }
});

// node_modules/picomatch/index.js
var require_picomatch2 = __commonJS({
  "node_modules/picomatch/index.js"(exports, module) {
    "use strict";
    var pico = require_picomatch();
    var utils = require_utils();
    function picomatch2(glob, options, returnState = false) {
      if (options && (options.windows === null || options.windows === void 0)) {
        options = { ...options, windows: utils.isWindows() };
      }
      return pico(glob, options, returnState);
    }
    Object.assign(picomatch2, pico);
    module.exports = picomatch2;
  }
});

// src/client/file-loader.js
var FileLoader = class {
  constructor(httpUrl) {
    this.httpUrl = httpUrl;
    this.loadQueue = /* @__PURE__ */ new Map();
    this.versions = /* @__PURE__ */ new Map();
  }
  async loadFile(path) {
    const isCSS = path.endsWith(".css");
    const isModule = path.endsWith(".mjs");
    if (isCSS) return await this.loadCSS(path);
    if (isModule) return await this.loadModule(path);
    return await this.loadScript(path);
  }
  // Load CSS atomically: append new <link>, wait for it to load, then remove
  // the old one. This fixes the brief flash of unstyled content that
  // happens when you remove the old sheet before the new one is parsed.
  async loadCSS(path) {
    const existing = document.querySelector(`link[data-file="${path}"]`);
    const url = this.makeUrl(path);
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
    link.setAttribute("data-file", path);
    return new Promise((resolve, reject) => {
      link.onload = () => {
        if (existing) existing.remove();
        resolve(true);
      };
      link.onerror = () => {
        link.remove();
        reject(new Error(`Failed to load CSS: ${path}`));
      };
      document.head.appendChild(link);
    });
  }
  async loadModule(path) {
    const url = this.makeUrl(path);
    await import(url);
    return true;
  }
  async loadScript(path) {
    const url = this.makeUrl(path);
    const existing = document.querySelector(`script[data-file="${path}"]`);
    if (existing) existing.remove();
    const script = document.createElement("script");
    script.src = url;
    script.setAttribute("data-file", path);
    return new Promise((resolve, reject) => {
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error(`Failed to load script: ${path}`));
      document.head.appendChild(script);
    });
  }
  // Debounce reloads within 100ms.
  // Calls in the same window share a single load and all receive the result.
  // Fixes prior behavior where only the last caller's Promise resolved.
  async reloadFile(path) {
    return new Promise((resolve, reject) => {
      if (this.loadQueue.has(path)) {
        const entry = this.loadQueue.get(path);
        clearTimeout(entry.timeout);
        entry.resolvers.push({ resolve, reject });
        entry.timeout = setTimeout(() => this._flushReload(path), 100);
      } else {
        const entry = {
          timeout: setTimeout(() => this._flushReload(path), 100),
          resolvers: [{ resolve, reject }]
        };
        this.loadQueue.set(path, entry);
      }
    });
  }
  async _flushReload(path) {
    const entry = this.loadQueue.get(path);
    this.loadQueue.delete(path);
    try {
      const success = await this.loadFile(path);
      for (const { resolve } of entry.resolvers) resolve(success);
    } catch (e) {
      for (const { reject } of entry.resolvers) reject(e);
    }
  }
  async removeFile(path) {
    if (this.loadQueue.has(path)) {
      const entry = this.loadQueue.get(path);
      clearTimeout(entry.timeout);
      for (const { reject } of entry.resolvers) reject(new Error(`File removed: ${path}`));
      this.loadQueue.delete(path);
    }
    const el = document.querySelector(`[data-file="${path}"]`);
    if (el) {
      el.remove();
      await new Promise((r) => setTimeout(r, 0));
    }
    this.versions.delete(path);
  }
  // Increment the version counter for individual files and return a versioned URL
  makeUrl(path) {
    const v = (this.versions.get(path) ?? 0) + 1;
    this.versions.set(path, v);
    return `${this.httpUrl}${path}?v=${v}`;
  }
};

// src/shared/constants.js
var HMR_ACTIONS = {
  RELOAD: "reload",
  ADD: "add",
  REMOVE: "remove",
  INIT: "init"
};

// src/shared/utils.js
var import_picomatch = __toESM(require_picomatch2(), 1);
var matcherCache = /* @__PURE__ */ new Map();
function matchGlob(file, patterns) {
  return patterns.some((pattern) => {
    if (!matcherCache.has(pattern)) matcherCache.set(pattern, (0, import_picomatch.default)(pattern));
    return matcherCache.get(pattern)(file);
  });
}
function formatTime() {
  return (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}
function getFileName(path) {
  return path.split("/").pop();
}
function getFilePath(path) {
  const parts = path.split("/");
  parts.pop();
  return parts.join("/") || ".";
}
function normalizeUrl(url) {
  return url.endsWith("/") ? url : url + "/";
}
function wsUrlToHttpUrl(wsUrl) {
  const u = new URL(wsUrl);
  return `${u.protocol === "wss:" ? "https" : "http"}://${u.host}/`;
}
function httpUrlToWsUrl(httpUrl, wsPath) {
  const u = new URL(httpUrl);
  return `${u.protocol === "https:" ? "wss" : "ws"}://${u.host}${wsPath}`;
}
function resolveConnectionUrls(options, wsPath = "/hmr") {
  if (typeof options === "string") {
    return { wsUrl: options, httpUrl: wsUrlToHttpUrl(options) };
  }
  if (typeof options === "number") {
    options = { port: options };
  }
  if (typeof options !== "object" || options === null) {
    throw new Error("Options must be a string, number, or object");
  }
  if (options.wsUrl && options.httpUrl) {
    return { wsUrl: options.wsUrl, httpUrl: normalizeUrl(options.httpUrl) };
  }
  if (options.wsUrl) {
    return { wsUrl: options.wsUrl, httpUrl: wsUrlToHttpUrl(options.wsUrl) };
  }
  if (options.httpUrl) {
    const httpUrl = normalizeUrl(options.httpUrl);
    return { wsUrl: httpUrlToWsUrl(httpUrl, wsPath), httpUrl };
  }
  if (options.port) {
    const host = options.host || "localhost";
    const secure = options.secure || false;
    const wsProtocol = secure ? "wss" : "ws";
    const httpProtocol = secure ? "https" : "http";
    const wsUrl = `${wsProtocol}://${host}:${options.port}${wsPath}`;
    const httpUrl = normalizeUrl(`${httpProtocol}://${host}:${options.port}`);
    return { wsUrl, httpUrl };
  }
  throw new Error("Must provide wsUrl, httpUrl, port, or host+port");
}

// src/client/hmr-client.js
var HMRClient = class {
  /**
   * `options` can be a shorthand or a full config object:
   * - **number**  treated as `{ port: n }`, connects to `ws://localhost:<n>`
   * - **string**  treated as a full WebSocket URL
   * - **object**  full config, see below
   *
   * @param {Object} options - setting options jsdoc to `Object` only for the sake of auto complete.
   * @param {string} [options.wsUrl] - Explicit WebSocket URL. Takes priority over host/port.
   * @param {string} [options.httpUrl] - Explicit HTTP base URL for fetching files. Derived from `wsUrl` if omitted.
   * @param {boolean} [options.watchFiles=true] Server side file watching is enabled by default.
   * @param {string} [options.host='localhost'] - Hostname (used when building from `port`)
   * @param {number} [options.port] - Port number
   * @param {boolean} [options.secure=false] - Use `wss://` and `https://`
   * @param {boolean} [options.autoReconnect=true] - Reconnect on disconnect with exponential backoff.
   * @param {number} [options.reconnectDelay=2000] - Base reconnect delay in ms
   * @param {number} [options.maxReconnectDelay=30000] - Maximum reconnect delay cap in ms
   * @param {string[]} [options.skip] - Glob patterns for files that should never be loaded (e.g. `['_*\/**']`)
   * @param {function(string, string[]): boolean} [options.filterSkip] - Custom skip logic. Receives `(filePath, allFiles)`. Combined with `skip` via OR.
   * @param {string[]} [options.cold] - Glob patterns for files that require a full page reload. Merged with the server's `cold` config on connect. A `cold` event is emitted instead of hot reloading.
   * @param {function(string): boolean} [options.filterCold] - Custom cold file logic. Receives `(filePath)`. Combined with `cold` via OR.
   * @param {function(string, string[]): string|null} [options.getOverrideTarget] - Given a changed file, return the path of the original it replaces, or `null`. Receives `(filePath, allFiles)`. When matched, the original is unloaded before the override loads.
   * @param {function(string): void} [options.onFileLoaded] - Called after each file loads or reloads. Receives `(filePath)`.
   * @param {function(string[]): string[]} [options.sortFiles] - Custom sort for the initial file load order. Default sorts CSS before JS, cold files first.
   */
  constructor(options) {
    const opts = typeof options === "object" && !Array.isArray(options) ? options : {};
    const wsPath = opts.wsPath || "/hmr";
    const { wsUrl, httpUrl } = resolveConnectionUrls(options, wsPath);
    this.wsUrl = wsUrl;
    this.httpUrl = httpUrl;
    this.watchFiles = true;
    this._autoReconnectDefault = opts.autoReconnect !== false;
    this.autoReconnect = this._autoReconnectDefault;
    this.reconnectDelay = opts.reconnectDelay || 2e3;
    this.maxReconnectDelay = opts.maxReconnectDelay || 3e4;
    this._coldPatterns = opts.cold || null;
    this._filterCold = opts.filterCold || null;
    this.shouldSkipFile = this.makeFilter(opts.skip || null, opts.filterSkip || null);
    this.isColdFile = this.makeFilter(this._coldPatterns, this._filterCold);
    this.allFiles = [];
    this.getOverrideTarget = opts.getOverrideTarget || null;
    this.onFileLoaded = opts.onFileLoaded || null;
    this.sortFiles = opts.sortFiles || this.defaultSortFiles.bind(this);
    this.socket = null;
    this.reconnectAttempts = 0;
    this.isConnected = false;
    this.eventHandlers = /* @__PURE__ */ new Map();
    this._reconnectTimer = null;
    this._messageQueue = [];
    this._processingMessages = false;
    this.fileLoader = new FileLoader(this.httpUrl);
    this.overrideMap = /* @__PURE__ */ new Map();
    this._reverseOverrideMap = /* @__PURE__ */ new Map();
    this.logStyles = {
      info: { symbol: "\u2139", color: "#76fffd" },
      success: { symbol: "\u25B6", color: "#68ff51" },
      warning: { symbol: "\u232C", color: "#ff8400" },
      error: { symbol: "\u2716", color: "#ff0000" },
      add: { symbol: "\u2295", color: "#22c55e" },
      remove: { symbol: "\u2296", color: "#f87171" },
      inject: { symbol: "\u2398", color: "#facc15" },
      disconnect: { symbol: "\u2726", color: "#ef4444" },
      override: { symbol: "\u29EB", color: "#ff8400" },
      skip: { symbol: "\u2298", color: "#888888" },
      cold: { symbol: "\u2744", color: "#60a5fa" }
    };
  }
  defaultSortFiles(files) {
    const coldSet = new Set(files.filter((f) => this.isColdFile(f)));
    return [...files].sort((a, b) => {
      const aIsCSS = a.endsWith(".css");
      const bIsCSS = b.endsWith(".css");
      if (aIsCSS && !bIsCSS) return -1;
      if (!aIsCSS && bIsCSS) return 1;
      const coldA = coldSet.has(a);
      const coldB = coldSet.has(b);
      if (coldA && !coldB) return -1;
      if (!coldA && coldB) return 1;
      return a.localeCompare(b);
    });
  }
  makeFilter(patterns, callback) {
    if (patterns && callback) {
      return (file, allFiles) => {
        return matchGlob(file, patterns) || callback(file, allFiles);
      };
    }
    if (patterns) {
      return (file) => matchGlob(file, patterns);
    }
    if (callback) {
      return callback;
    }
    return () => false;
  }
  log(type, message) {
    const { symbol, color } = this.logStyles[type] || this.logStyles.info;
    const time = formatTime();
    console.log(`%c${symbol} [${time}] ${message}`, `color: ${color}; font-weight: bold;`);
  }
  logInitFileGroup(files, overrideMap, isColdFile) {
    if (!files.length) return;
    const overrideCount = files.filter((f) => overrideMap.has(f)).length;
    const coldCount = files.filter((f) => isColdFile(f)).length;
    const jsCount = files.filter((f) => f.endsWith(".js") || f.endsWith(".cjs") || f.endsWith(".mjs")).length;
    const cssCount = files.filter((f) => f.endsWith(".css")).length;
    const parts = [];
    if (overrideCount) parts.push(`${overrideCount} overridden`);
    if (coldCount) parts.push(`${coldCount} cold`);
    if (cssCount) parts.push(`${jsCount} JS, ${cssCount} CSS`);
    const suffix = parts.length ? ` (${parts.join(", ")})` : "";
    const title = `Loading ${files.length} initial file${files.length !== 1 ? "s" : ""}${suffix}`;
    const { symbol, color } = this.logStyles.inject;
    console.groupCollapsed(
      `%c${symbol} [${formatTime()}] ${title}`,
      `color: ${color}; font-weight: bold;`
    );
    files.forEach((file) => {
      const fileName = getFileName(file);
      const filePath = getFilePath(file);
      const isOverride = overrideMap.has(file);
      const isCold = isColdFile(file);
      if (isOverride) {
        const target = getFileName(overrideMap.get(file));
        const targetPath = getFilePath(overrideMap.get(file));
        console.log(
          `%c\u2514\u2500 ${fileName} -> ${target}%c (${filePath} -> ${targetPath})`,
          `color: ${this.logStyles.override.color}; font-weight: bold;`,
          "color: #888888; font-style: italic;"
        );
      } else if (isCold) {
        console.log(
          `%c\u2514\u2500 ${fileName}%c (${filePath})`,
          `color: ${this.logStyles.cold.color}; font-weight: bold;`,
          "color: #888888; font-style: italic;"
        );
      } else {
        console.log(
          `\u2514\u2500 %c${fileName}%c (${filePath})`,
          "color: #ffffff; font-weight: bold;",
          "color: #888888; font-style: italic;"
        );
      }
    });
    console.groupEnd();
  }
  buildOverrideMap(files) {
    this.overrideMap.clear();
    this._reverseOverrideMap.clear();
    const overrideFiles = /* @__PURE__ */ new Set();
    const originalFiles = /* @__PURE__ */ new Set();
    if (!this.getOverrideTarget) {
      return files;
    }
    for (const file of files) {
      const target = this.getOverrideTarget(file, files);
      if (target) {
        this.overrideMap.set(file, target);
        if (!this._reverseOverrideMap.has(target)) {
          this._reverseOverrideMap.set(target, /* @__PURE__ */ new Set());
        }
        this._reverseOverrideMap.get(target).add(file);
        overrideFiles.add(file);
        originalFiles.add(target);
      }
    }
    return files.filter((f) => !originalFiles.has(f));
  }
  async processInitFiles(files) {
    const filtered = [];
    const skipped = [];
    for (const f of files) {
      (this.shouldSkipFile(f, files) ? skipped : filtered).push(f);
    }
    if (skipped.length > 0) {
      console.groupCollapsed(
        `%c${this.logStyles.skip.symbol} [${formatTime()}] Skipped ${skipped.length} file${skipped.length !== 1 ? "s" : ""}`,
        `color: ${this.logStyles.skip.color}; font-weight: bold;`
      );
      skipped.forEach((f) => console.log(`  \u2514\u2500 ${getFileName(f)}`));
      console.groupEnd();
    }
    const withOverrides = this.buildOverrideMap(filtered);
    const sorted2 = this.sortFiles(withOverrides);
    this.logInitFileGroup(sorted2, this.overrideMap, this.isColdFile.bind(this));
    for (const file of sorted2) {
      await this.fileLoader.loadFile(file);
      if (this.onFileLoaded) this.onFileLoaded(file);
    }
    this.log("success", `HMR client ready (${sorted2.length} files loaded)`);
  }
  async handleFileChange(file, action, serverCold = false) {
    if (this.shouldSkipFile(file, this.allFiles)) {
      this.log("skip", `Skipping ${action}: ${getFileName(file)}`);
      return;
    }
    if (this._reverseOverrideMap.has(file)) {
      this.log("skip", `Skipping ${action}: ${getFileName(file)} (overridden)`);
      return;
    }
    if (this.getOverrideTarget) {
      const newTarget = this.getOverrideTarget(file, this.allFiles);
      const previousTarget = this.overrideMap.get(file);
      if (previousTarget && previousTarget !== newTarget) {
        const siblings = this._reverseOverrideMap.get(previousTarget);
        if (siblings) {
          siblings.delete(file);
          if (siblings.size === 0) this._reverseOverrideMap.delete(previousTarget);
        }
        this.overrideMap.delete(file);
      }
      if (newTarget) {
        this.log("override", `${getFileName(file)} -> ${getFileName(newTarget)}`);
        await this.fileLoader.removeFile(newTarget);
        this.overrideMap.set(file, newTarget);
        if (!this._reverseOverrideMap.has(newTarget)) {
          this._reverseOverrideMap.set(newTarget, /* @__PURE__ */ new Set());
        }
        this._reverseOverrideMap.get(newTarget).add(file);
      }
    }
    const isCold = serverCold || this.isColdFile(file);
    if (isCold) {
      this.log("cold", `Cold file changed: ${getFileName(file)}`);
      this.emit("cold", file);
      return;
    }
    const fileName = getFileName(file);
    const filePath = getFilePath(file);
    const actionType = action === HMR_ACTIONS.RELOAD ? "warning" : "add";
    this.log(actionType, `HMR ${action}: ${fileName}`);
    console.log(`%c  \u2514\u2500 Path: ${filePath}`, "color: #888888; font-style: italic;");
    if (action === HMR_ACTIONS.RELOAD) {
      await this.fileLoader.reloadFile(file);
    } else {
      await this.fileLoader.loadFile(file);
    }
    if (this.onFileLoaded) {
      this.onFileLoaded(file);
    }
    this.emit(action, file);
  }
  async handleFileRemove(file) {
    if (this.shouldSkipFile(file, this.allFiles)) {
      this.log("skip", `Skipping remove: ${getFileName(file)}`);
      return;
    }
    const fileName = getFileName(file);
    const filePath = getFilePath(file);
    this.log("remove", `HMR remove: ${fileName}`);
    console.log(`%c  \u2514\u2500 Path: ${filePath}`, "color: #888888; font-style: italic;");
    const overriddenFile = this.overrideMap.get(file);
    if (overriddenFile) {
      this.overrideMap.delete(file);
      const remainingOverrides = this._reverseOverrideMap.get(overriddenFile);
      if (remainingOverrides) {
        remainingOverrides.delete(file);
        if (remainingOverrides.size === 0) {
          this._reverseOverrideMap.delete(overriddenFile);
          this.log("override", `Restoring: ${getFileName(overriddenFile)}`);
          const originalExists = this.allFiles.includes(overriddenFile);
          if (originalExists) {
            try {
              await this.fileLoader.loadFile(overriddenFile);
            } catch (e) {
              this.log("error", `Failed to restore original: ${getFileName(overriddenFile)} - ${e.message}`);
              this.allFiles = this.allFiles.filter((f) => f !== overriddenFile);
            }
          } else {
            this.log("warning", `Original file no longer tracked, skipping restore: ${getFileName(overriddenFile)}`);
          }
        }
      }
    }
    await this.fileLoader.removeFile(file);
    this.emit(HMR_ACTIONS.REMOVE, file);
  }
  async handleMessage(data) {
    if (data.type === HMR_ACTIONS.INIT) {
      this.emit(HMR_ACTIONS.INIT, data);
      this.watchFiles = data.config?.watchFiles ?? true;
      if (!this.watchFiles) {
        this.log("info", "Static snapshot mode -> live watching disabled");
      }
      if (data.config?.cold?.length) {
        const merged = [.../* @__PURE__ */ new Set([...this._coldPatterns || [], ...data.config.cold])];
        this.isColdFile = this.makeFilter(merged, this._filterCold);
      }
      if (data.files && data.files.length > 0) {
        this.allFiles = [...data.files];
        await this.processInitFiles(data.files);
      } else {
        const modeLabel = this.watchFiles ? "HMR ready" : "Static snapshot ready";
        this.log("success", `${modeLabel} (${sorted.length} files loaded)`);
      }
      return;
    }
    const { action, file } = data;
    if (!action || !file) return;
    if (action === HMR_ACTIONS.ADD) {
      this.allFiles = [...this.allFiles, file];
    }
    if (action === HMR_ACTIONS.REMOVE) {
      this.allFiles = this.allFiles.filter((f) => f !== file);
    }
    if (action === HMR_ACTIONS.RELOAD || action === HMR_ACTIONS.ADD) {
      await this.handleFileChange(file, action, data.cold ?? false);
    }
    if (action === HMR_ACTIONS.REMOVE) {
      await this.handleFileRemove(file);
    }
  }
  /**
   * Register an event handler
   * @param {'init'|'reload'|'add'|'remove'|'cold'|'connect'|'disconnect'|'error'} event - Event name
   * @param {Function} handler - Event handler function
   * @returns {HMRClient} This client for chaining
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
    return this;
  }
  /**
   * Register a one-time event handler that auto-removes itself after the first call
   * @param {'init'|'reload'|'add'|'remove'|'cold'|'connect'|'disconnect'|'error'} event - Event name
   * @param {Function} handler - Event handler function
   * @returns {HMRClient} This client for chaining
   */
  once(event, handler) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      handler(...args);
    };
    wrapper._original = handler;
    return this.on(event, wrapper);
  }
  /**
   * Remove a previously registered event handler
   * @param {'init'|'reload'|'add'|'remove'|'cold'|'connect'|'disconnect'|'error'} event - Event name
   * @param {Function} handler - The exact handler reference passed to `on()`
   * @returns {HMRClient} This client for chaining
   */
  off(event, handler) {
    const handlers = this.eventHandlers.get(event);
    if (!handlers) return this;
    if (!handler) {
      this.eventHandlers.delete(event);
      return this;
    }
    const remaining = handlers.filter((h) => h !== handler && h._original !== handler);
    if (remaining.length === handlers.length) return this;
    if (remaining.length === 0) {
      this.eventHandlers.delete(event);
    } else {
      this.eventHandlers.set(event, remaining);
    }
    return this;
  }
  emit(event, ...args) {
    const handlers = this.eventHandlers.get(event);
    if (!handlers) return;
    for (const handler of [...handlers]) {
      handler(...args);
    }
  }
  // Push an incoming message onto the serial queue and drain it if not already
  // running. This ensures handleMessage calls never execute concurrently, a
  // rapid pair of change events for the same file would otherwise race between
  // removeFile and loadFile and could leave the DOM in a broken state.
  _enqueueMessage(data) {
    this._messageQueue.push(data);
    if (!this._processingMessages) this._drainMessageQueue();
  }
  async _drainMessageQueue() {
    this._processingMessages = true;
    while (this._messageQueue.length > 0) {
      const data = this._messageQueue.shift();
      try {
        await this.handleMessage(data);
      } catch (e) {
        this.log("error", `Message handling error: ${e.message}`);
      }
    }
    this._processingMessages = false;
  }
  /**
   * Connect to the HMR server
   * @returns {Promise<void>}
   */
  connect() {
    this.autoReconnect = this._autoReconnectDefault;
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onclose = null;
      this.socket.onerror = null;
      this.socket.onmessage = null;
      this.socket.close();
      this.socket = null;
    }
    return new Promise((resolve, reject) => {
      let settled = false;
      try {
        this.socket = new WebSocket(this.wsUrl);
        this.socket.onopen = () => {
          settled = true;
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this._messageQueue = [];
          this._processingMessages = false;
          this.log("success", "HMR connected");
          this.emit("connect");
          resolve();
        };
        this.socket.onclose = () => {
          this.isConnected = false;
          this.socket = null;
          this.emit("disconnect");
          if (this.autoReconnect) {
            const delay = Math.min(
              this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts++),
              this.maxReconnectDelay
            );
            const msg = settled ? `HMR disconnected, retrying in ${(delay / 1e3).toFixed(1)}s...` : `HMR connection failed, retrying in ${(delay / 1e3).toFixed(1)}s...`;
            this.log("disconnect", msg);
            this._reconnectTimer = setTimeout(() => {
              this.connect().catch((error) => {
                this.log("error", `Reconnect attempt failed: ${error.message}`);
                this.emit("error", error);
              });
            }, delay);
          } else {
            if (settled) this.log("disconnect", "HMR disconnected");
          }
        };
        this.socket.onerror = (error) => {
          const errorMsg = error.message || "Connection failed";
          this.log("error", `HMR error: ${errorMsg}`);
          this.emit("error", error);
          if (!settled) {
            settled = true;
            reject(error);
          }
        };
        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this._enqueueMessage(data);
          } catch (e) {
            this.log("error", `Failed to parse message: ${e.message}`);
          }
        };
      } catch (error) {
        this.log("error", `Failed to create WebSocket: ${error.message}`);
        reject(error);
      }
    });
  }
  /**
   * Disconnect from the HMR server and clean up
   */
  disconnect() {
    this.autoReconnect = false;
    this.reconnectAttempts = 0;
    this.isConnected = false;
    clearTimeout(this._reconnectTimer);
    this._reconnectTimer = null;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
};
export {
  FileLoader,
  HMRClient,
  HMRClient as default
};
//# sourceMappingURL=client.js.map
