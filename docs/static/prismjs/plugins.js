(function () {

	if (typeof Prism === 'undefined' || typeof document === 'undefined' || !document.querySelector) {
		return;
	}

	var LINE_NUMBERS_CLASS = 'line-numbers';
	var LINKABLE_LINE_NUMBERS_CLASS = 'linkable-line-numbers';

	/**
	 * @param {string} selector
	 * @param {ParentNode} [container]
	 * @returns {HTMLElement[]}
	 */
	function $$(selector, container) {
		return Array.prototype.slice.call((container || document).querySelectorAll(selector));
	}

	/**
	 * Returns whether the given element has the given class.
	 *
	 * @param {Element} element
	 * @param {string} className
	 * @returns {boolean}
	 */
	function hasClass(element, className) {
		return element.classList.contains(className);
	}

	/**
	 * Calls the given function.
	 *
	 * @param {() => any} func
	 * @returns {void}
	 */
	function callFunction(func) {
		func();
	}

	// Some browsers round the line-height, others don't.
	// We need to test for it to position the elements properly.
	var isLineHeightRounded = (function () {
		var res;
		return function () {
			if (typeof res === 'undefined') {
				var d = document.createElement('div');
				d.style.fontSize = '13px';
				d.style.lineHeight = '1.5';
				d.style.padding = '0';
				d.style.border = '0';
				d.innerHTML = '&nbsp;<br />&nbsp;';
				document.body.appendChild(d);
				// Browsers that round the line-height should have offsetHeight === 38
				// The others should have 39.
				res = d.offsetHeight === 38;
				document.body.removeChild(d);
			}
			return res;
		};
	}());

	/**
	 * Returns the top offset of the content box of the given parent and the content box of one of its children.
	 *
	 * @param {HTMLElement} parent
	 * @param {HTMLElement} child
	 */
	function getContentBoxTopOffset(parent, child) {
		var parentStyle = getComputedStyle(parent);
		var childStyle = getComputedStyle(child);

		/**
		 * Returns the numeric value of the given pixel value.
		 *
		 * @param {string} px
		 */
		function pxToNumber(px) {
			return +px.substring(0, px.length - 2);
		}

		return child.offsetTop + pxToNumber(childStyle.borderTopWidth) + pxToNumber(childStyle.paddingTop) - pxToNumber(parentStyle.paddingTop);
	}

	/**
	 * Returns whether the Line Highlight plugin is active for the given element.
	 *
	 * If this function returns `false`, do not call `highlightLines` for the given element.
	 *
	 * @param {HTMLElement | null | undefined} pre
	 * @returns {boolean}
	 */
	function isActiveFor(pre) {
		if (!pre || !/pre/i.test(pre.nodeName)) {
			return false;
		}

		if (pre.hasAttribute('data-line')) {
			return true;
		}

		if (pre.id && Prism.util.isActive(pre, LINKABLE_LINE_NUMBERS_CLASS)) {
			// Technically, the line numbers plugin is also necessary but this plugin doesn't control the classes of
			// the line numbers plugin, so we can't assume that they are present.
			return true;
		}

		return false;
	}

	var scrollIntoView = true;

	Prism.plugins.lineHighlight = {
		/**
		 * Highlights the lines of the given pre.
		 *
		 * This function is split into a DOM measuring and mutate phase to improve performance.
		 * The returned function mutates the DOM when called.
		 *
		 * @param {HTMLElement} pre
		 * @param {string | null} [lines]
		 * @param {string} [classes='']
		 * @returns {() => void}
		 */
		highlightLines: function highlightLines(pre, lines, classes) {
			lines = typeof lines === 'string' ? lines : (pre.getAttribute('data-line') || '');

			var ranges = lines.replace(/\s+/g, '').split(',').filter(Boolean);
			var offset = +pre.getAttribute('data-line-offset') || 0;

			var parseMethod = isLineHeightRounded() ? parseInt : parseFloat;
			var lineHeight = parseMethod(getComputedStyle(pre).lineHeight);
			var hasLineNumbers = Prism.util.isActive(pre, LINE_NUMBERS_CLASS);
			var codeElement = pre.querySelector('code');
			var parentElement = hasLineNumbers ? pre : codeElement || pre;
			var mutateActions = /** @type {(() => void)[]} */ ([]);

			/**
			 * The top offset between the content box of the <code> element and the content box of the parent element of
			 * the line highlight element (either `<pre>` or `<code>`).
			 *
			 * This offset might not be zero for some themes where the <code> element has a top margin. Some plugins
			 * (or users) might also add element above the <code> element. Because the line highlight is aligned relative
			 * to the <pre> element, we have to take this into account.
			 *
			 * This offset will be 0 if the parent element of the line highlight element is the `<code>` element.
			 */
			var codePreOffset = !codeElement || parentElement == codeElement ? 0 : getContentBoxTopOffset(pre, codeElement);

			ranges.forEach(function (currentRange) {
				var range = currentRange.split('-');

				var start = +range[0];
				var end = +range[1] || start;

				/** @type {HTMLElement} */
				var line = pre.querySelector('.line-highlight[data-range="' + currentRange + '"]') || document.createElement('div');

				mutateActions.push(function () {
					line.setAttribute('aria-hidden', 'true');
					line.setAttribute('data-range', currentRange);
					line.className = (classes || '') + ' line-highlight';
				});

				// if the line-numbers plugin is enabled, then there is no reason for this plugin to display the line numbers
				if (hasLineNumbers && Prism.plugins.lineNumbers) {
					var startNode = Prism.plugins.lineNumbers.getLine(pre, start);
					var endNode = Prism.plugins.lineNumbers.getLine(pre, end);

					if (startNode) {
						var top = startNode.offsetTop + codePreOffset + 'px';
						mutateActions.push(function () {
							line.style.top = top;
						});
					}

					if (endNode) {
						var height = (endNode.offsetTop - startNode.offsetTop) + endNode.offsetHeight + 'px';
						mutateActions.push(function () {
							line.style.height = height;
						});
					}
				} else {
					mutateActions.push(function () {
						line.setAttribute('data-start', String(start));

						if (end > start) {
							line.setAttribute('data-end', String(end));
						}

						line.style.top = (start - offset - 1) * lineHeight + codePreOffset + 'px';

						line.textContent = new Array(end - start + 2).join(' \n');
					});
				}

				mutateActions.push(function () {
					line.style.width = pre.scrollWidth + 'px';
				});

				mutateActions.push(function () {
					// allow this to play nicely with the line-numbers plugin
					// need to attack to pre as when line-numbers is enabled, the code tag is relatively which screws up the positioning
					parentElement.appendChild(line);
				});
			});

			var id = pre.id;
			if (hasLineNumbers && Prism.util.isActive(pre, LINKABLE_LINE_NUMBERS_CLASS) && id) {
				// This implements linkable line numbers. Linkable line numbers use Line Highlight to create a link to a
				// specific line. For this to work, the pre element has to:
				//  1) have line numbers,
				//  2) have the `linkable-line-numbers` class or an ascendant that has that class, and
				//  3) have an id.

				if (!hasClass(pre, LINKABLE_LINE_NUMBERS_CLASS)) {
					// add class to pre
					mutateActions.push(function () {
						pre.classList.add(LINKABLE_LINE_NUMBERS_CLASS);
					});
				}

				var start = parseInt(pre.getAttribute('data-start') || '1');

				// iterate all line number spans
				$$('.line-numbers-rows > span', pre).forEach(function (lineSpan, i) {
					var lineNumber = i + start;
					lineSpan.onclick = function () {
						var hash = id + '.' + lineNumber;

						// this will prevent scrolling since the span is obviously in view
						scrollIntoView = false;
						location.hash = hash;
						setTimeout(function () {
							scrollIntoView = true;
						}, 1);
					};
				});
			}

			return function () {
				mutateActions.forEach(callFunction);
			};
		}
	};


	function applyHash() {
		var hash = location.hash.slice(1);

		// Remove pre-existing temporary lines
		$$('.temporary.line-highlight').forEach(function (line) {
			line.parentNode.removeChild(line);
		});

		var range = (hash.match(/\.([\d,-]+)$/) || [null, ''])[1];

		if (!range || document.getElementById(hash)) {
			return;
		}

		var id = hash.slice(0, hash.lastIndexOf('.'));
		var pre = document.getElementById(id);

		if (!pre) {
			return;
		}

		if (!pre.hasAttribute('data-line')) {
			pre.setAttribute('data-line', '');
		}

		var mutateDom = Prism.plugins.lineHighlight.highlightLines(pre, range, 'temporary ');
		mutateDom();

		if (scrollIntoView) {
			document.querySelector('.temporary.line-highlight').scrollIntoView();
		}
	}

	var fakeTimer = 0; // Hack to limit the number of times applyHash() runs

	Prism.hooks.add('before-sanity-check', function (env) {
		var pre = env.element.parentElement;
		if (!isActiveFor(pre)) {
			return;
		}

		/*
		 * Cleanup for other plugins (e.g. autoloader).
		 *
		 * Sometimes <code> blocks are highlighted multiple times. It is necessary
		 * to cleanup any left-over tags, because the whitespace inside of the <div>
		 * tags change the content of the <code> tag.
		 */
		var num = 0;
		$$('.line-highlight', pre).forEach(function (line) {
			num += line.textContent.length;
			line.parentNode.removeChild(line);
		});
		// Remove extra whitespace
		if (num && /^(?: \n)+$/.test(env.code.slice(-num))) {
			env.code = env.code.slice(0, -num);
		}
	});

	Prism.hooks.add('complete', function completeHook(env) {
		var pre = env.element.parentElement;
		if (!isActiveFor(pre)) {
			return;
		}

		clearTimeout(fakeTimer);

		var hasLineNumbers = Prism.plugins.lineNumbers;
		var isLineNumbersLoaded = env.plugins && env.plugins.lineNumbers;

		if (hasClass(pre, LINE_NUMBERS_CLASS) && hasLineNumbers && !isLineNumbersLoaded) {
			Prism.hooks.add('line-numbers', completeHook);
		} else {
			var mutateDom = Prism.plugins.lineHighlight.highlightLines(pre);
			mutateDom();
			fakeTimer = setTimeout(applyHash, 1);
		}
	});

	window.addEventListener('hashchange', applyHash);
	window.addEventListener('resize', function () {
		var actions = $$('pre')
			.filter(isActiveFor)
			.map(function (pre) {
				return Prism.plugins.lineHighlight.highlightLines(pre);
			});
		actions.forEach(callFunction);
	});

}());

