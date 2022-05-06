//////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////// added by me //////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////


Prism.languages.phoo = {
    comment: [
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
    punctuation: {
        pattern: /(\s|^)([\[\]]|do|end)(?=\s|$)/,
        lookbehind: true,
    },
    boolean: {
        pattern: /(\s|^)(true|false)(?=\s|$)/,
        lookbehind: true,
    },
    number: [
        {
            pattern: /(\s|^)[-+]?(([0-9]*\.?[0-9]+([Ee][-+]?[0-9]+)?)|(Infinity)|(NaN))(?=\s|$)/,
            lookbehind: true,
        },
        {
            pattern: /(\s|^)[-+]?(?:(?:0x[0-9a-f]+)|(?:[0-9]+))n?(?=\s|$)/i,
            lookbehind: true,
        },
        {
            pattern: /(\s|^)[0-9]{1,2}#[a-z]+(-n)?(?=\s|$)/,
            lookbehind: true,
        },
    ],
    'function-name': {
        pattern: /((\s|^)(to|macro|alias)\s+)\S+(?=\s|$)/,
        lookbehind: true,
    },
    builtin: [
        {
            pattern: /(\s|^)(to|macro|alias|pick|roll|2?drop|1?[+-]|\*\*?|[/&|^~=<>]|negate|\/?mod|nand|<<|>>|put|take|lower|upper|\.\.|\[]|\{}|concat|split|peek|poke|find|die|num>\$|\$>num|chr|type|big|compile|time|nestdepth|get|set|call|await|new|word|name|resolve|self|stacksize|window)(?=\s|$)/,
            lookbehind: true,
        },
        {
            pattern: /(\s|^)(protect|noop|2?dup|2?over|2?swap|rot|unrot|nip|tuck|pack|unpack|dip|abs|\/~|[!<>]=|min|max|clamp|within|\$[<>]|not|and|or|xor|bit|release|copy|replace|move|tally|this|run|recurse|i\^?|step|restart|break|printable\?|trim|nextword|split\$|nested|len|pluck|stuff|behead|join|of|reverse\$?|reflect|makewith|witheach|foldr?|map|filter|matchitem|findwith|findseq|found\?|sortwith|sort\$?|(to|new|now|not)-do|do-now|add-to|ord|isa\?|isoneof\?|stringify|arayify|phoo|new!|!!todo!!)(?=\s|$)/,
            lookbehind: true,
        }
    ],
    symbol: {
        pattern: /(\s|^)(stack|table|const|now!)(?=\s|$)/,
        lookbehind: true,
    },
    keyword: {
        pattern: /(\s|^)(done|again|iff?|else|until|while|switch|case|default|'|times|try|in_scope|import(\*|from)?)(?=\s|$)/,
        lookbehind: true,
    },
    meta: {
        alias: 'tag',
        pattern: /(\s|^)\]\S+\[(?=\s|$)/,
        lookbehind: true,
    },
    string: {
        pattern: /(\s|^)\$\s+(\S)((?!\2)[\s\S])+?\2\S*(?=\s|$)/,
        lookbehind: true,
    },
    url: {
        pattern: /((\s|^)import(from|\*)?\s+)\S+(?=\s|$)/,
        lookbehind: true,
    },
    'attr-value': {
        pattern: /(\s|^)\.\S+(?=\s|$)/,
        lookbehind: true,
    }
};
