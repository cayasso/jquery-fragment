/**
 * jQuery fragment plugin
 *
 * Copyright (c) 2010-2012 Jonathan Brumley <cayasso@gmail.com>
 * Dual licensed under the MIT and GPL licenses.
 * version 0.0.2
 * @dependencies [jQuery hashchange event - v1.3]
 */
(function ($, w) {

    // Constructor
    var Fragment = {
                
        partials: {},

        isMatched: false,

        paths: {},
        
        /**
         * This function is executed on hash change and
         * if the path matches a route pattern.
         *
         * @param  {String}   path
         * @param  {Function} fn
         * @return {Object}
         */
        on: function (path, fn) {
            
            var self = this, paths, len = 0;

            if ($.isPlainObject(path)) {
                paths = path;
            }
            if (!self.paths[path]) {
                $(w).bind('hashchange', function () {
                    if (paths) {
                        $.each.call(self, paths, self.check(self));
                    } else {
                        self.check(self)(path, self.paths[path]);
                    }
                });
            }
            self.load = function (target, url, fn) {
                self.partials[path] = { target: target, url: url, fn: fn };
                self.load = null;
            };
            self.paths[path] = fn;
            return { on: self.on, hash: self.hash, partial: self.partial, load: self.load };
        },

        /**
         * Check if a route is valid and
         * execute callback function.
         *
         * @param  {String}   path
         * @param  {Function} fn
         * @return {Boolean}
         */
        check: function (that) {
            return function check (path, fn) {
                var partial = that.partials[path];
                isValid = that.run(path, that.hash(), fn);
				if (isValid && $.isPlainObject(partial) && that.isMatched) {
					var options = partial;
					that.partial(options.target, options.url, options.fn);
					that.isMatched = false;
				}
				return !isValid;
            };
        },

        /**
         * Check path and execute function if hahs
         * fragment was matched.
         *
         * @param  {String}   path
         * @param  {String}   hash
         * @param  {Function} fn Callback function
         * @return {Object|False}
         */
        run: function (path, hash, fn) {
            if ((params = this.match(path, hash))) {
                this.isMatched = true;
                fn.call(this, params.obj, params);
                return true;
            }
            return false;
        },
        
        /**
         * Create regular expression to match a
         * given path.
         *
         * @param  {String} path
         * @param  {Array} keys
         * @param  {Boolean} strict
         * @return {RegExp}
         */
        regex: function (path, keys, strict) {
            path = path
            .concat(strict ? '' : '/?')
            .replace(/\/\(/g, '(?:/')
            .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function(_, slash, format, key, capture, optional){
                keys.push({ name: key, optional: !! optional });
                slash = slash || '';
                return ''
                + (optional ? '' : slash) + '(?:'
                + (optional ? slash : '')
                + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')'
                + (optional || '');
            })
            .replace(/([\/.])/g, '\\$1')
            .replace(/\*/g, '(.*)');
            return new RegExp('^' + path + '$');
		},

        /**
         * Match fragments.
         *
         * @param  {String} path
         * @param  {String} str
         * @return {Array}
         */
        match: function(path, str){
            var names = [], values = this.regex(path, names).exec(str);
            return (values) ? this.params(names, values) : null;
        },

        /**
         * Create and return a params object.
         *
         * @param  {Array} names
         * @param  {Array} values
         * @return {Object}
         */
        params: function (names, values) {
            // The result object
            var obj = { path: values[0], names: names, values: values, obj: {} };
            for (var i = 1, len = values.length; i < len; i++) {
                obj.obj[names[i-1].name] = values[i];
            }
            return obj;
        },

        /**
         * Get the url hash.
         *
         * @return {String}
         */
        hash: function () {
            return location.hash.replace( /^[^#]*#?(.*)$/, '$1' );
        },

        /**
         * Load a partial.
         *
         * @param  {String}   target
         * @param  {String}   url
         * @param  {Function} fn
         * @return {Function|False}
         */
        partial: $.partial
    };

    // Expose as plugin to jQuery
    $.fragment = function (path, fn) {
		return Fragment.on(path, fn);
	};

})(jQuery, window);
