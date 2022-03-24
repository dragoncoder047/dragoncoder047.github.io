const LocalEchoController = (function () {

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

    /**
     * Detects all the word boundaries on the given input
     */
    function wordBoundaries(input, leftSide = true) {
        let match;
        const words = [];
        const rx = /\w+/g;

        while ((match = rx.exec(input))) {
            if (leftSide) {
                words.push(match.index);
            } else {
                words.push(match.index + match[0].length);
            }
        }

        return words;
    }

    /**
     * The closest left word boundary of the given input at the
     * given offset.
     */
    function closestLeftBoundary(input, offset) {
        const found = wordBoundaries(input, true)
            .reverse()
            .find(x => x < offset);
        return found == null ? 0 : found;
    }

    /**
     * The closest right word boundary of the given input at the
     * given offset.
     */
    function closestRightBoundary(input, offset) {
        const found = wordBoundaries(input, false).find(x => x > offset);
        return found == null ? input.length : found;
    }

    /**
     * Convert offset at the given input to col/row location
     *
     * This function is not optimized and practically emulates via brute-force
     * the navigation on the terminal, wrapping when they reach the column width.
     */
    function offsetToColRow(input, offset, maxCols) {
        let row = 0,
            col = 0;

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

    /**
     * Counts the lines in the given input
     */
    function countLines(input, maxCols) {
        // patch for #24
        return offsetToColRow(input, removeEscapeCodes(input).length, maxCols).row + 1;
    }

    /**
     * Returns true if the expression ends on a trailing whitespace
     */
    function hasTailingWhitespace(input) {
        return input.match(/[^\\]\s$/m) != null;
    }

    /**
     * Returns the last expression in the given input
     */
    function getLastToken(input, tokenizer) {
        // Empty expressions
        if (input.trim() === "") return "";
        if (hasTailingWhitespace(input)) return "";

        // Last token

        const tokens = tokenizer(input);
        return tokens.pop() || "";
    }

    /**
     * Returns the auto-complete candidates for the given input
     */
    function collectAutocompleteCandidates(callbacks, input) {
        const tokens = parse(input);
        let index = tokens.length - 1;
        let expr = tokens[index] || "";

        // Empty expressions
        if (input.trim() === "") {
            index = 0;
            expr = "";
        } else if (hasTailingWhitespace(input)) {
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

        // end loop when fragment length = first candidate length
        if (fragment.length >= candidates[0].length) return fragment;

        // save old fragemnt
        const oldFragment = fragment;

        // get new fragment
        fragment += candidates[0].slice(fragment.length, fragment.length + 1);

        for (let i = 0; i < candidates.length; i++) {

            // return null when there's a wrong candidate
            if (!candidates[i].startsWith(oldFragment)) return null;

            if (!candidates[i].startsWith(fragment)) {
                return oldFragment;
            }
        }

        return getSharedFragment(fragment, candidates);
    }


    /**
     * The history controller provides an ring-buffer
     */
    class HistoryController {
        constructor(size) {
            this.size = size;
            this.entries = [];
            this.cursor = 0;
        }

        /**
         * Push an entry and maintain ring buffer size
         */
        push(entry) {
            // Skip empty entries
            if (entry.trim() === "") return;
            // Skip duplicate entries
            const lastEntry = this.entries[this.entries.length - 1];
            if (entry == lastEntry) return;
            // Keep track of entries
            this.entries.push(entry);
            if (this.entries.length > this.size) {
                // patch for #34
                this.entries.shift();
            }
            this.cursor = this.entries.length;
        }

        /**
         * Rewind history cursor on the last entry
         */
        rewind() {
            this.cursor = this.entries.length;
        }

        /**
         * Returns the previous entry
         */
        getPrevious() {
            const idx = Math.max(0, this.cursor - 1);
            this.cursor = idx;
            return this.entries[idx];
        }

        /**
         * Returns the next entry
         */
        getNext() {
            const idx = Math.min(this.entries.length, this.cursor + 1);
            this.cursor = idx;
            return this.entries[idx];
        }
    }

    /**
     * A local terminal controller is responsible for displaying messages
     * and handling local echo for the terminal.
     *
     * Local echo supports most of bash-like input primitives. Namely:
     * - Arrow navigation on the input
     * - Alt-arrow for word-boundary navigation
     * - Alt-backspace for word-boundary deletion
     * - Multi-line input for incomplete commands
     * - Auto-complete hooks
     */
    class LocalEchoController {
        constructor(term = null, options = null) {
            if (options === null) {
                options = term;
                term = null;
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
            this._termSize = {
                cols: 0,
                rows: 0,
            };

            this.incompleteTest = options.incompleteTest || (x => false);
            this.tokenizer = options.tokenize || (x => x);

            this._disposables = [];

            if (term) {
                if (term.loadAddon) term.loadAddon(this);
                else this.attach();
            }
        }

        // xterm.js new plugin API:
        activate(term) {
            this.term = term;
            this.attach();
        }
        dispose() {
            this.detach();
        }

        /////////////////////////////////////////////////////////////////////////////
        // User-Facing API
        /////////////////////////////////////////////////////////////////////////////

        /**
         *  Detach the controller from the terminal
         */
        detach() {
            this._disposables.forEach(d => d.dispose());
            this._disposables = [];
        }

        /**
         * Attach controller to the terminal, handling events
         */
        attach() {
            if (this.term.on) {
                this.term.on("data", this._handleTermData);
                this.term.on("resize", this._handleTermResize);
            } else {
                this._disposables.push(this.term.onData(this._handleTermData));
                this._disposables.push(this.term.onResize(this._handleTermResize));
            }
            this._termSize = {
                cols: this.term.cols,
                rows: this.term.rows,
            };
        }

        /**
         * Register a handler that will be called to satisfy auto-completion
         */
        addAutocompleteHandler(fn, ...args) {
            this._autocompleteHandlers.push({
                fn,
                args
            });
        }

        /**
         * Remove a previously registered auto-complete handler
         */
        removeAutocompleteHandler(fn) {
            const idx = this._autocompleteHandlers.findIndex(e => e.fn === fn);
            if (idx === -1) return;

            this._autocompleteHandlers.splice(idx, 1);
        }

        /**
         * Return a promise that will resolve when the user has completed
         * typing a single line
         */
        read(prompt, continuationPrompt) {
            const self = this;
            return new Promise((resolve, reject) => {
                self._activePrompt = {
                    prompt,
                    continuationPrompt,
                    resolve,
                    reject
                };
                self._input = "";
                self._cursor = 0;
                self._active = true;
                self.redraw();
            });
        }

        /**
         * Return a promise that will be resolved when the user types a single
         * character.
         *
         * This can be active in addition to `.read()` and will be resolved in
         * priority before it.
         */
        readChar(prompt, allowedChars) {
            const self = this;
            return new Promise((resolve, reject) => {
                self._activeCharPrompt = {
                    prompt,
                    resolve,
                    reject,
                    allowedChars, // monkey patch by @dragoncoder047
                };
                self.redraw();
            });
        }
    }

    return LocalEchoController;
})();