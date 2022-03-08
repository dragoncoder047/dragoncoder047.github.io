
Prism.languages.markup = {
    'comment': {
        pattern: /<!--(?:(?!<!--)[\s\S])*?-->/,
        greedy: true
    },
    'prolog': {
        pattern: /<\?[\s\S]+?\?>/,
        greedy: true
    },
    'doctype': {
        // https://www.w3.org/TR/xml/#NT-doctypedecl
        pattern: /<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\]\s*)?>/i,
        greedy: true,
        inside: {
            'internal-subset': {
                pattern: /(^[^\[]*\[)[\s\S]+(?=\]>$)/,
                lookbehind: true,
                greedy: true,
                inside: null // see below
            },
            'string': {
                pattern: /"[^"]*"|'[^']*'/,
                greedy: true
            },
            'punctuation': /^<!|>$|[[\]]/,
            'doctype-tag': /^DOCTYPE/i,
            'name': /[^\s<>'"]+/
        }
    },
    'cdata': {
        pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
        greedy: true
    },
    'tag': {
        pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/,
        greedy: true,
        inside: {
            'tag': {
                pattern: /^<\/?[^\s>\/]+/,
                inside: {
                    'punctuation': /^<\/?/,
                    'namespace': /^[^\s>\/:]+:/
                }
            },
            'special-attr': [],
            'attr-value': {
                pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/,
                inside: {
                    'punctuation': [
                        {
                            pattern: /^=/,
                            alias: 'attr-equals'
                        },
                        /"|'/
                    ]
                }
            },
            'punctuation': /\/?>/,
            'attr-name': {
                pattern: /[^\s>\/]+/,
                inside: {
                    'namespace': /^[^\s>\/:]+:/
                }
            }

        }
    },
    'entity': [
        {
            pattern: /&[\da-z]{1,8};/i,
            alias: 'named-entity'
        },
        /&#x?[\da-f]{1,8};/i
    ]
};

Prism.languages.markup.tag.inside['attr-value'].inside.entity =
    Prism.languages.markup.entity;
Prism.languages.markup.doctype.inside['internal-subset'].inside = Prism.languages.markup;

// Hack to make entity title show the real entity, idea by Roman Komarov
Prism.hooks.add('wrap', function (env) {

    if (env.type === 'entity') {
        env.attributes.title = env.content.replace(/&amp;/, '&');
    }
});