(function () {

	if (typeof Prism === 'undefined' || typeof document === 'undefined') {
		return;
	}

	/**
	 * Plugin name which is used as a class name for <pre> which is activating the plugin
	 *
	 * @type {string}
	 */
	var PLUGIN_NAME = 'line-numbers';

	/**
	 * Regular expression used for determining line breaks
	 *
	 * @type {RegExp}
	 */
	var NEW_LINE_EXP = /\n(?!$)/g;


	/**
	 * Global exports
	 */
	var config = Prism.plugins.lineNumbers = {
		/**
		 * Get node for provided line number
		 *
		 * @param {Element} element pre element
		 * @param {number} number line number
		 * @returns {Element|undefined}
		 */
		getLine: function (element, number) {
			if (element.tagName !== 'PRE' || !element.classList.contains(PLUGIN_NAME)) {
				return;
			}

			var lineNumberRows = element.querySelector('.line-numbers-rows');
			if (!lineNumberRows) {
				return;
			}
			var lineNumberStart = parseInt(element.getAttribute('data-start'), 10) || 1;
			var lineNumberEnd = lineNumberStart + (lineNumberRows.children.length - 1);

			if (number < lineNumberStart) {
				number = lineNumberStart;
			}
			if (number > lineNumberEnd) {
				number = lineNumberEnd;
			}

			var lineIndex = number - lineNumberStart;

			return lineNumberRows.children[lineIndex];
		},

		/**
		 * Resizes the line numbers of the given element.
		 *
		 * This function will not add line numbers. It will only resize existing ones.
		 *
		 * @param {HTMLElement} element A `<pre>` element with line numbers.
		 * @returns {void}
		 */
		resize: function (element) {
			resizeElements([element]);
		},

		/**
		 * Whether the plugin can assume that the units font sizes and margins are not depended on the size of
		 * the current viewport.
		 *
		 * Setting this to `true` will allow the plugin to do certain optimizations for better performance.
		 *
		 * Set this to `false` if you use any of the following CSS units: `vh`, `vw`, `vmin`, `vmax`.
		 *
		 * @type {boolean}
		 */
		assumeViewportIndependence: true
	};

	/**
	 * Resizes the given elements.
	 *
	 * @param {HTMLElement[]} elements
	 */
	function resizeElements(elements) {
		elements = elements.filter(function (e) {
			var codeStyles = getStyles(e);
			var whiteSpace = codeStyles['white-space'];
			return whiteSpace === 'pre-wrap' || whiteSpace === 'pre-line';
		});

		if (elements.length == 0) {
			return;
		}

		var infos = elements.map(function (element) {
			var codeElement = element.querySelector('code');
			var lineNumbersWrapper = element.querySelector('.line-numbers-rows');
			if (!codeElement || !lineNumbersWrapper) {
				return undefined;
			}

			/** @type {HTMLElement} */
			var lineNumberSizer = element.querySelector('.line-numbers-sizer');
			var codeLines = codeElement.textContent.split(NEW_LINE_EXP);

			if (!lineNumberSizer) {
				lineNumberSizer = document.createElement('span');
				lineNumberSizer.className = 'line-numbers-sizer';

				codeElement.appendChild(lineNumberSizer);
			}

			lineNumberSizer.innerHTML = '0';
			lineNumberSizer.style.display = 'block';

			var oneLinerHeight = lineNumberSizer.getBoundingClientRect().height;
			lineNumberSizer.innerHTML = '';

			return {
				element: element,
				lines: codeLines,
				lineHeights: [],
				oneLinerHeight: oneLinerHeight,
				sizer: lineNumberSizer,
			};
		}).filter(Boolean);

		infos.forEach(function (info) {
			var lineNumberSizer = info.sizer;
			var lines = info.lines;
			var lineHeights = info.lineHeights;
			var oneLinerHeight = info.oneLinerHeight;

			lineHeights[lines.length - 1] = undefined;
			lines.forEach(function (line, index) {
				if (line && line.length > 1) {
					var e = lineNumberSizer.appendChild(document.createElement('span'));
					e.style.display = 'block';
					e.textContent = line;
				} else {
					lineHeights[index] = oneLinerHeight;
				}
			});
		});

		infos.forEach(function (info) {
			var lineNumberSizer = info.sizer;
			var lineHeights = info.lineHeights;

			var childIndex = 0;
			for (var i = 0; i < lineHeights.length; i++) {
				if (lineHeights[i] === undefined) {
					lineHeights[i] = lineNumberSizer.children[childIndex++].getBoundingClientRect().height;
				}
			}
		});

		infos.forEach(function (info) {
			var lineNumberSizer = info.sizer;
			var wrapper = info.element.querySelector('.line-numbers-rows');

			lineNumberSizer.style.display = 'none';
			lineNumberSizer.innerHTML = '';

			info.lineHeights.forEach(function (height, lineNumber) {
				wrapper.children[lineNumber].style.height = height + 'px';
			});
		});
	}

	/**
	 * Returns style declarations for the element
	 *
	 * @param {Element} element
	 */
	function getStyles(element) {
		if (!element) {
			return null;
		}

		return window.getComputedStyle ? getComputedStyle(element) : (element.currentStyle || null);
	}

	var lastWidth;
	window.addEventListener('resize', function () {
		if (config.assumeViewportIndependence && lastWidth === window.innerWidth) {
			return;
		}
		lastWidth = window.innerWidth;

		resizeElements(Array.prototype.slice.call(document.querySelectorAll('pre.' + PLUGIN_NAME)));
	});

	Prism.hooks.add('complete', function (env) {
		if (!env.code) {
			return;
		}

		var code = /** @type {Element} */ (env.element);
		var pre = /** @type {HTMLElement} */ (code.parentNode);

		// works only for <code> wrapped inside <pre> (not inline)
		if (!pre || !/pre/i.test(pre.nodeName)) {
			return;
		}

		// Abort if line numbers already exists
		if (code.querySelector('.line-numbers-rows')) {
			return;
		}

		// only add line numbers if <code> or one of its ancestors has the `line-numbers` class
		if (!Prism.util.isActive(code, PLUGIN_NAME)) {
			return;
		}

		// Remove the class 'line-numbers' from the <code>
		code.classList.remove(PLUGIN_NAME);
		// Add the class 'line-numbers' to the <pre>
		pre.classList.add(PLUGIN_NAME);

		var match = env.code.match(NEW_LINE_EXP);
		var linesNum = match ? match.length + 1 : 1;
		var lineNumbersWrapper;

		var lines = new Array(linesNum + 1).join('<span></span>');

		lineNumbersWrapper = document.createElement('span');
		lineNumbersWrapper.setAttribute('aria-hidden', 'true');
		lineNumbersWrapper.className = 'line-numbers-rows';
		lineNumbersWrapper.innerHTML = lines;

		if (pre.hasAttribute('data-start')) {
			pre.style.counterReset = 'linenumber ' + (parseInt(pre.getAttribute('data-start'), 10) - 1);
		}

		env.element.appendChild(lineNumbersWrapper);

		resizeElements([pre]);

		Prism.hooks.run('line-numbers', env);
	});

	Prism.hooks.add('line-numbers', function (env) {
		env.plugins = env.plugins || {};
		env.plugins.lineNumbers = true;
	});

}());

