const Readline = (function factory() {

    function ansiRegex(onlyFirst = false) {
        const pattern = [
            '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
            '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))'
        ].join('|');

        return new RegExp(pattern, onlyFirst ? undefined : 'g');
    }

    function removeEscapeCodes(text) {
        return text.replace(ansiRegex(), '');
    }

    function wordBoundaries(input, leftSide = true) {
        let match;
        const words = [];
        const rx = /\w+/g;

        while ((match = rx.exec(removeEscapeCodes(input)))) {
            if (leftSide) words.push(match.index);
            else words.push(match.index + match[0].length);
        }

        return words;
    }

    function closestLeftBoundary(input, offset) {
        const found = wordBoundaries(input, true).reverse().find(x => x < offset);
        return found == null ? 0 : found;
    }

    function closestRightBoundary(input, offset) {
        const found = wordBoundaries(input, false).find(x => x > offset);
        return found == null ? input.length : found;
    }

    function offsetToColRow(input, offset, maxCols) {
        let row = 0,
            col = 0;
        input = removeEscapeCodes(input);
        for (let i = 0; i < offset; ++i) {
            const chr = input.charAt(i);
            if (chr == "\n") {
                col = 0;
                row += 1;
            } else {
                col += 1;
                if (col > maxCols) {
                    col = 0;
                    row += 1;
                }
            }
        }

        return { row, col };
    }

    function colRowToOffset(input, col, row) { // Used only in patch for #51, see below.
        let off = 0;
        let lines = removeEscapeCodes(input).split('\n');
        for (let i = 0; i < row; i++) {
            off += lines[i].length + 1;
        }
        return off + col;
    }

    function countLines(input, maxCols) {
        // patch for #24
        return offsetToColRow(input, removeEscapeCodes(input).length, maxCols).row + 1;
    }

    function hasTrailingWhitespace(input) {
        return input.match(/[^\\]\s$/m) != null;
    }

    function getLastToken(input, tokenizer) {
        // Empty expressions
        if (input.trim() === "") return "";
        if (hasTrailingWhitespace(input)) return "";

        // Last token

        const tokens = tokenizer(input);
        return tokens.pop() || "";
    }

    function collectAutocompleteCandidates(callbacks, input, tokenizer) {
        const tokens = tokenizer(input);
        let index = tokens.length - 1;
        let expr = tokens[index] || "";

        // Empty expressions
        if (input.trim() === "") {
            index = 0;
            expr = "";
        } else if (hasTrailingWhitespace(input)) {
            // Expressions with danging space
            index += 1;
            expr = "";
        }

        // Collect all auto-complete candidates from the callbacks
        const all = callbacks.reduce((candidates, { fn, args }) => {
            try {
                return candidates.concat(fn(index, tokens, ...args));
            } catch (e) {
                console.error("Auto-complete error:", e);
                return candidates;
            }
        }, []);

        // Filter only the ones starting with the expression
        return all.filter(txt => txt.startsWith(expr));
    }

    function getSharedFragment(fragment, candidates) {

        // end recursive loop when fragment length = first candidate length
        if (fragment.length >= candidates[0].length) return fragment;

        // save old fragemnt
        const oldFragment = fragment;

        // get new fragment
        fragment += candidates[0].slice(fragment.length, fragment.length + 1);

        for (let i = 0; i < candidates.length; i++) {

            // return null when there's a wrong candidate
            if (!candidates[i].startsWith(oldFragment)) return null;

            if (!candidates[i].startsWith(fragment)) return oldFragment;
        }

        return getSharedFragment(fragment, candidates);
    }

    class History {
        constructor(size) {
            this.size = size || 10;
            this.entries = [];
            this.position = 0;
        }
        push(entry) {
            if (entry.trim() === '') return;
            if (entry === this.entries[this.entries.length - 1]) {
                this.rewind();
                return;
            }
            this.entries.push(entry);
            if (this.entries.length > this.size) this.entries.shift();
            this.rewind();
        }
        rewind() {
            this.position = this.entries.length;
        }
        getPrevious() {
            if (--this.position < 0) this.position = 0;
            return this.entries[this.position] || '';
        }
        getNext() {
            if (++this.position === this.entries.length) this.position = this.entries.length;
            return this.entries[this.position] || '';
        }
    }

    class Readline {
        constructor(term, options) {
            if (!options) {
                options = term;
                term = undefined;
            }
            this.term = term;
            this._handleTermData = this.handleTermData.bind(this);
            this._handleTermResize = this.handleTermResize.bind(this);

            this.history = new HistoryController(options.historySize || 10);
            this.maxAutocompleteEntries = options.maxAutocompleteEntries || 100;

            this._autocompleteHandlers = [];
            this._active = false;
            this._input = "";
            this._cursor = 0;
            this._activePrompt = null;
            this._activeCharPrompt = null;
            this._termSize = { cols: 0, rows: 0 };

            this.incompleteTest = options.incompleteTest || isIncompleteInput;

            this._disposables = [];

            if (term) {
                if (term.loadAddon) term.loadAddon(this);
                else this.attach();
            }
        }
        activate(term) {
            this.term = term;
            this.attach();
        }
        dispose() {
            this.detach();
        }
        detach() {
            this._disposables.forEach(d => d.dispose());
            this._disposables = [];
        }
        attach() {
            this._disposables.push(this.term.onData(this._handleTermData));
            this._disposables.push(this.term.onResize(this._handleTermResize));
            this._termSize = {
                cols: this.term.cols,
                rows: this.term.rows,
            };
        }
        addAutocompleteHandler(fn, ...args) {
            this._autocompleteHandlers.push({
                fn,
                args
            });
        }
        removeAutocompleteHandler(fn) {
            const idx = this._autocompleteHandlers.findIndex(e => e.fn === fn);
            if (idx === -1) return;

            this._autocompleteHandlers.splice(idx, 1);
        }
        read(prompt1, prompt2 = '') {
            const self = this;
            return new Promise((resolve, reject) => {
                self.term.write(prompt1);
                self._activePrompt = {
                    prompt: prompt1,
                    continuationPrompt: prompt2 || prompt1,
                    resolve,
                    reject
                };
                self._input = "";
                self._cursor = 0;
                self._active = true;
            });
        }
    }

    return Readline;
})();