(function() {
	function make_js_runner(env) {
		return new Function(env.element.textContent); // dangerous, but i guess it's okay if code doesn't change
	}
	var run_transform_hooks = {
		'javascript': make_js_runner,
		'js': make_js_runner,
	};
	Prism.plugins.toolbar.registerButton('run-code', function (env) {
		var pre = env.element.parentNode;
		var lang = Prism.util.getLanguage(pre);
		if (!pre || !/pre/i.test(pre.nodeName) || !run_transform_hooks[lang]) {
			return;
		}
		var callback = window[pre.getAttribute('data-callback')] || run_transform_hooks[lang](env);
		var btn = document.createElement('button');
		btn.addEventListener('click', callback);
		btn.textContent = 'Run this code';
		return btn;
	});
	Prism.plugins.run_code = {
		addTransformer: function (lang, fun) {
			if (run_transform_hooks[lang]) {
				console.warn('A transformer for language ', lang, ' is already defined.');
				return;
			}
			run_transform_hooks[lang] = fun;
		},
	};
})();