(function () {

	if (typeof Prism === 'undefined' || typeof document === 'undefined') {
		return;
	}

	// https://developer.mozilla.org/en-US/docs/Web/API/Element/matches#Polyfill
	if (!Element.prototype.matches) {
		Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
	}

	var LOADING_MESSAGE = 'Loading…';
	var FAILURE_MESSAGE = function (status, message) {
		return '✖ Error ' + status + ' while fetching file: ' + message;
	};
	var FAILURE_EMPTY_MESSAGE = '✖ Error: File does not exist or is empty';

	var EXTENSIONS = {
		'js': 'javascript',
		'py': 'python',
		'rb': 'ruby',
		'ps1': 'powershell',
		'psm1': 'powershell',
		'sh': 'bash',
		'bat': 'batch',
		'h': 'c',
		'tex': 'latex'
	};

	var STATUS_ATTR = 'data-src-status';
	var STATUS_LOADING = 'loading';
	var STATUS_LOADED = 'loaded';
	var STATUS_FAILED = 'failed';

	var SELECTOR = 'pre[data-src]:not([' + STATUS_ATTR + '="' + STATUS_LOADED + '"])' + ':not([' + STATUS_ATTR + '="' + STATUS_LOADING + '"])';

	/**
	 * Loads the given file.
	 *
	 * @param {string} src The URL or path of the source file to load.
	 * @param {(result: string) => void} success
	 * @param {(reason: string) => void} error
	 */
	function loadFile(src, success, error) {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', src, true);
		xhr.onreadystatechange = function () {
			if (xhr.readyState == 4) {
				if (xhr.status < 400 && xhr.responseText) {
					success(xhr.responseText);
				} else {
					if (xhr.status >= 400) {
						error(FAILURE_MESSAGE(xhr.status, xhr.statusText));
					} else {
						error(FAILURE_EMPTY_MESSAGE);
					}
				}
			}
		};
		xhr.send(null);
	}

	/**
	 * Parses the given range.
	 *
	 * This returns a range with inclusive ends.
	 *
	 * @param {string | null | undefined} range
	 * @returns {[number, number | undefined] | undefined}
	 */
	function parseRange(range) {
		var m = /^\s*(\d+)\s*(?:(,)\s*(?:(\d+)\s*)?)?$/.exec(range || '');
		if (m) {
			var start = Number(m[1]);
			var comma = m[2];
			var end = m[3];

			if (!comma) {
				return [start, start];
			}
			if (!end) {
				return [start, undefined];
			}
			return [start, Number(end)];
		}
		return undefined;
	}

	Prism.hooks.add('before-highlightall', function (env) {
		env.selector += ', ' + SELECTOR;
	});

	Prism.hooks.add('before-sanity-check', function (env) {
		var pre = /** @type {HTMLPreElement} */ (env.element);
		if (pre.matches(SELECTOR)) {
			env.code = ''; // fast-path the whole thing and go to complete

			pre.setAttribute(STATUS_ATTR, STATUS_LOADING); // mark as loading

			// add code element with loading message
			var code = pre.appendChild(document.createElement('CODE'));
			code.textContent = LOADING_MESSAGE;

			var src = pre.getAttribute('data-src');

			var language = env.language;
			if (language === 'none') {
				// the language might be 'none' because there is no language set;
				// in this case, we want to use the extension as the language
				var extension = (/\.(\w+)$/.exec(src) || [null, 'none'])[1];
				language = EXTENSIONS[extension] || extension;
			}

			// set language classes
			Prism.util.setLanguage(code, language);
			Prism.util.setLanguage(pre, language);

			// preload the language
			var autoloader = Prism.plugins.autoloader;
			if (autoloader) {
				autoloader.loadLanguages(language);
			}

			// load file
			loadFile(
				src,
				function (text) {
					// mark as loaded
					pre.setAttribute(STATUS_ATTR, STATUS_LOADED);

					// handle data-range
					var range = parseRange(pre.getAttribute('data-range'));
					if (range) {
						var lines = text.split(/\r\n?|\n/g);

						// the range is one-based and inclusive on both ends
						var start = range[0];
						var end = range[1] == null ? lines.length : range[1];

						if (start < 0) { start += lines.length; }
						start = Math.max(0, Math.min(start - 1, lines.length));
						if (end < 0) { end += lines.length; }
						end = Math.max(0, Math.min(end, lines.length));

						text = lines.slice(start, end).join('\n');

						// add data-start for line numbers
						if (!pre.hasAttribute('data-start')) {
							pre.setAttribute('data-start', String(start + 1));
						}
					}

					// highlight code
					code.textContent = text;
					Prism.highlightElement(code);
				},
				function (error) {
					// mark as failed
					pre.setAttribute(STATUS_ATTR, STATUS_FAILED);

					code.textContent = error;
				}
			);
		}
	});

	Prism.plugins.fileHighlight = {
		/**
		 * Executes the File Highlight plugin for all matching `pre` elements under the given container.
		 *
		 * Note: Elements which are already loaded or currently loading will not be touched by this method.
		 *
		 * @param {ParentNode} [container=document]
		 */
		highlight: function highlight(container) {
			var elements = (container || document).querySelectorAll(SELECTOR);

			for (var i = 0, element; (element = elements[i++]);) {
				Prism.highlightElement(element);
			}
		}
	};

	var logged = false;
	/** @deprecated Use `Prism.plugins.fileHighlight.highlight` instead. */
	Prism.fileHighlight = function () {
		if (!logged) {
			console.warn('Prism.fileHighlight is deprecated. Use `Prism.plugins.fileHighlight.highlight` instead.');
			logged = true;
		}
		Prism.plugins.fileHighlight.highlight.apply(this, arguments);
	};

}());

(function () {

	if (typeof Prism === 'undefined' || typeof document === 'undefined') {
		return;
	}

	var callbacks = [];
	var map = {};
	var noop = function () {};

	Prism.plugins.toolbar = {};

	/**
	 * @typedef ButtonOptions
	 * @property {string} text The text displayed.
	 * @property {string} [url] The URL of the link which will be created.
	 * @property {Function} [onClick] The event listener for the `click` event of the created button.
	 * @property {string} [className] The class attribute to include with element.
	 */

	/**
	 * Register a button callback with the toolbar.
	 *
	 * @param {string} key
	 * @param {ButtonOptions|Function} opts
	 */
	var registerButton = Prism.plugins.toolbar.registerButton = function (key, opts) {
		var callback;

		if (typeof opts === 'function') {
			callback = opts;
		} else {
			callback = function (env) {
				var element;

				if (typeof opts.onClick === 'function') {
					element = document.createElement('button');
					element.type = 'button';
					element.addEventListener('click', function () {
						opts.onClick.call(this, env);
					});
				} else if (typeof opts.url === 'string') {
					element = document.createElement('a');
					element.href = opts.url;
				} else {
					element = document.createElement('span');
				}

				if (opts.className) {
					element.classList.add(opts.className);
				}

				element.textContent = opts.text;

				return element;
			};
		}

		if (key in map) {
			console.warn('There is a button with the key "' + key + '" registered already.');
			return;
		}

		callbacks.push(map[key] = callback);
	};

	/**
	 * Returns the callback order of the given element.
	 *
	 * @param {HTMLElement} element
	 * @returns {string[] | undefined}
	 */
	function getOrder(element) {
		while (element) {
			var order = element.getAttribute('data-toolbar-order');
			if (order != null) {
				order = order.trim();
				if (order.length) {
					return order.split(/\s*,\s*/g);
				} else {
					return [];
				}
			}
			element = element.parentElement;
		}
	}

	/**
	 * Post-highlight Prism hook callback.
	 *
	 * @param env
	 */
	var hook = Prism.plugins.toolbar.hook = function (env) {
		// Check if inline or actual code block (credit to line-numbers plugin)
		var pre = env.element.parentNode;
		if (!pre || !/pre/i.test(pre.nodeName)) {
			return;
		}

		// Autoloader rehighlights, so only do this once.
		if (pre.parentNode.classList.contains('code-toolbar')) {
			return;
		}

		// Create wrapper for <pre> to prevent scrolling toolbar with content
		var wrapper = document.createElement('div');
		wrapper.classList.add('code-toolbar');
		pre.parentNode.insertBefore(wrapper, pre);
		wrapper.appendChild(pre);

		// Setup the toolbar
		var toolbar = document.createElement('div');
		toolbar.classList.add('toolbar');

		// order callbacks
		var elementCallbacks = callbacks;
		var order = getOrder(env.element);
		if (order) {
			elementCallbacks = order.map(function (key) {
				return map[key] || noop;
			});
		}

		elementCallbacks.forEach(function (callback) {
			var element = callback(env);

			if (!element) {
				return;
			}

			var item = document.createElement('div');
			item.classList.add('toolbar-item');

			item.appendChild(element);
			toolbar.appendChild(item);
		});

		// Add our toolbar to the currently created wrapper of <pre> tag
		wrapper.appendChild(toolbar);
	};

	registerButton('label', function (env) {
		var pre = env.element.parentNode;
		if (!pre || !/pre/i.test(pre.nodeName)) {
			return;
		}

		if (!pre.hasAttribute('data-label')) {
			return;
		}

		var element; var template;
		var text = pre.getAttribute('data-label');
		try {
			// Any normal text will blow up this selector.
			template = document.querySelector('template#' + text);
		} catch (e) { /* noop */ }

		if (template) {
			element = template.content;
		} else {
			if (pre.hasAttribute('data-url')) {
				element = document.createElement('a');
				element.href = pre.getAttribute('data-url');
			} else {
				element = document.createElement('span');
			}

			element.textContent = text;
		}

		return element;
	});

	/**
	 * Register the toolbar with Prism.
	 */
	Prism.hooks.add('complete', hook);
}());