Object.defineProperty(Prism.languages.markup.tag, 'addInlined', {
    /**
     * Adds an inlined language to markup.
     *
     * An example of an inlined language is CSS with `<style>` tags.
     *
     * @param {string} tagName The name of the tag that contains the inlined language. This name will be treated as
     * case insensitive.
     * @param {string} lang The language key.
     * @example
     * addInlined('style', 'css');
     */
    value: function addInlined(tagName, lang) {
        var includedCdataInside = {};
        includedCdataInside['language-' + lang] = {
            pattern: /(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,
            lookbehind: true,
            inside: Prism.languages[lang]
        };
        includedCdataInside.cdata = /^<!\[CDATA\[|\]\]>$/i;

        var inside = {
            'included-cdata': {
                pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
                inside: includedCdataInside
            }
        };
        inside['language-' + lang] = {
            pattern: /[\s\S]+/,
            inside: Prism.languages[lang]
        };

        var def = {};
        def[tagName] = {
            pattern: RegExp(/(<__[^>]*>)(?:<!\[CDATA\[(?:[^\]]|\](?!\]>))*\]\]>|(?!<!\[CDATA\[)[\s\S])*?(?=<\/__>)/.source.replace(/__/g, function () { return tagName; }), 'i'),
            lookbehind: true,
            greedy: true,
            inside: inside
        };

        Prism.languages.insertBefore('markup', 'cdata', def);
    }
});
Object.defineProperty(Prism.languages.markup.tag, 'addAttribute', {
    /**
     * Adds an pattern to highlight languages embedded in HTML attributes.
     *
     * An example of an inlined language is CSS with `style` attributes.
     *
     * @param {string} attrName The name of the tag that contains the inlined language. This name will be treated as
     * case insensitive.
     * @param {string} lang The language key.
     * @example
     * addAttribute('style', 'css');
     */
    value: function (attrName, lang) {
        Prism.languages.markup.tag.inside['special-attr'].push({
            pattern: RegExp(
                /(^|["'\s])/.source + '(?:' + attrName + ')' + /\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))/.source,
                'i'
            ),
            lookbehind: true,
            inside: {
                'attr-name': /^[^\s=]+/,
                'attr-value': {
                    pattern: /=[\s\S]+/,
                    inside: {
                        'value': {
                            pattern: /(^=\s*(["']|(?!["'])))\S[\s\S]*(?=\2$)/,
                            lookbehind: true,
                            alias: [lang, 'language-' + lang],
                            inside: Prism.languages[lang]
                        },
                        'punctuation': [
                            {
                                pattern: /^=/,
                                alias: 'attr-equals'
                            },
                            /"|'/
                        ]
                    }
                }
            }
        });
    }
});

Prism.languages.html = Prism.languages.markup;
Prism.languages.mathml = Prism.languages.markup;
Prism.languages.svg = Prism.languages.markup;

Prism.languages.xml = Prism.languages.extend('markup', {});
Prism.languages.ssml = Prism.languages.xml;
Prism.languages.atom = Prism.languages.xml;
Prism.languages.rss = Prism.languages.xml;

(function (Prism) {

    var string = /(?:"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n])*')/;

    Prism.languages.css = {
        'comment': /\/\*[\s\S]*?\*\//,
        'atrule': {
            pattern: /@[\w-](?:[^;{\s]|\s+(?![\s{]))*(?:;|(?=\s*\{))/,
            inside: {
                'rule': /^@[\w-]+/,
                'selector-function-argument': {
                    pattern: /(\bselector\s*\(\s*(?![\s)]))(?:[^()\s]|\s+(?![\s)])|\((?:[^()]|\([^()]*\))*\))+(?=\s*\))/,
                    lookbehind: true,
                    alias: 'selector'
                },
                'keyword': {
                    pattern: /(^|[^\w-])(?:and|not|only|or)(?![\w-])/,
                    lookbehind: true
                }
                // See rest below
            }
        },
        'url': {
            // https://drafts.csswg.org/css-values-3/#urls
            pattern: RegExp('\\burl\\((?:' + string.source + '|' + /(?:[^\\\r\n()"']|\\[\s\S])*/.source + ')\\)', 'i'),
            greedy: true,
            inside: {
                'function': /^url/i,
                'punctuation': /^\(|\)$/,
                'string': {
                    pattern: RegExp('^' + string.source + '$'),
                    alias: 'url'
                }
            }
        },
        'selector': {
            pattern: RegExp('(^|[{}\\s])[^{}\\s](?:[^{};"\'\\s]|\\s+(?![\\s{])|' + string.source + ')*(?=\\s*\\{)'),
            lookbehind: true
        },
        'string': {
            pattern: string,
            greedy: true
        },
        'property': {
            pattern: /(^|[^-\w\xA0-\uFFFF])(?!\s)[-_a-z\xA0-\uFFFF](?:(?!\s)[-\w\xA0-\uFFFF])*(?=\s*:)/i,
            lookbehind: true
        },
        'important': /!important\b/i,
        'function': {
            pattern: /(^|[^-a-z0-9])[-a-z0-9]+(?=\()/i,
            lookbehind: true
        },
        'punctuation': /[(){};:,]/
    };

    Prism.languages.css.atrule.inside.rest = Prism.languages.css;

    var markup = Prism.languages.markup;
    if (markup) {
        markup.tag.addInlined('style', 'css');
        markup.tag.addAttribute('style', 'css');
    }

}(Prism));

Prism.languages.clike = {
    'comment': [
        {
            pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
            lookbehind: true,
            greedy: true
        },
        {
            pattern: /(^|[^\\:])\/\/.*/,
            lookbehind: true,
            greedy: true
        }
    ],
    'string': {
        pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
        greedy: true
    },
    'class-name': {
        pattern: /(\b(?:class|extends|implements|instanceof|interface|new|trait)\s+|\bcatch\s+\()[\w.\\]+/i,
        lookbehind: true,
        inside: {
            'punctuation': /[.\\]/
        }
    },
    'keyword': /\b(?:break|catch|continue|do|else|finally|for|function|if|in|instanceof|new|null|return|throw|try|while)\b/,
    'boolean': /\b(?:false|true)\b/,
    'function': /\b\w+(?=\()/,
    'number': /\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i,
    'operator': /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,
    'punctuation': /[{}[\];(),.:]/
};

(function (Prism) {

	var specialEscape = {
		pattern: /\\[\\(){}[\]^$+*?|.]/,
		alias: 'escape'
	};
	var escape = /\\(?:x[\da-fA-F]{2}|u[\da-fA-F]{4}|u\{[\da-fA-F]+\}|0[0-7]{0,2}|[123][0-7]{2}|c[a-zA-Z]|.)/;
	var charSet = {
		pattern: /\.|\\[wsd]|\\p\{[^{}]+\}/i,
		alias: 'class-name'
	};
	var charSetWithoutDot = {
		pattern: /\\[wsd]|\\p\{[^{}]+\}/i,
		alias: 'class-name'
	};

	var rangeChar = '(?:[^\\\\-]|' + escape.source + ')';
	var range = RegExp(rangeChar + '-' + rangeChar);

	// the name of a capturing group
	var groupName = {
		pattern: /(<|')[^<>']+(?=[>']$)/,
		lookbehind: true,
		alias: 'variable'
	};

	Prism.languages.regex = {
		'char-class': {
			pattern: /((?:^|[^\\])(?:\\\\)*)\[(?:[^\\\]]|\\[\s\S])*\]/,
			lookbehind: true,
			inside: {
				'char-class-negation': {
					pattern: /(^\[)\^/,
					lookbehind: true,
					alias: 'operator'
				},
				'char-class-punctuation': {
					pattern: /^\[|\]$/,
					alias: 'punctuation'
				},
				'range': {
					pattern: range,
					inside: {
						'escape': escape,
						'range-punctuation': {
							pattern: /-/,
							alias: 'operator'
						}
					}
				},
				'special-escape': specialEscape,
				'char-set': charSetWithoutDot,
				'escape': escape
			}
		},
		'special-escape': specialEscape,
		'char-set': charSet,
		'backreference': [
			{
				// a backreference which is not an octal escape
				pattern: /\\(?![123][0-7]{2})[1-9]/,
				alias: 'keyword'
			},
			{
				pattern: /\\k<[^<>']+>/,
				alias: 'keyword',
				inside: {
					'group-name': groupName
				}
			}
		],
		'anchor': {
			pattern: /[$^]|\\[ABbGZz]/,
			alias: 'function'
		},
		'escape': escape,
		'group': [
			{
				// https://docs.oracle.com/javase/10/docs/api/java/util/regex/Pattern.html
				// https://docs.microsoft.com/en-us/dotnet/standard/base-types/regular-expression-language-quick-reference?view=netframework-4.7.2#grouping-constructs

				// (), (?<name>), (?'name'), (?>), (?:), (?=), (?!), (?<=), (?<!), (?is-m), (?i-m:)
				pattern: /\((?:\?(?:<[^<>']+>|'[^<>']+'|[>:]|<?[=!]|[idmnsuxU]+(?:-[idmnsuxU]+)?:?))?/,
				alias: 'punctuation',
				inside: {
					'group-name': groupName
				}
			},
			{
				pattern: /\)/,
				alias: 'punctuation'
			}
		],
		'quantifier': {
			pattern: /(?:[+*?]|\{\d+(?:,\d*)?\})[?+]?/,
			alias: 'number'
		},
		'alternation': {
			pattern: /\|/,
			alias: 'keyword'
		}
	};

}(Prism));


Prism.languages.javascript = Prism.languages.extend('clike', {
    'class-name': [
        Prism.languages.clike['class-name'],
        {
            pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$A-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\.(?:constructor|prototype))/,
            lookbehind: true
        }
    ],
    'keyword': [
        {
            pattern: /((?:^|\})\s*)catch\b/,
            lookbehind: true
        },
        {
            pattern: /(^|[^.]|\.\.\.\s*)\b(?:as|assert(?=\s*\{)|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally(?=\s*(?:\{|$))|for|from(?=\s*(?:['"]|$))|function|(?:get|set)(?=\s*(?:[#\[$\w\xA0-\uFFFF]|$))|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,
            lookbehind: true
        },
    ],
    // Allow for all non-ASCII characters (See http://stackoverflow.com/a/2008444)
    'function': /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,
    'number': {
        pattern: RegExp(
            /(^|[^\w$])/.source +
            '(?:' +
            (
                // constant
                /NaN|Infinity/.source +
                '|' +
                // binary integer
                /0[bB][01]+(?:_[01]+)*n?/.source +
                '|' +
                // octal integer
                /0[oO][0-7]+(?:_[0-7]+)*n?/.source +
                '|' +
                // hexadecimal integer
                /0[xX][\dA-Fa-f]+(?:_[\dA-Fa-f]+)*n?/.source +
                '|' +
                // decimal bigint
                /\d+(?:_\d+)*n/.source +
                '|' +
                // decimal number (integer or float) but no bigint
                /(?:\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\.\d+(?:_\d+)*)(?:[Ee][+-]?\d+(?:_\d+)*)?/.source
            ) +
            ')' +
            /(?![\w$])/.source
        ),
        lookbehind: true
    },
    'operator': /--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/
});

Prism.languages.javascript['class-name'][0].pattern = /(\b(?:class|extends|implements|instanceof|interface|new)\s+)[\w.\\]+/;

Prism.languages.insertBefore('javascript', 'keyword', {
    'regex': {
        // eslint-disable-next-line regexp/no-dupe-characters-character-class
        pattern: /((?:^|[^$\w\xA0-\uFFFF."'\])\s]|\b(?:return|yield))\s*)\/(?:\[(?:[^\]\\\r\n]|\\.)*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}(?=(?:\s|\/\*(?:[^*]|\*(?!\/))*\*\/)*(?:$|[\r\n,.;:})\]]|\/\/))/,
        lookbehind: true,
        greedy: true,
        inside: {
            'regex-source': {
                pattern: /^(\/)[\s\S]+(?=\/[a-z]*$)/,
                lookbehind: true,
                alias: 'language-regex',
                inside: Prism.languages.regex
            },
            'regex-delimiter': /^\/|\/$/,
            'regex-flags': /^[a-z]+$/,
        }
    },
    // This must be declared before keyword because we use "function" inside the look-forward
    'function-variable': {
        pattern: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)\s*=>))/,
        alias: 'function'
    },
    'parameter': [
        {
            pattern: /(function(?:\s+(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)?\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\))/,
            lookbehind: true,
            inside: Prism.languages.javascript
        },
        {
            pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$a-z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*=>)/i,
            lookbehind: true,
            inside: Prism.languages.javascript
        },
        {
            pattern: /(\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*=>)/,
            lookbehind: true,
            inside: Prism.languages.javascript
        },
        {
            pattern: /((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*)\(\s*|\]\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*\{)/,
            lookbehind: true,
            inside: Prism.languages.javascript
        }
    ],
    'constant': /\b[A-Z](?:[A-Z_]|\dx?)*\b/
});

Prism.languages.insertBefore('javascript', 'string', {
    'hashbang': {
        pattern: /^#!.*/,
        greedy: true,
        alias: 'comment'
    },
    'template-string': {
        pattern: /`(?:\\[\s\S]|\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}|(?!\$\{)[^\\`])*`/,
        greedy: true,
        inside: {
            'template-punctuation': {
                pattern: /^`|`$/,
                alias: 'string'
            },
            'interpolation': {
                pattern: /((?:^|[^\\])(?:\\{2})*)\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}/,
                lookbehind: true,
                inside: {
                    'interpolation-punctuation': {
                        pattern: /^\$\{|\}$/,
                        alias: 'punctuation'
                    },
                    rest: Prism.languages.javascript
                }
            },
            'string': /[\s\S]+/
        }
    },
    'string-property': {
        pattern: /((?:^|[,{])[ \t]*)(["'])(?:\\(?:\r\n|[\s\S])|(?!\2)[^\\\r\n])*\2(?=\s*:)/m,
        lookbehind: true,
        greedy: true,
        alias: 'property'
    }
});

Prism.languages.insertBefore('javascript', 'operator', {
    'literal-property': {
        pattern: /((?:^|[,{])[ \t]*)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*:)/m,
        lookbehind: true,
        alias: 'property'
    },
});

if (Prism.languages.markup) {
    Prism.languages.markup.tag.addInlined('script', 'javascript');

    // add attribute support for all DOM events.
    // https://developer.mozilla.org/en-US/docs/Web/Events#Standard_events
    Prism.languages.markup.tag.addAttribute(
        /on(?:abort|blur|change|click|composition(?:end|start|update)|dblclick|error|focus(?:in|out)?|key(?:down|up)|load|mouse(?:down|enter|leave|move|out|over|up)|reset|resize|scroll|select|slotchange|submit|unload|wheel)/.source,
        'javascript'
    );
}

Prism.languages.js = Prism.languages.javascript;

Prism.languages.c = Prism.languages.extend('clike', {
    'comment': {
        pattern: /\/\/(?:[^\r\n\\]|\\(?:\r\n?|\n|(?![\r\n])))*|\/\*[\s\S]*?(?:\*\/|$)/,
        greedy: true
    },
    'string': {
        // https://en.cppreference.com/w/c/language/string_literal
        pattern: /"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"/,
        greedy: true
    },
    'class-name': {
        pattern: /(\b(?:enum|struct)\s+(?:__attribute__\s*\(\([\s\S]*?\)\)\s*)?)\w+|\b[a-z]\w*_t\b/,
        lookbehind: true
    },
    'keyword': /\b(?:_Alignas|_Alignof|_Atomic|_Bool|_Complex|_Generic|_Imaginary|_Noreturn|_Static_assert|_Thread_local|__attribute__|asm|auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|inline|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|typeof|union|unsigned|void|volatile|while)\b/,
    'function': /\b[a-z_]\w*(?=\s*\()/i,
    'number': /(?:\b0x(?:[\da-f]+(?:\.[\da-f]*)?|\.[\da-f]+)(?:p[+-]?\d+)?|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?)[ful]{0,4}/i,
    'operator': />>=?|<<=?|->|([-+&|:])\1|[?:~]|[-+*/%&|^!=<>]=?/
});

Prism.languages.insertBefore('c', 'string', {
    'char': {
        // https://en.cppreference.com/w/c/language/character_constant
        pattern: /'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n]){0,32}'/,
        greedy: true
    }
});

Prism.languages.insertBefore('c', 'string', {
    'macro': {
        // allow for multiline macro definitions
        // spaces after the # character compile fine with gcc
        pattern: /(^[\t ]*)#\s*[a-z](?:[^\r\n\\/]|\/(?!\*)|\/\*(?:[^*]|\*(?!\/))*\*\/|\\(?:\r\n|[\s\S]))*/im,
        lookbehind: true,
        greedy: true,
        alias: 'property',
        inside: {
            'string': [
                {
                    // highlight the path of the include statement as a string
                    pattern: /^(#\s*include\s*)<[^>]+>/,
                    lookbehind: true
                },
                Prism.languages.c.string
            ],
            'char': Prism.languages.c.char,
            'comment': Prism.languages.c.comment,
            'macro-name': [
                {
                    pattern: /(^#\s*define\s+)\w+\b(?!\()/i,
                    lookbehind: true
                },
                {
                    pattern: /(^#\s*define\s+)\w+\b(?=\()/i,
                    lookbehind: true,
                    alias: 'function'
                }
            ],
            // highlight macro directives as keywords
            'directive': {
                pattern: /^(#\s*)[a-z]+/,
                lookbehind: true,
                alias: 'keyword'
            },
            'directive-hash': /^#/,
            'punctuation': /##|\\(?=[\r\n])/,
            'expression': {
                pattern: /\S[\s\S]*/,
                inside: Prism.languages.c
            }
        }
    }
});

Prism.languages.insertBefore('c', 'function', {
    // highlight predefined macros as constants
    'constant': /\b(?:EOF|NULL|SEEK_CUR|SEEK_END|SEEK_SET|__DATE__|__FILE__|__LINE__|__TIMESTAMP__|__TIME__|__func__|stderr|stdin|stdout)\b/
});

delete Prism.languages.c.boolean;

(function (Prism) {

    var keyword = /\b(?:alignas|alignof|asm|auto|bool|break|case|catch|char|char16_t|char32_t|char8_t|class|co_await|co_return|co_yield|compl|concept|const|const_cast|consteval|constexpr|constinit|continue|decltype|default|delete|do|double|dynamic_cast|else|enum|explicit|export|extern|final|float|for|friend|goto|if|import|inline|int|int16_t|int32_t|int64_t|int8_t|long|module|mutable|namespace|new|noexcept|nullptr|operator|override|private|protected|public|register|reinterpret_cast|requires|return|short|signed|sizeof|static|static_assert|static_cast|struct|switch|template|this|thread_local|throw|try|typedef|typeid|typename|uint16_t|uint32_t|uint64_t|uint8_t|union|unsigned|using|virtual|void|volatile|wchar_t|while)\b/;
    var modName = /\b(?!<keyword>)\w+(?:\s*\.\s*\w+)*\b/.source.replace(/<keyword>/g, function () { return keyword.source; });

    Prism.languages.cpp = Prism.languages.extend('c', {
        'class-name': [
            {
                pattern: RegExp(/(\b(?:class|concept|enum|struct|typename)\s+)(?!<keyword>)\w+/.source
                    .replace(/<keyword>/g, function () { return keyword.source; })),
                lookbehind: true
            },
            // This is intended to capture the class name of method implementations like:
            //   void foo::bar() const {}
            // However! The `foo` in the above example could also be a namespace, so we only capture the class name if
            // it starts with an uppercase letter. This approximation should give decent results.
            /\b[A-Z]\w*(?=\s*::\s*\w+\s*\()/,
            // This will capture the class name before destructors like:
            //   Foo::~Foo() {}
            /\b[A-Z_]\w*(?=\s*::\s*~\w+\s*\()/i,
            // This also intends to capture the class name of method implementations but here the class has template
            // parameters, so it can't be a namespace (until C++ adds generic namespaces).
            /\b\w+(?=\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>\s*::\s*\w+\s*\()/
        ],
        'keyword': keyword,
        'number': {
            pattern: /(?:\b0b[01']+|\b0x(?:[\da-f']+(?:\.[\da-f']*)?|\.[\da-f']+)(?:p[+-]?[\d']+)?|(?:\b[\d']+(?:\.[\d']*)?|\B\.[\d']+)(?:e[+-]?[\d']+)?)[ful]{0,4}/i,
            greedy: true
        },
        'operator': />>=?|<<=?|->|--|\+\+|&&|\|\||[?:~]|<=>|[-+*/%&|^!=<>]=?|\b(?:and|and_eq|bitand|bitor|not|not_eq|or|or_eq|xor|xor_eq)\b/,
        'boolean': /\b(?:false|true)\b/
    });

    Prism.languages.insertBefore('cpp', 'string', {
        'module': {
            // https://en.cppreference.com/w/cpp/language/modules
            pattern: RegExp(
                /(\b(?:import|module)\s+)/.source +
                '(?:' +
                // header-name
                /"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|<[^<>\r\n]*>/.source +
                '|' +
                // module name or partition or both
                /<mod-name>(?:\s*:\s*<mod-name>)?|:\s*<mod-name>/.source.replace(/<mod-name>/g, function () { return modName; }) +
                ')'
            ),
            lookbehind: true,
            greedy: true,
            inside: {
                'string': /^[<"][\s\S]+/,
                'operator': /:/,
                'punctuation': /\./
            }
        },
        'raw-string': {
            pattern: /R"([^()\\ ]{0,16})\([\s\S]*?\)\1"/,
            alias: 'string',
            greedy: true
        }
    });

    Prism.languages.insertBefore('cpp', 'keyword', {
        'generic-function': {
            pattern: /\b(?!operator\b)[a-z_]\w*\s*<(?:[^<>]|<[^<>]*>)*>(?=\s*\()/i,
            inside: {
                'function': /^\w+/,
                'generic': {
                    pattern: /<[\s\S]+/,
                    alias: 'class-name',
                    inside: Prism.languages.cpp
                }
            }
        }
    });

    Prism.languages.insertBefore('cpp', 'operator', {
        'double-colon': {
            pattern: /::/,
            alias: 'punctuation'
        }
    });

    Prism.languages.insertBefore('cpp', 'class-name', {
        // the base clause is an optional list of parent classes
        // https://en.cppreference.com/w/cpp/language/class
        'base-clause': {
            pattern: /(\b(?:class|struct)\s+\w+\s*:\s*)[^;{}"'\s]+(?:\s+[^;{}"'\s]+)*(?=\s*[;{])/,
            lookbehind: true,
            greedy: true,
            inside: Prism.languages.extend('cpp', {})
        }
    });

    Prism.languages.insertBefore('inside', 'double-colon', {
        // All untokenized words that are not namespaces should be class names
        'class-name': /\b[a-z_]\w*\b(?!\s*::)/i
    }, Prism.languages.cpp['base-clause']);

}(Prism));

Prism.languages.arduino = Prism.languages.extend('cpp', {
    'keyword': /\b(?:String|array|bool|boolean|break|byte|case|catch|continue|default|do|double|else|finally|for|function|goto|if|in|instanceof|int|integer|long|loop|new|null|return|setup|string|switch|throw|try|void|while|word)\b/,
    'constant': /\b(?:ANALOG_MESSAGE|DEFAULT|DIGITAL_MESSAGE|EXTERNAL|FIRMATA_STRING|HIGH|INPUT|INPUT_PULLUP|INTERNAL|INTERNAL1V1|INTERNAL2V56|LED_BUILTIN|LOW|OUTPUT|REPORT_ANALOG|REPORT_DIGITAL|SET_PIN_MODE|SYSEX_START|SYSTEM_RESET)\b/,
    'builtin': /\b(?:Audio|BSSID|Bridge|Client|Console|EEPROM|Esplora|EsploraTFT|Ethernet|EthernetClient|EthernetServer|EthernetUDP|File|FileIO|FileSystem|Firmata|GPRS|GSM|GSMBand|GSMClient|GSMModem|GSMPIN|GSMScanner|GSMServer|GSMVoiceCall|GSM_SMS|HttpClient|IPAddress|IRread|Keyboard|KeyboardController|LiquidCrystal|LiquidCrystal_I2C|Mailbox|Mouse|MouseController|PImage|Process|RSSI|RobotControl|RobotMotor|SD|SPI|SSID|Scheduler|Serial|Server|Servo|SoftwareSerial|Stepper|Stream|TFT|Task|USBHost|WiFi|WiFiClient|WiFiServer|WiFiUDP|Wire|YunClient|YunServer|abs|addParameter|analogRead|analogReadResolution|analogReference|analogWrite|analogWriteResolution|answerCall|attach|attachGPRS|attachInterrupt|attached|autoscroll|available|background|beep|begin|beginPacket|beginSD|beginSMS|beginSpeaker|beginTFT|beginTransmission|beginWrite|bit|bitClear|bitRead|bitSet|bitWrite|blink|blinkVersion|buffer|changePIN|checkPIN|checkPUK|checkReg|circle|cityNameRead|cityNameWrite|clear|clearScreen|click|close|compassRead|config|connect|connected|constrain|cos|countryNameRead|countryNameWrite|createChar|cursor|debugPrint|delay|delayMicroseconds|detach|detachInterrupt|digitalRead|digitalWrite|disconnect|display|displayLogos|drawBMP|drawCompass|encryptionType|end|endPacket|endSMS|endTransmission|endWrite|exists|exitValue|fill|find|findUntil|flush|gatewayIP|get|getAsynchronously|getBand|getButton|getCurrentCarrier|getIMEI|getKey|getModifiers|getOemKey|getPINUsed|getResult|getSignalStrength|getSocket|getVoiceCallStatus|getXChange|getYChange|hangCall|height|highByte|home|image|interrupts|isActionDone|isDirectory|isListening|isPIN|isPressed|isValid|keyPressed|keyReleased|keyboardRead|knobRead|leftToRight|line|lineFollowConfig|listen|listenOnLocalhost|loadImage|localIP|lowByte|macAddress|maintain|map|max|messageAvailable|micros|millis|min|mkdir|motorsStop|motorsWrite|mouseDragged|mouseMoved|mousePressed|mouseReleased|move|noAutoscroll|noBlink|noBuffer|noCursor|noDisplay|noFill|noInterrupts|noListenOnLocalhost|noStroke|noTone|onReceive|onRequest|open|openNextFile|overflow|parseCommand|parseFloat|parseInt|parsePacket|pauseMode|peek|pinMode|playFile|playMelody|point|pointTo|position|pow|prepare|press|print|printFirmwareVersion|printVersion|println|process|processInput|pulseIn|put|random|randomSeed|read|readAccelerometer|readBlue|readButton|readBytes|readBytesUntil|readGreen|readJoystickButton|readJoystickSwitch|readJoystickX|readJoystickY|readLightSensor|readMessage|readMicrophone|readNetworks|readRed|readSlider|readString|readStringUntil|readTemperature|ready|rect|release|releaseAll|remoteIP|remoteNumber|remotePort|remove|requestFrom|retrieveCallingNumber|rewindDirectory|rightToLeft|rmdir|robotNameRead|robotNameWrite|run|runAsynchronously|runShellCommand|runShellCommandAsynchronously|running|scanNetworks|scrollDisplayLeft|scrollDisplayRight|seek|sendAnalog|sendDigitalPortPair|sendDigitalPorts|sendString|sendSysex|serialEvent|setBand|setBitOrder|setClockDivider|setCursor|setDNS|setDataMode|setFirmwareVersion|setMode|setPINUsed|setSpeed|setTextSize|setTimeout|shiftIn|shiftOut|shutdown|sin|size|sqrt|startLoop|step|stop|stroke|subnetMask|switchPIN|tan|tempoWrite|text|tone|transfer|tuneWrite|turn|updateIR|userNameRead|userNameWrite|voiceCall|waitContinue|width|write|writeBlue|writeGreen|writeJSON|writeMessage|writeMicroseconds|writeRGB|writeRed|yield)\b/
});

Prism.languages.ino = Prism.languages.arduino;

(function (Prism) {
    // $ set | grep '^[A-Z][^[:space:]]*=' | cut -d= -f1 | tr '\n' '|'
    // + LC_ALL, RANDOM, REPLY, SECONDS.
    // + make sure PS1..4 are here as they are not always set,
    // - some useless things.
    var envVars = '\\b(?:BASH|BASHOPTS|BASH_ALIASES|BASH_ARGC|BASH_ARGV|BASH_CMDS|BASH_COMPLETION_COMPAT_DIR|BASH_LINENO|BASH_REMATCH|BASH_SOURCE|BASH_VERSINFO|BASH_VERSION|COLORTERM|COLUMNS|COMP_WORDBREAKS|DBUS_SESSION_BUS_ADDRESS|DEFAULTS_PATH|DESKTOP_SESSION|DIRSTACK|DISPLAY|EUID|GDMSESSION|GDM_LANG|GNOME_KEYRING_CONTROL|GNOME_KEYRING_PID|GPG_AGENT_INFO|GROUPS|HISTCONTROL|HISTFILE|HISTFILESIZE|HISTSIZE|HOME|HOSTNAME|HOSTTYPE|IFS|INSTANCE|JOB|LANG|LANGUAGE|LC_ADDRESS|LC_ALL|LC_IDENTIFICATION|LC_MEASUREMENT|LC_MONETARY|LC_NAME|LC_NUMERIC|LC_PAPER|LC_TELEPHONE|LC_TIME|LESSCLOSE|LESSOPEN|LINES|LOGNAME|LS_COLORS|MACHTYPE|MAILCHECK|MANDATORY_PATH|NO_AT_BRIDGE|OLDPWD|OPTERR|OPTIND|ORBIT_SOCKETDIR|OSTYPE|PAPERSIZE|PATH|PIPESTATUS|PPID|PS1|PS2|PS3|PS4|PWD|RANDOM|REPLY|SECONDS|SELINUX_INIT|SESSION|SESSIONTYPE|SESSION_MANAGER|SHELL|SHELLOPTS|SHLVL|SSH_AUTH_SOCK|TERM|UID|UPSTART_EVENTS|UPSTART_INSTANCE|UPSTART_JOB|UPSTART_SESSION|USER|WINDOWID|XAUTHORITY|XDG_CONFIG_DIRS|XDG_CURRENT_DESKTOP|XDG_DATA_DIRS|XDG_GREETER_DATA_DIR|XDG_MENU_PREFIX|XDG_RUNTIME_DIR|XDG_SEAT|XDG_SEAT_PATH|XDG_SESSION_DESKTOP|XDG_SESSION_ID|XDG_SESSION_PATH|XDG_SESSION_TYPE|XDG_VTNR|XMODIFIERS)\\b';

    var commandAfterHeredoc = {
        pattern: /(^(["']?)\w+\2)[ \t]+\S.*/,
        lookbehind: true,
        alias: 'punctuation', // this looks reasonably well in all themes
        inside: null // see below
    };

    var insideString = {
        'bash': commandAfterHeredoc,
        'environment': {
            pattern: RegExp('\\$' + envVars),
            alias: 'constant'
        },
        'variable': [
            // [0]: Arithmetic Environment
            {
                pattern: /\$?\(\([\s\S]+?\)\)/,
                greedy: true,
                inside: {
                    // If there is a $ sign at the beginning highlight $(( and )) as variable
                    'variable': [
                        {
                            pattern: /(^\$\(\([\s\S]+)\)\)/,
                            lookbehind: true
                        },
                        /^\$\(\(/
                    ],
                    'number': /\b0x[\dA-Fa-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:[Ee]-?\d+)?/,
                    // Operators according to https://www.gnu.org/software/bash/manual/bashref.html#Shell-Arithmetic
                    'operator': /--|\+\+|\*\*=?|<<=?|>>=?|&&|\|\||[=!+\-*/%<>^&|]=?|[?~:]/,
                    // If there is no $ sign at the beginning highlight (( and )) as punctuation
                    'punctuation': /\(\(?|\)\)?|,|;/
                }
            },
            // [1]: Command Substitution
            {
                pattern: /\$\((?:\([^)]+\)|[^()])+\)|`[^`]+`/,
                greedy: true,
                inside: {
                    'variable': /^\$\(|^`|\)$|`$/
                }
            },
            // [2]: Brace expansion
            {
                pattern: /\$\{[^}]+\}/,
                greedy: true,
                inside: {
                    'operator': /:[-=?+]?|[!\/]|##?|%%?|\^\^?|,,?/,
                    'punctuation': /[\[\]]/,
                    'environment': {
                        pattern: RegExp('(\\{)' + envVars),
                        lookbehind: true,
                        alias: 'constant'
                    }
                }
            },
            /\$(?:\w+|[#?*!@$])/
        ],
        // Escape sequences from echo and printf's manuals, and escaped quotes.
        'entity': /\\(?:[abceEfnrtv\\"]|O?[0-7]{1,3}|U[0-9a-fA-F]{8}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{1,2})/
    };

    Prism.languages.bash = {
        'shebang': {
            pattern: /^#!\s*\/.*/,
            alias: 'important'
        },
        'comment': {
            pattern: /(^|[^"{\\$])#.*/,
            lookbehind: true
        },
        'function-name': [
            // a) function foo {
            // b) foo() {
            // c) function foo() {
            // but not “foo {”
            {
                // a) and c)
                pattern: /(\bfunction\s+)[\w-]+(?=(?:\s*\(?:\s*\))?\s*\{)/,
                lookbehind: true,
                alias: 'function'
            },
            {
                // b)
                pattern: /\b[\w-]+(?=\s*\(\s*\)\s*\{)/,
                alias: 'function'
            }
        ],
        // Highlight variable names as variables in for and select beginnings.
        'for-or-select': {
            pattern: /(\b(?:for|select)\s+)\w+(?=\s+in\s)/,
            alias: 'variable',
            lookbehind: true
        },
        // Highlight variable names as variables in the left-hand part
        // of assignments (“=” and “+=”).
        'assign-left': {
            pattern: /(^|[\s;|&]|[<>]\()\w+(?=\+?=)/,
            inside: {
                'environment': {
                    pattern: RegExp('(^|[\\s;|&]|[<>]\\()' + envVars),
                    lookbehind: true,
                    alias: 'constant'
                }
            },
            alias: 'variable',
            lookbehind: true
        },
        'string': [
            // Support for Here-documents https://en.wikipedia.org/wiki/Here_document
            {
                pattern: /((?:^|[^<])<<-?\s*)(\w+)\s[\s\S]*?(?:\r?\n|\r)\2/,
                lookbehind: true,
                greedy: true,
                inside: insideString
            },
            // Here-document with quotes around the tag
            // → No expansion (so no “inside”).
            {
                pattern: /((?:^|[^<])<<-?\s*)(["'])(\w+)\2\s[\s\S]*?(?:\r?\n|\r)\3/,
                lookbehind: true,
                greedy: true,
                inside: {
                    'bash': commandAfterHeredoc
                }
            },
            // “Normal” string
            {
                // https://www.gnu.org/software/bash/manual/html_node/Double-Quotes.html
                pattern: /(^|[^\\](?:\\\\)*)"(?:\\[\s\S]|\$\([^)]+\)|\$(?!\()|`[^`]+`|[^"\\`$])*"/,
                lookbehind: true,
                greedy: true,
                inside: insideString
            },
            {
                // https://www.gnu.org/software/bash/manual/html_node/Single-Quotes.html
                pattern: /(^|[^$\\])'[^']*'/,
                lookbehind: true,
                greedy: true
            },
            {
                // https://www.gnu.org/software/bash/manual/html_node/ANSI_002dC-Quoting.html
                pattern: /\$'(?:[^'\\]|\\[\s\S])*'/,
                greedy: true,
                inside: {
                    'entity': insideString.entity
                }
            }
        ],
        'environment': {
            pattern: RegExp('\\$?' + envVars),
            alias: 'constant'
        },
        'variable': insideString.variable,
        'function': {
            pattern: /(^|[\s;|&]|[<>]\()(?:add|apropos|apt|apt-cache|apt-get|aptitude|aspell|automysqlbackup|awk|basename|bash|bc|bconsole|bg|bzip2|cal|cat|cfdisk|chgrp|chkconfig|chmod|chown|chroot|cksum|clear|cmp|column|comm|composer|cp|cron|crontab|csplit|curl|cut|date|dc|dd|ddrescue|debootstrap|df|diff|diff3|dig|dir|dircolors|dirname|dirs|dmesg|docker|docker-compose|du|egrep|eject|env|ethtool|expand|expect|expr|fdformat|fdisk|fg|fgrep|file|find|fmt|fold|format|free|fsck|ftp|fuser|gawk|git|gparted|grep|groupadd|groupdel|groupmod|groups|grub-mkconfig|gzip|halt|head|hg|history|host|hostname|htop|iconv|id|ifconfig|ifdown|ifup|import|install|ip|jobs|join|kill|killall|less|link|ln|locate|logname|logrotate|look|lpc|lpr|lprint|lprintd|lprintq|lprm|ls|lsof|lynx|make|man|mc|mdadm|mkconfig|mkdir|mke2fs|mkfifo|mkfs|mkisofs|mknod|mkswap|mmv|more|most|mount|mtools|mtr|mutt|mv|nano|nc|netstat|nice|nl|node|nohup|notify-send|npm|nslookup|op|open|parted|passwd|paste|pathchk|ping|pkill|pnpm|podman|podman-compose|popd|pr|printcap|printenv|ps|pushd|pv|quota|quotacheck|quotactl|ram|rar|rcp|reboot|remsync|rename|renice|rev|rm|rmdir|rpm|rsync|scp|screen|sdiff|sed|sendmail|seq|service|sftp|sh|shellcheck|shuf|shutdown|sleep|slocate|sort|split|ssh|stat|strace|su|sudo|sum|suspend|swapon|sync|tac|tail|tar|tee|time|timeout|top|touch|tr|traceroute|tsort|tty|umount|uname|unexpand|uniq|units|unrar|unshar|unzip|update-grub|uptime|useradd|userdel|usermod|users|uudecode|uuencode|v|vcpkg|vdir|vi|vim|virsh|vmstat|wait|watch|wc|wget|whereis|which|who|whoami|write|xargs|xdg-open|yarn|yes|zenity|zip|zsh|zypper)(?=$|[)\s;|&])/,
            lookbehind: true
        },
        'keyword': {
            pattern: /(^|[\s;|&]|[<>]\()(?:case|do|done|elif|else|esac|fi|for|function|if|in|select|then|until|while)(?=$|[)\s;|&])/,
            lookbehind: true
        },
        // https://www.gnu.org/software/bash/manual/html_node/Shell-Builtin-Commands.html
        'builtin': {
            pattern: /(^|[\s;|&]|[<>]\()(?:\.|:|alias|bind|break|builtin|caller|cd|command|continue|declare|echo|enable|eval|exec|exit|export|getopts|hash|help|let|local|logout|mapfile|printf|pwd|read|readarray|readonly|return|set|shift|shopt|source|test|times|trap|type|typeset|ulimit|umask|unalias|unset)(?=$|[)\s;|&])/,
            lookbehind: true,
            // Alias added to make those easier to distinguish from strings.
            alias: 'class-name'
        },
        'boolean': {
            pattern: /(^|[\s;|&]|[<>]\()(?:false|true)(?=$|[)\s;|&])/,
            lookbehind: true
        },
        'file-descriptor': {
            pattern: /\B&\d\b/,
            alias: 'important'
        },
        'operator': {
            // Lots of redirections here, but not just that.
            pattern: /\d?<>|>\||\+=|=[=~]?|!=?|<<[<-]?|[&\d]?>>|\d[<>]&?|[<>][&=]?|&[>&]?|\|[&|]?/,
            inside: {
                'file-descriptor': {
                    pattern: /^\d/,
                    alias: 'important'
                }
            }
        },
        'punctuation': /\$?\(\(?|\)\)?|\.\.|[{}[\];\\]/,
        'number': {
            pattern: /(^|\s)(?:[1-9]\d*|0)(?:[.,]\d+)?\b/,
            lookbehind: true
        }
    };

    commandAfterHeredoc.inside = Prism.languages.bash;

    /* Patterns in command substitution. */
    var toBeCopied = [
        'comment',
        'function-name',
        'for-or-select',
        'assign-left',
        'string',
        'environment',
        'function',
        'keyword',
        'builtin',
        'boolean',
        'file-descriptor',
        'operator',
        'punctuation',
        'number'
    ];
    var inside = insideString.variable[1].inside;
    for (var i = 0; i < toBeCopied.length; i++) {
        inside[toBeCopied[i]] = Prism.languages.bash[toBeCopied[i]];
    }

    Prism.languages.shell = Prism.languages.bash;
}(Prism));

Prism.languages.bbcode = {
    'tag': {
        pattern: /\[\/?[^\s=\]]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'"\]=]+))?(?:\s+[^\s=\]]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'"\]=]+))*\s*\]/,
        inside: {
            'tag': {
                pattern: /^\[\/?[^\s=\]]+/,
                inside: {
                    'punctuation': /^\[\/?/
                }
            },
            'attr-value': {
                pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'"\]=]+)/,
                inside: {
                    'punctuation': [
                        /^=/,
                        {
                            pattern: /^(\s*)["']|["']$/,
                            lookbehind: true
                        }
                    ]
                }
            },
            'punctuation': /\]/,
            'attr-name': /[^\s=\]]+/
        }
    }
};

Prism.languages.shortcode = Prism.languages.bbcode;

Prism.languages.brainfuck = {
    'pointer': {
        pattern: /<|>/,
        alias: 'keyword'
    },
    'increment': {
        pattern: /\+/,
        alias: 'inserted'
    },
    'decrement': {
        pattern: /-/,
        alias: 'deleted'
    },
    'branching': {
        pattern: /\[|\]/,
        alias: 'important'
    },
    'operator': /[.,]/,
    'comment': /\S+/
};

(function (Prism) {

    // Ignore comments starting with { to privilege string interpolation highlighting
    var comment = /#(?!\{).+/;
    var interpolation = {
        pattern: /#\{[^}]+\}/,
        alias: 'variable'
    };

    Prism.languages.coffeescript = Prism.languages.extend('javascript', {
        'comment': comment,
        'string': [

            // Strings are multiline
            {
                pattern: /'(?:\\[\s\S]|[^\\'])*'/,
                greedy: true
            },

            {
                // Strings are multiline
                pattern: /"(?:\\[\s\S]|[^\\"])*"/,
                greedy: true,
                inside: {
                    'interpolation': interpolation
                }
            }
        ],
        'keyword': /\b(?:and|break|by|catch|class|continue|debugger|delete|do|each|else|extend|extends|false|finally|for|if|in|instanceof|is|isnt|let|loop|namespace|new|no|not|null|of|off|on|or|own|return|super|switch|then|this|throw|true|try|typeof|undefined|unless|until|when|while|window|with|yes|yield)\b/,
        'class-member': {
            pattern: /@(?!\d)\w+/,
            alias: 'variable'
        }
    });

    Prism.languages.insertBefore('coffeescript', 'comment', {
        'multiline-comment': {
            pattern: /###[\s\S]+?###/,
            alias: 'comment'
        },

        // Block regexp can contain comments and interpolation
        'block-regex': {
            pattern: /\/{3}[\s\S]*?\/{3}/,
            alias: 'regex',
            inside: {
                'comment': comment,
                'interpolation': interpolation
            }
        }
    });

    Prism.languages.insertBefore('coffeescript', 'string', {
        'inline-javascript': {
            pattern: /`(?:\\[\s\S]|[^\\`])*`/,
            inside: {
                'delimiter': {
                    pattern: /^`|`$/,
                    alias: 'punctuation'
                },
                'script': {
                    pattern: /[\s\S]+/,
                    alias: 'language-javascript',
                    inside: Prism.languages.javascript
                }
            }
        },

        // Block strings
        'multiline-string': [
            {
                pattern: /'''[\s\S]*?'''/,
                greedy: true,
                alias: 'string'
            },
            {
                pattern: /"""[\s\S]*?"""/,
                greedy: true,
                alias: 'string',
                inside: {
                    interpolation: interpolation
                }
            }
        ]

    });

    Prism.languages.insertBefore('coffeescript', 'keyword', {
        // Object property
        'property': /(?!\d)\w+(?=\s*:(?!:))/
    });

    delete Prism.languages.coffeescript['template-string'];

    Prism.languages.coffee = Prism.languages.coffeescript;
}(Prism));

(function (Prism) {

    var string = /("|')(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/;
    var selectorInside;

    Prism.languages.css.selector = {
        pattern: Prism.languages.css.selector.pattern,
        lookbehind: true,
        inside: selectorInside = {
            'pseudo-element': /:(?:after|before|first-letter|first-line|selection)|::[-\w]+/,
            'pseudo-class': /:[-\w]+/,
            'class': /\.[-\w]+/,
            'id': /#[-\w]+/,
            'attribute': {
                pattern: RegExp('\\[(?:[^[\\]"\']|' + string.source + ')*\\]'),
                greedy: true,
                inside: {
                    'punctuation': /^\[|\]$/,
                    'case-sensitivity': {
                        pattern: /(\s)[si]$/i,
                        lookbehind: true,
                        alias: 'keyword'
                    },
                    'namespace': {
                        pattern: /^(\s*)(?:(?!\s)[-*\w\xA0-\uFFFF])*\|(?!=)/,
                        lookbehind: true,
                        inside: {
                            'punctuation': /\|$/
                        }
                    },
                    'attr-name': {
                        pattern: /^(\s*)(?:(?!\s)[-\w\xA0-\uFFFF])+/,
                        lookbehind: true
                    },
                    'attr-value': [
                        string,
                        {
                            pattern: /(=\s*)(?:(?!\s)[-\w\xA0-\uFFFF])+(?=\s*$)/,
                            lookbehind: true
                        }
                    ],
                    'operator': /[|~*^$]?=/
                }
            },
            'n-th': [
                {
                    pattern: /(\(\s*)[+-]?\d*[\dn](?:\s*[+-]\s*\d+)?(?=\s*\))/,
                    lookbehind: true,
                    inside: {
                        'number': /[\dn]+/,
                        'operator': /[+-]/
                    }
                },
                {
                    pattern: /(\(\s*)(?:even|odd)(?=\s*\))/i,
                    lookbehind: true
                }
            ],
            'combinator': />|\+|~|\|\|/,

            // the `tag` token has been existed and removed.
            // because we can't find a perfect tokenize to match it.
            // if you want to add it, please read https://github.com/PrismJS/prism/pull/2373 first.

            'punctuation': /[(),]/,
        }
    };

    Prism.languages.css.atrule.inside['selector-function-argument'].inside = selectorInside;

    Prism.languages.insertBefore('css', 'property', {
        'variable': {
            pattern: /(^|[^-\w\xA0-\uFFFF])--(?!\s)[-_a-z\xA0-\uFFFF](?:(?!\s)[-\w\xA0-\uFFFF])*/i,
            lookbehind: true
        }
    });

    var unit = {
        pattern: /(\b\d+)(?:%|[a-z]+(?![\w-]))/,
        lookbehind: true
    };
    // 123 -123 .123 -.123 12.3 -12.3
    var number = {
        pattern: /(^|[^\w.-])-?(?:\d+(?:\.\d+)?|\.\d+)/,
        lookbehind: true
    };

    Prism.languages.insertBefore('css', 'function', {
        'operator': {
            pattern: /(\s)[+\-*\/](?=\s)/,
            lookbehind: true
        },
        // CAREFUL!
        // Previewers and Inline color use hexcode and color.
        'hexcode': {
            pattern: /\B#[\da-f]{3,8}\b/i,
            alias: 'color'
        },
        'color': [
            {
                pattern: /(^|[^\w-])(?:AliceBlue|AntiqueWhite|Aqua|Aquamarine|Azure|Beige|Bisque|Black|BlanchedAlmond|Blue|BlueViolet|Brown|BurlyWood|CadetBlue|Chartreuse|Chocolate|Coral|CornflowerBlue|Cornsilk|Crimson|Cyan|DarkBlue|DarkCyan|DarkGoldenRod|DarkGr[ae]y|DarkGreen|DarkKhaki|DarkMagenta|DarkOliveGreen|DarkOrange|DarkOrchid|DarkRed|DarkSalmon|DarkSeaGreen|DarkSlateBlue|DarkSlateGr[ae]y|DarkTurquoise|DarkViolet|DeepPink|DeepSkyBlue|DimGr[ae]y|DodgerBlue|FireBrick|FloralWhite|ForestGreen|Fuchsia|Gainsboro|GhostWhite|Gold|GoldenRod|Gr[ae]y|Green|GreenYellow|HoneyDew|HotPink|IndianRed|Indigo|Ivory|Khaki|Lavender|LavenderBlush|LawnGreen|LemonChiffon|LightBlue|LightCoral|LightCyan|LightGoldenRodYellow|LightGr[ae]y|LightGreen|LightPink|LightSalmon|LightSeaGreen|LightSkyBlue|LightSlateGr[ae]y|LightSteelBlue|LightYellow|Lime|LimeGreen|Linen|Magenta|Maroon|MediumAquaMarine|MediumBlue|MediumOrchid|MediumPurple|MediumSeaGreen|MediumSlateBlue|MediumSpringGreen|MediumTurquoise|MediumVioletRed|MidnightBlue|MintCream|MistyRose|Moccasin|NavajoWhite|Navy|OldLace|Olive|OliveDrab|Orange|OrangeRed|Orchid|PaleGoldenRod|PaleGreen|PaleTurquoise|PaleVioletRed|PapayaWhip|PeachPuff|Peru|Pink|Plum|PowderBlue|Purple|Red|RosyBrown|RoyalBlue|SaddleBrown|Salmon|SandyBrown|SeaGreen|SeaShell|Sienna|Silver|SkyBlue|SlateBlue|SlateGr[ae]y|Snow|SpringGreen|SteelBlue|Tan|Teal|Thistle|Tomato|Transparent|Turquoise|Violet|Wheat|White|WhiteSmoke|Yellow|YellowGreen)(?![\w-])/i,
                lookbehind: true
            },
            {
                pattern: /\b(?:hsl|rgb)\(\s*\d{1,3}\s*,\s*\d{1,3}%?\s*,\s*\d{1,3}%?\s*\)\B|\b(?:hsl|rgb)a\(\s*\d{1,3}\s*,\s*\d{1,3}%?\s*,\s*\d{1,3}%?\s*,\s*(?:0|0?\.\d+|1)\s*\)\B/i,
                inside: {
                    'unit': unit,
                    'number': number,
                    'function': /[\w-]+(?=\()/,
                    'punctuation': /[(),]/
                }
            }
        ],
        // it's important that there is no boundary assertion after the hex digits
        'entity': /\\[\da-f]{1,8}/i,
        'unit': unit,
        'number': number
    });

}(Prism));

(function (Prism) {

    /**
     * Returns the placeholder for the given language id and index.
     *
     * @param {string} language
     * @param {string|number} index
     * @returns {string}
     */
    function getPlaceholder(language, index) {
        return '___' + language.toUpperCase() + index + '___';
    }

    Object.defineProperties(Prism.languages['markup-templating'] = {}, {
        buildPlaceholders: {
            /**
             * Tokenize all inline templating expressions matching `placeholderPattern`.
             *
             * If `replaceFilter` is provided, only matches of `placeholderPattern` for which `replaceFilter` returns
             * `true` will be replaced.
             *
             * @param {object} env The environment of the `before-tokenize` hook.
             * @param {string} language The language id.
             * @param {RegExp} placeholderPattern The matches of this pattern will be replaced by placeholders.
             * @param {(match: string) => boolean} [replaceFilter]
             */
            value: function (env, language, placeholderPattern, replaceFilter) {
                if (env.language !== language) {
                    return;
                }

                var tokenStack = env.tokenStack = [];

                env.code = env.code.replace(placeholderPattern, function (match) {
                    if (typeof replaceFilter === 'function' && !replaceFilter(match)) {
                        return match;
                    }
                    var i = tokenStack.length;
                    var placeholder;

                    // Check for existing strings
                    while (env.code.indexOf(placeholder = getPlaceholder(language, i)) !== -1) {
                        ++i;
                    }

                    // Create a sparse array
                    tokenStack[i] = match;

                    return placeholder;
                });

                // Switch the grammar to markup
                env.grammar = Prism.languages.markup;
            }
        },
        tokenizePlaceholders: {
            /**
             * Replace placeholders with proper tokens after tokenizing.
             *
             * @param {object} env The environment of the `after-tokenize` hook.
             * @param {string} language The language id.
             */
            value: function (env, language) {
                if (env.language !== language || !env.tokenStack) {
                    return;
                }

                // Switch the grammar back
                env.grammar = Prism.languages[language];

                var j = 0;
                var keys = Object.keys(env.tokenStack);

                function walkTokens(tokens) {
                    for (var i = 0; i < tokens.length; i++) {
                        // all placeholders are replaced already
                        if (j >= keys.length) {
                            break;
                        }

                        var token = tokens[i];
                        if (typeof token === 'string' || (token.content && typeof token.content === 'string')) {
                            var k = keys[j];
                            var t = env.tokenStack[k];
                            var s = typeof token === 'string' ? token : token.content;
                            var placeholder = getPlaceholder(language, k);

                            var index = s.indexOf(placeholder);
                            if (index > -1) {
                                ++j;

                                var before = s.substring(0, index);
                                var middle = new Prism.Token(language, Prism.tokenize(t, env.grammar), 'language-' + language, t);
                                var after = s.substring(index + placeholder.length);

                                var replacement = [];
                                if (before) {
                                    replacement.push.apply(replacement, walkTokens([before]));
                                }
                                replacement.push(middle);
                                if (after) {
                                    replacement.push.apply(replacement, walkTokens([after]));
                                }

                                if (typeof token === 'string') {
                                    tokens.splice.apply(tokens, [i, 1].concat(replacement));
                                } else {
                                    token.content = replacement;
                                }
                            }
                        } else if (token.content /* && typeof token.content !== 'string' */) {
                            walkTokens(token.content);
                        }
                    }

                    return tokens;
                }

                walkTokens(env.tokens);
            }
        }
    });

}(Prism));

// Django/Jinja2 syntax definition for Prism.js <http://prismjs.com> syntax highlighter.
// Mostly it works OK but can paint code incorrectly on complex html/template tag combinations.

(function (Prism) {

    Prism.languages.django = {
        'comment': /^\{#[\s\S]*?#\}$/,
        'tag': {
            pattern: /(^\{%[+-]?\s*)\w+/,
            lookbehind: true,
            alias: 'keyword'
        },
        'delimiter': {
            pattern: /^\{[{%][+-]?|[+-]?[}%]\}$/,
            alias: 'punctuation'
        },
        'string': {
            pattern: /("|')(?:\\.|(?!\1)[^\\\r\n])*\1/,
            greedy: true
        },
        'filter': {
            pattern: /(\|)\w+/,
            lookbehind: true,
            alias: 'function'
        },
        'test': {
            pattern: /(\bis\s+(?:not\s+)?)(?!not\b)\w+/,
            lookbehind: true,
            alias: 'function'
        },
        'function': /\b[a-z_]\w+(?=\s*\()/i,
        'keyword': /\b(?:and|as|by|else|for|if|import|in|is|loop|not|or|recursive|with|without)\b/,
        'operator': /[-+%=]=?|!=|\*\*?=?|\/\/?=?|<[<=>]?|>[=>]?|[&|^~]/,
        'number': /\b\d+(?:\.\d+)?\b/,
        'boolean': /[Ff]alse|[Nn]one|[Tt]rue/,
        'variable': /\b\w+\b/,
        'punctuation': /[{}[\](),.:;]/
    };


    var pattern = /\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}|\{#[\s\S]*?#\}/g;
    var markupTemplating = Prism.languages['markup-templating'];

    Prism.hooks.add('before-tokenize', function (env) {
        markupTemplating.buildPlaceholders(env, 'django', pattern);
    });
    Prism.hooks.add('after-tokenize', function (env) {
        markupTemplating.tokenizePlaceholders(env, 'django');
    });

    // Add an Jinja2 alias
    Prism.languages.jinja2 = Prism.languages.django;
    Prism.hooks.add('before-tokenize', function (env) {
        markupTemplating.buildPlaceholders(env, 'jinja2', pattern);
    });
    Prism.hooks.add('after-tokenize', function (env) {
        markupTemplating.tokenizePlaceholders(env, 'jinja2');
    });

}(Prism));

Prism.languages.ebnf = {
    'comment': /\(\*[\s\S]*?\*\)/,
    'string': {
        pattern: /"[^"\r\n]*"|'[^'\r\n]*'/,
        greedy: true
    },
    'special': {
        pattern: /\?[^?\r\n]*\?/,
        greedy: true,
        alias: 'class-name'
    },

    'definition': {
        pattern: /^([\t ]*)[a-z]\w*(?:[ \t]+[a-z]\w*)*(?=\s*=)/im,
        lookbehind: true,
        alias: ['rule', 'keyword']
    },
    'rule': /\b[a-z]\w*(?:[ \t]+[a-z]\w*)*\b/i,

    'punctuation': /\([:/]|[:/]\)|[.,;()[\]{}]/,
    'operator': /[-=|*/!]/
};

Prism.languages.haskell = {
    'comment': {
        pattern: /(^|[^-!#$%*+=?&@|~.:<>^\\\/])(?:--(?:(?=.)[^-!#$%*+=?&@|~.:<>^\\\/].*|$)|\{-[\s\S]*?-\})/m,
        lookbehind: true
    },
    'char': {
        pattern: /'(?:[^\\']|\\(?:[abfnrtv\\"'&]|\^[A-Z@[\]^_]|ACK|BEL|BS|CAN|CR|DC1|DC2|DC3|DC4|DEL|DLE|EM|ENQ|EOT|ESC|ETB|ETX|FF|FS|GS|HT|LF|NAK|NUL|RS|SI|SO|SOH|SP|STX|SUB|SYN|US|VT|\d+|o[0-7]+|x[0-9a-fA-F]+))'/,
        alias: 'string'
    },
    'string': {
        pattern: /"(?:[^\\"]|\\(?:\S|\s+\\))*"/,
        greedy: true
    },
    'keyword': /\b(?:case|class|data|deriving|do|else|if|in|infixl|infixr|instance|let|module|newtype|of|primitive|then|type|where)\b/,
    'import-statement': {
        // The imported or hidden names are not included in this import
        // statement. This is because we want to highlight those exactly like
        // we do for the names in the program.
        pattern: /(^[\t ]*)import\s+(?:qualified\s+)?(?:[A-Z][\w']*)(?:\.[A-Z][\w']*)*(?:\s+as\s+(?:[A-Z][\w']*)(?:\.[A-Z][\w']*)*)?(?:\s+hiding\b)?/m,
        lookbehind: true,
        inside: {
            'keyword': /\b(?:as|hiding|import|qualified)\b/,
            'punctuation': /\./
        }
    },
    // These are builtin variables only. Constructors are highlighted later as a constant.
    'builtin': /\b(?:abs|acos|acosh|all|and|any|appendFile|approxRational|asTypeOf|asin|asinh|atan|atan2|atanh|basicIORun|break|catch|ceiling|chr|compare|concat|concatMap|const|cos|cosh|curry|cycle|decodeFloat|denominator|digitToInt|div|divMod|drop|dropWhile|either|elem|encodeFloat|enumFrom|enumFromThen|enumFromThenTo|enumFromTo|error|even|exp|exponent|fail|filter|flip|floatDigits|floatRadix|floatRange|floor|fmap|foldl|foldl1|foldr|foldr1|fromDouble|fromEnum|fromInt|fromInteger|fromIntegral|fromRational|fst|gcd|getChar|getContents|getLine|group|head|id|inRange|index|init|intToDigit|interact|ioError|isAlpha|isAlphaNum|isAscii|isControl|isDenormalized|isDigit|isHexDigit|isIEEE|isInfinite|isLower|isNaN|isNegativeZero|isOctDigit|isPrint|isSpace|isUpper|iterate|last|lcm|length|lex|lexDigits|lexLitChar|lines|log|logBase|lookup|map|mapM|mapM_|max|maxBound|maximum|maybe|min|minBound|minimum|mod|negate|not|notElem|null|numerator|odd|or|ord|otherwise|pack|pi|pred|primExitWith|print|product|properFraction|putChar|putStr|putStrLn|quot|quotRem|range|rangeSize|read|readDec|readFile|readFloat|readHex|readIO|readInt|readList|readLitChar|readLn|readOct|readParen|readSigned|reads|readsPrec|realToFrac|recip|rem|repeat|replicate|return|reverse|round|scaleFloat|scanl|scanl1|scanr|scanr1|seq|sequence|sequence_|show|showChar|showInt|showList|showLitChar|showParen|showSigned|showString|shows|showsPrec|significand|signum|sin|sinh|snd|sort|span|splitAt|sqrt|subtract|succ|sum|tail|take|takeWhile|tan|tanh|threadToIOResult|toEnum|toInt|toInteger|toLower|toRational|toUpper|truncate|uncurry|undefined|unlines|until|unwords|unzip|unzip3|userError|words|writeFile|zip|zip3|zipWith|zipWith3)\b/,
    // decimal integers and floating point numbers | octal integers | hexadecimal integers
    'number': /\b(?:\d+(?:\.\d+)?(?:e[+-]?\d+)?|0o[0-7]+|0x[0-9a-f]+)\b/i,
    'operator': [
        {
            // infix operator
            pattern: /`(?:[A-Z][\w']*\.)*[_a-z][\w']*`/,
            greedy: true
        },
        {
            // function composition
            pattern: /(\s)\.(?=\s)/,
            lookbehind: true
        },
        // Most of this is needed because of the meaning of a single '.'.
        // If it stands alone freely, it is the function composition.
        // It may also be a separator between a module name and an identifier => no
        // operator. If it comes together with other special characters it is an
        // operator too.
        //
        // This regex means: /[-!#$%*+=?&@|~.:<>^\\\/]+/ without /\./.
        /[-!#$%*+=?&@|~:<>^\\\/][-!#$%*+=?&@|~.:<>^\\\/]*|\.[-!#$%*+=?&@|~.:<>^\\\/]+/,
    ],
    // In Haskell, nearly everything is a variable, do not highlight these.
    'hvariable': {
        pattern: /\b(?:[A-Z][\w']*\.)*[_a-z][\w']*/,
        inside: {
            'punctuation': /\./
        }
    },
    'constant': {
        pattern: /\b(?:[A-Z][\w']*\.)*[A-Z][\w']*/,
        inside: {
            'punctuation': /\./
        }
    },
    'punctuation': /[{}[\];(),.:]/
};

Prism.languages.hs = Prism.languages.haskell;

Prism.languages.inform7 = {
    'string': {
        pattern: /"[^"]*"/,
        inside: {
            'substitution': {
                pattern: /\[[^\[\]]+\]/,
                inside: {
                    'delimiter': {
                        pattern: /\[|\]/,
                        alias: 'punctuation'
                    }
                    // See rest below
                }
            }
        }
    },
    'comment': {
        pattern: /\[[^\[\]]+\]/,
        greedy: true
    },
    'title': {
        pattern: /^[ \t]*(?:book|chapter|part(?! of)|section|table|volume)\b.+/im,
        alias: 'important'
    },
    'number': {
        pattern: /(^|[^-])(?:\b\d+(?:\.\d+)?(?:\^\d+)?(?:(?!\d)\w+)?|\b(?:eight|eleven|five|four|nine|one|seven|six|ten|three|twelve|two))\b(?!-)/i,
        lookbehind: true
    },
    'verb': {
        pattern: /(^|[^-])\b(?:answering|applying to|are|asking|attacking|be(?:ing)?|burning|buying|called|carries|carry(?! out)|carrying|climbing|closing|conceal(?:ing|s)?|consulting|contain(?:ing|s)?|cutting|drinking|dropping|eating|enclos(?:es?|ing)|entering|examining|exiting|getting|giving|going|ha(?:s|ve|ving)|hold(?:ing|s)?|impl(?:ies|y)|incorporat(?:es?|ing)|inserting|is|jumping|kissing|listening|locking|looking|mean(?:ing|s)?|opening|provid(?:es?|ing)|pulling|pushing|putting|relat(?:es?|ing)|removing|searching|see(?:ing|s)?|setting|showing|singing|sleeping|smelling|squeezing|support(?:ing|s)?|swearing|switching|taking|tasting|telling|thinking|throwing|touching|turning|tying|unlock(?:ing|s)?|var(?:ies|y|ying)|waiting|waking|waving|wear(?:ing|s)?)\b(?!-)/i,
        lookbehind: true,
        alias: 'operator'
    },
    'keyword': {
        pattern: /(^|[^-])\b(?:after|before|carry out|check|continue the action|definition(?= *:)|do nothing|else|end (?:if|the story|unless)|every turn|if|include|instead(?: of)?|let|move|no|now|otherwise|repeat|report|resume the story|rule for|running through|say(?:ing)?|stop the action|test|try(?:ing)?|understand|unless|use|when|while|yes)\b(?!-)/i,
        lookbehind: true
    },
    'property': {
        pattern: /(^|[^-])\b(?:adjacent(?! to)|carried|closed|concealed|contained|dark|described|edible|empty|enclosed|enterable|even|female|fixed in place|full|handled|held|improper-named|incorporated|inedible|invisible|lighted|lit|lock(?:able|ed)|male|marked for listing|mentioned|negative|neuter|non-(?:empty|full|recurring)|odd|opaque|open(?:able)?|plural-named|portable|positive|privately-named|proper-named|provided|publically-named|pushable between rooms|recurring|related|rubbing|scenery|seen|singular-named|supported|swinging|switch(?:able|ed(?: off| on)?)|touch(?:able|ed)|transparent|unconcealed|undescribed|unlit|unlocked|unmarked for listing|unmentioned|unopenable|untouchable|unvisited|variable|visible|visited|wearable|worn)\b(?!-)/i,
        lookbehind: true,
        alias: 'symbol'
    },
    'position': {
        pattern: /(^|[^-])\b(?:above|adjacent to|back side of|below|between|down|east|everywhere|front side|here|in|inside(?: from)?|north(?:east|west)?|nowhere|on(?: top of)?|other side|outside(?: from)?|parts? of|regionally in|south(?:east|west)?|through|up|west|within)\b(?!-)/i,
        lookbehind: true,
        alias: 'keyword'
    },
    'type': {
        pattern: /(^|[^-])\b(?:actions?|activit(?:ies|y)|actors?|animals?|backdrops?|containers?|devices?|directions?|doors?|holders?|kinds?|lists?|m[ae]n|nobody|nothing|nouns?|numbers?|objects?|people|persons?|player(?:'s holdall)?|regions?|relations?|rooms?|rule(?:book)?s?|scenes?|someone|something|supporters?|tables?|texts?|things?|time|vehicles?|wom[ae]n)\b(?!-)/i,
        lookbehind: true,
        alias: 'variable'
    },
    'punctuation': /[.,:;(){}]/
};

Prism.languages.inform7.string.inside.substitution.inside.rest = Prism.languages.inform7;
// We don't want the remaining text in the substitution to be highlighted as the string.
Prism.languages.inform7.string.inside.substitution.inside.rest.text = {
    pattern: /\S(?:\s*\S)*/,
    alias: 'comment'
};

(function (Prism) {
    var funcPattern = /\\(?:[^a-z()[\]]|[a-z*]+)/i;
    var insideEqu = {
        'equation-command': {
            pattern: funcPattern,
            alias: 'regex'
        }
    };

    Prism.languages.latex = {
        'comment': /%.*/,
        // the verbatim environment prints whitespace to the document
        'cdata': {
            pattern: /(\\begin\{((?:lstlisting|verbatim)\*?)\})[\s\S]*?(?=\\end\{\2\})/,
            lookbehind: true
        },
        /*
         * equations can be between $$ $$ or $ $ or \( \) or \[ \]
         * (all are multiline)
         */
        'equation': [
            {
                pattern: /\$\$(?:\\[\s\S]|[^\\$])+\$\$|\$(?:\\[\s\S]|[^\\$])+\$|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]/,
                inside: insideEqu,
                alias: 'string'
            },
            {
                pattern: /(\\begin\{((?:align|eqnarray|equation|gather|math|multline)\*?)\})[\s\S]*?(?=\\end\{\2\})/,
                lookbehind: true,
                inside: insideEqu,
                alias: 'string'
            }
        ],
        /*
         * arguments which are keywords or references are highlighted
         * as keywords
         */
        'keyword': {
            pattern: /(\\(?:begin|cite|documentclass|end|label|ref|usepackage)(?:\[[^\]]+\])?\{)[^}]+(?=\})/,
            lookbehind: true
        },
        'url': {
            pattern: /(\\url\{)[^}]+(?=\})/,
            lookbehind: true
        },
        /*
         * section or chapter headlines are highlighted as bold so that
         * they stand out more
         */
        'headline': {
            pattern: /(\\(?:chapter|frametitle|paragraph|part|section|subparagraph|subsection|subsubparagraph|subsubsection|subsubsubparagraph)\*?(?:\[[^\]]+\])?\{)[^}]+(?=\})/,
            lookbehind: true,
            alias: 'class-name'
        },
        'function': {
            pattern: funcPattern,
            alias: 'selector'
        },
        'punctuation': /[[\]{}&]/
    };

    Prism.languages.tex = Prism.languages.latex;
    Prism.languages.context = Prism.languages.latex;
}(Prism));

Prism.languages.processing = Prism.languages.extend('clike', {
    'keyword': /\b(?:break|case|catch|class|continue|default|else|extends|final|for|if|implements|import|new|null|private|public|return|static|super|switch|this|try|void|while)\b/,
    // Spaces are allowed between function name and parenthesis
    'function': /\b\w+(?=\s*\()/,
    'operator': /<[<=]?|>[>=]?|&&?|\|\|?|[%?]|[!=+\-*\/]=?/
});

Prism.languages.insertBefore('processing', 'number', {
    // Special case: XML is a type
    'constant': /\b(?!XML\b)[A-Z][A-Z\d_]+\b/,
    'type': {
        pattern: /\b(?:boolean|byte|char|color|double|float|int|[A-Z]\w*)\b/,
        alias: 'class-name'
    }
});

Prism.languages.python = {
    'comment': {
        pattern: /(^|[^\\])#.*/,
        lookbehind: true,
        greedy: true
    },
    'string-interpolation': {
        pattern: /(?:f|fr|rf)(?:("""|''')[\s\S]*?\1|("|')(?:\\.|(?!\2)[^\\\r\n])*\2)/i,
        greedy: true,
        inside: {
            'interpolation': {
                // "{" <expression> <optional "!s", "!r", or "!a"> <optional ":" format specifier> "}"
                pattern: /((?:^|[^{])(?:\{\{)*)\{(?!\{)(?:[^{}]|\{(?!\{)(?:[^{}]|\{(?!\{)(?:[^{}])+\})+\})+\}/,
                lookbehind: true,
                inside: {
                    'format-spec': {
                        pattern: /(:)[^:(){}]+(?=\}$)/,
                        lookbehind: true
                    },
                    'conversion-option': {
                        pattern: /![sra](?=[:}]$)/,
                        alias: 'punctuation'
                    },
                    rest: null // recursive, see below
                }
            },
            'string': /[\s\S]+/
        }
    },
    'triple-quoted-string': {
        pattern: /(?:[rub]|br|rb)?("""|''')[\s\S]*?\1/i,
        greedy: true,
        alias: 'string'
    },
    'string': {
        pattern: /(?:[rub]|br|rb)?("|')(?:\\.|(?!\1)[^\\\r\n])*\1/i,
        greedy: true
    },
    'function': {
        pattern: /((?:^|\s)def[ \t]+)[a-zA-Z_]\w*(?=\s*\()/g,
        lookbehind: true
    },
    'class-name': {
        pattern: /(\bclass\s+)\w+/i,
        lookbehind: true
    },
    'decorator': {
        pattern: /(^[\t ]*)@\w+(?:\.\w+)*/m,
        lookbehind: true,
        alias: ['annotation', 'punctuation'],
        inside: {
            'punctuation': /\./
        }
    },
    'keyword': /\b(?:_(?=\s*:)|and|as|assert|async|await|break|case|class|continue|def|del|elif|else|except|exec|finally|for|from|global|if|import|in|is|lambda|match|nonlocal|not|or|pass|print|raise|return|try|while|with|yield)\b/,
    'builtin': /\b(?:__import__|abs|all|any|apply|ascii|basestring|bin|bool|buffer|bytearray|bytes|callable|chr|classmethod|cmp|coerce|compile|complex|delattr|dict|dir|divmod|enumerate|eval|execfile|file|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|intern|isinstance|issubclass|iter|len|list|locals|long|map|max|memoryview|min|next|object|oct|open|ord|pow|property|range|raw_input|reduce|reload|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|unichr|unicode|vars|xrange|zip)\b/,
    'boolean': /\b(?:False|None|True)\b/,
    'number': /\b0(?:b(?:_?[01])+|o(?:_?[0-7])+|x(?:_?[a-f0-9])+)\b|(?:\b\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\B\.\d+(?:_\d+)*)(?:e[+-]?\d+(?:_\d+)*)?j?(?!\w)/i,
    'operator': /[-+%=]=?|!=|:=|\*\*?=?|\/\/?=?|<[<=>]?|>[=>]?|[&|^~]/,
    'punctuation': /[{}[\];(),.:]/
};

Prism.languages.python['string-interpolation'].inside.interpolation.inside.rest = Prism.languages.python;

Prism.languages.py = Prism.languages.python;
Prism.languages.py3 = Prism.languages.python;


Prism.languages.r = {
    'comment': /#.*/,
    'string': {
        pattern: /(['"])(?:\\.|(?!\1)[^\\\r\n])*\1/,
        greedy: true
    },
    'percent-operator': {
        // Includes user-defined operators
        // and %%, %*%, %/%, %in%, %o%, %x%
        pattern: /%[^%\s]*%/,
        alias: 'operator'
    },
    'boolean': /\b(?:FALSE|TRUE)\b/,
    'ellipsis': /\.\.(?:\.|\d+)/,
    'number': [
        /\b(?:Inf|NaN)\b/,
        /(?:\b0x[\dA-Fa-f]+(?:\.\d*)?|\b\d+(?:\.\d*)?|\B\.\d+)(?:[EePp][+-]?\d+)?[iL]?/
    ],
    'keyword': /\b(?:NA|NA_character_|NA_complex_|NA_integer_|NA_real_|NULL|break|else|for|function|if|in|next|repeat|while)\b/,
    'operator': /->?>?|<(?:=|<?-)?|[>=!]=?|::?|&&?|\|\|?|[+*\/^$@~]/,
    'punctuation': /[(){}\[\],;]/
};

Prism.languages.rest = {
    'table': [
        {
            pattern: /(^[\t ]*)(?:\+[=-]+)+\+(?:\r?\n|\r)(?:\1[+|].+[+|](?:\r?\n|\r))+\1(?:\+[=-]+)+\+/m,
            lookbehind: true,
            inside: {
                'punctuation': /\||(?:\+[=-]+)+\+/
            }
        },
        {
            pattern: /(^[\t ]*)=+ [ =]*=(?:(?:\r?\n|\r)\1.+)+(?:\r?\n|\r)\1=+ [ =]*=(?=(?:\r?\n|\r){2}|\s*$)/m,
            lookbehind: true,
            inside: {
                'punctuation': /[=-]+/
            }
        }
    ],

    // Directive-like patterns

    'substitution-def': {
        pattern: /(^[\t ]*\.\. )\|(?:[^|\s](?:[^|]*[^|\s])?)\| [^:]+::/m,
        lookbehind: true,
        inside: {
            'substitution': {
                pattern: /^\|(?:[^|\s]|[^|\s][^|]*[^|\s])\|/,
                alias: 'attr-value',
                inside: {
                    'punctuation': /^\||\|$/
                }
            },
            'directive': {
                pattern: /( )(?! )[^:]+::/,
                lookbehind: true,
                alias: 'function',
                inside: {
                    'punctuation': /::$/
                }
            }
        }
    },
    'link-target': [
        {
            pattern: /(^[\t ]*\.\. )\[[^\]]+\]/m,
            lookbehind: true,
            alias: 'string',
            inside: {
                'punctuation': /^\[|\]$/
            }
        },
        {
            pattern: /(^[\t ]*\.\. )_(?:`[^`]+`|(?:[^:\\]|\\.)+):/m,
            lookbehind: true,
            alias: 'string',
            inside: {
                'punctuation': /^_|:$/
            }
        }
    ],
    'directive': {
        pattern: /(^[\t ]*\.\. )[^:]+::/m,
        lookbehind: true,
        alias: 'function',
        inside: {
            'punctuation': /::$/
        }
    },
    'comment': {
        // The two alternatives try to prevent highlighting of blank comments
        pattern: /(^[\t ]*\.\.)(?:(?: .+)?(?:(?:\r?\n|\r).+)+| .+)(?=(?:\r?\n|\r){2}|$)/m,
        lookbehind: true
    },

    'title': [
        // Overlined and underlined
        {
            pattern: /^(([!"#$%&'()*+,\-.\/:;<=>?@\[\\\]^_`{|}~])\2+)(?:\r?\n|\r).+(?:\r?\n|\r)\1$/m,
            inside: {
                'punctuation': /^[!"#$%&'()*+,\-.\/:;<=>?@\[\\\]^_`{|}~]+|[!"#$%&'()*+,\-.\/:;<=>?@\[\\\]^_`{|}~]+$/,
                'important': /.+/
            }
        },

        // Underlined only
        {
            pattern: /(^|(?:\r?\n|\r){2}).+(?:\r?\n|\r)([!"#$%&'()*+,\-.\/:;<=>?@\[\\\]^_`{|}~])\2+(?=\r?\n|\r|$)/,
            lookbehind: true,
            inside: {
                'punctuation': /[!"#$%&'()*+,\-.\/:;<=>?@\[\\\]^_`{|}~]+$/,
                'important': /.+/
            }
        }
    ],
    'hr': {
        pattern: /((?:\r?\n|\r){2})([!"#$%&'()*+,\-.\/:;<=>?@\[\\\]^_`{|}~])\2{3,}(?=(?:\r?\n|\r){2})/,
        lookbehind: true,
        alias: 'punctuation'
    },
    'field': {
        pattern: /(^[\t ]*):[^:\r\n]+:(?= )/m,
        lookbehind: true,
        alias: 'attr-name'
    },
    'command-line-option': {
        pattern: /(^[\t ]*)(?:[+-][a-z\d]|(?:--|\/)[a-z\d-]+)(?:[ =](?:[a-z][\w-]*|<[^<>]+>))?(?:, (?:[+-][a-z\d]|(?:--|\/)[a-z\d-]+)(?:[ =](?:[a-z][\w-]*|<[^<>]+>))?)*(?=(?:\r?\n|\r)? {2,}\S)/im,
        lookbehind: true,
        alias: 'symbol'
    },
    'literal-block': {
        pattern: /::(?:\r?\n|\r){2}([ \t]+)(?![ \t]).+(?:(?:\r?\n|\r)\1.+)*/,
        inside: {
            'literal-block-punctuation': {
                pattern: /^::/,
                alias: 'punctuation'
            }
        }
    },
    'quoted-literal-block': {
        pattern: /::(?:\r?\n|\r){2}([!"#$%&'()*+,\-.\/:;<=>?@\[\\\]^_`{|}~]).*(?:(?:\r?\n|\r)\1.*)*/,
        inside: {
            'literal-block-punctuation': {
                pattern: /^(?:::|([!"#$%&'()*+,\-.\/:;<=>?@\[\\\]^_`{|}~])\1*)/m,
                alias: 'punctuation'
            }
        }
    },
    'list-bullet': {
        pattern: /(^[\t ]*)(?:[*+\-•‣⁃]|\(?(?:\d+|[a-z]|[ivxdclm]+)\)|(?:\d+|[a-z]|[ivxdclm]+)\.)(?= )/im,
        lookbehind: true,
        alias: 'punctuation'
    },
    'doctest-block': {
        pattern: /(^[\t ]*)>>> .+(?:(?:\r?\n|\r).+)*/m,
        lookbehind: true,
        inside: {
            'punctuation': /^>>>/
        }
    },

    'inline': [
        {
            pattern: /(^|[\s\-:\/'"<(\[{])(?::[^:]+:`.*?`|`.*?`:[^:]+:|(\*\*?|``?|\|)(?!\s)(?:(?!\2).)*\S\2(?=[\s\-.,:;!?\\\/'")\]}]|$))/m,
            lookbehind: true,
            inside: {
                'bold': {
                    pattern: /(^\*\*).+(?=\*\*$)/,
                    lookbehind: true
                },
                'italic': {
                    pattern: /(^\*).+(?=\*$)/,
                    lookbehind: true
                },
                'inline-literal': {
                    pattern: /(^``).+(?=``$)/,
                    lookbehind: true,
                    alias: 'symbol'
                },
                'role': {
                    pattern: /^:[^:]+:|:[^:]+:$/,
                    alias: 'function',
                    inside: {
                        'punctuation': /^:|:$/
                    }
                },
                'interpreted-text': {
                    pattern: /(^`).+(?=`$)/,
                    lookbehind: true,
                    alias: 'attr-value'
                },
                'substitution': {
                    pattern: /(^\|).+(?=\|$)/,
                    lookbehind: true,
                    alias: 'attr-value'
                },
                'punctuation': /\*\*?|``?|\|/
            }
        }
    ],

    'link': [
        {
            pattern: /\[[^\[\]]+\]_(?=[\s\-.,:;!?\\\/'")\]}]|$)/,
            alias: 'string',
            inside: {
                'punctuation': /^\[|\]_$/
            }
        },
        {
            pattern: /(?:\b[a-z\d]+(?:[_.:+][a-z\d]+)*_?_|`[^`]+`_?_|_`[^`]+`)(?=[\s\-.,:;!?\\\/'")\]}]|$)/i,
            alias: 'string',
            inside: {
                'punctuation': /^_?`|`$|`?_?_$/
            }
        }
    ],

    // Line block start,
    // quote attribution,
    // explicit markup start,
    // and anonymous hyperlink target shortcut (__)
    'punctuation': {
        pattern: /(^[\t ]*)(?:\|(?= |$)|(?:---?|—|\.\.|__)(?= )|\.\.$)/m,
        lookbehind: true
    }
};

Prism.languages.rst = Prism.languages.rest;

/**
 * Original by Samuel Flores
 *
 * Adds the following new token classes:
 *     constant, builtin, variable, symbol, regex
 */
(function (Prism) {
    Prism.languages.ruby = Prism.languages.extend('clike', {
        'comment': {
            pattern: /#.*|^=begin\s[\s\S]*?^=end/m,
            greedy: true
        },
        'class-name': {
            pattern: /(\b(?:class|module)\s+|\bcatch\s+\()[\w.\\]+|\b[A-Z_]\w*(?=\s*\.\s*new\b)/,
            lookbehind: true,
            inside: {
                'punctuation': /[.\\]/
            }
        },
        'keyword': /\b(?:BEGIN|END|alias|and|begin|break|case|class|def|define_method|defined|do|each|else|elsif|end|ensure|extend|for|if|in|include|module|new|next|nil|not|or|prepend|private|protected|public|raise|redo|require|rescue|retry|return|self|super|then|throw|undef|unless|until|when|while|yield)\b/,
        'operator': /\.{2,3}|&\.|===|<?=>|[!=]?~|(?:&&|\|\||<<|>>|\*\*|[+\-*/%<>!^&|=])=?|[?:]/,
        'punctuation': /[(){}[\].,;]/,
    });

    Prism.languages.insertBefore('ruby', 'operator', {
        'double-colon': {
            pattern: /::/,
            alias: 'punctuation'
        },
    });

    var interpolation = {
        pattern: /((?:^|[^\\])(?:\\{2})*)#\{(?:[^{}]|\{[^{}]*\})*\}/,
        lookbehind: true,
        inside: {
            'content': {
                pattern: /^(#\{)[\s\S]+(?=\}$)/,
                lookbehind: true,
                inside: Prism.languages.ruby
            },
            'delimiter': {
                pattern: /^#\{|\}$/,
                alias: 'punctuation'
            }
        }
    };

    delete Prism.languages.ruby.function;

    var percentExpression = '(?:' + [
        /([^a-zA-Z0-9\s{(\[<=])(?:(?!\1)[^\\]|\\[\s\S])*\1/.source,
        /\((?:[^()\\]|\\[\s\S]|\((?:[^()\\]|\\[\s\S])*\))*\)/.source,
        /\{(?:[^{}\\]|\\[\s\S]|\{(?:[^{}\\]|\\[\s\S])*\})*\}/.source,
        /\[(?:[^\[\]\\]|\\[\s\S]|\[(?:[^\[\]\\]|\\[\s\S])*\])*\]/.source,
        /<(?:[^<>\\]|\\[\s\S]|<(?:[^<>\\]|\\[\s\S])*>)*>/.source
    ].join('|') + ')';

    var symbolName = /(?:"(?:\\.|[^"\\\r\n])*"|(?:\b[a-zA-Z_]\w*|[^\s\0-\x7F]+)[?!]?|\$.)/.source;

    Prism.languages.insertBefore('ruby', 'keyword', {
        'regex-literal': [
            {
                pattern: RegExp(/%r/.source + percentExpression + /[egimnosux]{0,6}/.source),
                greedy: true,
                inside: {
                    'interpolation': interpolation,
                    'regex': /[\s\S]+/
                }
            },
            {
                pattern: /(^|[^/])\/(?!\/)(?:\[[^\r\n\]]+\]|\\.|[^[/\\\r\n])+\/[egimnosux]{0,6}(?=\s*(?:$|[\r\n,.;})#]))/,
                lookbehind: true,
                greedy: true,
                inside: {
                    'interpolation': interpolation,
                    'regex': /[\s\S]+/
                }
            }
        ],
        'variable': /[@$]+[a-zA-Z_]\w*(?:[?!]|\b)/,
        'symbol': [
            {
                pattern: RegExp(/(^|[^:]):/.source + symbolName),
                lookbehind: true,
                greedy: true
            },
            {
                pattern: RegExp(/([\r\n{(,][ \t]*)/.source + symbolName + /(?=:(?!:))/.source),
                lookbehind: true,
                greedy: true
            },
        ],
        'method-definition': {
            pattern: /(\bdef\s+)\w+(?:\s*\.\s*\w+)?/,
            lookbehind: true,
            inside: {
                'function': /\b\w+$/,
                'keyword': /^self\b/,
                'class-name': /^\w+/,
                'punctuation': /\./
            }
        }
    });

    Prism.languages.insertBefore('ruby', 'string', {
        'string-literal': [
            {
                pattern: RegExp(/%[qQiIwWs]?/.source + percentExpression),
                greedy: true,
                inside: {
                    'interpolation': interpolation,
                    'string': /[\s\S]+/
                }
            },
            {
                pattern: /("|')(?:#\{[^}]+\}|#(?!\{)|\\(?:\r\n|[\s\S])|(?!\1)[^\\#\r\n])*\1/,
                greedy: true,
                inside: {
                    'interpolation': interpolation,
                    'string': /[\s\S]+/
                }
            },
            {
                pattern: /<<[-~]?([a-z_]\w*)[\r\n](?:.*[\r\n])*?[\t ]*\1/i,
                alias: 'heredoc-string',
                greedy: true,
                inside: {
                    'delimiter': {
                        pattern: /^<<[-~]?[a-z_]\w*|\b[a-z_]\w*$/i,
                        inside: {
                            'symbol': /\b\w+/,
                            'punctuation': /^<<[-~]?/
                        }
                    },
                    'interpolation': interpolation,
                    'string': /[\s\S]+/
                }
            },
            {
                pattern: /<<[-~]?'([a-z_]\w*)'[\r\n](?:.*[\r\n])*?[\t ]*\1/i,
                alias: 'heredoc-string',
                greedy: true,
                inside: {
                    'delimiter': {
                        pattern: /^<<[-~]?'[a-z_]\w*'|\b[a-z_]\w*$/i,
                        inside: {
                            'symbol': /\b\w+/,
                            'punctuation': /^<<[-~]?'|'$/,
                        }
                    },
                    'string': /[\s\S]+/
                }
            }
        ],
        'command-literal': [
            {
                pattern: RegExp(/%x/.source + percentExpression),
                greedy: true,
                inside: {
                    'interpolation': interpolation,
                    'command': {
                        pattern: /[\s\S]+/,
                        alias: 'string'
                    }
                }
            },
            {
                pattern: /`(?:#\{[^}]+\}|#(?!\{)|\\(?:\r\n|[\s\S])|[^\\`#\r\n])*`/,
                greedy: true,
                inside: {
                    'interpolation': interpolation,
                    'command': {
                        pattern: /[\s\S]+/,
                        alias: 'string'
                    }
                }
            }
        ]
    });

    delete Prism.languages.ruby.string;

    Prism.languages.insertBefore('ruby', 'number', {
        'builtin': /\b(?:Array|Bignum|Binding|Class|Continuation|Dir|Exception|FalseClass|File|Fixnum|Float|Hash|IO|Integer|MatchData|Method|Module|NilClass|Numeric|Object|Proc|Range|Regexp|Stat|String|Struct|Symbol|TMS|Thread|ThreadGroup|Time|TrueClass)\b/,
        'constant': /\b[A-Z][A-Z0-9_]*(?:[?!]|\b)/
    });

    Prism.languages.rb = Prism.languages.ruby;
}(Prism));

(function (Prism) {

    // CAREFUL!
    // The following patterns are concatenated, so the group referenced by a back reference is non-obvious!

    var strings = [
        // normal string
        /"(?:\\[\s\S]|\$\([^)]+\)|\$(?!\()|`[^`]+`|[^"\\`$])*"/.source,
        /'[^']*'/.source,
        /\$'(?:[^'\\]|\\[\s\S])*'/.source,

        // here doc
        // 2 capturing groups
        /<<-?\s*(["']?)(\w+)\1\s[\s\S]*?[\r\n]\2/.source
    ].join('|');

    Prism.languages['shell-session'] = {
        'command': {
            pattern: RegExp(
                // user info
                /^/.source +
                '(?:' +
                (
                    // <user> ":" ( <path> )?
                    /[^\s@:$#%*!/\\]+@[^\r\n@:$#%*!/\\]+(?::[^\0-\x1F$#%*?"<>:;|]+)?/.source +
                    '|' +
                    // <path>
                    // Since the path pattern is quite general, we will require it to start with a special character to
                    // prevent false positives.
                    /[/~.][^\0-\x1F$#%*?"<>@:;|]*/.source
                ) +
                ')?' +
                // shell symbol
                /[$#%](?=\s)/.source +
                // bash command
                /(?:[^\\\r\n \t'"<$]|[ \t](?:(?!#)|#.*$)|\\(?:[^\r]|\r\n?)|\$(?!')|<(?!<)|<<str>>)+/.source.replace(/<<str>>/g, function () { return strings; }),
                'm'
            ),
            greedy: true,
            inside: {
                'info': {
                    // foo@bar:~/files$ exit
                    // foo@bar$ exit
                    // ~/files$ exit
                    pattern: /^[^#$%]+/,
                    alias: 'punctuation',
                    inside: {
                        'user': /^[^\s@:$#%*!/\\]+@[^\r\n@:$#%*!/\\]+/,
                        'punctuation': /:/,
                        'path': /[\s\S]+/
                    }
                },
                'bash': {
                    pattern: /(^[$#%]\s*)\S[\s\S]*/,
                    lookbehind: true,
                    alias: 'language-bash',
                    inside: Prism.languages.bash
                },
                'shell-symbol': {
                    pattern: /^[$#%]/,
                    alias: 'important'
                }
            }
        },
        'output': /.(?:.*(?:[\r\n]|.$))*/
    };

    Prism.languages['sh-session'] = Prism.languages.shellsession = Prism.languages['shell-session'];

}(Prism));

(function (Prism) {

    var key = /(?:[\w-]+|'[^'\n\r]*'|"(?:\\.|[^\\"\r\n])*")/.source;

    /**
     * @param {string} pattern
     */
    function insertKey(pattern) {
        return pattern.replace(/__/g, function () { return key; });
    }

    Prism.languages.toml = {
        'comment': {
            pattern: /#.*/,
            greedy: true
        },
        'table': {
            pattern: RegExp(insertKey(/(^[\t ]*\[\s*(?:\[\s*)?)__(?:\s*\.\s*__)*(?=\s*\])/.source), 'm'),
            lookbehind: true,
            greedy: true,
            alias: 'class-name'
        },
        'key': {
            pattern: RegExp(insertKey(/(^[\t ]*|[{,]\s*)__(?:\s*\.\s*__)*(?=\s*=)/.source), 'm'),
            lookbehind: true,
            greedy: true,
            alias: 'property'
        },
        'string': {
            pattern: /"""(?:\\[\s\S]|[^\\])*?"""|'''[\s\S]*?'''|'[^'\n\r]*'|"(?:\\.|[^\\"\r\n])*"/,
            greedy: true
        },
        'date': [
            {
                // Offset Date-Time, Local Date-Time, Local Date
                pattern: /\b\d{4}-\d{2}-\d{2}(?:[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?\b/i,
                alias: 'number'
            },
            {
                // Local Time
                pattern: /\b\d{2}:\d{2}:\d{2}(?:\.\d+)?\b/,
                alias: 'number'
            }
        ],
        'number': /(?:\b0(?:x[\da-zA-Z]+(?:_[\da-zA-Z]+)*|o[0-7]+(?:_[0-7]+)*|b[10]+(?:_[10]+)*))\b|[-+]?\b\d+(?:_\d+)*(?:\.\d+(?:_\d+)*)?(?:[eE][+-]?\d+(?:_\d+)*)?\b|[-+]?\b(?:inf|nan)\b/,
        'boolean': /\b(?:false|true)\b/,
        'punctuation': /[.,=[\]{}]/
    };
}(Prism));

Prism.languages.wasm = {
    'comment': [
        /\(;[\s\S]*?;\)/,
        {
            pattern: /;;.*/,
            greedy: true
        }
    ],
    'string': {
        pattern: /"(?:\\[\s\S]|[^"\\])*"/,
        greedy: true
    },
    'keyword': [
        {
            pattern: /\b(?:align|offset)=/,
            inside: {
                'operator': /=/
            }
        },
        {
            pattern: /\b(?:(?:f32|f64|i32|i64)(?:\.(?:abs|add|and|ceil|clz|const|convert_[su]\/i(?:32|64)|copysign|ctz|demote\/f64|div(?:_[su])?|eqz?|extend_[su]\/i32|floor|ge(?:_[su])?|gt(?:_[su])?|le(?:_[su])?|load(?:(?:8|16|32)_[su])?|lt(?:_[su])?|max|min|mul|neg?|nearest|or|popcnt|promote\/f32|reinterpret\/[fi](?:32|64)|rem_[su]|rot[lr]|shl|shr_[su]|sqrt|store(?:8|16|32)?|sub|trunc(?:_[su]\/f(?:32|64))?|wrap\/i64|xor))?|memory\.(?:grow|size))\b/,
            inside: {
                'punctuation': /\./
            }
        },
        /\b(?:anyfunc|block|br(?:_if|_table)?|call(?:_indirect)?|data|drop|elem|else|end|export|func|get_(?:global|local)|global|if|import|local|loop|memory|module|mut|nop|offset|param|result|return|select|set_(?:global|local)|start|table|tee_local|then|type|unreachable)\b/
    ],
    'variable': /\$[\w!#$%&'*+\-./:<=>?@\\^`|~]+/,
    'number': /[+-]?\b(?:\d(?:_?\d)*(?:\.\d(?:_?\d)*)?(?:[eE][+-]?\d(?:_?\d)*)?|0x[\da-fA-F](?:_?[\da-fA-F])*(?:\.[\da-fA-F](?:_?[\da-fA-D])*)?(?:[pP][+-]?\d(?:_?\d)*)?)\b|\binf\b|\bnan(?::0x[\da-fA-F](?:_?[\da-fA-D])*)?\b/,
    'punctuation': /[()]/
};

(function (Prism) {

    var id = /(?:\B-|\b_|\b)[A-Za-z][\w-]*(?![\w-])/.source;
    var type =
        '(?:' +
        /\b(?:unsigned\s+)?long\s+long(?![\w-])/.source +
        '|' +
        /\b(?:unrestricted|unsigned)\s+[a-z]+(?![\w-])/.source +
        '|' +
        /(?!(?:unrestricted|unsigned)\b)/.source + id + /(?:\s*<(?:[^<>]|<[^<>]*>)*>)?/.source +
        ')' + /(?:\s*\?)?/.source;

    var typeInside = {};

    Prism.languages['web-idl'] = {
        'comment': {
            pattern: /\/\/.*|\/\*[\s\S]*?\*\//,
            greedy: true
        },
        'string': {
            pattern: /"[^"]*"/,
            greedy: true
        },

        'namespace': {
            pattern: RegExp(/(\bnamespace\s+)/.source + id),
            lookbehind: true,
        },
        'class-name': [
            {
                pattern: /(^|[^\w-])(?:iterable|maplike|setlike)\s*<(?:[^<>]|<[^<>]*>)*>/,
                lookbehind: true,
                inside: typeInside
            },
            {
                pattern: RegExp(/(\b(?:attribute|const|deleter|getter|optional|setter)\s+)/.source + type),
                lookbehind: true,
                inside: typeInside
            },
            {
                // callback return type
                pattern: RegExp('(' + /\bcallback\s+/.source + id + /\s*=\s*/.source + ')' + type),
                lookbehind: true,
                inside: typeInside
            },
            {
                // typedef
                pattern: RegExp(/(\btypedef\b\s*)/.source + type),
                lookbehind: true,
                inside: typeInside
            },

            {
                pattern: RegExp(/(\b(?:callback|dictionary|enum|interface(?:\s+mixin)?)\s+)(?!(?:interface|mixin)\b)/.source + id),
                lookbehind: true,
            },
            {
                // inheritance
                pattern: RegExp(/(:\s*)/.source + id),
                lookbehind: true,
            },

            // includes and implements
            RegExp(id + /(?=\s+(?:implements|includes)\b)/.source),
            {
                pattern: RegExp(/(\b(?:implements|includes)\s+)/.source + id),
                lookbehind: true,
            },

            {
                // function return type, parameter types, and dictionary members
                pattern: RegExp(type + '(?=' + /\s*(?:\.{3}\s*)?/.source + id + /\s*[(),;=]/.source + ')'),
                inside: typeInside
            },
        ],

        'builtin': /\b(?:ArrayBuffer|BigInt64Array|BigUint64Array|ByteString|DOMString|DataView|Float32Array|Float64Array|FrozenArray|Int16Array|Int32Array|Int8Array|ObservableArray|Promise|USVString|Uint16Array|Uint32Array|Uint8Array|Uint8ClampedArray)\b/,
        'keyword': [
            /\b(?:async|attribute|callback|const|constructor|deleter|dictionary|enum|getter|implements|includes|inherit|interface|mixin|namespace|null|optional|or|partial|readonly|required|setter|static|stringifier|typedef|unrestricted)\b/,
            // type keywords
            /\b(?:any|bigint|boolean|byte|double|float|iterable|long|maplike|object|octet|record|sequence|setlike|short|symbol|undefined|unsigned|void)\b/
        ],
        'boolean': /\b(?:false|true)\b/,

        'number': {
            pattern: /(^|[^\w-])-?(?:0x[0-9a-f]+|(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|NaN|Infinity)(?![\w-])/i,
            lookbehind: true
        },
        'operator': /\.{3}|[=:?<>-]/,
        'punctuation': /[(){}[\].,;]/
    };

    for (var key in Prism.languages['web-idl']) {
        if (key !== 'class-name') {
            typeInside[key] = Prism.languages['web-idl'][key];
        }
    }

    Prism.languages.webidl = Prism.languages['web-idl'];

}(Prism));

Prism.languages.wiki = Prism.languages.extend('markup', {
    'block-comment': {
        pattern: /(^|[^\\])\/\*[\s\S]*?\*\//,
        lookbehind: true,
        alias: 'comment'
    },
    'heading': {
        pattern: /^(=+)[^=\r\n].*?\1/m,
        inside: {
            'punctuation': /^=+|=+$/,
            'important': /.+/
        }
    },
    'emphasis': {
        // TODO Multi-line
        pattern: /('{2,5}).+?\1/,
        inside: {
            'bold-italic': {
                pattern: /(''''').+?(?=\1)/,
                lookbehind: true,
                alias: ['bold', 'italic']
            },
            'bold': {
                pattern: /(''')[^'](?:.*?[^'])?(?=\1)/,
                lookbehind: true
            },
            'italic': {
                pattern: /('')[^'](?:.*?[^'])?(?=\1)/,
                lookbehind: true
            },
            'punctuation': /^''+|''+$/
        }
    },
    'hr': {
        pattern: /^-{4,}/m,
        alias: 'punctuation'
    },
    'url': [
        /ISBN +(?:97[89][ -]?)?(?:\d[ -]?){9}[\dx]\b|(?:PMID|RFC) +\d+/i,
        /\[\[.+?\]\]|\[.+?\]/
    ],
    'variable': [
        /__[A-Z]+__/,
        // FIXME Nested structures should be handled
        // {{formatnum:{{#expr:{{{3}}}}}}}
        /\{{3}.+?\}{3}/,
        /\{\{.+?\}\}/
    ],
    'symbol': [
        /^#redirect/im,
        /~{3,5}/
    ],
    // Handle table attrs:
    // {|
    // ! style="text-align:left;"| Item
    // |}
    'table-tag': {
        pattern: /((?:^|[|!])[|!])[^|\r\n]+\|(?!\|)/m,
        lookbehind: true,
        inside: {
            'table-bar': {
                pattern: /\|$/,
                alias: 'punctuation'
            },
            rest: Prism.languages.markup.tag.inside
        }
    },
    'punctuation': /^(?:\{\||\|\}|\|-|[*#:;!|])|\|\||!!/m
});

Prism.languages.insertBefore('wiki', 'tag', {
    // Prevent highlighting inside <nowiki>, <source> and <pre> tags
    'nowiki': {
        pattern: /<(nowiki|pre|source)\b[^>]*>[\s\S]*?<\/\1>/i,
        inside: {
            'tag': {
                pattern: /<(?:nowiki|pre|source)\b[^>]*>|<\/(?:nowiki|pre|source)>/i,
                inside: Prism.languages.markup.tag.inside
            }
        }
    }
});

(function (Prism) {

    // https://yaml.org/spec/1.2/spec.html#c-ns-anchor-property
    // https://yaml.org/spec/1.2/spec.html#c-ns-alias-node
    var anchorOrAlias = /[*&][^\s[\]{},]+/;
    // https://yaml.org/spec/1.2/spec.html#c-ns-tag-property
    var tag = /!(?:<[\w\-%#;/?:@&=+$,.!~*'()[\]]+>|(?:[a-zA-Z\d-]*!)?[\w\-%#;/?:@&=+$.~*'()]+)?/;
    // https://yaml.org/spec/1.2/spec.html#c-ns-properties(n,c)
    var properties = '(?:' + tag.source + '(?:[ \t]+' + anchorOrAlias.source + ')?|' + anchorOrAlias.source + '(?:[ \t]+' + tag.source + ')?)';
    // https://yaml.org/spec/1.2/spec.html#ns-plain(n,c)
    // This is a simplified version that doesn't support "#" and multiline keys
    // All these long scarry character classes are simplified versions of YAML's characters
    var plainKey = /(?:[^\s\x00-\x08\x0e-\x1f!"#%&'*,\-:>?@[\]`{|}\x7f-\x84\x86-\x9f\ud800-\udfff\ufffe\uffff]|[?:-]<PLAIN>)(?:[ \t]*(?:(?![#:])<PLAIN>|:<PLAIN>))*/.source
        .replace(/<PLAIN>/g, function () { return /[^\s\x00-\x08\x0e-\x1f,[\]{}\x7f-\x84\x86-\x9f\ud800-\udfff\ufffe\uffff]/.source; });
    var string = /"(?:[^"\\\r\n]|\\.)*"|'(?:[^'\\\r\n]|\\.)*'/.source;

    /**
     *
     * @param {string} value
     * @param {string} [flags]
     * @returns {RegExp}
     */
    function createValuePattern(value, flags) {
        flags = (flags || '').replace(/m/g, '') + 'm'; // add m flag
        var pattern = /([:\-,[{]\s*(?:\s<<prop>>[ \t]+)?)(?:<<value>>)(?=[ \t]*(?:$|,|\]|\}|(?:[\r\n]\s*)?#))/.source
            .replace(/<<prop>>/g, function () { return properties; }).replace(/<<value>>/g, function () { return value; });
        return RegExp(pattern, flags);
    }

    Prism.languages.yaml = {
        'scalar': {
            pattern: RegExp(/([\-:]\s*(?:\s<<prop>>[ \t]+)?[|>])[ \t]*(?:((?:\r?\n|\r)[ \t]+)\S[^\r\n]*(?:\2[^\r\n]+)*)/.source
                .replace(/<<prop>>/g, function () { return properties; })),
            lookbehind: true,
            alias: 'string'
        },
        'comment': /#.*/,
        'key': {
            pattern: RegExp(/((?:^|[:\-,[{\r\n?])[ \t]*(?:<<prop>>[ \t]+)?)<<key>>(?=\s*:\s)/.source
                .replace(/<<prop>>/g, function () { return properties; })
                .replace(/<<key>>/g, function () { return '(?:' + plainKey + '|' + string + ')'; })),
            lookbehind: true,
            greedy: true,
            alias: 'atrule'
        },
        'directive': {
            pattern: /(^[ \t]*)%.+/m,
            lookbehind: true,
            alias: 'important'
        },
        'datetime': {
            pattern: createValuePattern(/\d{4}-\d\d?-\d\d?(?:[tT]|[ \t]+)\d\d?:\d{2}:\d{2}(?:\.\d*)?(?:[ \t]*(?:Z|[-+]\d\d?(?::\d{2})?))?|\d{4}-\d{2}-\d{2}|\d\d?:\d{2}(?::\d{2}(?:\.\d*)?)?/.source),
            lookbehind: true,
            alias: 'number'
        },
        'boolean': {
            pattern: createValuePattern(/false|true|yes|no|on|off/.source, 'i'),
            lookbehind: true,
            alias: 'important'
        },
        'null': {
            pattern: createValuePattern(/null|~/.source, 'i'),
            lookbehind: true,
            alias: 'important'
        },
        'string': {
            pattern: createValuePattern(string),
            lookbehind: true,
            greedy: true
        },
        'number': {
            pattern: createValuePattern(/[+-]?(?:0x[\da-f]+|0o[0-7]+|(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|\.inf|\.nan)/.source, 'i'),
            lookbehind: true
        },
        'tag': tag,
        'important': anchorOrAlias,
        'punctuation': /---|[:[\]{}\-,|>?]|\.\.\./
    };

    Prism.languages.yml = Prism.languages.yaml;

}(Prism));