(function () {

	if (typeof Prism === 'undefined' || typeof document === 'undefined') {
		return;
	}

	if (!Prism.plugins.toolbar) {
		console.warn('Show Languages plugin loaded before Toolbar plugin.');

		return;
	}

	/* eslint-disable */

	// The languages map is built automatically with gulp
	var Languages = /*languages_placeholder[*/{
		"none": "Plain text",
		"plain": "Plain text",
		"plaintext": "Plain text",
		"text": "Plain text",
		"txt": "Plain text",
		"html": "HTML",
		"xml": "XML",
		"svg": "SVG",
		"mathml": "MathML",
		"ssml": "SSML",
		"rss": "RSS",
		"css": "CSS",
		"clike": "C-like",
		"js": "JavaScript",
		"abap": "ABAP",
		"abnf": "ABNF",
		"al": "AL",
		"antlr4": "ANTLR4",
		"g4": "ANTLR4",
		"apacheconf": "Apache Configuration",
		"apl": "APL",
		"aql": "AQL",
		"ino": "Arduino",
		"arff": "ARFF",
		"asciidoc": "AsciiDoc",
		"adoc": "AsciiDoc",
		"aspnet": "ASP.NET (C#)",
		"asm6502": "6502 Assembly",
		"asmatmel": "Atmel AVR Assembly",
		"autohotkey": "AutoHotkey",
		"autoit": "AutoIt",
		"avisynth": "AviSynth",
		"avs": "AviSynth",
		"avro-idl": "Avro IDL",
		"avdl": "Avro IDL",
		"basic": "BASIC",
		"bbcode": "BBcode",
		"bnf": "BNF",
		"rbnf": "RBNF",
		"bsl": "BSL (1C:Enterprise)",
		"oscript": "OneScript",
		"csharp": "C#",
		"cs": "C#",
		"dotnet": "C#",
		"cpp": "C++",
		"cfscript": "CFScript",
		"cfc": "CFScript",
		"cil": "CIL",
		"cmake": "CMake",
		"cobol": "COBOL",
		"coffee": "CoffeeScript",
		"conc": "Concurnas",
		"csp": "Content-Security-Policy",
		"css-extras": "CSS Extras",
		"csv": "CSV",
		"dataweave": "DataWeave",
		"dax": "DAX",
		"django": "Django/Jinja2",
		"jinja2": "Django/Jinja2",
		"dns-zone-file": "DNS zone file",
		"dns-zone": "DNS zone file",
		"dockerfile": "Docker",
		"dot": "DOT (Graphviz)",
		"gv": "DOT (Graphviz)",
		"ebnf": "EBNF",
		"editorconfig": "EditorConfig",
		"ejs": "EJS",
		"etlua": "Embedded Lua templating",
		"erb": "ERB",
		"excel-formula": "Excel Formula",
		"xlsx": "Excel Formula",
		"xls": "Excel Formula",
		"fsharp": "F#",
		"firestore-security-rules": "Firestore security rules",
		"ftl": "FreeMarker Template Language",
		"gml": "GameMaker Language",
		"gamemakerlanguage": "GameMaker Language",
		"gap": "GAP (CAS)",
		"gcode": "G-code",
		"gdscript": "GDScript",
		"gedcom": "GEDCOM",
		"glsl": "GLSL",
		"gn": "GN",
		"gni": "GN",
		"go-module": "Go module",
		"go-mod": "Go module",
		"graphql": "GraphQL",
		"hbs": "Handlebars",
		"hs": "Haskell",
		"hcl": "HCL",
		"hlsl": "HLSL",
		"http": "HTTP",
		"hpkp": "HTTP Public-Key-Pins",
		"hsts": "HTTP Strict-Transport-Security",
		"ichigojam": "IchigoJam",
		"icu-message-format": "ICU Message Format",
		"idr": "Idris",
		"ignore": ".ignore",
		"gitignore": ".gitignore",
		"hgignore": ".hgignore",
		"npmignore": ".npmignore",
		"inform7": "Inform 7",
		"javadoc": "JavaDoc",
		"javadoclike": "JavaDoc-like",
		"javastacktrace": "Java stack trace",
		"jq": "JQ",
		"jsdoc": "JSDoc",
		"js-extras": "JS Extras",
		"json": "JSON",
		"webmanifest": "Web App Manifest",
		"json5": "JSON5",
		"jsonp": "JSONP",
		"jsstacktrace": "JS stack trace",
		"js-templates": "JS Templates",
		"keepalived": "Keepalived Configure",
		"kts": "Kotlin Script",
		"kt": "Kotlin",
		"kumir": "KuMir (КуМир)",
		"kum": "KuMir (КуМир)",
		"latex": "LaTeX",
		"tex": "TeX",
		"context": "ConTeXt",
		"lilypond": "LilyPond",
		"ly": "LilyPond",
		"emacs": "Lisp",
		"elisp": "Lisp",
		"emacs-lisp": "Lisp",
		"llvm": "LLVM IR",
		"log": "Log file",
		"lolcode": "LOLCODE",
		"magma": "Magma (CAS)",
		"md": "Markdown",
		"markup-templating": "Markup templating",
		"matlab": "MATLAB",
		"maxscript": "MAXScript",
		"mel": "MEL",
		"mongodb": "MongoDB",
		"moon": "MoonScript",
		"n1ql": "N1QL",
		"n4js": "N4JS",
		"n4jsd": "N4JS",
		"nand2tetris-hdl": "Nand To Tetris HDL",
		"naniscript": "Naninovel Script",
		"nani": "Naninovel Script",
		"nasm": "NASM",
		"neon": "NEON",
		"nginx": "nginx",
		"nsis": "NSIS",
		"objectivec": "Objective-C",
		"objc": "Objective-C",
		"ocaml": "OCaml",
		"opencl": "OpenCL",
		"openqasm": "OpenQasm",
		"qasm": "OpenQasm",
		"parigp": "PARI/GP",
		"objectpascal": "Object Pascal",
		"psl": "PATROL Scripting Language",
		"pcaxis": "PC-Axis",
		"px": "PC-Axis",
		"peoplecode": "PeopleCode",
		"pcode": "PeopleCode",
		"php": "PHP",
		"phpdoc": "PHPDoc",
		"php-extras": "PHP Extras",
		"plsql": "PL/SQL",
		"powerquery": "PowerQuery",
		"pq": "PowerQuery",
		"mscript": "PowerQuery",
		"powershell": "PowerShell",
		"promql": "PromQL",
		"properties": ".properties",
		"protobuf": "Protocol Buffers",
		"purebasic": "PureBasic",
		"pbfasm": "PureBasic",
		"purs": "PureScript",
		"py": "Python",
		"qsharp": "Q#",
		"qs": "Q#",
		"q": "Q (kdb+ database)",
		"qml": "QML",
		"rkt": "Racket",
		"cshtml": "Razor C#",
		"razor": "Razor C#",
		"jsx": "React JSX",
		"tsx": "React TSX",
		"renpy": "Ren'py",
		"rpy": "Ren'py",
		"rest": "reST (reStructuredText)",
		"robotframework": "Robot Framework",
		"robot": "Robot Framework",
		"rb": "Ruby",
		"sas": "SAS",
		"sass": "Sass (Sass)",
		"scss": "Sass (Scss)",
		"shell-session": "Shell session",
		"sh-session": "Shell session",
		"shellsession": "Shell session",
		"sml": "SML",
		"smlnj": "SML/NJ",
		"solidity": "Solidity (Ethereum)",
		"sol": "Solidity (Ethereum)",
		"solution-file": "Solution file",
		"sln": "Solution file",
		"soy": "Soy (Closure Template)",
		"sparql": "SPARQL",
		"rq": "SPARQL",
		"splunk-spl": "Splunk SPL",
		"sqf": "SQF: Status Quo Function (Arma 3)",
		"sql": "SQL",
		"iecst": "Structured Text (IEC 61131-3)",
		"systemd": "Systemd configuration file",
		"t4-templating": "T4 templating",
		"t4-cs": "T4 Text Templates (C#)",
		"t4": "T4 Text Templates (C#)",
		"t4-vb": "T4 Text Templates (VB)",
		"tap": "TAP",
		"tt2": "Template Toolkit 2",
		"toml": "TOML",
		"trickle": "trickle",
		"troy": "troy",
		"trig": "TriG",
		"ts": "TypeScript",
		"tsconfig": "TSConfig",
		"uscript": "UnrealScript",
		"uc": "UnrealScript",
		"uorazor": "UO Razor Script",
		"uri": "URI",
		"url": "URL",
		"vbnet": "VB.Net",
		"vhdl": "VHDL",
		"vim": "vim",
		"visual-basic": "Visual Basic",
		"vba": "VBA",
		"vb": "Visual Basic",
		"wasm": "WebAssembly",
		"web-idl": "Web IDL",
		"webidl": "Web IDL",
		"wiki": "Wiki markup",
		"wolfram": "Wolfram language",
		"nb": "Mathematica Notebook",
		"wl": "Wolfram language",
		"xeoracube": "XeoraCube",
		"xml-doc": "XML doc (.net)",
		"xojo": "Xojo (REALbasic)",
		"xquery": "XQuery",
		"yaml": "YAML",
		"yml": "YAML",
		"yang": "YANG"
	}/*]*/;

	/* eslint-enable */

	Prism.plugins.toolbar.registerButton('show-language', function (env) {
		var pre = env.element.parentNode;
		if (!pre || !/pre/i.test(pre.nodeName)) {
			return;
		}

		/**
		 * Tries to guess the name of a language given its id.
		 *
		 * @param {string} id The language id.
		 * @returns {string}
		 */
		function guessTitle(id) {
			if (!id) {
				return id;
			}
			return (id.substring(0, 1).toUpperCase() + id.substring(1)).replace(/s(?=cript)/, 'S');
		}

		var language = pre.getAttribute('data-language') || Languages[env.language] || guessTitle(env.language);

		if (!language) {
			return;
		}
		var element = document.createElement('span');
		element.textContent = language;

		return element;
	});

}());

(function () {

	if (typeof Prism === 'undefined' || typeof document === 'undefined' || !Function.prototype.bind) {
		return;
	}

	var previewers = {
		// gradient must be defined before color and angle
		'gradient': {
			create: (function () {

				// Stores already processed gradients so that we don't
				// make the conversion every time the previewer is shown
				var cache = {};

				/**
				 * Returns a W3C-valid linear gradient
				 *
				 * @param {string} prefix Vendor prefix if any ("-moz-", "-webkit-", etc.)
				 * @param {string} func Gradient function name ("linear-gradient")
				 * @param {string[]} values Array of the gradient function parameters (["0deg", "red 0%", "blue 100%"])
				 */
				var convertToW3CLinearGradient = function (prefix, func, values) {
					// Default value for angle
					var angle = '180deg';

					if (/^(?:-?(?:\d+(?:\.\d+)?|\.\d+)(?:deg|rad)|to\b|top|right|bottom|left)/.test(values[0])) {
						angle = values.shift();
						if (angle.indexOf('to ') < 0) {
							// Angle uses old keywords
							// W3C syntax uses "to" + opposite keywords
							if (angle.indexOf('top') >= 0) {
								if (angle.indexOf('left') >= 0) {
									angle = 'to bottom right';
								} else if (angle.indexOf('right') >= 0) {
									angle = 'to bottom left';
								} else {
									angle = 'to bottom';
								}
							} else if (angle.indexOf('bottom') >= 0) {
								if (angle.indexOf('left') >= 0) {
									angle = 'to top right';
								} else if (angle.indexOf('right') >= 0) {
									angle = 'to top left';
								} else {
									angle = 'to top';
								}
							} else if (angle.indexOf('left') >= 0) {
								angle = 'to right';
							} else if (angle.indexOf('right') >= 0) {
								angle = 'to left';
							} else if (prefix) {
								// Angle is shifted by 90deg in prefixed gradients
								if (angle.indexOf('deg') >= 0) {
									angle = (90 - parseFloat(angle)) + 'deg';
								} else if (angle.indexOf('rad') >= 0) {
									angle = (Math.PI / 2 - parseFloat(angle)) + 'rad';
								}
							}
						}
					}

					return func + '(' + angle + ',' + values.join(',') + ')';
				};

				/**
				 * Returns a W3C-valid radial gradient
				 *
				 * @param {string} prefix Vendor prefix if any ("-moz-", "-webkit-", etc.)
				 * @param {string} func Gradient function name ("linear-gradient")
				 * @param {string[]} values Array of the gradient function parameters (["0deg", "red 0%", "blue 100%"])
				 */
				var convertToW3CRadialGradient = function (prefix, func, values) {
					if (values[0].indexOf('at') < 0) {
						// Looks like old syntax

						// Default values
						var position = 'center';
						var shape = 'ellipse';
						var size = 'farthest-corner';

						if (/\b(?:bottom|center|left|right|top)\b|^\d+/.test(values[0])) {
							// Found a position
							// Remove angle value, if any
							position = values.shift().replace(/\s*-?\d+(?:deg|rad)\s*/, '');
						}
						if (/\b(?:circle|closest|contain|cover|ellipse|farthest)\b/.test(values[0])) {
							// Found a shape and/or size
							var shapeSizeParts = values.shift().split(/\s+/);
							if (shapeSizeParts[0] && (shapeSizeParts[0] === 'circle' || shapeSizeParts[0] === 'ellipse')) {
								shape = shapeSizeParts.shift();
							}
							if (shapeSizeParts[0]) {
								size = shapeSizeParts.shift();
							}

							// Old keywords are converted to their synonyms
							if (size === 'cover') {
								size = 'farthest-corner';
							} else if (size === 'contain') {
								size = 'clothest-side';
							}
						}

						return func + '(' + shape + ' ' + size + ' at ' + position + ',' + values.join(',') + ')';
					}
					return func + '(' + values.join(',') + ')';
				};

				/**
				 * Converts a gradient to a W3C-valid one
				 * Does not support old webkit syntax (-webkit-gradient(linear...) and -webkit-gradient(radial...))
				 *
				 * @param {string} gradient The CSS gradient
				 */
				var convertToW3CGradient = function (gradient) {
					if (cache[gradient]) {
						return cache[gradient];
					}
					var parts = gradient.match(/^(\b|\B-[a-z]{1,10}-)((?:repeating-)?(?:linear|radial)-gradient)/);
					// "", "-moz-", etc.
					var prefix = parts && parts[1];
					// "linear-gradient", "radial-gradient", etc.
					var func = parts && parts[2];

					var values = gradient.replace(/^(?:\b|\B-[a-z]{1,10}-)(?:repeating-)?(?:linear|radial)-gradient\(|\)$/g, '').split(/\s*,\s*/);

					if (func.indexOf('linear') >= 0) {
						return cache[gradient] = convertToW3CLinearGradient(prefix, func, values);
					} else if (func.indexOf('radial') >= 0) {
						return cache[gradient] = convertToW3CRadialGradient(prefix, func, values);
					}
					return cache[gradient] = func + '(' + values.join(',') + ')';
				};

				return function () {
					new Prism.plugins.Previewer('gradient', function (value) {
						this.firstChild.style.backgroundImage = '';
						this.firstChild.style.backgroundImage = convertToW3CGradient(value);
						return !!this.firstChild.style.backgroundImage;
					}, '*', function () {
						this._elt.innerHTML = '<div></div>';
					});
				};
			}()),
			tokens: {
				'gradient': {
					pattern: /(?:\b|\B-[a-z]{1,10}-)(?:repeating-)?(?:linear|radial)-gradient\((?:(?:hsl|rgb)a?\(.+?\)|[^\)])+\)/gi,
					inside: {
						'function': /[\w-]+(?=\()/,
						'punctuation': /[(),]/
					}
				}
			},
			languages: {
				'css': true,
				'less': true,
				'sass': [
					{
						lang: 'sass',
						before: 'punctuation',
						inside: 'inside',
						root: Prism.languages.sass && Prism.languages.sass['variable-line']
					},
					{
						lang: 'sass',
						before: 'punctuation',
						inside: 'inside',
						root: Prism.languages.sass && Prism.languages.sass['property-line']
					}
				],
				'scss': true,
				'stylus': [
					{
						lang: 'stylus',
						before: 'func',
						inside: 'rest',
						root: Prism.languages.stylus && Prism.languages.stylus['property-declaration'].inside
					},
					{
						lang: 'stylus',
						before: 'func',
						inside: 'rest',
						root: Prism.languages.stylus && Prism.languages.stylus['variable-declaration'].inside
					}
				]
			}
		},
		'angle': {
			create: function () {
				new Prism.plugins.Previewer('angle', function (value) {
					var num = parseFloat(value);
					var unit = value.match(/[a-z]+$/i);
					var max; var percentage;
					if (!num || !unit) {
						return false;
					}
					unit = unit[0];

					switch (unit) {
						case 'deg':
							max = 360;
							break;
						case 'grad':
							max = 400;
							break;
						case 'rad':
							max = 2 * Math.PI;
							break;
						case 'turn':
							max = 1;
					}

					percentage = 100 * num / max;
					percentage %= 100;

					this[(num < 0 ? 'set' : 'remove') + 'Attribute']('data-negative', '');
					this.querySelector('circle').style.strokeDasharray = Math.abs(percentage) + ',500';
					return true;
				}, '*', function () {
					this._elt.innerHTML = '<svg viewBox="0 0 64 64">' +
						'<circle r="16" cy="32" cx="32"></circle>' +
						'</svg>';
				});
			},
			tokens: {
				'angle': /(?:\b|\B-|(?=\B\.))(?:\d+(?:\.\d+)?|\.\d+)(?:deg|g?rad|turn)\b/i
			},
			languages: {
				'css': true,
				'less': true,
				'markup': {
					lang: 'markup',
					before: 'punctuation',
					inside: 'inside',
					root: Prism.languages.markup && Prism.languages.markup.tag.inside['attr-value']
				},
				'sass': [
					{
						lang: 'sass',
						inside: 'inside',
						root: Prism.languages.sass && Prism.languages.sass['property-line']
					},
					{
						lang: 'sass',
						before: 'operator',
						inside: 'inside',
						root: Prism.languages.sass && Prism.languages.sass['variable-line']
					}
				],
				'scss': true,
				'stylus': [
					{
						lang: 'stylus',
						before: 'func',
						inside: 'rest',
						root: Prism.languages.stylus && Prism.languages.stylus['property-declaration'].inside
					},
					{
						lang: 'stylus',
						before: 'func',
						inside: 'rest',
						root: Prism.languages.stylus && Prism.languages.stylus['variable-declaration'].inside
					}
				]
			}
		},
		'color': {
			create: function () {
				new Prism.plugins.Previewer('color', function (value) {
					this.style.backgroundColor = '';
					this.style.backgroundColor = value;
					return !!this.style.backgroundColor;
				});
			},
			tokens: {
				'color': [Prism.languages.css.hexcode].concat(Prism.languages.css.color)
			},
			languages: {
				// CSS extras is required, so css and scss are not necessary
				'css': false,
				'less': true,
				'markup': {
					lang: 'markup',
					before: 'punctuation',
					inside: 'inside',
					root: Prism.languages.markup && Prism.languages.markup.tag.inside['attr-value']
				},
				'sass': [
					{
						lang: 'sass',
						before: 'punctuation',
						inside: 'inside',
						root: Prism.languages.sass && Prism.languages.sass['variable-line']
					},
					{
						lang: 'sass',
						inside: 'inside',
						root: Prism.languages.sass && Prism.languages.sass['property-line']
					}
				],
				'scss': false,
				'stylus': [
					{
						lang: 'stylus',
						before: 'hexcode',
						inside: 'rest',
						root: Prism.languages.stylus && Prism.languages.stylus['property-declaration'].inside
					},
					{
						lang: 'stylus',
						before: 'hexcode',
						inside: 'rest',
						root: Prism.languages.stylus && Prism.languages.stylus['variable-declaration'].inside
					}
				]
			}
		},
		'easing': {
			create: function () {
				new Prism.plugins.Previewer('easing', function (value) {

					value = {
						'linear': '0,0,1,1',
						'ease': '.25,.1,.25,1',
						'ease-in': '.42,0,1,1',
						'ease-out': '0,0,.58,1',
						'ease-in-out': '.42,0,.58,1'
					}[value] || value;

					var p = value.match(/-?(?:\d+(?:\.\d+)?|\.\d+)/g);

					if (p.length === 4) {
						p = p.map(function (p, i) { return (i % 2 ? 1 - p : p) * 100; });

						this.querySelector('path').setAttribute('d', 'M0,100 C' + p[0] + ',' + p[1] + ', ' + p[2] + ',' + p[3] + ', 100,0');

						var lines = this.querySelectorAll('line');
						lines[0].setAttribute('x2', p[0]);
						lines[0].setAttribute('y2', p[1]);
						lines[1].setAttribute('x2', p[2]);
						lines[1].setAttribute('y2', p[3]);

						return true;
					}

					return false;
				}, '*', function () {
					this._elt.innerHTML = '<svg viewBox="-20 -20 140 140" width="100" height="100">' +
						'<defs>' +
						'<marker id="prism-previewer-easing-marker" viewBox="0 0 4 4" refX="2" refY="2" markerUnits="strokeWidth">' +
						'<circle cx="2" cy="2" r="1.5" />' +
						'</marker>' +
						'</defs>' +
						'<path d="M0,100 C20,50, 40,30, 100,0" />' +
						'<line x1="0" y1="100" x2="20" y2="50" marker-start="url(#prism-previewer-easing-marker)" marker-end="url(#prism-previewer-easing-marker)" />' +
						'<line x1="100" y1="0" x2="40" y2="30" marker-start="url(#prism-previewer-easing-marker)" marker-end="url(#prism-previewer-easing-marker)" />' +
						'</svg>';
				});
			},
			tokens: {
				'easing': {
					pattern: /\bcubic-bezier\((?:-?(?:\d+(?:\.\d+)?|\.\d+),\s*){3}-?(?:\d+(?:\.\d+)?|\.\d+)\)\B|\b(?:ease(?:-in)?(?:-out)?|linear)(?=\s|[;}]|$)/i,
					inside: {
						'function': /[\w-]+(?=\()/,
						'punctuation': /[(),]/
					}
				}
			},
			languages: {
				'css': true,
				'less': true,
				'sass': [
					{
						lang: 'sass',
						inside: 'inside',
						before: 'punctuation',
						root: Prism.languages.sass && Prism.languages.sass['variable-line']
					},
					{
						lang: 'sass',
						inside: 'inside',
						root: Prism.languages.sass && Prism.languages.sass['property-line']
					}
				],
				'scss': true,
				'stylus': [
					{
						lang: 'stylus',
						before: 'hexcode',
						inside: 'rest',
						root: Prism.languages.stylus && Prism.languages.stylus['property-declaration'].inside
					},
					{
						lang: 'stylus',
						before: 'hexcode',
						inside: 'rest',
						root: Prism.languages.stylus && Prism.languages.stylus['variable-declaration'].inside
					}
				]
			}
		},

		'time': {
			create: function () {
				new Prism.plugins.Previewer('time', function (value) {
					var num = parseFloat(value);
					var unit = value.match(/[a-z]+$/i);
					if (!num || !unit) {
						return false;
					}
					unit = unit[0];
					this.querySelector('circle').style.animationDuration = 2 * num + unit;
					return true;
				}, '*', function () {
					this._elt.innerHTML = '<svg viewBox="0 0 64 64">' +
						'<circle r="16" cy="32" cx="32"></circle>' +
						'</svg>';
				});
			},
			tokens: {
				'time': /(?:\b|\B-|(?=\B\.))(?:\d+(?:\.\d+)?|\.\d+)m?s\b/i
			},
			languages: {
				'css': true,
				'less': true,
				'markup': {
					lang: 'markup',
					before: 'punctuation',
					inside: 'inside',
					root: Prism.languages.markup && Prism.languages.markup.tag.inside['attr-value']
				},
				'sass': [
					{
						lang: 'sass',
						inside: 'inside',
						root: Prism.languages.sass && Prism.languages.sass['property-line']
					},
					{
						lang: 'sass',
						before: 'operator',
						inside: 'inside',
						root: Prism.languages.sass && Prism.languages.sass['variable-line']
					}
				],
				'scss': true,
				'stylus': [
					{
						lang: 'stylus',
						before: 'hexcode',
						inside: 'rest',
						root: Prism.languages.stylus && Prism.languages.stylus['property-declaration'].inside
					},
					{
						lang: 'stylus',
						before: 'hexcode',
						inside: 'rest',
						root: Prism.languages.stylus && Prism.languages.stylus['variable-declaration'].inside
					}
				]
			}
		}
	};

	/**
	 * Returns the absolute X, Y offsets for an element
	 *
	 * @param {HTMLElement} element
	 * @returns {{top: number, right: number, bottom: number, left: number, width: number, height: number}}
	 */
	var getOffset = function (element) {
		var elementBounds = element.getBoundingClientRect();
		var left = elementBounds.left;
		var top = elementBounds.top;
		var documentBounds = document.documentElement.getBoundingClientRect();
		left -= documentBounds.left;
		top -= documentBounds.top;

		return {
			top: top,
			right: innerWidth - left - elementBounds.width,
			bottom: innerHeight - top - elementBounds.height,
			left: left,
			width: elementBounds.width,
			height: elementBounds.height
		};
	};

	var TOKEN_CLASS = 'token';
	var ACTIVE_CLASS = 'active';
	var FLIPPED_CLASS = 'flipped';

	/**
	 * Previewer constructor
	 *
	 * @param {string} type Unique previewer type
	 * @param {Function} updater Function that will be called on mouseover.
	 * @param {string[]|string} [supportedLanguages] Aliases of the languages this previewer must be enabled for. Defaults to "*", all languages.
	 * @param {Function} [initializer] Function that will be called on initialization.
	 * @class
	 */
	var Previewer = function (type, updater, supportedLanguages, initializer) {
		this._elt = null;
		this._type = type;
		this._token = null;
		this.updater = updater;
		this._mouseout = this.mouseout.bind(this);
		this.initializer = initializer;

		var self = this;

		if (!supportedLanguages) {
			supportedLanguages = ['*'];
		}
		if (!Array.isArray(supportedLanguages)) {
			supportedLanguages = [supportedLanguages];
		}
		supportedLanguages.forEach(function (lang) {
			if (typeof lang !== 'string') {
				lang = lang.lang;
			}
			if (!Previewer.byLanguages[lang]) {
				Previewer.byLanguages[lang] = [];
			}
			if (Previewer.byLanguages[lang].indexOf(self) < 0) {
				Previewer.byLanguages[lang].push(self);
			}
		});
		Previewer.byType[type] = this;
	};

	/**
	 * Creates the HTML element for the previewer.
	 */
	Previewer.prototype.init = function () {
		if (this._elt) {
			return;
		}
		this._elt = document.createElement('div');
		this._elt.className = 'prism-previewer prism-previewer-' + this._type;
		document.body.appendChild(this._elt);
		if (this.initializer) {
			this.initializer();
		}
	};

	/**
	 * @param {Element} token
	 * @returns {boolean}
	 */
	Previewer.prototype.isDisabled = function (token) {
		do {
			if (token.hasAttribute && token.hasAttribute('data-previewers')) {
				var previewers = token.getAttribute('data-previewers');
				return (previewers || '').split(/\s+/).indexOf(this._type) === -1;
			}
		} while ((token = token.parentNode));
		return false;
	};

	/**
	 * Checks the class name of each hovered element
	 *
	 * @param {Element} token
	 */
	Previewer.prototype.check = function (token) {
		if (token.classList.contains(TOKEN_CLASS) && this.isDisabled(token)) {
			return;
		}
		do {
			if (token.classList && token.classList.contains(TOKEN_CLASS) && token.classList.contains(this._type)) {
				break;
			}
		} while ((token = token.parentNode));

		if (token && token !== this._token) {
			this._token = token;
			this.show();
		}
	};

	/**
	 * Called on mouseout
	 */
	Previewer.prototype.mouseout = function () {
		this._token.removeEventListener('mouseout', this._mouseout, false);
		this._token = null;
		this.hide();
	};

	/**
	 * Shows the previewer positioned properly for the current token.
	 */
	Previewer.prototype.show = function () {
		if (!this._elt) {
			this.init();
		}
		if (!this._token) {
			return;
		}

		if (this.updater.call(this._elt, this._token.textContent)) {
			this._token.addEventListener('mouseout', this._mouseout, false);

			var offset = getOffset(this._token);
			this._elt.classList.add(ACTIVE_CLASS);

			if (offset.top - this._elt.offsetHeight > 0) {
				this._elt.classList.remove(FLIPPED_CLASS);
				this._elt.style.top = offset.top + 'px';
				this._elt.style.bottom = '';
			} else {
				this._elt.classList.add(FLIPPED_CLASS);
				this._elt.style.bottom = offset.bottom + 'px';
				this._elt.style.top = '';
			}

			this._elt.style.left = offset.left + Math.min(200, offset.width / 2) + 'px';
		} else {
			this.hide();
		}
	};

	/**
	 * Hides the previewer.
	 */
	Previewer.prototype.hide = function () {
		this._elt.classList.remove(ACTIVE_CLASS);
	};

	/**
	 * Map of all registered previewers by language
	 *
	 * @type {{}}
	 */
	Previewer.byLanguages = {};

	/**
	 * Map of all registered previewers by type
	 *
	 * @type {{}}
	 */
	Previewer.byType = {};

	/**
	 * Initializes the mouseover event on the code block.
	 *
	 * @param {HTMLElement} elt The code block (env.element)
	 * @param {string} lang The language (env.language)
	 */
	Previewer.initEvents = function (elt, lang) {
		var previewers = [];
		if (Previewer.byLanguages[lang]) {
			previewers = previewers.concat(Previewer.byLanguages[lang]);
		}
		if (Previewer.byLanguages['*']) {
			previewers = previewers.concat(Previewer.byLanguages['*']);
		}
		elt.addEventListener('mouseover', function (e) {
			var target = e.target;
			previewers.forEach(function (previewer) {
				previewer.check(target);
			});
		}, false);
	};
	Prism.plugins.Previewer = Previewer;

	Prism.hooks.add('before-highlight', function (env) {
		for (var previewer in previewers) {
			var languages = previewers[previewer].languages;
			if (env.language && languages[env.language] && !languages[env.language].initialized) {
				var lang = languages[env.language];
				if (!Array.isArray(lang)) {
					lang = [lang];
				}
				lang.forEach(function (lang) {
					var before, inside, root, skip;
					if (lang === true) {
						before = 'important';
						inside = env.language;
						lang = env.language;
					} else {
						before = lang.before || 'important';
						inside = lang.inside || lang.lang;
						root = lang.root || Prism.languages;
						skip = lang.skip;
						lang = env.language;
					}

					if (!skip && Prism.languages[lang]) {
						Prism.languages.insertBefore(inside, before, previewers[previewer].tokens, root);
						env.grammar = Prism.languages[lang];

						languages[env.language] = { initialized: true };
					}
				});
			}
		}
	});

	// Initialize the previewers only when needed
	Prism.hooks.add('after-highlight', function (env) {
		if (Previewer.byLanguages['*'] || Previewer.byLanguages[env.language]) {
			Previewer.initEvents(env.element, env.language);
		}
	});

	for (var previewer in previewers) {
		previewers[previewer].create();
	}

}());

(function () {

	if (typeof Prism === 'undefined' || typeof document === 'undefined' || !document.createRange) {
		return;
	}

	Prism.plugins.KeepMarkup = true;

	Prism.hooks.add('before-highlight', function (env) {
		if (!env.element.children.length) {
			return;
		}

		if (!Prism.util.isActive(env.element, 'keep-markup', true)) {
			return;
		}

		var dropTokens = Prism.util.isActive(env.element, 'drop-tokens', false);
		/**
		 * Returns whether the given element should be kept.
		 *
		 * @param {HTMLElement} element
		 * @returns {boolean}
		 */
		function shouldKeep(element) {
			if (dropTokens && element.nodeName.toLowerCase() === 'span' && element.classList.contains('token')) {
				return false;
			}
			return true;
		}

		var pos = 0;
		var data = [];
		function processElement(element) {
			if (!shouldKeep(element)) {
				// don't keep this element and just process its children
				processChildren(element);
				return;
			}

			var o = {
				// Clone the original tag to keep all attributes
				clone: element.cloneNode(false),
				posOpen: pos
			};
			data.push(o);

			processChildren(element);

			o.posClose = pos;
		}
		function processChildren(element) {
			for (var i = 0, l = element.childNodes.length; i < l; i++) {
				var child = element.childNodes[i];
				if (child.nodeType === 1) { // element
					processElement(child);
				} else if (child.nodeType === 3) { // text
					pos += child.data.length;
				}
			}
		}
		processChildren(env.element);

		if (data.length) {
			// data is an array of all existing tags
			env.keepMarkup = data;
		}
	});

	Prism.hooks.add('after-highlight', function (env) {
		if (env.keepMarkup && env.keepMarkup.length) {

			var walk = function (elt, nodeState) {
				for (var i = 0, l = elt.childNodes.length; i < l; i++) {

					var child = elt.childNodes[i];

					if (child.nodeType === 1) { // element
						if (!walk(child, nodeState)) {
							return false;
						}

					} else if (child.nodeType === 3) { // text
						if (!nodeState.nodeStart && nodeState.pos + child.data.length > nodeState.node.posOpen) {
							// We found the start position
							nodeState.nodeStart = child;
							nodeState.nodeStartPos = nodeState.node.posOpen - nodeState.pos;
						}
						if (nodeState.nodeStart && nodeState.pos + child.data.length >= nodeState.node.posClose) {
							// We found the end position
							nodeState.nodeEnd = child;
							nodeState.nodeEndPos = nodeState.node.posClose - nodeState.pos;
						}

						nodeState.pos += child.data.length;
					}

					if (nodeState.nodeStart && nodeState.nodeEnd) {
						// Select the range and wrap it with the clone
						var range = document.createRange();
						range.setStart(nodeState.nodeStart, nodeState.nodeStartPos);
						range.setEnd(nodeState.nodeEnd, nodeState.nodeEndPos);
						nodeState.node.clone.appendChild(range.extractContents());
						range.insertNode(nodeState.node.clone);
						range.detach();

						// Process is over
						return false;
					}
				}
				return true;
			};

			// For each tag, we walk the DOM to reinsert it
			env.keepMarkup.forEach(function (node) {
				walk(env.element, {
					node: node,
					pos: 0
				});
			});
			// Store new highlightedCode for later hooks calls
			env.highlightedCode = env.element.innerHTML;
		}
	});
}());

(function () {

	if (typeof Prism === 'undefined' || typeof document === 'undefined') {
		return;
	}

	if (!Prism.plugins.toolbar) {
		console.warn('Copy to Clipboard plugin loaded before Toolbar plugin.');

		return;
	}

	/**
	 * When the given elements is clicked by the user, the given text will be copied to clipboard.
	 *
	 * @param {HTMLElement} element
	 * @param {CopyInfo} copyInfo
	 *
	 * @typedef CopyInfo
	 * @property {() => string} getText
	 * @property {() => void} success
	 * @property {(reason: unknown) => void} error
	 */
	function registerClipboard(element, copyInfo) {
		element.addEventListener('click', function () {
			copyTextToClipboard(copyInfo);
		});
	}

	// https://stackoverflow.com/a/30810322/7595472

	/** @param {CopyInfo} copyInfo */
	function fallbackCopyTextToClipboard(copyInfo) {
		var textArea = document.createElement('textarea');
		textArea.value = copyInfo.getText();

		// Avoid scrolling to bottom
		textArea.style.top = '0';
		textArea.style.left = '0';
		textArea.style.position = 'fixed';

		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();

		try {
			var successful = document.execCommand('copy');
			setTimeout(function () {
				if (successful) {
					copyInfo.success();
				} else {
					copyInfo.error();
				}
			}, 1);
		} catch (err) {
			setTimeout(function () {
				copyInfo.error(err);
			}, 1);
		}

		document.body.removeChild(textArea);
	}
	/** @param {CopyInfo} copyInfo */
	function copyTextToClipboard(copyInfo) {
		if (navigator.clipboard) {
			navigator.clipboard.writeText(copyInfo.getText()).then(copyInfo.success, function () {
				// try the fallback in case `writeText` didn't work
				fallbackCopyTextToClipboard(copyInfo);
			});
		} else {
			fallbackCopyTextToClipboard(copyInfo);
		}
	}

	/**
	 * Selects the text content of the given element.
	 *
	 * @param {Element} element
	 */
	function selectElementText(element) {
		// https://stackoverflow.com/a/20079910/7595472
		window.getSelection().selectAllChildren(element);
	}

	/**
	 * Traverses up the DOM tree to find data attributes that override the default plugin settings.
	 *
	 * @param {Element} startElement An element to start from.
	 * @returns {Settings} The plugin settings.
	 * @typedef {Record<"copy" | "copy-error" | "copy-success" | "copy-timeout", string | number>} Settings
	 */
	function getSettings(startElement) {
		/** @type {Settings} */
		var settings = {
			'copy': 'Copy',
			'copy-error': 'Press Ctrl+C to copy',
			'copy-success': 'Copied!',
			'copy-timeout': 5000
		};

		var prefix = 'data-prismjs-';
		for (var key in settings) {
			var attr = prefix + key;
			var element = startElement;
			while (element && !element.hasAttribute(attr)) {
				element = element.parentElement;
			}
			if (element) {
				settings[key] = element.getAttribute(attr);
			}
		}
		return settings;
	}

	Prism.plugins.toolbar.registerButton('copy-to-clipboard', function (env) {
		var element = env.element;

		var settings = getSettings(element);

		var linkCopy = document.createElement('button');
		linkCopy.className = 'copy-to-clipboard-button';
		linkCopy.setAttribute('type', 'button');
		var linkSpan = document.createElement('span');
		linkCopy.appendChild(linkSpan);

		setState('copy');

		registerClipboard(linkCopy, {
			getText: function () {
				return element.textContent;
			},
			success: function () {
				setState('copy-success');

				resetText();
			},
			error: function () {
				setState('copy-error');

				setTimeout(function () {
					selectElementText(element);
				}, 1);

				resetText();
			}
		});

		return linkCopy;

		function resetText() {
			setTimeout(function () { setState('copy'); }, settings['copy-timeout']);
		}

		/** @param {"copy" | "copy-error" | "copy-success"} state */
		function setState(state) {
			linkSpan.textContent = settings[state];
			linkCopy.setAttribute('data-copy-state', state);
		}
	});
}());

(function () {

	if (typeof Prism === 'undefined' || typeof document === 'undefined' || !document.querySelector) {
		return;
	}

	Prism.plugins.toolbar.registerButton('download-file', function (env) {
		var pre = env.element.parentNode;
		if (!pre || !/pre/i.test(pre.nodeName) || !pre.hasAttribute('data-src') || !pre.hasAttribute('data-download-link')) {
			return;
		}
		var src = pre.getAttribute('data-src');
		var a = document.createElement('a');
		a.textContent = pre.getAttribute('data-download-link-label') || 'Download';
		a.setAttribute('download', '');
		a.href = src;
		return a;
	});

}());

(function () {

	if (typeof Prism === 'undefined' || typeof document === 'undefined') {
		return;
	}

	function mapClassName(name) {
		var customClass = Prism.plugins.customClass;
		if (customClass) {
			return customClass.apply(name, 'none');
		} else {
			return name;
		}
	}

	var PARTNER = {
		'(': ')',
		'[': ']',
		'{': '}',
	};

	// The names for brace types.
	// These names have two purposes: 1) they can be used for styling and 2) they are used to pair braces. Only braces
	// of the same type are paired.
	var NAMES = {
		'(': 'brace-round',
		'[': 'brace-square',
		'{': 'brace-curly',
	};

	// A map for brace aliases.
	// This is useful for when some braces have a prefix/suffix as part of the punctuation token.
	var BRACE_ALIAS_MAP = {
		'${': '{', // JS template punctuation (e.g. `foo ${bar + 1}`)
	};

	var LEVEL_WARP = 12;

	var pairIdCounter = 0;

	var BRACE_ID_PATTERN = /^(pair-\d+-)(close|open)$/;

	/**
	 * Returns the brace partner given one brace of a brace pair.
	 *
	 * @param {HTMLElement} brace
	 * @returns {HTMLElement}
	 */
	function getPartnerBrace(brace) {
		var match = BRACE_ID_PATTERN.exec(brace.id);
		return document.querySelector('#' + match[1] + (match[2] == 'open' ? 'close' : 'open'));
	}

	/**
	 * @this {HTMLElement}
	 */
	function hoverBrace() {
		if (!Prism.util.isActive(this, 'brace-hover', true)) {
			return;
		}

		[this, getPartnerBrace(this)].forEach(function (e) {
			e.classList.add(mapClassName('brace-hover'));
		});
	}
	/**
	 * @this {HTMLElement}
	 */
	function leaveBrace() {
		[this, getPartnerBrace(this)].forEach(function (e) {
			e.classList.remove(mapClassName('brace-hover'));
		});
	}
	/**
	 * @this {HTMLElement}
	 */
	function clickBrace() {
		if (!Prism.util.isActive(this, 'brace-select', true)) {
			return;
		}

		[this, getPartnerBrace(this)].forEach(function (e) {
			e.classList.add(mapClassName('brace-selected'));
		});
	}

	Prism.hooks.add('complete', function (env) {

		/** @type {HTMLElement} */
		var code = env.element;
		var pre = code.parentElement;

		if (!pre || pre.tagName != 'PRE') {
			return;
		}

		// find the braces to match
		/** @type {string[]} */
		var toMatch = [];
		if (Prism.util.isActive(code, 'match-braces')) {
			toMatch.push('(', '[', '{');
		}

		if (toMatch.length == 0) {
			// nothing to match
			return;
		}

		if (!pre.__listenerAdded) {
			// code blocks might be highlighted more than once
			pre.addEventListener('mousedown', function removeBraceSelected() {
				// the code element might have been replaced
				var code = pre.querySelector('code');
				var className = mapClassName('brace-selected');
				Array.prototype.slice.call(code.querySelectorAll('.' + className)).forEach(function (e) {
					e.classList.remove(className);
				});
			});
			Object.defineProperty(pre, '__listenerAdded', { value: true });
		}

		/** @type {HTMLSpanElement[]} */
		var punctuation = Array.prototype.slice.call(
			code.querySelectorAll('span.' + mapClassName('token') + '.' + mapClassName('punctuation'))
		);

		/** @type {{ index: number, open: boolean, element: HTMLElement }[]} */
		var allBraces = [];

		toMatch.forEach(function (open) {
			var close = PARTNER[open];
			var name = mapClassName(NAMES[open]);

			/** @type {[number, number][]} */
			var pairs = [];
			/** @type {number[]} */
			var openStack = [];

			for (var i = 0; i < punctuation.length; i++) {
				var element = punctuation[i];
				if (element.childElementCount == 0) {
					var text = element.textContent;
					text = BRACE_ALIAS_MAP[text] || text;
					if (text === open) {
						allBraces.push({ index: i, open: true, element: element });
						element.classList.add(name);
						element.classList.add(mapClassName('brace-open'));
						openStack.push(i);
					} else if (text === close) {
						allBraces.push({ index: i, open: false, element: element });
						element.classList.add(name);
						element.classList.add(mapClassName('brace-close'));
						if (openStack.length) {
							pairs.push([i, openStack.pop()]);
						}
					}
				}
			}

			pairs.forEach(function (pair) {
				var pairId = 'pair-' + (pairIdCounter++) + '-';

				var opening = punctuation[pair[0]];
				var closing = punctuation[pair[1]];

				opening.id = pairId + 'open';
				closing.id = pairId + 'close';

				[opening, closing].forEach(function (e) {
					e.addEventListener('mouseenter', hoverBrace);
					e.addEventListener('mouseleave', leaveBrace);
					e.addEventListener('click', clickBrace);
				});
			});
		});

		var level = 0;
		allBraces.sort(function (a, b) { return a.index - b.index; });
		allBraces.forEach(function (brace) {
			if (brace.open) {
				brace.element.classList.add(mapClassName('brace-level-' + (level % LEVEL_WARP + 1)));
				level++;
			} else {
				level = Math.max(0, level - 1);
				brace.element.classList.add(mapClassName('brace-level-' + (level % LEVEL_WARP + 1)));
			}
		});
	});

}());

