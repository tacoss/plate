(function () {
	function noop() {}

	function assign(tar, src) {
		for (const k in src) tar[k] = src[k];
		return tar;
	}

	function run(fn) {
		return fn();
	}

	function blank_object() {
		return Object.create(null);
	}

	function run_all(fns) {
		fns.forEach(run);
	}

	function is_function(thing) {
		return typeof thing === 'function';
	}

	function safe_not_equal(a, b) {
		return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
	}

	function subscribe(component, store, callback) {
		const unsub = store.subscribe(callback);

		component.$$.on_destroy.push(unsub.unsubscribe
			? () => unsub.unsubscribe()
			: unsub);
	}

	function create_slot(definition, ctx, fn) {
		if (definition) {
			const slot_ctx = get_slot_context(definition, ctx, fn);
			return definition[0](slot_ctx);
		}
	}

	function get_slot_context(definition, ctx, fn) {
		return definition[1]
			? assign({}, assign(ctx.$$scope.ctx, definition[1](fn ? fn(ctx) : {})))
			: ctx.$$scope.ctx;
	}

	function get_slot_changes(definition, ctx, changed, fn) {
		return definition[1]
			? assign({}, assign(ctx.$$scope.changed || {}, definition[1](fn ? fn(changed) : {})))
			: ctx.$$scope.changed || {};
	}

	function exclude_internal_props(props) {
		const result = {};
		for (const k in props) if (k[0] !== '$') result[k] = props[k];
		return result;
	}

	function append(target, node) {
		target.appendChild(node);
	}

	function insert(target, node, anchor) {
		target.insertBefore(node, anchor || null);
	}

	function detach(node) {
		node.parentNode.removeChild(node);
	}

	function element(name) {
		return document.createElement(name);
	}

	function text(data) {
		return document.createTextNode(data);
	}

	function space() {
		return text(' ');
	}

	function empty() {
		return text('');
	}

	function listen(node, event, handler, options) {
		node.addEventListener(event, handler, options);
		return () => node.removeEventListener(event, handler, options);
	}

	function prevent_default(fn) {
		return function(event) {
			event.preventDefault();
			return fn.call(this, event);
		};
	}

	function children(element) {
		return Array.from(element.childNodes);
	}

	function set_data(text, data) {
		data = '' + data;
		if (text.data !== data) text.data = data;
	}

	function custom_event(type, detail) {
		const e = document.createEvent('CustomEvent');
		e.initCustomEvent(type, false, false, detail);
		return e;
	}

	let current_component;

	function set_current_component(component) {
		current_component = component;
	}

	function get_current_component() {
		if (!current_component) throw new Error(`Function called outside component initialization`);
		return current_component;
	}

	function onMount(fn) {
		get_current_component().$$.on_mount.push(fn);
	}

	function onDestroy(fn) {
		get_current_component().$$.on_destroy.push(fn);
	}

	function createEventDispatcher() {
		const component = current_component;

		return (type, detail) => {
			const callbacks = component.$$.callbacks[type];

			if (callbacks) {
				// TODO are there situations where events could be dispatched
				// in a server (non-DOM) environment?
				const event = custom_event(type, detail);
				callbacks.slice().forEach(fn => {
					fn.call(component, event);
				});
			}
		};
	}

	function setContext(key, context) {
		get_current_component().$$.context.set(key, context);
	}

	function getContext(key) {
		return get_current_component().$$.context.get(key);
	}

	const dirty_components = [];

	const resolved_promise = Promise.resolve();
	let update_scheduled = false;
	const binding_callbacks = [];
	const render_callbacks = [];
	const flush_callbacks = [];

	function schedule_update() {
		if (!update_scheduled) {
			update_scheduled = true;
			resolved_promise.then(flush);
		}
	}

	function add_binding_callback(fn) {
		binding_callbacks.push(fn);
	}

	function add_render_callback(fn) {
		render_callbacks.push(fn);
	}

	function flush() {
		const seen_callbacks = new Set();

		do {
			// first, call beforeUpdate functions
			// and update components
			while (dirty_components.length) {
				const component = dirty_components.shift();
				set_current_component(component);
				update(component.$$);
			}

			while (binding_callbacks.length) binding_callbacks.shift()();

			// then, once components are updated, call
			// afterUpdate functions. This may cause
			// subsequent updates...
			while (render_callbacks.length) {
				const callback = render_callbacks.pop();
				if (!seen_callbacks.has(callback)) {
					callback();

					// ...so guard against infinite loops
					seen_callbacks.add(callback);
				}
			}
		} while (dirty_components.length);

		while (flush_callbacks.length) {
			flush_callbacks.pop()();
		}

		update_scheduled = false;
	}

	function update($$) {
		if ($$.fragment) {
			$$.update($$.dirty);
			run_all($$.before_render);
			$$.fragment.p($$.dirty, $$.ctx);
			$$.dirty = null;

			$$.after_render.forEach(add_render_callback);
		}
	}

	let outros;

	function group_outros() {
		outros = {
			remaining: 0,
			callbacks: []
		};
	}

	function check_outros() {
		if (!outros.remaining) {
			run_all(outros.callbacks);
		}
	}

	function on_outro(callback) {
		outros.callbacks.push(callback);
	}

	function get_spread_update(levels, updates) {
		const update = {};

		const to_null_out = {};
		const accounted_for = { $$scope: 1 };

		let i = levels.length;
		while (i--) {
			const o = levels[i];
			const n = updates[i];

			if (n) {
				for (const key in o) {
					if (!(key in n)) to_null_out[key] = 1;
				}

				for (const key in n) {
					if (!accounted_for[key]) {
						update[key] = n[key];
						accounted_for[key] = 1;
					}
				}

				levels[i] = n;
			} else {
				for (const key in o) {
					accounted_for[key] = 1;
				}
			}
		}

		for (const key in to_null_out) {
			if (!(key in update)) update[key] = undefined;
		}

		return update;
	}

	function mount_component(component, target, anchor) {
		const { fragment, on_mount, on_destroy, after_render } = component.$$;

		fragment.m(target, anchor);

		// onMount happens after the initial afterUpdate. Because
		// afterUpdate callbacks happen in reverse order (inner first)
		// we schedule onMount callbacks before afterUpdate callbacks
		add_render_callback(() => {
			const new_on_destroy = on_mount.map(run).filter(is_function);
			if (on_destroy) {
				on_destroy.push(...new_on_destroy);
			} else {
				// Edge case - component was destroyed immediately,
				// most likely as a result of a binding initialising
				run_all(new_on_destroy);
			}
			component.$$.on_mount = [];
		});

		after_render.forEach(add_render_callback);
	}

	function destroy(component, detaching) {
		if (component.$$) {
			run_all(component.$$.on_destroy);
			component.$$.fragment.d(detaching);

			// TODO null out other refs, including component.$$ (but need to
			// preserve final state?)
			component.$$.on_destroy = component.$$.fragment = null;
			component.$$.ctx = {};
		}
	}

	function make_dirty(component, key) {
		if (!component.$$.dirty) {
			dirty_components.push(component);
			schedule_update();
			component.$$.dirty = blank_object();
		}
		component.$$.dirty[key] = true;
	}

	function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
		const parent_component = current_component;
		set_current_component(component);

		const props = options.props || {};

		const $$ = component.$$ = {
			fragment: null,
			ctx: null,

			// state
			props: prop_names,
			update: noop,
			not_equal: not_equal$$1,
			bound: blank_object(),

			// lifecycle
			on_mount: [],
			on_destroy: [],
			before_render: [],
			after_render: [],
			context: new Map(parent_component ? parent_component.$$.context : []),

			// everything else
			callbacks: blank_object(),
			dirty: null
		};

		let ready = false;

		$$.ctx = instance
			? instance(component, props, (key, value) => {
				if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
					if ($$.bound[key]) $$.bound[key](value);
					if (ready) make_dirty(component, key);
				}
			})
			: props;

		$$.update();
		ready = true;
		run_all($$.before_render);
		$$.fragment = create_fragment($$.ctx);

		if (options.target) {
			if (options.hydrate) {
				$$.fragment.l(children(options.target));
			} else {
				$$.fragment.c();
			}

			if (options.intro && component.$$.fragment.i) component.$$.fragment.i();
			mount_component(component, options.target, options.anchor);
			flush();
		}

		set_current_component(parent_component);
	}

	let SvelteElement;
	if (typeof HTMLElement !== 'undefined') {
		SvelteElement = class extends HTMLElement {
			constructor() {
				super();
				this.attachShadow({ mode: 'open' });
			}

			connectedCallback() {
				for (const key in this.$$.slotted) {
					this.appendChild(this.$$.slotted[key]);
				}
			}

			attributeChangedCallback(attr$$1, oldValue, newValue) {
				this[attr$$1] = newValue;
			}

			$destroy() {
				destroy(this, true);
				this.$destroy = noop;
			}

			$on(type, callback) {
				// TODO should this delegate to addEventListener?
				const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
				callbacks.push(callback);

				return () => {
					const index = callbacks.indexOf(callback);
					if (index !== -1) callbacks.splice(index, 1);
				};
			}

			$set() {
				// overridden by instance, if it has props
			}
		};
	}

	class SvelteComponent {
		$destroy() {
			destroy(this, true);
			this.$destroy = noop;
		}

		$on(type, callback) {
			const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
			callbacks.push(callback);

			return () => {
				const index = callbacks.indexOf(callback);
				if (index !== -1) callbacks.splice(index, 1);
			};
		}

		$set() {
			// overridden by instance, if it has props
		}
	}

	var strictUriEncode = str => encodeURIComponent(str).replace(/[!'()*]/g, x => `%${x.charCodeAt(0).toString(16).toUpperCase()}`);

	var token = '%[a-f0-9]{2}';
	var singleMatcher = new RegExp(token, 'gi');
	var multiMatcher = new RegExp('(' + token + ')+', 'gi');

	function decodeComponents(components, split) {
		try {
			// Try to decode the entire string first
			return decodeURIComponent(components.join(''));
		} catch (err) {
			// Do nothing
		}

		if (components.length === 1) {
			return components;
		}

		split = split || 1;

		// Split the array in 2 parts
		var left = components.slice(0, split);
		var right = components.slice(split);

		return Array.prototype.concat.call([], decodeComponents(left), decodeComponents(right));
	}

	function decode(input) {
		try {
			return decodeURIComponent(input);
		} catch (err) {
			var tokens = input.match(singleMatcher);

			for (var i = 1; i < tokens.length; i++) {
				input = decodeComponents(tokens, i).join('');

				tokens = input.match(singleMatcher);
			}

			return input;
		}
	}

	function customDecodeURIComponent(input) {
		// Keep track of all the replacements and prefill the map with the `BOM`
		var replaceMap = {
			'%FE%FF': '\uFFFD\uFFFD',
			'%FF%FE': '\uFFFD\uFFFD'
		};

		var match = multiMatcher.exec(input);
		while (match) {
			try {
				// Decode as big chunks as possible
				replaceMap[match[0]] = decodeURIComponent(match[0]);
			} catch (err) {
				var result = decode(match[0]);

				if (result !== match[0]) {
					replaceMap[match[0]] = result;
				}
			}

			match = multiMatcher.exec(input);
		}

		// Add `%C2` at the end of the map to make sure it does not replace the combinator before everything else
		replaceMap['%C2'] = '\uFFFD';

		var entries = Object.keys(replaceMap);

		for (var i = 0; i < entries.length; i++) {
			// Replace all decoded components
			var key = entries[i];
			input = input.replace(new RegExp(key, 'g'), replaceMap[key]);
		}

		return input;
	}

	var decodeUriComponent = function (encodedURI) {
		if (typeof encodedURI !== 'string') {
			throw new TypeError('Expected `encodedURI` to be of type `string`, got `' + typeof encodedURI + '`');
		}

		try {
			encodedURI = encodedURI.replace(/\+/g, ' ');

			// Try the built in decoder first
			return decodeURIComponent(encodedURI);
		} catch (err) {
			// Fallback to a more advanced decoder
			return customDecodeURIComponent(encodedURI);
		}
	};

	var splitOnFirst = (string, separator) => {
		if (!(typeof string === 'string' && typeof separator === 'string')) {
			throw new TypeError('Expected the arguments to be of type `string`');
		}

		if (separator === '') {
			return [string];
		}

		const separatorIndex = string.indexOf(separator);

		if (separatorIndex === -1) {
			return [string];
		}

		return [
			string.slice(0, separatorIndex),
			string.slice(separatorIndex + separator.length)
		];
	};

	function encoderForArrayFormat(options) {
		switch (options.arrayFormat) {
			case 'index':
				return key => (result, value) => {
					const index = result.length;
					if (value === undefined) {
						return result;
					}

					if (value === null) {
						return [...result, [encode(key, options), '[', index, ']'].join('')];
					}

					return [
						...result,
						[encode(key, options), '[', encode(index, options), ']=', encode(value, options)].join('')
					];
				};

			case 'bracket':
				return key => (result, value) => {
					if (value === undefined) {
						return result;
					}

					if (value === null) {
						return [...result, [encode(key, options), '[]'].join('')];
					}

					return [...result, [encode(key, options), '[]=', encode(value, options)].join('')];
				};

			case 'comma':
				return key => (result, value, index) => {
					if (value === null || value === undefined || value.length === 0) {
						return result;
					}

					if (index === 0) {
						return [[encode(key, options), '=', encode(value, options)].join('')];
					}

					return [[result, encode(value, options)].join(',')];
				};

			default:
				return key => (result, value) => {
					if (value === undefined) {
						return result;
					}

					if (value === null) {
						return [...result, encode(key, options)];
					}

					return [...result, [encode(key, options), '=', encode(value, options)].join('')];
				};
		}
	}

	function parserForArrayFormat(options) {
		let result;

		switch (options.arrayFormat) {
			case 'index':
				return (key, value, accumulator) => {
					result = /\[(\d*)\]$/.exec(key);

					key = key.replace(/\[\d*\]$/, '');

					if (!result) {
						accumulator[key] = value;
						return;
					}

					if (accumulator[key] === undefined) {
						accumulator[key] = {};
					}

					accumulator[key][result[1]] = value;
				};

			case 'bracket':
				return (key, value, accumulator) => {
					result = /(\[\])$/.exec(key);
					key = key.replace(/\[\]$/, '');

					if (!result) {
						accumulator[key] = value;
						return;
					}

					if (accumulator[key] === undefined) {
						accumulator[key] = [value];
						return;
					}

					accumulator[key] = [].concat(accumulator[key], value);
				};

			case 'comma':
				return (key, value, accumulator) => {
					const isArray = typeof value === 'string' && value.split('').indexOf(',') > -1;
					const newValue = isArray ? value.split(',') : value;
					accumulator[key] = newValue;
				};

			default:
				return (key, value, accumulator) => {
					if (accumulator[key] === undefined) {
						accumulator[key] = value;
						return;
					}

					accumulator[key] = [].concat(accumulator[key], value);
				};
		}
	}

	function encode(value, options) {
		if (options.encode) {
			return options.strict ? strictUriEncode(value) : encodeURIComponent(value);
		}

		return value;
	}

	function decode$1(value, options) {
		if (options.decode) {
			return decodeUriComponent(value);
		}

		return value;
	}

	function keysSorter(input) {
		if (Array.isArray(input)) {
			return input.sort();
		}

		if (typeof input === 'object') {
			return keysSorter(Object.keys(input))
				.sort((a, b) => Number(a) - Number(b))
				.map(key => input[key]);
		}

		return input;
	}

	function removeHash(input) {
		const hashStart = input.indexOf('#');
		if (hashStart !== -1) {
			input = input.slice(0, hashStart);
		}

		return input;
	}

	function extract(input) {
		input = removeHash(input);
		const queryStart = input.indexOf('?');
		if (queryStart === -1) {
			return '';
		}

		return input.slice(queryStart + 1);
	}

	function parseValue(value, options) {
		if (options.parseNumbers && !Number.isNaN(Number(value)) && (typeof value === 'string' && value.trim() !== '')) {
			value = Number(value);
		} else if (options.parseBooleans && value !== null && (value.toLowerCase() === 'true' || value.toLowerCase() === 'false')) {
			value = value.toLowerCase() === 'true';
		}

		return value;
	}

	function parse(input, options) {
		options = Object.assign({
			decode: true,
			sort: true,
			arrayFormat: 'none',
			parseNumbers: false,
			parseBooleans: false
		}, options);

		const formatter = parserForArrayFormat(options);

		// Create an object with no prototype
		const ret = Object.create(null);

		if (typeof input !== 'string') {
			return ret;
		}

		input = input.trim().replace(/^[?#&]/, '');

		if (!input) {
			return ret;
		}

		for (const param of input.split('&')) {
			let [key, value] = splitOnFirst(param.replace(/\+/g, ' '), '=');

			// Missing `=` should be `null`:
			// http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
			value = value === undefined ? null : decode$1(value, options);
			formatter(decode$1(key, options), value, ret);
		}

		for (const key of Object.keys(ret)) {
			const value = ret[key];
			if (typeof value === 'object' && value !== null) {
				for (const k of Object.keys(value)) {
					value[k] = parseValue(value[k], options);
				}
			} else {
				ret[key] = parseValue(value, options);
			}
		}

		if (options.sort === false) {
			return ret;
		}

		return (options.sort === true ? Object.keys(ret).sort() : Object.keys(ret).sort(options.sort)).reduce((result, key) => {
			const value = ret[key];
			if (Boolean(value) && typeof value === 'object' && !Array.isArray(value)) {
				// Sort object keys, not values
				result[key] = keysSorter(value);
			} else {
				result[key] = value;
			}

			return result;
		}, Object.create(null));
	}

	var extract_1 = extract;
	var parse_1 = parse;

	var stringify = (object, options) => {
		if (!object) {
			return '';
		}

		options = Object.assign({
			encode: true,
			strict: true,
			arrayFormat: 'none'
		}, options);

		const formatter = encoderForArrayFormat(options);
		const keys = Object.keys(object);

		if (options.sort !== false) {
			keys.sort(options.sort);
		}

		return keys.map(key => {
			const value = object[key];

			if (value === undefined) {
				return '';
			}

			if (value === null) {
				return encode(key, options);
			}

			if (Array.isArray(value)) {
				return value
					.reduce(formatter(key), [])
					.join('&');
			}

			return encode(key, options) + '=' + encode(value, options);
		}).filter(x => x.length > 0).join('&');
	};

	var parseUrl = (input, options) => {
		return {
			url: removeHash(input).split('?')[0] || '',
			query: parse(extract(input), options)
		};
	};

	var queryString = {
		extract: extract_1,
		parse: parse_1,
		stringify: stringify,
		parseUrl: parseUrl
	};

	var defaultExport = /*@__PURE__*/(function (Error) {
	  function defaultExport(route, path) {
	    var message = "Unreachable '" + route + "', segment '" + path + "' is not defined";
	    Error.call(this, message);
	    this.message = message;
	  }

	  if ( Error ) defaultExport.__proto__ = Error;
	  defaultExport.prototype = Object.create( Error && Error.prototype );
	  defaultExport.prototype.constructor = defaultExport;

	  return defaultExport;
	}(Error));

	function buildMatcher(path, parent) {
	  var regex;

	  var _isSplat;

	  var _priority = -100;

	  var keys = [];
	  regex = path.replace(/[-$.]/g, '\\$&').replace(/\(/g, '(?:').replace(/\)/g, ')?').replace(/([:*]\w+)(?:<([^<>]+?)>)?/g, function (_, key, expr) {
	    keys.push(key.substr(1));

	    if (key.charAt() === ':') {
	      _priority += 100;
	      return ("((?!#)" + (expr || '[^#/]+?') + ")");
	    }

	    _isSplat = true;
	    _priority += 500;
	    return ("((?!#)" + (expr || '[^#]+?') + ")");
	  });

	  try {
	    regex = new RegExp(("^" + regex + "$"));
	  } catch (e) {
	    throw new TypeError(("Invalid route expression, given '" + parent + "'"));
	  }

	  var _hashed = path.includes('#') ? 0.5 : 1;

	  var _depth = path.length * _priority * _hashed;

	  return {
	    keys: keys,
	    regex: regex,
	    _depth: _depth,
	    _isSplat: _isSplat
	  };
	}
	var PathMatcher = function PathMatcher(path, parent) {
	  var ref = buildMatcher(path, parent);
	  var keys = ref.keys;
	  var regex = ref.regex;
	  var _depth = ref._depth;
	  var _isSplat = ref._isSplat;
	  return {
	    _isSplat: _isSplat,
	    _depth: _depth,
	    match: function (value) {
	      var matches = value.match(regex);

	      if (matches) {
	        return keys.reduce(function (prev, cur, i) {
	          prev[cur] = typeof matches[i + 1] === 'string' ? decodeURIComponent(matches[i + 1]) : null;
	          return prev;
	        }, {});
	      }
	    }
	  };
	};

	PathMatcher.push = function push (key, prev, leaf, parent) {
	  var root = prev[key] || (prev[key] = {});

	  if (!root.pattern) {
	    root.pattern = new PathMatcher(key, parent);
	    root.route = (leaf || '').replace(/\/$/, '') || '/';
	  }

	  prev.keys = prev.keys || [];

	  if (!prev.keys.includes(key)) {
	    prev.keys.push(key);
	    PathMatcher.sort(prev);
	  }

	  return root;
	};

	PathMatcher.sort = function sort (root) {
	  root.keys.sort(function (a, b) {
	    return root[a].pattern._depth - root[b].pattern._depth;
	  });
	};

	function merge(path, parent) {
	  return ("" + (parent && parent !== '/' ? parent : '') + (path || ''));
	}
	function walk(path, cb) {
	  var matches = path.match(/<[^<>]*\/[^<>]*>/);

	  if (matches) {
	    throw new TypeError(("RegExp cannot contain slashes, given '" + matches + "'"));
	  }

	  var parts = path !== '/' ? path.split('/') : [''];
	  var root = [];
	  parts.some(function (x, i) {
	    var parent = root.concat(x).join('/') || null;
	    var segment = parts.slice(i + 1).join('/') || null;
	    var retval = cb(("/" + x), parent, segment ? ((x ? ("/" + x) : '') + "/" + segment) : null);
	    root.push(x);
	    return retval;
	  });
	}
	function reduce(key, root, _seen) {
	  var params = {};
	  var out = [];
	  var splat;
	  walk(key, function (x, leaf, extra) {
	    var found;

	    if (!root.keys) {
	      throw new defaultExport(key, x);
	    }

	    root.keys.some(function (k) {
	      if (_seen.includes(k)) { return false; }
	      var ref = root[k].pattern;
	      var match = ref.match;
	      var _isSplat = ref._isSplat;
	      var matches = match(_isSplat ? extra || x : x);

	      if (matches) {
	        Object.assign(params, matches);

	        if (root[k].route) {
	          var routeInfo = Object.assign({}, root[k].info); // properly handle exact-routes!

	          var hasMatch = false;

	          if (routeInfo.exact) {
	            hasMatch = extra === null;
	          } else {
	            hasMatch = x && leaf === null || x === leaf || _isSplat || !extra;
	          }

	          routeInfo.matches = hasMatch;
	          routeInfo.params = Object.assign({}, params);
	          routeInfo.route = root[k].route;
	          routeInfo.path = _isSplat ? extra : leaf || x;
	          out.push(routeInfo);
	        }

	        if (extra === null && !root[k].keys) {
	          return true;
	        }

	        if (k !== '/') { _seen.push(k); }
	        splat = _isSplat;
	        root = root[k];
	        found = true;
	        return true;
	      }

	      return false;
	    });

	    if (!(found || root.keys.some(function (k) { return root[k].pattern.match(x); }))) {
	      throw new defaultExport(key, x);
	    }

	    return splat || !found;
	  });
	  return out;
	}
	function find(path, routes, retries) {
	  var get = reduce.bind(null, path, routes);
	  var set = [];

	  while (retries > 0) {
	    retries -= 1;

	    try {
	      return get(set);
	    } catch (e) {
	      if (retries > 0) {
	        return get(set);
	      }

	      throw e;
	    }
	  }
	}
	function add(path, routes, parent, routeInfo) {
	  var fullpath = merge(path, parent);
	  var root = routes;
	  walk(fullpath, function (x, leaf) {
	    root = PathMatcher.push(x, root, leaf, fullpath);

	    if (x !== '/') {
	      root.info = root.info || Object.assign({}, routeInfo);
	    }
	  });
	  root.info = root.info || Object.assign({}, routeInfo);
	  return fullpath;
	}
	function rm(path, routes, parent) {
	  var fullpath = merge(path, parent);
	  var root = routes;
	  var leaf = null;
	  var key = null;
	  walk(fullpath, function (x) {
	    if (!root) {
	      leaf = null;
	      return true;
	    }

	    key = x;
	    leaf = x === '/' ? routes['/'] : root;

	    if (!leaf.keys) {
	      throw new defaultExport(path, x);
	    }

	    root = root[x];
	  });

	  if (!(leaf && key)) {
	    throw new defaultExport(path, key);
	  }

	  delete leaf[key];

	  if (key === '/') {
	    delete leaf.info;
	    delete leaf.route;
	  }

	  var offset = leaf.keys.indexOf(key);

	  if (offset !== -1) {
	    leaf.keys.splice(leaf.keys.indexOf(key), 1);
	    PathMatcher.sort(leaf);
	  }
	}

	var Router = function Router() {
	  var routes = {};
	  var stack = [];
	  return {
	    resolve: function (path, cb) {
	      var ref = path.split(/(?=[#?])/);
	      var uri = ref[0];
	      var hash = ref[1];
	      var query = ref[2];
	      var segments = uri.substr(1).split('/');
	      var prefix = [];
	      var seen = [];
	      segments.some(function (key) {
	        var sub = prefix.concat(("/" + key)).join('');
	        if (key.length) { prefix.push(("/" + key)); }

	        try {
	          var next = find(sub, routes, 1);
	          cb(null, next.filter(function (x) {
	            if (!seen.includes(x.route)) {
	              seen.push(x.route);
	              return true;
	            }

	            return false;
	          }));
	        } catch (e) {
	          cb(e, []);
	          return true;
	        }

	        return false;
	      });

	      if (hash) {
	        cb(null, find(("" + uri + hash), routes, 1));
	      }
	    },
	    mount: function (path, cb) {
	      if (path !== '/') {
	        stack.push(path);
	      }

	      cb();
	      stack.pop();
	    },
	    find: function (path, retries) { return find(path, routes, retries === true ? 2 : retries || 1); },
	    add: function (path, routeInfo) { return add(path, routes, stack.join(''), routeInfo); },
	    rm: function (path) { return rm(path, routes, stack.join('')); }
	  };
	};

	function writable(value, start = noop) {
		let stop;
		const subscribers = [];

		function set(new_value) {
			if (safe_not_equal(value, new_value)) {
				value = new_value;
				if (!stop) return; // not ready
				subscribers.forEach(s => s[1]());
				subscribers.forEach(s => s[0](value));
			}
		}

		function update(fn) {
			set(fn(value));
		}

		function subscribe(run, invalidate = noop) {
			const subscriber = [run, invalidate];
			subscribers.push(subscriber);
			if (subscribers.length === 1) stop = start(set) || noop;
			run(value);

			return () => {
				const index = subscribers.indexOf(subscriber);
				if (index !== -1) subscribers.splice(index, 1);
				if (subscribers.length === 0) stop();
			};
		}

		return { set, update, subscribe };
	}

	const baseTag = document.getElementsByTagName('base');
	const basePrefix = (baseTag[0] && baseTag[0].href.replace(/\/$/, '')) || '/';

	const ROOT_URL = basePrefix.replace(window.location.origin, '');

	const router = writable({
	  path: '/',
	  params: {},
	});

	const CTX_ROUTER = {};
	const CTX_ROUTE = {};

	// use location.hash on embedded pages, e.g. Svelte REPL
	let HASHCHANGE = location.origin === 'null';

	function hashchangeEnable(value) {
	  if (typeof value === 'boolean') {
	    HASHCHANGE = !!value;
	  }

	  return HASHCHANGE;
	}

	function fixedLocation(path, callback) {
	  const baseUri = hashchangeEnable() ? location.hash.replace('#', '') : location.pathname;

	  // this will rebase anchors to avoid location changes
	  if (path.charAt() !== '/') {
	    path = baseUri + path;
	  }

	  // do not change location et all...
	  if ((baseUri + location.search) !== path) {
	    callback(path);
	  }
	}

	function navigateTo(path, options) {
	  const {
	    reload, replace,
	    params, queryParams,
	  } = options || {};

	  // If path empty or no string, throws error
	  if (!path || typeof path !== 'string') {
	    throw new Error(`yrv expects navigateTo() to have a string parameter. The parameter provided was: ${path} of type ${typeof path} instead.`);
	  }

	  if (path[0] !== '/' && path[0] !== '#') {
	    throw new Error(`yrv expects navigateTo() param to start with slash or hash, e.g. "/${path}" or "#${path}" instead of "${path}".`);
	  }

	  if (params) {
	    path = path.replace(/:([a-zA-Z][a-zA-Z0-9_-]*)/g, (_, key) => params[key]);
	  }

	  // rebase active URL
	  if (ROOT_URL !== '/' && path.indexOf(ROOT_URL) !== 0) {
	    path = ROOT_URL + path;
	  }

	  if (queryParams) {
	    const qs = queryString.stringify(queryParams);

	    if (qs) {
	      path += `?${qs}`;
	    }
	  }

	  if (hashchangeEnable()) {
	    location.hash = path.replace(/^#/, '');
	    return;
	  }

	  // If no History API support, fallbacks to URL redirect
	  if (reload || !history.pushState || !dispatchEvent) {
	    location.href = path;
	    return;
	  }

	  // If has History API support, uses it
	  fixedLocation(path, nextURL => {
	    history[replace ? 'replaceState' : 'pushState'](null, '', nextURL);
	    dispatchEvent(new Event('popstate'));
	  });
	}

	function isActive(uri, path, exact) {
	  if (exact !== true && path.indexOf(uri) === 0) {
	    return /^[#/?]?$/.test(path.substr(uri.length, 1));
	  }

	  return path === uri;
	}

	/* node_modules/yrv/src/Router.svelte generated by Svelte v3.3.0 */

	function add_css() {
		var style = element("style");
		style.id = 'svelte-6x68uz-style';
		style.textContent = ".yrv-failure.svelte-6x68uz{margin:10px;border:1px dashed silver}";
		append(document.head, style);
	}

	// (187:0) {#if failure && !fallback && !nofallback}
	function create_if_block(ctx) {
		var fieldset, legend, t0, t1, t2, pre, t3;

		return {
			c() {
				fieldset = element("fieldset");
				legend = element("legend");
				t0 = text("Router failure: ");
				t1 = text(ctx.path);
				t2 = space();
				pre = element("pre");
				t3 = text(ctx.failure);
				fieldset.className = "yrv-failure svelte-6x68uz";
			},

			m(target, anchor) {
				insert(target, fieldset, anchor);
				append(fieldset, legend);
				append(legend, t0);
				append(legend, t1);
				append(fieldset, t2);
				append(fieldset, pre);
				append(pre, t3);
			},

			p(changed, ctx) {
				if (changed.path) {
					set_data(t1, ctx.path);
				}

				if (changed.failure) {
					set_data(t3, ctx.failure);
				}
			},

			d(detaching) {
				if (detaching) {
					detach(fieldset);
				}
			}
		};
	}

	function create_fragment(ctx) {
		var t, current;

		var if_block = (ctx.failure && !ctx.fallback && !ctx.nofallback) && create_if_block(ctx);

		const default_slot_1 = ctx.$$slots.default;
		const default_slot = create_slot(default_slot_1, ctx, null);

		return {
			c() {
				if (if_block) if_block.c();
				t = space();

				if (default_slot) default_slot.c();
			},

			l(nodes) {
				if (default_slot) default_slot.l(nodes);
			},

			m(target, anchor) {
				if (if_block) if_block.m(target, anchor);
				insert(target, t, anchor);

				if (default_slot) {
					default_slot.m(target, anchor);
				}

				current = true;
			},

			p(changed, ctx) {
				if (ctx.failure && !ctx.fallback && !ctx.nofallback) {
					if (if_block) {
						if_block.p(changed, ctx);
					} else {
						if_block = create_if_block(ctx);
						if_block.c();
						if_block.m(t.parentNode, t);
					}
				} else if (if_block) {
					if_block.d(1);
					if_block = null;
				}

				if (default_slot && default_slot.p && changed.$$scope) {
					default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
				}
			},

			i(local) {
				if (current) return;
				if (default_slot && default_slot.i) default_slot.i(local);
				current = true;
			},

			o(local) {
				if (default_slot && default_slot.o) default_slot.o(local);
				current = false;
			},

			d(detaching) {
				if (if_block) if_block.d(detaching);

				if (detaching) {
					detach(t);
				}

				if (default_slot) default_slot.d(detaching);
			}
		};
	}



	const baseRouter = new Router();

	function instance($$self, $$props, $$invalidate) {
		let $basePath, $routeInfo, $router;

		subscribe($$self, router, $$value => { $router = $$value; $$invalidate('$router', $router); });

		

	  let failure;
	  let fallback;

	  let { path = '/', exact = null, nofallback = false } = $$props;

	  const isExact = exact;
	  const routerContext = getContext(CTX_ROUTER);
	  const routeInfo = routerContext ? routerContext.routeInfo : writable({}); subscribe($$self, routeInfo, $$value => { $routeInfo = $$value; $$invalidate('$routeInfo', $routeInfo); });
	  const basePath = routerContext ? routerContext.basePath : writable(path); subscribe($$self, basePath, $$value => { $basePath = $$value; $$invalidate('$basePath', $basePath); });

	  const fixedRoot = $basePath !== path && $basePath !== '/'
	    ? `${$basePath}${path !== '/' ? path : ''}`
	    : path;

	  function doFallback(e, _path, queryParams) {
	    $routeInfo = {
	      [fallback]: {
	        failure: e,
	        query: queryParams,
	        params: { _: _path.substr(1) || undefined },
	      },
	    }; routeInfo.set($routeInfo);
	  }

	  function handleRoutes(map, _path, _query, _shared) {
	    const _params = map.reduce((prev, cur) => {
	      if (cur.key) {
	        Object.assign(_shared, cur.params);

	        prev[cur.key] = Object.assign(prev[cur.key] || {}, cur.params);
	      }

	      return prev;
	    }, {});

	    map.some(x => {
	      if (x.key && x.matches && !$routeInfo[x.key]) {
	        if (typeof x.condition === 'boolean' || typeof x.condition === 'function') {
	          const ok = typeof x.condition === 'function' ? x.condition($router) : x.condition;

	          if (ok !== true && x.redirect) {
	            navigateTo(x.redirect);
	            return true;
	          }
	        }

	        if (x.redirect && !x.condition) {
	          navigateTo(x.redirect);
	          return true;
	        }

	        if (!x.fallback) {
	          $routeInfo[x.key] = {
	            ...x,
	            query: _query,
	            params: _params[x.key],
	          }; routeInfo.set($routeInfo);
	        } else {
	          doFallback(null, _path, _query);
	          return true;
	        }
	      }

	      return false;
	    });
	  }

	  function resolveRoutes() {
	    clearTimeout(resolveRoutes.t);

	    resolveRoutes.t = setTimeout(() => {
	      $$invalidate('failure', failure = null);
	      $routeInfo = {}; routeInfo.set($routeInfo);

	      let baseUri = !hashchangeEnable() ? location.href.replace(location.origin, '') : location.hash;

	      // unprefix active URL
	      if (ROOT_URL !== '/') {
	        baseUri = baseUri.replace(ROOT_URL, '');
	      }

	      const [fullpath, searchQuery] = `/${baseUri.replace(/^#?\//, '')}`.split('?');
	      const query = queryString.parse(searchQuery);
	      const ctx = {};

	      try {
	        if (isActive(fixedRoot, fullpath, false) || fixedRoot === '/') {
	          baseRouter.resolve(fullpath, (err, result) => {
	            if (err) {
	              $$invalidate('failure', failure = err);
	              return;
	            }

	            handleRoutes(result, fullpath, query, ctx);
	          });
	        }
	      } catch (e) {
	        $$invalidate('failure', failure = e);
	      } finally {
	        $router.path = fullpath; router.set($router);
	        $router.query = query; router.set($router);
	        $router.params = ctx; router.set($router);
	      }

	      if (failure && fallback) {
	        doFallback(failure, fullpath, query);
	        return;
	      }

	      try {
	        baseRouter.find(fullpath).forEach(sub => {
	          // clear routes that are not longer matches!
	          if (!sub.matches && sub.exact && sub.key) {
	            $routeInfo[sub.key] = null; routeInfo.set($routeInfo);
	          }
	        });
	      } catch (e) {
	        // this is fine
	      }
	    }, 50); $$invalidate('resolveRoutes', resolveRoutes);
	  }

	  function assignRoute(key, route, detail) {
	    key = key || Math.random().toString(36).substr(2);

	    const handler = { key, ...detail };

	    let fullpath;

	    baseRouter.mount(fixedRoot, () => {
	      fullpath = baseRouter.add(route, handler);
	      $$invalidate('fallback', fallback = (handler.fallback && key) || fallback);
	    });

	    resolveRoutes();

	    return [key, fullpath];
	  }

	  function unassignRoute(route) {
	    baseRouter.rm(route);
	    resolveRoutes();
	  }

	  window.addEventListener('popstate', resolveRoutes, false);

	  onDestroy(() => {
	    window.removeEventListener('popstate', resolveRoutes, false);
	  });

	  setContext(CTX_ROUTER, {
	    isExact,
	    basePath,
	    routeInfo,
	    assignRoute,
	    unassignRoute,
	  });

		let { $$slots = {}, $$scope } = $$props;

		$$self.$set = $$props => {
			if ('path' in $$props) $$invalidate('path', path = $$props.path);
			if ('exact' in $$props) $$invalidate('exact', exact = $$props.exact);
			if ('nofallback' in $$props) $$invalidate('nofallback', nofallback = $$props.nofallback);
			if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
		};

		return {
			failure,
			fallback,
			path,
			exact,
			nofallback,
			routeInfo,
			basePath,
			$$slots,
			$$scope
		};
	}

	class Router_1 extends SvelteComponent {
		constructor(options) {
			super();
			if (!document.getElementById("svelte-6x68uz-style")) add_css();
			init(this, options, instance, create_fragment, safe_not_equal, ["path", "exact", "nofallback"]);
		}
	}

	/* node_modules/yrv/src/Route.svelte generated by Svelte v3.3.0 */

	const get_default_slot_changes = ({ activeRouter, activeProps }) => ({ router: activeRouter, props: activeProps });
	const get_default_slot_context = ({ activeRouter, activeProps }) => ({
		router: activeRouter,
		props: activeProps
	});

	// (68:0) {#if activeRouter}
	function create_if_block$1(ctx) {
		var current_block_type_index, if_block, if_block_anchor, current;

		var if_block_creators = [
			create_if_block_1,
			create_else_block
		];

		var if_blocks = [];

		function select_block_type(ctx) {
			if (ctx.component) return 0;
			return 1;
		}

		current_block_type_index = select_block_type(ctx);
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

		return {
			c() {
				if_block.c();
				if_block_anchor = empty();
			},

			m(target, anchor) {
				if_blocks[current_block_type_index].m(target, anchor);
				insert(target, if_block_anchor, anchor);
				current = true;
			},

			p(changed, ctx) {
				var previous_block_index = current_block_type_index;
				current_block_type_index = select_block_type(ctx);
				if (current_block_type_index === previous_block_index) {
					if_blocks[current_block_type_index].p(changed, ctx);
				} else {
					group_outros();
					on_outro(() => {
						if_blocks[previous_block_index].d(1);
						if_blocks[previous_block_index] = null;
					});
					if_block.o(1);
					check_outros();

					if_block = if_blocks[current_block_type_index];
					if (!if_block) {
						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block.c();
					}
					if_block.i(1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			},

			i(local) {
				if (current) return;
				if (if_block) if_block.i();
				current = true;
			},

			o(local) {
				if (if_block) if_block.o();
				current = false;
			},

			d(detaching) {
				if_blocks[current_block_type_index].d(detaching);

				if (detaching) {
					detach(if_block_anchor);
				}
			}
		};
	}

	// (71:2) {:else}
	function create_else_block(ctx) {
		var current;

		const default_slot_1 = ctx.$$slots.default;
		const default_slot = create_slot(default_slot_1, ctx, get_default_slot_context);

		return {
			c() {
				if (default_slot) default_slot.c();
			},

			l(nodes) {
				if (default_slot) default_slot.l(nodes);
			},

			m(target, anchor) {
				if (default_slot) {
					default_slot.m(target, anchor);
				}

				current = true;
			},

			p(changed, ctx) {
				if (default_slot && default_slot.p && (changed.$$scope || changed.activeRouter || changed.activeProps)) {
					default_slot.p(get_slot_changes(default_slot_1, ctx, changed, get_default_slot_changes), get_slot_context(default_slot_1, ctx, get_default_slot_context));
				}
			},

			i(local) {
				if (current) return;
				if (default_slot && default_slot.i) default_slot.i(local);
				current = true;
			},

			o(local) {
				if (default_slot && default_slot.o) default_slot.o(local);
				current = false;
			},

			d(detaching) {
				if (default_slot) default_slot.d(detaching);
			}
		};
	}

	// (69:2) {#if component}
	function create_if_block_1(ctx) {
		var switch_instance_anchor, current;

		var switch_instance_spread_levels = [
			{ router: ctx.activeRouter },
			ctx.activeProps
		];

		var switch_value = ctx.component;

		function switch_props(ctx) {
			let switch_instance_props = {};
			for (var i = 0; i < switch_instance_spread_levels.length; i += 1) {
				switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
			}
			return { props: switch_instance_props };
		}

		if (switch_value) {
			var switch_instance = new switch_value(switch_props());
		}

		return {
			c() {
				if (switch_instance) switch_instance.$$.fragment.c();
				switch_instance_anchor = empty();
			},

			m(target, anchor) {
				if (switch_instance) {
					mount_component(switch_instance, target, anchor);
				}

				insert(target, switch_instance_anchor, anchor);
				current = true;
			},

			p(changed, ctx) {
				var switch_instance_changes = (changed.activeRouter || changed.activeProps) ? get_spread_update(switch_instance_spread_levels, [
					(changed.activeRouter) && { router: ctx.activeRouter },
					(changed.activeProps) && ctx.activeProps
				]) : {};

				if (switch_value !== (switch_value = ctx.component)) {
					if (switch_instance) {
						group_outros();
						const old_component = switch_instance;
						on_outro(() => {
							old_component.$destroy();
						});
						old_component.$$.fragment.o(1);
						check_outros();
					}

					if (switch_value) {
						switch_instance = new switch_value(switch_props());

						switch_instance.$$.fragment.c();
						switch_instance.$$.fragment.i(1);
						mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
					} else {
						switch_instance = null;
					}
				}

				else if (switch_value) {
					switch_instance.$set(switch_instance_changes);
				}
			},

			i(local) {
				if (current) return;
				if (switch_instance) switch_instance.$$.fragment.i(local);

				current = true;
			},

			o(local) {
				if (switch_instance) switch_instance.$$.fragment.o(local);
				current = false;
			},

			d(detaching) {
				if (detaching) {
					detach(switch_instance_anchor);
				}

				if (switch_instance) switch_instance.$destroy(detaching);
			}
		};
	}

	function create_fragment$1(ctx) {
		var if_block_anchor, current;

		var if_block = (ctx.activeRouter) && create_if_block$1(ctx);

		return {
			c() {
				if (if_block) if_block.c();
				if_block_anchor = empty();
			},

			m(target, anchor) {
				if (if_block) if_block.m(target, anchor);
				insert(target, if_block_anchor, anchor);
				current = true;
			},

			p(changed, ctx) {
				if (ctx.activeRouter) {
					if (if_block) {
						if_block.p(changed, ctx);
						if_block.i(1);
					} else {
						if_block = create_if_block$1(ctx);
						if_block.c();
						if_block.i(1);
						if_block.m(if_block_anchor.parentNode, if_block_anchor);
					}
				} else if (if_block) {
					group_outros();
					on_outro(() => {
						if_block.d(1);
						if_block = null;
					});

					if_block.o(1);
					check_outros();
				}
			},

			i(local) {
				if (current) return;
				if (if_block) if_block.i();
				current = true;
			},

			o(local) {
				if (if_block) if_block.o();
				current = false;
			},

			d(detaching) {
				if (if_block) if_block.d(detaching);

				if (detaching) {
					detach(if_block_anchor);
				}
			}
		};
	}

	function getProps(given, required) {
	  const { props: sub, ...others } = given;

	  // prune all declared props from this component
	  required.forEach(k => {
	    delete others[k];
	  });

	  return {
	    ...sub,
	    ...others,
	  };
	}

	function instance$1($$self, $$props, $$invalidate) {
		let $routePath, $routeInfo;

		

	  let { key = null, path = '/', props = null, exact = null, fallback = null, component = null, condition = null, redirect = null } = $$props;

	  const routeContext = getContext(CTX_ROUTE);
	  const routePath = routeContext ? routeContext.routePath : writable(path); subscribe($$self, routePath, $$value => { $routePath = $$value; $$invalidate('$routePath', $routePath); });

	  const {
	    assignRoute, unassignRoute, routeInfo, isExact,
	  } = getContext(CTX_ROUTER); subscribe($$self, routeInfo, $$value => { $routeInfo = $$value; $$invalidate('$routeInfo', $routeInfo); });

	  // inherit exact from parent Router
	  if (isExact) $$invalidate('exact', exact = true);

	  let activeRouter = null;
	  let activeProps = {};
	  let fullpath;

	  const fixedRoot = $routePath !== path && $routePath !== '/'
	    ? `${$routePath}${path !== '/' ? path : ''}`
	    : path;

	  [key, fullpath] = assignRoute(key, fixedRoot, {
	    condition, redirect, fallback, exact,
	  }); $$invalidate('key', key); $$invalidate('fullpath', fullpath);

	  onDestroy(() => {
	    unassignRoute(fullpath);
	  });

	  setContext(CTX_ROUTE, {
	    routePath,
	  });

		let { $$slots = {}, $$scope } = $$props;

		$$self.$set = $$new_props => {
			$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
			if ('key' in $$props) $$invalidate('key', key = $$props.key);
			if ('path' in $$props) $$invalidate('path', path = $$props.path);
			if ('props' in $$props) $$invalidate('props', props = $$props.props);
			if ('exact' in $$props) $$invalidate('exact', exact = $$props.exact);
			if ('fallback' in $$props) $$invalidate('fallback', fallback = $$props.fallback);
			if ('component' in $$props) $$invalidate('component', component = $$props.component);
			if ('condition' in $$props) $$invalidate('condition', condition = $$props.condition);
			if ('redirect' in $$props) $$invalidate('redirect', redirect = $$props.redirect);
			if ('$$scope' in $$new_props) $$invalidate('$$scope', $$scope = $$new_props.$$scope);
		};

		$$self.$$.update = ($$dirty = { $routeInfo: 1, key: 1, $$props: 1 }) => {
			if ($$dirty.$routeInfo || $$dirty.key) { {
	        $$invalidate('activeRouter', activeRouter = $routeInfo[key]);
	        $$invalidate('activeProps', activeProps = getProps($$props, arguments[0].$$.props));
	      } }
		};

		return {
			key,
			path,
			props,
			exact,
			fallback,
			component,
			condition,
			redirect,
			routePath,
			routeInfo,
			activeRouter,
			activeProps,
			$$props: $$props = exclude_internal_props($$props),
			$$slots,
			$$scope
		};
	}

	class Route extends SvelteComponent {
		constructor(options) {
			super();
			init(this, options, instance$1, create_fragment$1, safe_not_equal, ["key", "path", "props", "exact", "fallback", "component", "condition", "redirect"]);
		}
	}

	/* node_modules/yrv/src/Link.svelte generated by Svelte v3.3.0 */

	// (73:0) {:else}
	function create_else_block$1(ctx) {
		var a, current, dispose;

		const default_slot_1 = ctx.$$slots.default;
		const default_slot = create_slot(default_slot_1, ctx, null);

		return {
			c() {
				a = element("a");

				if (default_slot) default_slot.c();

				a.href = ctx.fixedHref;
				a.className = ctx.className;
				a.title = ctx.title;
				dispose = listen(a, "click", prevent_default(ctx.onClick));
			},

			l(nodes) {
				if (default_slot) default_slot.l(a_nodes);
			},

			m(target, anchor) {
				insert(target, a, anchor);

				if (default_slot) {
					default_slot.m(a, null);
				}

				add_binding_callback(() => ctx.a_binding(a, null));
				current = true;
			},

			p(changed, ctx) {
				if (default_slot && default_slot.p && changed.$$scope) {
					default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
				}

				if (changed.items) {
					ctx.a_binding(null, a);
					ctx.a_binding(a, null);
				}

				if (!current || changed.fixedHref) {
					a.href = ctx.fixedHref;
				}

				if (!current || changed.className) {
					a.className = ctx.className;
				}

				if (!current || changed.title) {
					a.title = ctx.title;
				}
			},

			i(local) {
				if (current) return;
				if (default_slot && default_slot.i) default_slot.i(local);
				current = true;
			},

			o(local) {
				if (default_slot && default_slot.o) default_slot.o(local);
				current = false;
			},

			d(detaching) {
				if (detaching) {
					detach(a);
				}

				if (default_slot) default_slot.d(detaching);
				ctx.a_binding(null, a);
				dispose();
			}
		};
	}

	// (69:0) {#if button}
	function create_if_block$2(ctx) {
		var button_1, current, dispose;

		const default_slot_1 = ctx.$$slots.default;
		const default_slot = create_slot(default_slot_1, ctx, null);

		return {
			c() {
				button_1 = element("button");

				if (default_slot) default_slot.c();

				button_1.className = ctx.className;
				button_1.title = ctx.title;
				dispose = listen(button_1, "click", prevent_default(ctx.onClick));
			},

			l(nodes) {
				if (default_slot) default_slot.l(button_1_nodes);
			},

			m(target, anchor) {
				insert(target, button_1, anchor);

				if (default_slot) {
					default_slot.m(button_1, null);
				}

				add_binding_callback(() => ctx.button_1_binding(button_1, null));
				current = true;
			},

			p(changed, ctx) {
				if (default_slot && default_slot.p && changed.$$scope) {
					default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
				}

				if (changed.items) {
					ctx.button_1_binding(null, button_1);
					ctx.button_1_binding(button_1, null);
				}

				if (!current || changed.className) {
					button_1.className = ctx.className;
				}

				if (!current || changed.title) {
					button_1.title = ctx.title;
				}
			},

			i(local) {
				if (current) return;
				if (default_slot && default_slot.i) default_slot.i(local);
				current = true;
			},

			o(local) {
				if (default_slot && default_slot.o) default_slot.o(local);
				current = false;
			},

			d(detaching) {
				if (detaching) {
					detach(button_1);
				}

				if (default_slot) default_slot.d(detaching);
				ctx.button_1_binding(null, button_1);
				dispose();
			}
		};
	}

	function create_fragment$2(ctx) {
		var current_block_type_index, if_block, if_block_anchor, current;

		var if_block_creators = [
			create_if_block$2,
			create_else_block$1
		];

		var if_blocks = [];

		function select_block_type(ctx) {
			if (ctx.button) return 0;
			return 1;
		}

		current_block_type_index = select_block_type(ctx);
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

		return {
			c() {
				if_block.c();
				if_block_anchor = empty();
			},

			m(target, anchor) {
				if_blocks[current_block_type_index].m(target, anchor);
				insert(target, if_block_anchor, anchor);
				current = true;
			},

			p(changed, ctx) {
				var previous_block_index = current_block_type_index;
				current_block_type_index = select_block_type(ctx);
				if (current_block_type_index === previous_block_index) {
					if_blocks[current_block_type_index].p(changed, ctx);
				} else {
					group_outros();
					on_outro(() => {
						if_blocks[previous_block_index].d(1);
						if_blocks[previous_block_index] = null;
					});
					if_block.o(1);
					check_outros();

					if_block = if_blocks[current_block_type_index];
					if (!if_block) {
						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block.c();
					}
					if_block.i(1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			},

			i(local) {
				if (current) return;
				if (if_block) if_block.i();
				current = true;
			},

			o(local) {
				if (if_block) if_block.o();
				current = false;
			},

			d(detaching) {
				if_blocks[current_block_type_index].d(detaching);

				if (detaching) {
					detach(if_block_anchor);
				}
			}
		};
	}

	function instance$2($$self, $$props, $$invalidate) {
		let $router;

		subscribe($$self, router, $$value => { $router = $$value; $$invalidate('$router', $router); });

		

	  let ref;
	  let active;
	  let { class: cssClass = '' } = $$props;
	  let fixedHref = null;

	  let { go = null, href = '/', title = '', button = false, exact = false, reload = false, replace = false, className = '' } = $$props;

	  // rebase active URL
	  if (ROOT_URL !== '/') {
	    $$invalidate('fixedHref', fixedHref = ROOT_URL + href);
	  } else {
	    $$invalidate('fixedHref', fixedHref = href);
	  }

	  onMount(() => {
	    $$invalidate('className', className = className || cssClass);
	  });

	  const dispatch = createEventDispatcher();

	  // this will enable `<Link on:click={...} />` calls
	  function onClick(e) {
	    if (typeof go === 'string' && history.length > 1) {
	      if (go === 'back') history.back();
	      else if (go === 'fwd') history.forward();
	      else history.go(parseInt(go, 10));
	      return;
	    }

	    fixedLocation(href, nextURL => {
	      navigateTo(nextURL, { reload, replace });
	      dispatch('click', e);
	    });
	  }

		let { $$slots = {}, $$scope } = $$props;

		function button_1_binding($$node, check) {
			ref = $$node;
			$$invalidate('ref', ref);
		}

		function a_binding($$node, check) {
			ref = $$node;
			$$invalidate('ref', ref);
		}

		$$self.$set = $$props => {
			if ('class' in $$props) $$invalidate('cssClass', cssClass = $$props.class);
			if ('go' in $$props) $$invalidate('go', go = $$props.go);
			if ('href' in $$props) $$invalidate('href', href = $$props.href);
			if ('title' in $$props) $$invalidate('title', title = $$props.title);
			if ('button' in $$props) $$invalidate('button', button = $$props.button);
			if ('exact' in $$props) $$invalidate('exact', exact = $$props.exact);
			if ('reload' in $$props) $$invalidate('reload', reload = $$props.reload);
			if ('replace' in $$props) $$invalidate('replace', replace = $$props.replace);
			if ('className' in $$props) $$invalidate('className', className = $$props.className);
			if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
		};

		$$self.$$.update = ($$dirty = { ref: 1, $router: 1, href: 1, exact: 1, active: 1, button: 1 }) => {
			if ($$dirty.ref || $$dirty.$router || $$dirty.href || $$dirty.exact || $$dirty.active || $$dirty.button) { if (ref && $router.path) {
	        if (isActive(href, $router.path, exact)) {
	          if (!active) {
	            $$invalidate('active', active = true);
	            ref.setAttribute('aria-current', 'page');
	    
	            if (button) {
	              ref.setAttribute('disabled', true);
	            }
	          }
	        } else if (active) {
	          $$invalidate('active', active = false);
	          ref.removeAttribute('disabled');
	          ref.removeAttribute('aria-current');
	        }
	      } }
		};

		return {
			ref,
			cssClass,
			fixedHref,
			go,
			href,
			title,
			button,
			exact,
			reload,
			replace,
			className,
			onClick,
			button_1_binding,
			a_binding,
			$$slots,
			$$scope
		};
	}

	class Link extends SvelteComponent {
		constructor(options) {
			super();
			init(this, options, instance$2, create_fragment$2, safe_not_equal, ["class", "go", "href", "title", "button", "exact", "reload", "replace", "className"]);
		}
	}

	Object.defineProperty(Router_1, 'hashchange', {
	  set: value => hashchangeEnable(value),
	  get: () => hashchangeEnable(),
	  configurable: false,
	  enumerable: false,
	});

	/* src/app/components/pages/NotFound.svelte generated by Svelte v3.3.0 */

	function create_fragment$3(ctx) {
		var h1;

		return {
			c() {
				h1 = element("h1");
				h1.textContent = "Not found";
			},

			m(target, anchor) {
				insert(target, h1, anchor);
			},

			p: noop,
			i: noop,
			o: noop,

			d(detaching) {
				if (detaching) {
					detach(h1);
				}
			}
		};
	}

	class NotFound extends SvelteComponent {
		constructor(options) {
			super();
			init(this, options, null, create_fragment$3, safe_not_equal, []);
		}
	}

	/* src/app/components/pages/Home.svelte generated by Svelte v3.3.0 */

	function create_fragment$4(ctx) {
		var h1;

		return {
			c() {
				h1 = element("h1");
				h1.textContent = "HOME";
			},

			m(target, anchor) {
				insert(target, h1, anchor);
			},

			p: noop,
			i: noop,
			o: noop,

			d(detaching) {
				if (detaching) {
					detach(h1);
				}
			}
		};
	}

	class Home extends SvelteComponent {
		constructor(options) {
			super();
			init(this, options, null, create_fragment$4, safe_not_equal, []);
		}
	}

	/* src/app/components/App.svelte generated by Svelte v3.3.0 */

	// (11:6) <Link exact href="/admin/">
	function create_default_slot_2(ctx) {
		var t;

		return {
			c() {
				t = text("Dashboard");
			},

			m(target, anchor) {
				insert(target, t, anchor);
			},

			d(detaching) {
				if (detaching) {
					detach(t);
				}
			}
		};
	}

	// (12:8) <Link exact href="/admin/not-found">
	function create_default_slot_1(ctx) {
		var t;

		return {
			c() {
				t = text("Page not found");
			},

			m(target, anchor) {
				insert(target, t, anchor);
			},

			d(detaching) {
				if (detaching) {
					detach(t);
				}
			}
		};
	}

	// (8:0) <Router path="/admin">
	function create_default_slot(ctx) {
		var nav1, nav0, t0, t1, main, t2, current;

		var link0 = new Link({
			props: {
			exact: true,
			href: "/admin/",
			$$slots: { default: [create_default_slot_2] },
			$$scope: { ctx }
		}
		});

		var link1 = new Link({
			props: {
			exact: true,
			href: "/admin/not-found",
			$$slots: { default: [create_default_slot_1] },
			$$scope: { ctx }
		}
		});

		var route0 = new Route({
			props: {
			exact: true,
			path: "/",
			component: Home
		}
		});

		var route1 = new Route({
			props: { fallback: true, component: NotFound }
		});

		return {
			c() {
				nav1 = element("nav");
				nav0 = element("nav");
				link0.$$.fragment.c();
				t0 = text("\n      | ");
				link1.$$.fragment.c();
				t1 = space();
				main = element("main");
				route0.$$.fragment.c();
				t2 = space();
				route1.$$.fragment.c();
			},

			m(target, anchor) {
				insert(target, nav1, anchor);
				append(nav1, nav0);
				mount_component(link0, nav0, null);
				append(nav0, t0);
				mount_component(link1, nav0, null);
				insert(target, t1, anchor);
				insert(target, main, anchor);
				mount_component(route0, main, null);
				append(main, t2);
				mount_component(route1, main, null);
				current = true;
			},

			p(changed, ctx) {
				var link0_changes = {};
				if (changed.$$scope) link0_changes.$$scope = { changed, ctx };
				link0.$set(link0_changes);

				var link1_changes = {};
				if (changed.$$scope) link1_changes.$$scope = { changed, ctx };
				link1.$set(link1_changes);

				var route0_changes = {};
				if (changed.Home) route0_changes.component = Home;
				route0.$set(route0_changes);

				var route1_changes = {};
				if (changed.NotFound) route1_changes.component = NotFound;
				route1.$set(route1_changes);
			},

			i(local) {
				if (current) return;
				link0.$$.fragment.i(local);

				link1.$$.fragment.i(local);

				route0.$$.fragment.i(local);

				route1.$$.fragment.i(local);

				current = true;
			},

			o(local) {
				link0.$$.fragment.o(local);
				link1.$$.fragment.o(local);
				route0.$$.fragment.o(local);
				route1.$$.fragment.o(local);
				current = false;
			},

			d(detaching) {
				if (detaching) {
					detach(nav1);
				}

				link0.$destroy();

				link1.$destroy();

				if (detaching) {
					detach(t1);
					detach(main);
				}

				route0.$destroy();

				route1.$destroy();
			}
		};
	}

	function create_fragment$5(ctx) {
		var current;

		var router = new Router_1({
			props: {
			path: "/admin",
			$$slots: { default: [create_default_slot] },
			$$scope: { ctx }
		}
		});

		return {
			c() {
				router.$$.fragment.c();
			},

			m(target, anchor) {
				mount_component(router, target, anchor);
				current = true;
			},

			p(changed, ctx) {
				var router_changes = {};
				if (changed.$$scope) router_changes.$$scope = { changed, ctx };
				router.$set(router_changes);
			},

			i(local) {
				if (current) return;
				router.$$.fragment.i(local);

				current = true;
			},

			o(local) {
				router.$$.fragment.o(local);
				current = false;
			},

			d(detaching) {
				router.$destroy(detaching);
			}
		};
	}

	class App extends SvelteComponent {
		constructor(options) {
			super();
			init(this, options, null, create_fragment$5, safe_not_equal, []);
		}
	}

	new App({ // eslint-disable-line
	  target: document.querySelector('#app'),
	});

}());

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsibm9kZV9tb2R1bGVzL3N2ZWx0ZS9pbnRlcm5hbC5tanMiLCJub2RlX21vZHVsZXMvc3RyaWN0LXVyaS1lbmNvZGUvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZGVjb2RlLXVyaS1jb21wb25lbnQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvc3BsaXQtb24tZmlyc3QvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcXVlcnktc3RyaW5nL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Fic3RyYWN0LW5lc3RlZC1yb3V0ZXIvZGlzdC9pbmRleC5lc20uanMiLCJub2RlX21vZHVsZXMvc3ZlbHRlL3N0b3JlLm1qcyIsIm5vZGVfbW9kdWxlcy95cnYvc3JjL3V0aWxzLmpzIiwibm9kZV9tb2R1bGVzL3lydi9zcmMvUm91dGVyLnN2ZWx0ZSIsIm5vZGVfbW9kdWxlcy95cnYvc3JjL1JvdXRlLnN2ZWx0ZSIsIm5vZGVfbW9kdWxlcy95cnYvc3JjL0xpbmsuc3ZlbHRlIiwibm9kZV9tb2R1bGVzL3lydi9zcmMvaW5kZXguanMiLCJzcmMvYXBwL2NvbXBvbmVudHMvQXBwLnN2ZWx0ZSIsInNyYy9hcHAvbWFpbi5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJmdW5jdGlvbiBub29wKCkge31cblxuY29uc3QgaWRlbnRpdHkgPSB4ID0+IHg7XG5cbmZ1bmN0aW9uIGFzc2lnbih0YXIsIHNyYykge1xuXHRmb3IgKGNvbnN0IGsgaW4gc3JjKSB0YXJba10gPSBzcmNba107XG5cdHJldHVybiB0YXI7XG59XG5cbmZ1bmN0aW9uIGlzX3Byb21pc2UodmFsdWUpIHtcblx0cmV0dXJuIHZhbHVlICYmIHR5cGVvZiB2YWx1ZS50aGVuID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBhZGRfbG9jYXRpb24oZWxlbWVudCwgZmlsZSwgbGluZSwgY29sdW1uLCBjaGFyKSB7XG5cdGVsZW1lbnQuX19zdmVsdGVfbWV0YSA9IHtcblx0XHRsb2M6IHsgZmlsZSwgbGluZSwgY29sdW1uLCBjaGFyIH1cblx0fTtcbn1cblxuZnVuY3Rpb24gcnVuKGZuKSB7XG5cdHJldHVybiBmbigpO1xufVxuXG5mdW5jdGlvbiBibGFua19vYmplY3QoKSB7XG5cdHJldHVybiBPYmplY3QuY3JlYXRlKG51bGwpO1xufVxuXG5mdW5jdGlvbiBydW5fYWxsKGZucykge1xuXHRmbnMuZm9yRWFjaChydW4pO1xufVxuXG5mdW5jdGlvbiBpc19mdW5jdGlvbih0aGluZykge1xuXHRyZXR1cm4gdHlwZW9mIHRoaW5nID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBzYWZlX25vdF9lcXVhbChhLCBiKSB7XG5cdHJldHVybiBhICE9IGEgPyBiID09IGIgOiBhICE9PSBiIHx8ICgoYSAmJiB0eXBlb2YgYSA9PT0gJ29iamVjdCcpIHx8IHR5cGVvZiBhID09PSAnZnVuY3Rpb24nKTtcbn1cblxuZnVuY3Rpb24gbm90X2VxdWFsKGEsIGIpIHtcblx0cmV0dXJuIGEgIT0gYSA/IGIgPT0gYiA6IGEgIT09IGI7XG59XG5cbmZ1bmN0aW9uIHZhbGlkYXRlX3N0b3JlKHN0b3JlLCBuYW1lKSB7XG5cdGlmICghc3RvcmUgfHwgdHlwZW9mIHN0b3JlLnN1YnNjcmliZSAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdHRocm93IG5ldyBFcnJvcihgJyR7bmFtZX0nIGlzIG5vdCBhIHN0b3JlIHdpdGggYSAnc3Vic2NyaWJlJyBtZXRob2RgKTtcblx0fVxufVxuXG5mdW5jdGlvbiBzdWJzY3JpYmUoY29tcG9uZW50LCBzdG9yZSwgY2FsbGJhY2spIHtcblx0Y29uc3QgdW5zdWIgPSBzdG9yZS5zdWJzY3JpYmUoY2FsbGJhY2spO1xuXG5cdGNvbXBvbmVudC4kJC5vbl9kZXN0cm95LnB1c2godW5zdWIudW5zdWJzY3JpYmVcblx0XHQ/ICgpID0+IHVuc3ViLnVuc3Vic2NyaWJlKClcblx0XHQ6IHVuc3ViKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlX3Nsb3QoZGVmaW5pdGlvbiwgY3R4LCBmbikge1xuXHRpZiAoZGVmaW5pdGlvbikge1xuXHRcdGNvbnN0IHNsb3RfY3R4ID0gZ2V0X3Nsb3RfY29udGV4dChkZWZpbml0aW9uLCBjdHgsIGZuKTtcblx0XHRyZXR1cm4gZGVmaW5pdGlvblswXShzbG90X2N0eCk7XG5cdH1cbn1cblxuZnVuY3Rpb24gZ2V0X3Nsb3RfY29udGV4dChkZWZpbml0aW9uLCBjdHgsIGZuKSB7XG5cdHJldHVybiBkZWZpbml0aW9uWzFdXG5cdFx0PyBhc3NpZ24oe30sIGFzc2lnbihjdHguJCRzY29wZS5jdHgsIGRlZmluaXRpb25bMV0oZm4gPyBmbihjdHgpIDoge30pKSlcblx0XHQ6IGN0eC4kJHNjb3BlLmN0eDtcbn1cblxuZnVuY3Rpb24gZ2V0X3Nsb3RfY2hhbmdlcyhkZWZpbml0aW9uLCBjdHgsIGNoYW5nZWQsIGZuKSB7XG5cdHJldHVybiBkZWZpbml0aW9uWzFdXG5cdFx0PyBhc3NpZ24oe30sIGFzc2lnbihjdHguJCRzY29wZS5jaGFuZ2VkIHx8IHt9LCBkZWZpbml0aW9uWzFdKGZuID8gZm4oY2hhbmdlZCkgOiB7fSkpKVxuXHRcdDogY3R4LiQkc2NvcGUuY2hhbmdlZCB8fCB7fTtcbn1cblxuZnVuY3Rpb24gZXhjbHVkZV9pbnRlcm5hbF9wcm9wcyhwcm9wcykge1xuXHRjb25zdCByZXN1bHQgPSB7fTtcblx0Zm9yIChjb25zdCBrIGluIHByb3BzKSBpZiAoa1swXSAhPT0gJyQnKSByZXN1bHRba10gPSBwcm9wc1trXTtcblx0cmV0dXJuIHJlc3VsdDtcbn1cblxuY29uc3QgdGFza3MgPSBuZXcgU2V0KCk7XG5sZXQgcnVubmluZyA9IGZhbHNlO1xuXG5mdW5jdGlvbiBydW5fdGFza3MoKSB7XG5cdHRhc2tzLmZvckVhY2godGFzayA9PiB7XG5cdFx0aWYgKCF0YXNrWzBdKHdpbmRvdy5wZXJmb3JtYW5jZS5ub3coKSkpIHtcblx0XHRcdHRhc2tzLmRlbGV0ZSh0YXNrKTtcblx0XHRcdHRhc2tbMV0oKTtcblx0XHR9XG5cdH0pO1xuXG5cdHJ1bm5pbmcgPSB0YXNrcy5zaXplID4gMDtcblx0aWYgKHJ1bm5pbmcpIHJlcXVlc3RBbmltYXRpb25GcmFtZShydW5fdGFza3MpO1xufVxuXG5mdW5jdGlvbiBjbGVhcl9sb29wcygpIHtcblx0Ly8gZm9yIHRlc3RpbmcuLi5cblx0dGFza3MuZm9yRWFjaCh0YXNrID0+IHRhc2tzLmRlbGV0ZSh0YXNrKSk7XG5cdHJ1bm5pbmcgPSBmYWxzZTtcbn1cblxuZnVuY3Rpb24gbG9vcChmbikge1xuXHRsZXQgdGFzaztcblxuXHRpZiAoIXJ1bm5pbmcpIHtcblx0XHRydW5uaW5nID0gdHJ1ZTtcblx0XHRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUocnVuX3Rhc2tzKTtcblx0fVxuXG5cdHJldHVybiB7XG5cdFx0cHJvbWlzZTogbmV3IFByb21pc2UoZnVsZmlsID0+IHtcblx0XHRcdHRhc2tzLmFkZCh0YXNrID0gW2ZuLCBmdWxmaWxdKTtcblx0XHR9KSxcblx0XHRhYm9ydCgpIHtcblx0XHRcdHRhc2tzLmRlbGV0ZSh0YXNrKTtcblx0XHR9XG5cdH07XG59XG5cbmZ1bmN0aW9uIGFwcGVuZCh0YXJnZXQsIG5vZGUpIHtcblx0dGFyZ2V0LmFwcGVuZENoaWxkKG5vZGUpO1xufVxuXG5mdW5jdGlvbiBpbnNlcnQodGFyZ2V0LCBub2RlLCBhbmNob3IpIHtcblx0dGFyZ2V0Lmluc2VydEJlZm9yZShub2RlLCBhbmNob3IgfHwgbnVsbCk7XG59XG5cbmZ1bmN0aW9uIGRldGFjaChub2RlKSB7XG5cdG5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChub2RlKTtcbn1cblxuZnVuY3Rpb24gZGV0YWNoX2JldHdlZW4oYmVmb3JlLCBhZnRlcikge1xuXHR3aGlsZSAoYmVmb3JlLm5leHRTaWJsaW5nICYmIGJlZm9yZS5uZXh0U2libGluZyAhPT0gYWZ0ZXIpIHtcblx0XHRiZWZvcmUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChiZWZvcmUubmV4dFNpYmxpbmcpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGRldGFjaF9iZWZvcmUoYWZ0ZXIpIHtcblx0d2hpbGUgKGFmdGVyLnByZXZpb3VzU2libGluZykge1xuXHRcdGFmdGVyLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoYWZ0ZXIucHJldmlvdXNTaWJsaW5nKTtcblx0fVxufVxuXG5mdW5jdGlvbiBkZXRhY2hfYWZ0ZXIoYmVmb3JlKSB7XG5cdHdoaWxlIChiZWZvcmUubmV4dFNpYmxpbmcpIHtcblx0XHRiZWZvcmUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChiZWZvcmUubmV4dFNpYmxpbmcpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGRlc3Ryb3lfZWFjaChpdGVyYXRpb25zLCBkZXRhY2hpbmcpIHtcblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBpdGVyYXRpb25zLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0aWYgKGl0ZXJhdGlvbnNbaV0pIGl0ZXJhdGlvbnNbaV0uZChkZXRhY2hpbmcpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGVsZW1lbnQobmFtZSkge1xuXHRyZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChuYW1lKTtcbn1cblxuZnVuY3Rpb24gb2JqZWN0X3dpdGhvdXRfcHJvcGVydGllcyhvYmosIGV4Y2x1ZGUpIHtcblx0Y29uc3QgdGFyZ2V0ID0ge307XG5cdGZvciAoY29uc3QgayBpbiBvYmopIHtcblx0XHRpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgaykgJiYgZXhjbHVkZS5pbmRleE9mKGspID09PSAtMSkge1xuXHRcdFx0dGFyZ2V0W2tdID0gb2JqW2tdO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gdGFyZ2V0O1xufVxuXG5mdW5jdGlvbiBzdmdfZWxlbWVudChuYW1lKSB7XG5cdHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgbmFtZSk7XG59XG5cbmZ1bmN0aW9uIHRleHQoZGF0YSkge1xuXHRyZXR1cm4gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoZGF0YSk7XG59XG5cbmZ1bmN0aW9uIHNwYWNlKCkge1xuXHRyZXR1cm4gdGV4dCgnICcpO1xufVxuXG5mdW5jdGlvbiBlbXB0eSgpIHtcblx0cmV0dXJuIHRleHQoJycpO1xufVxuXG5mdW5jdGlvbiBsaXN0ZW4obm9kZSwgZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMpIHtcblx0bm9kZS5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBoYW5kbGVyLCBvcHRpb25zKTtcblx0cmV0dXJuICgpID0+IG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgaGFuZGxlciwgb3B0aW9ucyk7XG59XG5cbmZ1bmN0aW9uIHByZXZlbnRfZGVmYXVsdChmbikge1xuXHRyZXR1cm4gZnVuY3Rpb24oZXZlbnQpIHtcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdHJldHVybiBmbi5jYWxsKHRoaXMsIGV2ZW50KTtcblx0fTtcbn1cblxuZnVuY3Rpb24gc3RvcF9wcm9wYWdhdGlvbihmbikge1xuXHRyZXR1cm4gZnVuY3Rpb24oZXZlbnQpIHtcblx0XHRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRyZXR1cm4gZm4uY2FsbCh0aGlzLCBldmVudCk7XG5cdH07XG59XG5cbmZ1bmN0aW9uIGF0dHIobm9kZSwgYXR0cmlidXRlLCB2YWx1ZSkge1xuXHRpZiAodmFsdWUgPT0gbnVsbCkgbm9kZS5yZW1vdmVBdHRyaWJ1dGUoYXR0cmlidXRlKTtcblx0ZWxzZSBub2RlLnNldEF0dHJpYnV0ZShhdHRyaWJ1dGUsIHZhbHVlKTtcbn1cblxuZnVuY3Rpb24gc2V0X2F0dHJpYnV0ZXMobm9kZSwgYXR0cmlidXRlcykge1xuXHRmb3IgKGNvbnN0IGtleSBpbiBhdHRyaWJ1dGVzKSB7XG5cdFx0aWYgKGtleSA9PT0gJ3N0eWxlJykge1xuXHRcdFx0bm9kZS5zdHlsZS5jc3NUZXh0ID0gYXR0cmlidXRlc1trZXldO1xuXHRcdH0gZWxzZSBpZiAoa2V5IGluIG5vZGUpIHtcblx0XHRcdG5vZGVba2V5XSA9IGF0dHJpYnV0ZXNba2V5XTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0YXR0cihub2RlLCBrZXksIGF0dHJpYnV0ZXNba2V5XSk7XG5cdFx0fVxuXHR9XG59XG5cbmZ1bmN0aW9uIHNldF9jdXN0b21fZWxlbWVudF9kYXRhKG5vZGUsIHByb3AsIHZhbHVlKSB7XG5cdGlmIChwcm9wIGluIG5vZGUpIHtcblx0XHRub2RlW3Byb3BdID0gdmFsdWU7XG5cdH0gZWxzZSB7XG5cdFx0YXR0cihub2RlLCBwcm9wLCB2YWx1ZSk7XG5cdH1cbn1cblxuZnVuY3Rpb24geGxpbmtfYXR0cihub2RlLCBhdHRyaWJ1dGUsIHZhbHVlKSB7XG5cdG5vZGUuc2V0QXR0cmlidXRlTlMoJ2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsnLCBhdHRyaWJ1dGUsIHZhbHVlKTtcbn1cblxuZnVuY3Rpb24gZ2V0X2JpbmRpbmdfZ3JvdXBfdmFsdWUoZ3JvdXApIHtcblx0Y29uc3QgdmFsdWUgPSBbXTtcblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBncm91cC5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdGlmIChncm91cFtpXS5jaGVja2VkKSB2YWx1ZS5wdXNoKGdyb3VwW2ldLl9fdmFsdWUpO1xuXHR9XG5cdHJldHVybiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gdG9fbnVtYmVyKHZhbHVlKSB7XG5cdHJldHVybiB2YWx1ZSA9PT0gJycgPyB1bmRlZmluZWQgOiArdmFsdWU7XG59XG5cbmZ1bmN0aW9uIHRpbWVfcmFuZ2VzX3RvX2FycmF5KHJhbmdlcykge1xuXHRjb25zdCBhcnJheSA9IFtdO1xuXHRmb3IgKGxldCBpID0gMDsgaSA8IHJhbmdlcy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdGFycmF5LnB1c2goeyBzdGFydDogcmFuZ2VzLnN0YXJ0KGkpLCBlbmQ6IHJhbmdlcy5lbmQoaSkgfSk7XG5cdH1cblx0cmV0dXJuIGFycmF5O1xufVxuXG5mdW5jdGlvbiBjaGlsZHJlbihlbGVtZW50KSB7XG5cdHJldHVybiBBcnJheS5mcm9tKGVsZW1lbnQuY2hpbGROb2Rlcyk7XG59XG5cbmZ1bmN0aW9uIGNsYWltX2VsZW1lbnQobm9kZXMsIG5hbWUsIGF0dHJpYnV0ZXMsIHN2Zykge1xuXHRmb3IgKGxldCBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0Y29uc3Qgbm9kZSA9IG5vZGVzW2ldO1xuXHRcdGlmIChub2RlLm5vZGVOYW1lID09PSBuYW1lKSB7XG5cdFx0XHRmb3IgKGxldCBqID0gMDsgaiA8IG5vZGUuYXR0cmlidXRlcy5sZW5ndGg7IGogKz0gMSkge1xuXHRcdFx0XHRjb25zdCBhdHRyaWJ1dGUgPSBub2RlLmF0dHJpYnV0ZXNbal07XG5cdFx0XHRcdGlmICghYXR0cmlidXRlc1thdHRyaWJ1dGUubmFtZV0pIG5vZGUucmVtb3ZlQXR0cmlidXRlKGF0dHJpYnV0ZS5uYW1lKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBub2Rlcy5zcGxpY2UoaSwgMSlbMF07IC8vIFRPRE8gc3RyaXAgdW53YW50ZWQgYXR0cmlidXRlc1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBzdmcgPyBzdmdfZWxlbWVudChuYW1lKSA6IGVsZW1lbnQobmFtZSk7XG59XG5cbmZ1bmN0aW9uIGNsYWltX3RleHQobm9kZXMsIGRhdGEpIHtcblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdGNvbnN0IG5vZGUgPSBub2Rlc1tpXTtcblx0XHRpZiAobm9kZS5ub2RlVHlwZSA9PT0gMykge1xuXHRcdFx0bm9kZS5kYXRhID0gZGF0YTtcblx0XHRcdHJldHVybiBub2Rlcy5zcGxpY2UoaSwgMSlbMF07XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHRleHQoZGF0YSk7XG59XG5cbmZ1bmN0aW9uIHNldF9kYXRhKHRleHQsIGRhdGEpIHtcblx0ZGF0YSA9ICcnICsgZGF0YTtcblx0aWYgKHRleHQuZGF0YSAhPT0gZGF0YSkgdGV4dC5kYXRhID0gZGF0YTtcbn1cblxuZnVuY3Rpb24gc2V0X2lucHV0X3R5cGUoaW5wdXQsIHR5cGUpIHtcblx0dHJ5IHtcblx0XHRpbnB1dC50eXBlID0gdHlwZTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdC8vIGRvIG5vdGhpbmdcblx0fVxufVxuXG5mdW5jdGlvbiBzZXRfc3R5bGUobm9kZSwga2V5LCB2YWx1ZSkge1xuXHRub2RlLnN0eWxlLnNldFByb3BlcnR5KGtleSwgdmFsdWUpO1xufVxuXG5mdW5jdGlvbiBzZWxlY3Rfb3B0aW9uKHNlbGVjdCwgdmFsdWUpIHtcblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3Qub3B0aW9ucy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdGNvbnN0IG9wdGlvbiA9IHNlbGVjdC5vcHRpb25zW2ldO1xuXG5cdFx0aWYgKG9wdGlvbi5fX3ZhbHVlID09PSB2YWx1ZSkge1xuXHRcdFx0b3B0aW9uLnNlbGVjdGVkID0gdHJ1ZTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdH1cbn1cblxuZnVuY3Rpb24gc2VsZWN0X29wdGlvbnMoc2VsZWN0LCB2YWx1ZSkge1xuXHRmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdC5vcHRpb25zLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0Y29uc3Qgb3B0aW9uID0gc2VsZWN0Lm9wdGlvbnNbaV07XG5cdFx0b3B0aW9uLnNlbGVjdGVkID0gfnZhbHVlLmluZGV4T2Yob3B0aW9uLl9fdmFsdWUpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHNlbGVjdF92YWx1ZShzZWxlY3QpIHtcblx0Y29uc3Qgc2VsZWN0ZWRfb3B0aW9uID0gc2VsZWN0LnF1ZXJ5U2VsZWN0b3IoJzpjaGVja2VkJykgfHwgc2VsZWN0Lm9wdGlvbnNbMF07XG5cdHJldHVybiBzZWxlY3RlZF9vcHRpb24gJiYgc2VsZWN0ZWRfb3B0aW9uLl9fdmFsdWU7XG59XG5cbmZ1bmN0aW9uIHNlbGVjdF9tdWx0aXBsZV92YWx1ZShzZWxlY3QpIHtcblx0cmV0dXJuIFtdLm1hcC5jYWxsKHNlbGVjdC5xdWVyeVNlbGVjdG9yQWxsKCc6Y2hlY2tlZCcpLCBvcHRpb24gPT4gb3B0aW9uLl9fdmFsdWUpO1xufVxuXG5mdW5jdGlvbiBhZGRfcmVzaXplX2xpc3RlbmVyKGVsZW1lbnQsIGZuKSB7XG5cdGlmIChnZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQpLnBvc2l0aW9uID09PSAnc3RhdGljJykge1xuXHRcdGVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuXHR9XG5cblx0Y29uc3Qgb2JqZWN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb2JqZWN0Jyk7XG5cdG9iamVjdC5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgJ2Rpc3BsYXk6IGJsb2NrOyBwb3NpdGlvbjogYWJzb2x1dGU7IHRvcDogMDsgbGVmdDogMDsgaGVpZ2h0OiAxMDAlOyB3aWR0aDogMTAwJTsgb3ZlcmZsb3c6IGhpZGRlbjsgcG9pbnRlci1ldmVudHM6IG5vbmU7IHotaW5kZXg6IC0xOycpO1xuXHRvYmplY3QudHlwZSA9ICd0ZXh0L2h0bWwnO1xuXG5cdGxldCB3aW47XG5cblx0b2JqZWN0Lm9ubG9hZCA9ICgpID0+IHtcblx0XHR3aW4gPSBvYmplY3QuY29udGVudERvY3VtZW50LmRlZmF1bHRWaWV3O1xuXHRcdHdpbi5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBmbik7XG5cdH07XG5cblx0aWYgKC9UcmlkZW50Ly50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpKSB7XG5cdFx0ZWxlbWVudC5hcHBlbmRDaGlsZChvYmplY3QpO1xuXHRcdG9iamVjdC5kYXRhID0gJ2Fib3V0OmJsYW5rJztcblx0fSBlbHNlIHtcblx0XHRvYmplY3QuZGF0YSA9ICdhYm91dDpibGFuayc7XG5cdFx0ZWxlbWVudC5hcHBlbmRDaGlsZChvYmplY3QpO1xuXHR9XG5cblx0cmV0dXJuIHtcblx0XHRjYW5jZWw6ICgpID0+IHtcblx0XHRcdHdpbiAmJiB3aW4ucmVtb3ZlRXZlbnRMaXN0ZW5lciAmJiB3aW4ucmVtb3ZlRXZlbnRMaXN0ZW5lcigncmVzaXplJywgZm4pO1xuXHRcdFx0ZWxlbWVudC5yZW1vdmVDaGlsZChvYmplY3QpO1xuXHRcdH1cblx0fTtcbn1cblxuZnVuY3Rpb24gdG9nZ2xlX2NsYXNzKGVsZW1lbnQsIG5hbWUsIHRvZ2dsZSkge1xuXHRlbGVtZW50LmNsYXNzTGlzdFt0b2dnbGUgPyAnYWRkJyA6ICdyZW1vdmUnXShuYW1lKTtcbn1cblxuZnVuY3Rpb24gY3VzdG9tX2V2ZW50KHR5cGUsIGRldGFpbCkge1xuXHRjb25zdCBlID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0N1c3RvbUV2ZW50Jyk7XG5cdGUuaW5pdEN1c3RvbUV2ZW50KHR5cGUsIGZhbHNlLCBmYWxzZSwgZGV0YWlsKTtcblx0cmV0dXJuIGU7XG59XG5cbmxldCBzdHlsZXNoZWV0O1xubGV0IGFjdGl2ZSA9IDA7XG5sZXQgY3VycmVudF9ydWxlcyA9IHt9O1xuXG4vLyBodHRwczovL2dpdGh1Yi5jb20vZGFya3NreWFwcC9zdHJpbmctaGFzaC9ibG9iL21hc3Rlci9pbmRleC5qc1xuZnVuY3Rpb24gaGFzaChzdHIpIHtcblx0bGV0IGhhc2ggPSA1MzgxO1xuXHRsZXQgaSA9IHN0ci5sZW5ndGg7XG5cblx0d2hpbGUgKGktLSkgaGFzaCA9ICgoaGFzaCA8PCA1KSAtIGhhc2gpIF4gc3RyLmNoYXJDb2RlQXQoaSk7XG5cdHJldHVybiBoYXNoID4+PiAwO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVfcnVsZShub2RlLCBhLCBiLCBkdXJhdGlvbiwgZGVsYXksIGVhc2UsIGZuLCB1aWQgPSAwKSB7XG5cdGNvbnN0IHN0ZXAgPSAxNi42NjYgLyBkdXJhdGlvbjtcblx0bGV0IGtleWZyYW1lcyA9ICd7XFxuJztcblxuXHRmb3IgKGxldCBwID0gMDsgcCA8PSAxOyBwICs9IHN0ZXApIHtcblx0XHRjb25zdCB0ID0gYSArIChiIC0gYSkgKiBlYXNlKHApO1xuXHRcdGtleWZyYW1lcyArPSBwICogMTAwICsgYCV7JHtmbih0LCAxIC0gdCl9fVxcbmA7XG5cdH1cblxuXHRjb25zdCBydWxlID0ga2V5ZnJhbWVzICsgYDEwMCUgeyR7Zm4oYiwgMSAtIGIpfX1cXG59YDtcblx0Y29uc3QgbmFtZSA9IGBfX3N2ZWx0ZV8ke2hhc2gocnVsZSl9XyR7dWlkfWA7XG5cblx0aWYgKCFjdXJyZW50X3J1bGVzW25hbWVdKSB7XG5cdFx0aWYgKCFzdHlsZXNoZWV0KSB7XG5cdFx0XHRjb25zdCBzdHlsZSA9IGVsZW1lbnQoJ3N0eWxlJyk7XG5cdFx0XHRkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKTtcblx0XHRcdHN0eWxlc2hlZXQgPSBzdHlsZS5zaGVldDtcblx0XHR9XG5cblx0XHRjdXJyZW50X3J1bGVzW25hbWVdID0gdHJ1ZTtcblx0XHRzdHlsZXNoZWV0Lmluc2VydFJ1bGUoYEBrZXlmcmFtZXMgJHtuYW1lfSAke3J1bGV9YCwgc3R5bGVzaGVldC5jc3NSdWxlcy5sZW5ndGgpO1xuXHR9XG5cblx0Y29uc3QgYW5pbWF0aW9uID0gbm9kZS5zdHlsZS5hbmltYXRpb24gfHwgJyc7XG5cdG5vZGUuc3R5bGUuYW5pbWF0aW9uID0gYCR7YW5pbWF0aW9uID8gYCR7YW5pbWF0aW9ufSwgYCA6IGBgfSR7bmFtZX0gJHtkdXJhdGlvbn1tcyBsaW5lYXIgJHtkZWxheX1tcyAxIGJvdGhgO1xuXG5cdGFjdGl2ZSArPSAxO1xuXHRyZXR1cm4gbmFtZTtcbn1cblxuZnVuY3Rpb24gZGVsZXRlX3J1bGUobm9kZSwgbmFtZSkge1xuXHRub2RlLnN0eWxlLmFuaW1hdGlvbiA9IChub2RlLnN0eWxlLmFuaW1hdGlvbiB8fCAnJylcblx0XHQuc3BsaXQoJywgJylcblx0XHQuZmlsdGVyKG5hbWVcblx0XHRcdD8gYW5pbSA9PiBhbmltLmluZGV4T2YobmFtZSkgPCAwIC8vIHJlbW92ZSBzcGVjaWZpYyBhbmltYXRpb25cblx0XHRcdDogYW5pbSA9PiBhbmltLmluZGV4T2YoJ19fc3ZlbHRlJykgPT09IC0xIC8vIHJlbW92ZSBhbGwgU3ZlbHRlIGFuaW1hdGlvbnNcblx0XHQpXG5cdFx0LmpvaW4oJywgJyk7XG5cblx0aWYgKG5hbWUgJiYgIS0tYWN0aXZlKSBjbGVhcl9ydWxlcygpO1xufVxuXG5mdW5jdGlvbiBjbGVhcl9ydWxlcygpIHtcblx0cmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcblx0XHRpZiAoYWN0aXZlKSByZXR1cm47XG5cdFx0bGV0IGkgPSBzdHlsZXNoZWV0LmNzc1J1bGVzLmxlbmd0aDtcblx0XHR3aGlsZSAoaS0tKSBzdHlsZXNoZWV0LmRlbGV0ZVJ1bGUoaSk7XG5cdFx0Y3VycmVudF9ydWxlcyA9IHt9O1xuXHR9KTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlX2FuaW1hdGlvbihub2RlLCBmcm9tLCBmbiwgcGFyYW1zKSB7XG5cdGlmICghZnJvbSkgcmV0dXJuIG5vb3A7XG5cblx0Y29uc3QgdG8gPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXHRpZiAoZnJvbS5sZWZ0ID09PSB0by5sZWZ0ICYmIGZyb20ucmlnaHQgPT09IHRvLnJpZ2h0ICYmIGZyb20udG9wID09PSB0by50b3AgJiYgZnJvbS5ib3R0b20gPT09IHRvLmJvdHRvbSkgcmV0dXJuIG5vb3A7XG5cblx0Y29uc3Qge1xuXHRcdGRlbGF5ID0gMCxcblx0XHRkdXJhdGlvbiA9IDMwMCxcblx0XHRlYXNpbmcgPSBpZGVudGl0eSxcblx0XHRzdGFydDogc3RhcnRfdGltZSA9IHdpbmRvdy5wZXJmb3JtYW5jZS5ub3coKSArIGRlbGF5LFxuXHRcdGVuZCA9IHN0YXJ0X3RpbWUgKyBkdXJhdGlvbixcblx0XHR0aWNrID0gbm9vcCxcblx0XHRjc3Ncblx0fSA9IGZuKG5vZGUsIHsgZnJvbSwgdG8gfSwgcGFyYW1zKTtcblxuXHRsZXQgcnVubmluZyA9IHRydWU7XG5cdGxldCBzdGFydGVkID0gZmFsc2U7XG5cdGxldCBuYW1lO1xuXG5cdGNvbnN0IGNzc190ZXh0ID0gbm9kZS5zdHlsZS5jc3NUZXh0O1xuXG5cdGZ1bmN0aW9uIHN0YXJ0KCkge1xuXHRcdGlmIChjc3MpIHtcblx0XHRcdGlmIChkZWxheSkgbm9kZS5zdHlsZS5jc3NUZXh0ID0gY3NzX3RleHQ7IC8vIFRPRE8gY3JlYXRlIGRlbGF5ZWQgYW5pbWF0aW9uIGluc3RlYWQ/XG5cdFx0XHRuYW1lID0gY3JlYXRlX3J1bGUobm9kZSwgMCwgMSwgZHVyYXRpb24sIDAsIGVhc2luZywgY3NzKTtcblx0XHR9XG5cblx0XHRzdGFydGVkID0gdHJ1ZTtcblx0fVxuXG5cdGZ1bmN0aW9uIHN0b3AoKSB7XG5cdFx0aWYgKGNzcykgZGVsZXRlX3J1bGUobm9kZSwgbmFtZSk7XG5cdFx0cnVubmluZyA9IGZhbHNlO1xuXHR9XG5cblx0bG9vcChub3cgPT4ge1xuXHRcdGlmICghc3RhcnRlZCAmJiBub3cgPj0gc3RhcnRfdGltZSkge1xuXHRcdFx0c3RhcnQoKTtcblx0XHR9XG5cblx0XHRpZiAoc3RhcnRlZCAmJiBub3cgPj0gZW5kKSB7XG5cdFx0XHR0aWNrKDEsIDApO1xuXHRcdFx0c3RvcCgpO1xuXHRcdH1cblxuXHRcdGlmICghcnVubmluZykge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdGlmIChzdGFydGVkKSB7XG5cdFx0XHRjb25zdCBwID0gbm93IC0gc3RhcnRfdGltZTtcblx0XHRcdGNvbnN0IHQgPSAwICsgMSAqIGVhc2luZyhwIC8gZHVyYXRpb24pO1xuXHRcdFx0dGljayh0LCAxIC0gdCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH0pO1xuXG5cdGlmIChkZWxheSkge1xuXHRcdGlmIChjc3MpIG5vZGUuc3R5bGUuY3NzVGV4dCArPSBjc3MoMCwgMSk7XG5cdH0gZWxzZSB7XG5cdFx0c3RhcnQoKTtcblx0fVxuXG5cdHRpY2soMCwgMSk7XG5cblx0cmV0dXJuIHN0b3A7XG59XG5cbmZ1bmN0aW9uIGZpeF9wb3NpdGlvbihub2RlKSB7XG5cdGNvbnN0IHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShub2RlKTtcblxuXHRpZiAoc3R5bGUucG9zaXRpb24gIT09ICdhYnNvbHV0ZScgJiYgc3R5bGUucG9zaXRpb24gIT09ICdmaXhlZCcpIHtcblx0XHRjb25zdCB7IHdpZHRoLCBoZWlnaHQgfSA9IHN0eWxlO1xuXHRcdGNvbnN0IGEgPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXHRcdG5vZGUuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdG5vZGUuc3R5bGUud2lkdGggPSB3aWR0aDtcblx0XHRub2RlLnN0eWxlLmhlaWdodCA9IGhlaWdodDtcblx0XHRjb25zdCBiID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuXHRcdGlmIChhLmxlZnQgIT09IGIubGVmdCB8fCBhLnRvcCAhPT0gYi50b3ApIHtcblx0XHRcdGNvbnN0IHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShub2RlKTtcblx0XHRcdGNvbnN0IHRyYW5zZm9ybSA9IHN0eWxlLnRyYW5zZm9ybSA9PT0gJ25vbmUnID8gJycgOiBzdHlsZS50cmFuc2Zvcm07XG5cblx0XHRcdG5vZGUuc3R5bGUudHJhbnNmb3JtID0gYCR7dHJhbnNmb3JtfSB0cmFuc2xhdGUoJHthLmxlZnQgLSBiLmxlZnR9cHgsICR7YS50b3AgLSBiLnRvcH1weClgO1xuXHRcdH1cblx0fVxufVxuXG5sZXQgY3VycmVudF9jb21wb25lbnQ7XG5cbmZ1bmN0aW9uIHNldF9jdXJyZW50X2NvbXBvbmVudChjb21wb25lbnQpIHtcblx0Y3VycmVudF9jb21wb25lbnQgPSBjb21wb25lbnQ7XG59XG5cbmZ1bmN0aW9uIGdldF9jdXJyZW50X2NvbXBvbmVudCgpIHtcblx0aWYgKCFjdXJyZW50X2NvbXBvbmVudCkgdGhyb3cgbmV3IEVycm9yKGBGdW5jdGlvbiBjYWxsZWQgb3V0c2lkZSBjb21wb25lbnQgaW5pdGlhbGl6YXRpb25gKTtcblx0cmV0dXJuIGN1cnJlbnRfY29tcG9uZW50O1xufVxuXG5mdW5jdGlvbiBiZWZvcmVVcGRhdGUoZm4pIHtcblx0Z2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQuYmVmb3JlX3JlbmRlci5wdXNoKGZuKTtcbn1cblxuZnVuY3Rpb24gb25Nb3VudChmbikge1xuXHRnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5vbl9tb3VudC5wdXNoKGZuKTtcbn1cblxuZnVuY3Rpb24gYWZ0ZXJVcGRhdGUoZm4pIHtcblx0Z2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQuYWZ0ZXJfcmVuZGVyLnB1c2goZm4pO1xufVxuXG5mdW5jdGlvbiBvbkRlc3Ryb3koZm4pIHtcblx0Z2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQub25fZGVzdHJveS5wdXNoKGZuKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlRXZlbnREaXNwYXRjaGVyKCkge1xuXHRjb25zdCBjb21wb25lbnQgPSBjdXJyZW50X2NvbXBvbmVudDtcblxuXHRyZXR1cm4gKHR5cGUsIGRldGFpbCkgPT4ge1xuXHRcdGNvbnN0IGNhbGxiYWNrcyA9IGNvbXBvbmVudC4kJC5jYWxsYmFja3NbdHlwZV07XG5cblx0XHRpZiAoY2FsbGJhY2tzKSB7XG5cdFx0XHQvLyBUT0RPIGFyZSB0aGVyZSBzaXR1YXRpb25zIHdoZXJlIGV2ZW50cyBjb3VsZCBiZSBkaXNwYXRjaGVkXG5cdFx0XHQvLyBpbiBhIHNlcnZlciAobm9uLURPTSkgZW52aXJvbm1lbnQ/XG5cdFx0XHRjb25zdCBldmVudCA9IGN1c3RvbV9ldmVudCh0eXBlLCBkZXRhaWwpO1xuXHRcdFx0Y2FsbGJhY2tzLnNsaWNlKCkuZm9yRWFjaChmbiA9PiB7XG5cdFx0XHRcdGZuLmNhbGwoY29tcG9uZW50LCBldmVudCk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH07XG59XG5cbmZ1bmN0aW9uIHNldENvbnRleHQoa2V5LCBjb250ZXh0KSB7XG5cdGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLmNvbnRleHQuc2V0KGtleSwgY29udGV4dCk7XG59XG5cbmZ1bmN0aW9uIGdldENvbnRleHQoa2V5KSB7XG5cdHJldHVybiBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5jb250ZXh0LmdldChrZXkpO1xufVxuXG4vLyBUT0RPIGZpZ3VyZSBvdXQgaWYgd2Ugc3RpbGwgd2FudCB0byBzdXBwb3J0XG4vLyBzaG9ydGhhbmQgZXZlbnRzLCBvciBpZiB3ZSB3YW50IHRvIGltcGxlbWVudFxuLy8gYSByZWFsIGJ1YmJsaW5nIG1lY2hhbmlzbVxuZnVuY3Rpb24gYnViYmxlKGNvbXBvbmVudCwgZXZlbnQpIHtcblx0Y29uc3QgY2FsbGJhY2tzID0gY29tcG9uZW50LiQkLmNhbGxiYWNrc1tldmVudC50eXBlXTtcblxuXHRpZiAoY2FsbGJhY2tzKSB7XG5cdFx0Y2FsbGJhY2tzLnNsaWNlKCkuZm9yRWFjaChmbiA9PiBmbihldmVudCkpO1xuXHR9XG59XG5cbmNvbnN0IGRpcnR5X2NvbXBvbmVudHMgPSBbXTtcbmNvbnN0IGludHJvcyA9IHsgZW5hYmxlZDogZmFsc2UgfTtcblxuY29uc3QgcmVzb2x2ZWRfcHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgpO1xubGV0IHVwZGF0ZV9zY2hlZHVsZWQgPSBmYWxzZTtcbmNvbnN0IGJpbmRpbmdfY2FsbGJhY2tzID0gW107XG5jb25zdCByZW5kZXJfY2FsbGJhY2tzID0gW107XG5jb25zdCBmbHVzaF9jYWxsYmFja3MgPSBbXTtcblxuZnVuY3Rpb24gc2NoZWR1bGVfdXBkYXRlKCkge1xuXHRpZiAoIXVwZGF0ZV9zY2hlZHVsZWQpIHtcblx0XHR1cGRhdGVfc2NoZWR1bGVkID0gdHJ1ZTtcblx0XHRyZXNvbHZlZF9wcm9taXNlLnRoZW4oZmx1c2gpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHRpY2soKSB7XG5cdHNjaGVkdWxlX3VwZGF0ZSgpO1xuXHRyZXR1cm4gcmVzb2x2ZWRfcHJvbWlzZTtcbn1cblxuZnVuY3Rpb24gYWRkX2JpbmRpbmdfY2FsbGJhY2soZm4pIHtcblx0YmluZGluZ19jYWxsYmFja3MucHVzaChmbik7XG59XG5cbmZ1bmN0aW9uIGFkZF9yZW5kZXJfY2FsbGJhY2soZm4pIHtcblx0cmVuZGVyX2NhbGxiYWNrcy5wdXNoKGZuKTtcbn1cblxuZnVuY3Rpb24gYWRkX2ZsdXNoX2NhbGxiYWNrKGZuKSB7XG5cdGZsdXNoX2NhbGxiYWNrcy5wdXNoKGZuKTtcbn1cblxuZnVuY3Rpb24gZmx1c2goKSB7XG5cdGNvbnN0IHNlZW5fY2FsbGJhY2tzID0gbmV3IFNldCgpO1xuXG5cdGRvIHtcblx0XHQvLyBmaXJzdCwgY2FsbCBiZWZvcmVVcGRhdGUgZnVuY3Rpb25zXG5cdFx0Ly8gYW5kIHVwZGF0ZSBjb21wb25lbnRzXG5cdFx0d2hpbGUgKGRpcnR5X2NvbXBvbmVudHMubGVuZ3RoKSB7XG5cdFx0XHRjb25zdCBjb21wb25lbnQgPSBkaXJ0eV9jb21wb25lbnRzLnNoaWZ0KCk7XG5cdFx0XHRzZXRfY3VycmVudF9jb21wb25lbnQoY29tcG9uZW50KTtcblx0XHRcdHVwZGF0ZShjb21wb25lbnQuJCQpO1xuXHRcdH1cblxuXHRcdHdoaWxlIChiaW5kaW5nX2NhbGxiYWNrcy5sZW5ndGgpIGJpbmRpbmdfY2FsbGJhY2tzLnNoaWZ0KCkoKTtcblxuXHRcdC8vIHRoZW4sIG9uY2UgY29tcG9uZW50cyBhcmUgdXBkYXRlZCwgY2FsbFxuXHRcdC8vIGFmdGVyVXBkYXRlIGZ1bmN0aW9ucy4gVGhpcyBtYXkgY2F1c2Vcblx0XHQvLyBzdWJzZXF1ZW50IHVwZGF0ZXMuLi5cblx0XHR3aGlsZSAocmVuZGVyX2NhbGxiYWNrcy5sZW5ndGgpIHtcblx0XHRcdGNvbnN0IGNhbGxiYWNrID0gcmVuZGVyX2NhbGxiYWNrcy5wb3AoKTtcblx0XHRcdGlmICghc2Vlbl9jYWxsYmFja3MuaGFzKGNhbGxiYWNrKSkge1xuXHRcdFx0XHRjYWxsYmFjaygpO1xuXG5cdFx0XHRcdC8vIC4uLnNvIGd1YXJkIGFnYWluc3QgaW5maW5pdGUgbG9vcHNcblx0XHRcdFx0c2Vlbl9jYWxsYmFja3MuYWRkKGNhbGxiYWNrKTtcblx0XHRcdH1cblx0XHR9XG5cdH0gd2hpbGUgKGRpcnR5X2NvbXBvbmVudHMubGVuZ3RoKTtcblxuXHR3aGlsZSAoZmx1c2hfY2FsbGJhY2tzLmxlbmd0aCkge1xuXHRcdGZsdXNoX2NhbGxiYWNrcy5wb3AoKSgpO1xuXHR9XG5cblx0dXBkYXRlX3NjaGVkdWxlZCA9IGZhbHNlO1xufVxuXG5mdW5jdGlvbiB1cGRhdGUoJCQpIHtcblx0aWYgKCQkLmZyYWdtZW50KSB7XG5cdFx0JCQudXBkYXRlKCQkLmRpcnR5KTtcblx0XHRydW5fYWxsKCQkLmJlZm9yZV9yZW5kZXIpO1xuXHRcdCQkLmZyYWdtZW50LnAoJCQuZGlydHksICQkLmN0eCk7XG5cdFx0JCQuZGlydHkgPSBudWxsO1xuXG5cdFx0JCQuYWZ0ZXJfcmVuZGVyLmZvckVhY2goYWRkX3JlbmRlcl9jYWxsYmFjayk7XG5cdH1cbn1cblxubGV0IHByb21pc2U7XG5cbmZ1bmN0aW9uIHdhaXQoKSB7XG5cdGlmICghcHJvbWlzZSkge1xuXHRcdHByb21pc2UgPSBQcm9taXNlLnJlc29sdmUoKTtcblx0XHRwcm9taXNlLnRoZW4oKCkgPT4ge1xuXHRcdFx0cHJvbWlzZSA9IG51bGw7XG5cdFx0fSk7XG5cdH1cblxuXHRyZXR1cm4gcHJvbWlzZTtcbn1cblxuZnVuY3Rpb24gZGlzcGF0Y2gobm9kZSwgZGlyZWN0aW9uLCBraW5kKSB7XG5cdG5vZGUuZGlzcGF0Y2hFdmVudChjdXN0b21fZXZlbnQoYCR7ZGlyZWN0aW9uID8gJ2ludHJvJyA6ICdvdXRybyd9JHtraW5kfWApKTtcbn1cblxubGV0IG91dHJvcztcblxuZnVuY3Rpb24gZ3JvdXBfb3V0cm9zKCkge1xuXHRvdXRyb3MgPSB7XG5cdFx0cmVtYWluaW5nOiAwLFxuXHRcdGNhbGxiYWNrczogW11cblx0fTtcbn1cblxuZnVuY3Rpb24gY2hlY2tfb3V0cm9zKCkge1xuXHRpZiAoIW91dHJvcy5yZW1haW5pbmcpIHtcblx0XHRydW5fYWxsKG91dHJvcy5jYWxsYmFja3MpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIG9uX291dHJvKGNhbGxiYWNrKSB7XG5cdG91dHJvcy5jYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZV9pbl90cmFuc2l0aW9uKG5vZGUsIGZuLCBwYXJhbXMpIHtcblx0bGV0IGNvbmZpZyA9IGZuKG5vZGUsIHBhcmFtcyk7XG5cdGxldCBydW5uaW5nID0gZmFsc2U7XG5cdGxldCBhbmltYXRpb25fbmFtZTtcblx0bGV0IHRhc2s7XG5cdGxldCB1aWQgPSAwO1xuXG5cdGZ1bmN0aW9uIGNsZWFudXAoKSB7XG5cdFx0aWYgKGFuaW1hdGlvbl9uYW1lKSBkZWxldGVfcnVsZShub2RlLCBhbmltYXRpb25fbmFtZSk7XG5cdH1cblxuXHRmdW5jdGlvbiBnbygpIHtcblx0XHRjb25zdCB7XG5cdFx0XHRkZWxheSA9IDAsXG5cdFx0XHRkdXJhdGlvbiA9IDMwMCxcblx0XHRcdGVhc2luZyA9IGlkZW50aXR5LFxuXHRcdFx0dGljazogdGljayQkMSA9IG5vb3AsXG5cdFx0XHRjc3Ncblx0XHR9ID0gY29uZmlnO1xuXG5cdFx0aWYgKGNzcykgYW5pbWF0aW9uX25hbWUgPSBjcmVhdGVfcnVsZShub2RlLCAwLCAxLCBkdXJhdGlvbiwgZGVsYXksIGVhc2luZywgY3NzLCB1aWQrKyk7XG5cdFx0dGljayQkMSgwLCAxKTtcblxuXHRcdGNvbnN0IHN0YXJ0X3RpbWUgPSB3aW5kb3cucGVyZm9ybWFuY2Uubm93KCkgKyBkZWxheTtcblx0XHRjb25zdCBlbmRfdGltZSA9IHN0YXJ0X3RpbWUgKyBkdXJhdGlvbjtcblxuXHRcdGlmICh0YXNrKSB0YXNrLmFib3J0KCk7XG5cdFx0cnVubmluZyA9IHRydWU7XG5cblx0XHR0YXNrID0gbG9vcChub3cgPT4ge1xuXHRcdFx0aWYgKHJ1bm5pbmcpIHtcblx0XHRcdFx0aWYgKG5vdyA+PSBlbmRfdGltZSkge1xuXHRcdFx0XHRcdHRpY2skJDEoMSwgMCk7XG5cdFx0XHRcdFx0Y2xlYW51cCgpO1xuXHRcdFx0XHRcdHJldHVybiBydW5uaW5nID0gZmFsc2U7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAobm93ID49IHN0YXJ0X3RpbWUpIHtcblx0XHRcdFx0XHRjb25zdCB0ID0gZWFzaW5nKChub3cgLSBzdGFydF90aW1lKSAvIGR1cmF0aW9uKTtcblx0XHRcdFx0XHR0aWNrJCQxKHQsIDEgLSB0KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gcnVubmluZztcblx0XHR9KTtcblx0fVxuXG5cdGxldCBzdGFydGVkID0gZmFsc2U7XG5cblx0cmV0dXJuIHtcblx0XHRzdGFydCgpIHtcblx0XHRcdGlmIChzdGFydGVkKSByZXR1cm47XG5cblx0XHRcdGRlbGV0ZV9ydWxlKG5vZGUpO1xuXG5cdFx0XHRpZiAodHlwZW9mIGNvbmZpZyA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRjb25maWcgPSBjb25maWcoKTtcblx0XHRcdFx0d2FpdCgpLnRoZW4oZ28pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Z28oKTtcblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0aW52YWxpZGF0ZSgpIHtcblx0XHRcdHN0YXJ0ZWQgPSBmYWxzZTtcblx0XHR9LFxuXG5cdFx0ZW5kKCkge1xuXHRcdFx0aWYgKHJ1bm5pbmcpIHtcblx0XHRcdFx0Y2xlYW51cCgpO1xuXHRcdFx0XHRydW5uaW5nID0gZmFsc2U7XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVfb3V0X3RyYW5zaXRpb24obm9kZSwgZm4sIHBhcmFtcykge1xuXHRsZXQgY29uZmlnID0gZm4obm9kZSwgcGFyYW1zKTtcblx0bGV0IHJ1bm5pbmcgPSB0cnVlO1xuXHRsZXQgYW5pbWF0aW9uX25hbWU7XG5cblx0Y29uc3QgZ3JvdXAgPSBvdXRyb3M7XG5cblx0Z3JvdXAucmVtYWluaW5nICs9IDE7XG5cblx0ZnVuY3Rpb24gZ28oKSB7XG5cdFx0Y29uc3Qge1xuXHRcdFx0ZGVsYXkgPSAwLFxuXHRcdFx0ZHVyYXRpb24gPSAzMDAsXG5cdFx0XHRlYXNpbmcgPSBpZGVudGl0eSxcblx0XHRcdHRpY2s6IHRpY2skJDEgPSBub29wLFxuXHRcdFx0Y3NzXG5cdFx0fSA9IGNvbmZpZztcblxuXHRcdGlmIChjc3MpIGFuaW1hdGlvbl9uYW1lID0gY3JlYXRlX3J1bGUobm9kZSwgMSwgMCwgZHVyYXRpb24sIGRlbGF5LCBlYXNpbmcsIGNzcyk7XG5cblx0XHRjb25zdCBzdGFydF90aW1lID0gd2luZG93LnBlcmZvcm1hbmNlLm5vdygpICsgZGVsYXk7XG5cdFx0Y29uc3QgZW5kX3RpbWUgPSBzdGFydF90aW1lICsgZHVyYXRpb247XG5cblx0XHRsb29wKG5vdyA9PiB7XG5cdFx0XHRpZiAocnVubmluZykge1xuXHRcdFx0XHRpZiAobm93ID49IGVuZF90aW1lKSB7XG5cdFx0XHRcdFx0dGljayQkMSgwLCAxKTtcblxuXHRcdFx0XHRcdGlmICghLS1ncm91cC5yZW1haW5pbmcpIHtcblx0XHRcdFx0XHRcdC8vIHRoaXMgd2lsbCByZXN1bHQgaW4gYGVuZCgpYCBiZWluZyBjYWxsZWQsXG5cdFx0XHRcdFx0XHQvLyBzbyB3ZSBkb24ndCBuZWVkIHRvIGNsZWFuIHVwIGhlcmVcblx0XHRcdFx0XHRcdHJ1bl9hbGwoZ3JvdXAuY2FsbGJhY2tzKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAobm93ID49IHN0YXJ0X3RpbWUpIHtcblx0XHRcdFx0XHRjb25zdCB0ID0gZWFzaW5nKChub3cgLSBzdGFydF90aW1lKSAvIGR1cmF0aW9uKTtcblx0XHRcdFx0XHR0aWNrJCQxKDEgLSB0LCB0KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gcnVubmluZztcblx0XHR9KTtcblx0fVxuXG5cdGlmICh0eXBlb2YgY29uZmlnID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0d2FpdCgpLnRoZW4oKCkgPT4ge1xuXHRcdFx0Y29uZmlnID0gY29uZmlnKCk7XG5cdFx0XHRnbygpO1xuXHRcdH0pO1xuXHR9IGVsc2Uge1xuXHRcdGdvKCk7XG5cdH1cblxuXHRyZXR1cm4ge1xuXHRcdGVuZChyZXNldCkge1xuXHRcdFx0aWYgKHJlc2V0ICYmIGNvbmZpZy50aWNrKSB7XG5cdFx0XHRcdGNvbmZpZy50aWNrKDEsIDApO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAocnVubmluZykge1xuXHRcdFx0XHRpZiAoYW5pbWF0aW9uX25hbWUpIGRlbGV0ZV9ydWxlKG5vZGUsIGFuaW1hdGlvbl9uYW1lKTtcblx0XHRcdFx0cnVubmluZyA9IGZhbHNlO1xuXHRcdFx0fVxuXHRcdH1cblx0fTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlX2JpZGlyZWN0aW9uYWxfdHJhbnNpdGlvbihub2RlLCBmbiwgcGFyYW1zLCBpbnRybykge1xuXHRsZXQgY29uZmlnID0gZm4obm9kZSwgcGFyYW1zKTtcblxuXHRsZXQgdCA9IGludHJvID8gMCA6IDE7XG5cblx0bGV0IHJ1bm5pbmdfcHJvZ3JhbSA9IG51bGw7XG5cdGxldCBwZW5kaW5nX3Byb2dyYW0gPSBudWxsO1xuXHRsZXQgYW5pbWF0aW9uX25hbWUgPSBudWxsO1xuXG5cdGZ1bmN0aW9uIGNsZWFyX2FuaW1hdGlvbigpIHtcblx0XHRpZiAoYW5pbWF0aW9uX25hbWUpIGRlbGV0ZV9ydWxlKG5vZGUsIGFuaW1hdGlvbl9uYW1lKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGluaXQocHJvZ3JhbSwgZHVyYXRpb24pIHtcblx0XHRjb25zdCBkID0gcHJvZ3JhbS5iIC0gdDtcblx0XHRkdXJhdGlvbiAqPSBNYXRoLmFicyhkKTtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRhOiB0LFxuXHRcdFx0YjogcHJvZ3JhbS5iLFxuXHRcdFx0ZCxcblx0XHRcdGR1cmF0aW9uLFxuXHRcdFx0c3RhcnQ6IHByb2dyYW0uc3RhcnQsXG5cdFx0XHRlbmQ6IHByb2dyYW0uc3RhcnQgKyBkdXJhdGlvbixcblx0XHRcdGdyb3VwOiBwcm9ncmFtLmdyb3VwXG5cdFx0fTtcblx0fVxuXG5cdGZ1bmN0aW9uIGdvKGIpIHtcblx0XHRjb25zdCB7XG5cdFx0XHRkZWxheSA9IDAsXG5cdFx0XHRkdXJhdGlvbiA9IDMwMCxcblx0XHRcdGVhc2luZyA9IGlkZW50aXR5LFxuXHRcdFx0dGljazogdGljayQkMSA9IG5vb3AsXG5cdFx0XHRjc3Ncblx0XHR9ID0gY29uZmlnO1xuXG5cdFx0Y29uc3QgcHJvZ3JhbSA9IHtcblx0XHRcdHN0YXJ0OiB3aW5kb3cucGVyZm9ybWFuY2Uubm93KCkgKyBkZWxheSxcblx0XHRcdGJcblx0XHR9O1xuXG5cdFx0aWYgKCFiKSB7XG5cdFx0XHRwcm9ncmFtLmdyb3VwID0gb3V0cm9zO1xuXHRcdFx0b3V0cm9zLnJlbWFpbmluZyArPSAxO1xuXHRcdH1cblxuXHRcdGlmIChydW5uaW5nX3Byb2dyYW0pIHtcblx0XHRcdHBlbmRpbmdfcHJvZ3JhbSA9IHByb2dyYW07XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIGlmIHRoaXMgaXMgYW4gaW50cm8sIGFuZCB0aGVyZSdzIGEgZGVsYXksIHdlIG5lZWQgdG8gZG9cblx0XHRcdC8vIGFuIGluaXRpYWwgdGljayBhbmQvb3IgYXBwbHkgQ1NTIGFuaW1hdGlvbiBpbW1lZGlhdGVseVxuXHRcdFx0aWYgKGNzcykge1xuXHRcdFx0XHRjbGVhcl9hbmltYXRpb24oKTtcblx0XHRcdFx0YW5pbWF0aW9uX25hbWUgPSBjcmVhdGVfcnVsZShub2RlLCB0LCBiLCBkdXJhdGlvbiwgZGVsYXksIGVhc2luZywgY3NzKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGIpIHRpY2skJDEoMCwgMSk7XG5cblx0XHRcdHJ1bm5pbmdfcHJvZ3JhbSA9IGluaXQocHJvZ3JhbSwgZHVyYXRpb24pO1xuXHRcdFx0YWRkX3JlbmRlcl9jYWxsYmFjaygoKSA9PiBkaXNwYXRjaChub2RlLCBiLCAnc3RhcnQnKSk7XG5cblx0XHRcdGxvb3Aobm93ID0+IHtcblx0XHRcdFx0aWYgKHBlbmRpbmdfcHJvZ3JhbSAmJiBub3cgPiBwZW5kaW5nX3Byb2dyYW0uc3RhcnQpIHtcblx0XHRcdFx0XHRydW5uaW5nX3Byb2dyYW0gPSBpbml0KHBlbmRpbmdfcHJvZ3JhbSwgZHVyYXRpb24pO1xuXHRcdFx0XHRcdHBlbmRpbmdfcHJvZ3JhbSA9IG51bGw7XG5cblx0XHRcdFx0XHRkaXNwYXRjaChub2RlLCBydW5uaW5nX3Byb2dyYW0uYiwgJ3N0YXJ0Jyk7XG5cblx0XHRcdFx0XHRpZiAoY3NzKSB7XG5cdFx0XHRcdFx0XHRjbGVhcl9hbmltYXRpb24oKTtcblx0XHRcdFx0XHRcdGFuaW1hdGlvbl9uYW1lID0gY3JlYXRlX3J1bGUobm9kZSwgdCwgcnVubmluZ19wcm9ncmFtLmIsIHJ1bm5pbmdfcHJvZ3JhbS5kdXJhdGlvbiwgMCwgZWFzaW5nLCBjb25maWcuY3NzKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAocnVubmluZ19wcm9ncmFtKSB7XG5cdFx0XHRcdFx0aWYgKG5vdyA+PSBydW5uaW5nX3Byb2dyYW0uZW5kKSB7XG5cdFx0XHRcdFx0XHR0aWNrJCQxKHQgPSBydW5uaW5nX3Byb2dyYW0uYiwgMSAtIHQpO1xuXHRcdFx0XHRcdFx0ZGlzcGF0Y2gobm9kZSwgcnVubmluZ19wcm9ncmFtLmIsICdlbmQnKTtcblxuXHRcdFx0XHRcdFx0aWYgKCFwZW5kaW5nX3Byb2dyYW0pIHtcblx0XHRcdFx0XHRcdFx0Ly8gd2UncmUgZG9uZVxuXHRcdFx0XHRcdFx0XHRpZiAocnVubmluZ19wcm9ncmFtLmIpIHtcblx0XHRcdFx0XHRcdFx0XHQvLyBpbnRybyDigJQgd2UgY2FuIHRpZHkgdXAgaW1tZWRpYXRlbHlcblx0XHRcdFx0XHRcdFx0XHRjbGVhcl9hbmltYXRpb24oKTtcblx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHQvLyBvdXRybyDigJQgbmVlZHMgdG8gYmUgY29vcmRpbmF0ZWRcblx0XHRcdFx0XHRcdFx0XHRpZiAoIS0tcnVubmluZ19wcm9ncmFtLmdyb3VwLnJlbWFpbmluZykgcnVuX2FsbChydW5uaW5nX3Byb2dyYW0uZ3JvdXAuY2FsbGJhY2tzKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRydW5uaW5nX3Byb2dyYW0gPSBudWxsO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGVsc2UgaWYgKG5vdyA+PSBydW5uaW5nX3Byb2dyYW0uc3RhcnQpIHtcblx0XHRcdFx0XHRcdGNvbnN0IHAgPSBub3cgLSBydW5uaW5nX3Byb2dyYW0uc3RhcnQ7XG5cdFx0XHRcdFx0XHR0ID0gcnVubmluZ19wcm9ncmFtLmEgKyBydW5uaW5nX3Byb2dyYW0uZCAqIGVhc2luZyhwIC8gcnVubmluZ19wcm9ncmFtLmR1cmF0aW9uKTtcblx0XHRcdFx0XHRcdHRpY2skJDEodCwgMSAtIHQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiAhIShydW5uaW5nX3Byb2dyYW0gfHwgcGVuZGluZ19wcm9ncmFtKTtcblx0XHRcdH0pO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiB7XG5cdFx0cnVuKGIpIHtcblx0XHRcdGlmICh0eXBlb2YgY29uZmlnID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdHdhaXQoKS50aGVuKCgpID0+IHtcblx0XHRcdFx0XHRjb25maWcgPSBjb25maWcoKTtcblx0XHRcdFx0XHRnbyhiKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRnbyhiKTtcblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0ZW5kKCkge1xuXHRcdFx0Y2xlYXJfYW5pbWF0aW9uKCk7XG5cdFx0XHRydW5uaW5nX3Byb2dyYW0gPSBwZW5kaW5nX3Byb2dyYW0gPSBudWxsO1xuXHRcdH1cblx0fTtcbn1cblxuZnVuY3Rpb24gaGFuZGxlX3Byb21pc2UocHJvbWlzZSwgaW5mbykge1xuXHRjb25zdCB0b2tlbiA9IGluZm8udG9rZW4gPSB7fTtcblxuXHRmdW5jdGlvbiB1cGRhdGUodHlwZSwgaW5kZXgsIGtleSwgdmFsdWUpIHtcblx0XHRpZiAoaW5mby50b2tlbiAhPT0gdG9rZW4pIHJldHVybjtcblxuXHRcdGluZm8ucmVzb2x2ZWQgPSBrZXkgJiYgeyBba2V5XTogdmFsdWUgfTtcblxuXHRcdGNvbnN0IGNoaWxkX2N0eCA9IGFzc2lnbihhc3NpZ24oe30sIGluZm8uY3R4KSwgaW5mby5yZXNvbHZlZCk7XG5cdFx0Y29uc3QgYmxvY2sgPSB0eXBlICYmIChpbmZvLmN1cnJlbnQgPSB0eXBlKShjaGlsZF9jdHgpO1xuXG5cdFx0aWYgKGluZm8uYmxvY2spIHtcblx0XHRcdGlmIChpbmZvLmJsb2Nrcykge1xuXHRcdFx0XHRpbmZvLmJsb2Nrcy5mb3JFYWNoKChibG9jaywgaSkgPT4ge1xuXHRcdFx0XHRcdGlmIChpICE9PSBpbmRleCAmJiBibG9jaykge1xuXHRcdFx0XHRcdFx0Z3JvdXBfb3V0cm9zKCk7XG5cdFx0XHRcdFx0XHRvbl9vdXRybygoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdGJsb2NrLmQoMSk7XG5cdFx0XHRcdFx0XHRcdGluZm8uYmxvY2tzW2ldID0gbnVsbDtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0YmxvY2subygxKTtcblx0XHRcdFx0XHRcdGNoZWNrX291dHJvcygpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpbmZvLmJsb2NrLmQoMSk7XG5cdFx0XHR9XG5cblx0XHRcdGJsb2NrLmMoKTtcblx0XHRcdGlmIChibG9jay5pKSBibG9jay5pKDEpO1xuXHRcdFx0YmxvY2subShpbmZvLm1vdW50KCksIGluZm8uYW5jaG9yKTtcblxuXHRcdFx0Zmx1c2goKTtcblx0XHR9XG5cblx0XHRpbmZvLmJsb2NrID0gYmxvY2s7XG5cdFx0aWYgKGluZm8uYmxvY2tzKSBpbmZvLmJsb2Nrc1tpbmRleF0gPSBibG9jaztcblx0fVxuXG5cdGlmIChpc19wcm9taXNlKHByb21pc2UpKSB7XG5cdFx0cHJvbWlzZS50aGVuKHZhbHVlID0+IHtcblx0XHRcdHVwZGF0ZShpbmZvLnRoZW4sIDEsIGluZm8udmFsdWUsIHZhbHVlKTtcblx0XHR9LCBlcnJvciA9PiB7XG5cdFx0XHR1cGRhdGUoaW5mby5jYXRjaCwgMiwgaW5mby5lcnJvciwgZXJyb3IpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gaWYgd2UgcHJldmlvdXNseSBoYWQgYSB0aGVuL2NhdGNoIGJsb2NrLCBkZXN0cm95IGl0XG5cdFx0aWYgKGluZm8uY3VycmVudCAhPT0gaW5mby5wZW5kaW5nKSB7XG5cdFx0XHR1cGRhdGUoaW5mby5wZW5kaW5nLCAwKTtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRpZiAoaW5mby5jdXJyZW50ICE9PSBpbmZvLnRoZW4pIHtcblx0XHRcdHVwZGF0ZShpbmZvLnRoZW4sIDEsIGluZm8udmFsdWUsIHByb21pc2UpO1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0aW5mby5yZXNvbHZlZCA9IHsgW2luZm8udmFsdWVdOiBwcm9taXNlIH07XG5cdH1cbn1cblxuZnVuY3Rpb24gZGVzdHJveV9ibG9jayhibG9jaywgbG9va3VwKSB7XG5cdGJsb2NrLmQoMSk7XG5cdGxvb2t1cC5kZWxldGUoYmxvY2sua2V5KTtcbn1cblxuZnVuY3Rpb24gb3V0cm9fYW5kX2Rlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCkge1xuXHRvbl9vdXRybygoKSA9PiB7XG5cdFx0ZGVzdHJveV9ibG9jayhibG9jaywgbG9va3VwKTtcblx0fSk7XG5cblx0YmxvY2subygxKTtcbn1cblxuZnVuY3Rpb24gZml4X2FuZF9vdXRyb19hbmRfZGVzdHJveV9ibG9jayhibG9jaywgbG9va3VwKSB7XG5cdGJsb2NrLmYoKTtcblx0b3V0cm9fYW5kX2Rlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZV9rZXllZF9lYWNoKG9sZF9ibG9ja3MsIGNoYW5nZWQsIGdldF9rZXksIGR5bmFtaWMsIGN0eCwgbGlzdCwgbG9va3VwLCBub2RlLCBkZXN0cm95LCBjcmVhdGVfZWFjaF9ibG9jaywgbmV4dCwgZ2V0X2NvbnRleHQpIHtcblx0bGV0IG8gPSBvbGRfYmxvY2tzLmxlbmd0aDtcblx0bGV0IG4gPSBsaXN0Lmxlbmd0aDtcblxuXHRsZXQgaSA9IG87XG5cdGNvbnN0IG9sZF9pbmRleGVzID0ge307XG5cdHdoaWxlIChpLS0pIG9sZF9pbmRleGVzW29sZF9ibG9ja3NbaV0ua2V5XSA9IGk7XG5cblx0Y29uc3QgbmV3X2Jsb2NrcyA9IFtdO1xuXHRjb25zdCBuZXdfbG9va3VwID0gbmV3IE1hcCgpO1xuXHRjb25zdCBkZWx0YXMgPSBuZXcgTWFwKCk7XG5cblx0aSA9IG47XG5cdHdoaWxlIChpLS0pIHtcblx0XHRjb25zdCBjaGlsZF9jdHggPSBnZXRfY29udGV4dChjdHgsIGxpc3QsIGkpO1xuXHRcdGNvbnN0IGtleSA9IGdldF9rZXkoY2hpbGRfY3R4KTtcblx0XHRsZXQgYmxvY2sgPSBsb29rdXAuZ2V0KGtleSk7XG5cblx0XHRpZiAoIWJsb2NrKSB7XG5cdFx0XHRibG9jayA9IGNyZWF0ZV9lYWNoX2Jsb2NrKGtleSwgY2hpbGRfY3R4KTtcblx0XHRcdGJsb2NrLmMoKTtcblx0XHR9IGVsc2UgaWYgKGR5bmFtaWMpIHtcblx0XHRcdGJsb2NrLnAoY2hhbmdlZCwgY2hpbGRfY3R4KTtcblx0XHR9XG5cblx0XHRuZXdfbG9va3VwLnNldChrZXksIG5ld19ibG9ja3NbaV0gPSBibG9jayk7XG5cblx0XHRpZiAoa2V5IGluIG9sZF9pbmRleGVzKSBkZWx0YXMuc2V0KGtleSwgTWF0aC5hYnMoaSAtIG9sZF9pbmRleGVzW2tleV0pKTtcblx0fVxuXG5cdGNvbnN0IHdpbGxfbW92ZSA9IG5ldyBTZXQoKTtcblx0Y29uc3QgZGlkX21vdmUgPSBuZXcgU2V0KCk7XG5cblx0ZnVuY3Rpb24gaW5zZXJ0KGJsb2NrKSB7XG5cdFx0aWYgKGJsb2NrLmkpIGJsb2NrLmkoMSk7XG5cdFx0YmxvY2subShub2RlLCBuZXh0KTtcblx0XHRsb29rdXAuc2V0KGJsb2NrLmtleSwgYmxvY2spO1xuXHRcdG5leHQgPSBibG9jay5maXJzdDtcblx0XHRuLS07XG5cdH1cblxuXHR3aGlsZSAobyAmJiBuKSB7XG5cdFx0Y29uc3QgbmV3X2Jsb2NrID0gbmV3X2Jsb2Nrc1tuIC0gMV07XG5cdFx0Y29uc3Qgb2xkX2Jsb2NrID0gb2xkX2Jsb2Nrc1tvIC0gMV07XG5cdFx0Y29uc3QgbmV3X2tleSA9IG5ld19ibG9jay5rZXk7XG5cdFx0Y29uc3Qgb2xkX2tleSA9IG9sZF9ibG9jay5rZXk7XG5cblx0XHRpZiAobmV3X2Jsb2NrID09PSBvbGRfYmxvY2spIHtcblx0XHRcdC8vIGRvIG5vdGhpbmdcblx0XHRcdG5leHQgPSBuZXdfYmxvY2suZmlyc3Q7XG5cdFx0XHRvLS07XG5cdFx0XHRuLS07XG5cdFx0fVxuXG5cdFx0ZWxzZSBpZiAoIW5ld19sb29rdXAuaGFzKG9sZF9rZXkpKSB7XG5cdFx0XHQvLyByZW1vdmUgb2xkIGJsb2NrXG5cdFx0XHRkZXN0cm95KG9sZF9ibG9jaywgbG9va3VwKTtcblx0XHRcdG8tLTtcblx0XHR9XG5cblx0XHRlbHNlIGlmICghbG9va3VwLmhhcyhuZXdfa2V5KSB8fCB3aWxsX21vdmUuaGFzKG5ld19rZXkpKSB7XG5cdFx0XHRpbnNlcnQobmV3X2Jsb2NrKTtcblx0XHR9XG5cblx0XHRlbHNlIGlmIChkaWRfbW92ZS5oYXMob2xkX2tleSkpIHtcblx0XHRcdG8tLTtcblxuXHRcdH0gZWxzZSBpZiAoZGVsdGFzLmdldChuZXdfa2V5KSA+IGRlbHRhcy5nZXQob2xkX2tleSkpIHtcblx0XHRcdGRpZF9tb3ZlLmFkZChuZXdfa2V5KTtcblx0XHRcdGluc2VydChuZXdfYmxvY2spO1xuXG5cdFx0fSBlbHNlIHtcblx0XHRcdHdpbGxfbW92ZS5hZGQob2xkX2tleSk7XG5cdFx0XHRvLS07XG5cdFx0fVxuXHR9XG5cblx0d2hpbGUgKG8tLSkge1xuXHRcdGNvbnN0IG9sZF9ibG9jayA9IG9sZF9ibG9ja3Nbb107XG5cdFx0aWYgKCFuZXdfbG9va3VwLmhhcyhvbGRfYmxvY2sua2V5KSkgZGVzdHJveShvbGRfYmxvY2ssIGxvb2t1cCk7XG5cdH1cblxuXHR3aGlsZSAobikgaW5zZXJ0KG5ld19ibG9ja3NbbiAtIDFdKTtcblxuXHRyZXR1cm4gbmV3X2Jsb2Nrcztcbn1cblxuZnVuY3Rpb24gbWVhc3VyZShibG9ja3MpIHtcblx0Y29uc3QgcmVjdHMgPSB7fTtcblx0bGV0IGkgPSBibG9ja3MubGVuZ3RoO1xuXHR3aGlsZSAoaS0tKSByZWN0c1tibG9ja3NbaV0ua2V5XSA9IGJsb2Nrc1tpXS5ub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXHRyZXR1cm4gcmVjdHM7XG59XG5cbmZ1bmN0aW9uIGdldF9zcHJlYWRfdXBkYXRlKGxldmVscywgdXBkYXRlcykge1xuXHRjb25zdCB1cGRhdGUgPSB7fTtcblxuXHRjb25zdCB0b19udWxsX291dCA9IHt9O1xuXHRjb25zdCBhY2NvdW50ZWRfZm9yID0geyAkJHNjb3BlOiAxIH07XG5cblx0bGV0IGkgPSBsZXZlbHMubGVuZ3RoO1xuXHR3aGlsZSAoaS0tKSB7XG5cdFx0Y29uc3QgbyA9IGxldmVsc1tpXTtcblx0XHRjb25zdCBuID0gdXBkYXRlc1tpXTtcblxuXHRcdGlmIChuKSB7XG5cdFx0XHRmb3IgKGNvbnN0IGtleSBpbiBvKSB7XG5cdFx0XHRcdGlmICghKGtleSBpbiBuKSkgdG9fbnVsbF9vdXRba2V5XSA9IDE7XG5cdFx0XHR9XG5cblx0XHRcdGZvciAoY29uc3Qga2V5IGluIG4pIHtcblx0XHRcdFx0aWYgKCFhY2NvdW50ZWRfZm9yW2tleV0pIHtcblx0XHRcdFx0XHR1cGRhdGVba2V5XSA9IG5ba2V5XTtcblx0XHRcdFx0XHRhY2NvdW50ZWRfZm9yW2tleV0gPSAxO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGxldmVsc1tpXSA9IG47XG5cdFx0fSBlbHNlIHtcblx0XHRcdGZvciAoY29uc3Qga2V5IGluIG8pIHtcblx0XHRcdFx0YWNjb3VudGVkX2ZvcltrZXldID0gMTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRmb3IgKGNvbnN0IGtleSBpbiB0b19udWxsX291dCkge1xuXHRcdGlmICghKGtleSBpbiB1cGRhdGUpKSB1cGRhdGVba2V5XSA9IHVuZGVmaW5lZDtcblx0fVxuXG5cdHJldHVybiB1cGRhdGU7XG59XG5cbmNvbnN0IGludmFsaWRfYXR0cmlidXRlX25hbWVfY2hhcmFjdGVyID0gL1tcXHMnXCI+Lz1cXHV7RkREMH0tXFx1e0ZERUZ9XFx1e0ZGRkV9XFx1e0ZGRkZ9XFx1ezFGRkZFfVxcdXsxRkZGRn1cXHV7MkZGRkV9XFx1ezJGRkZGfVxcdXszRkZGRX1cXHV7M0ZGRkZ9XFx1ezRGRkZFfVxcdXs0RkZGRn1cXHV7NUZGRkV9XFx1ezVGRkZGfVxcdXs2RkZGRX1cXHV7NkZGRkZ9XFx1ezdGRkZFfVxcdXs3RkZGRn1cXHV7OEZGRkV9XFx1ezhGRkZGfVxcdXs5RkZGRX1cXHV7OUZGRkZ9XFx1e0FGRkZFfVxcdXtBRkZGRn1cXHV7QkZGRkV9XFx1e0JGRkZGfVxcdXtDRkZGRX1cXHV7Q0ZGRkZ9XFx1e0RGRkZFfVxcdXtERkZGRn1cXHV7RUZGRkV9XFx1e0VGRkZGfVxcdXtGRkZGRX1cXHV7RkZGRkZ9XFx1ezEwRkZGRX1cXHV7MTBGRkZGfV0vdTtcbi8vIGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL3N5bnRheC5odG1sI2F0dHJpYnV0ZXMtMlxuLy8gaHR0cHM6Ly9pbmZyYS5zcGVjLndoYXR3Zy5vcmcvI25vbmNoYXJhY3RlclxuXG5mdW5jdGlvbiBzcHJlYWQoYXJncykge1xuXHRjb25zdCBhdHRyaWJ1dGVzID0gT2JqZWN0LmFzc2lnbih7fSwgLi4uYXJncyk7XG5cdGxldCBzdHIgPSAnJztcblxuXHRPYmplY3Qua2V5cyhhdHRyaWJ1dGVzKS5mb3JFYWNoKG5hbWUgPT4ge1xuXHRcdGlmIChpbnZhbGlkX2F0dHJpYnV0ZV9uYW1lX2NoYXJhY3Rlci50ZXN0KG5hbWUpKSByZXR1cm47XG5cblx0XHRjb25zdCB2YWx1ZSA9IGF0dHJpYnV0ZXNbbmFtZV07XG5cdFx0aWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHJldHVybjtcblx0XHRpZiAodmFsdWUgPT09IHRydWUpIHN0ciArPSBcIiBcIiArIG5hbWU7XG5cblx0XHRjb25zdCBlc2NhcGVkID0gU3RyaW5nKHZhbHVlKVxuXHRcdFx0LnJlcGxhY2UoL1wiL2csICcmIzM0OycpXG5cdFx0XHQucmVwbGFjZSgvJy9nLCAnJiMzOTsnKTtcblxuXHRcdHN0ciArPSBcIiBcIiArIG5hbWUgKyBcIj1cIiArIEpTT04uc3RyaW5naWZ5KGVzY2FwZWQpO1xuXHR9KTtcblxuXHRyZXR1cm4gc3RyO1xufVxuXG5jb25zdCBlc2NhcGVkID0ge1xuXHQnXCInOiAnJnF1b3Q7Jyxcblx0XCInXCI6ICcmIzM5OycsXG5cdCcmJzogJyZhbXA7Jyxcblx0JzwnOiAnJmx0OycsXG5cdCc+JzogJyZndDsnXG59O1xuXG5mdW5jdGlvbiBlc2NhcGUoaHRtbCkge1xuXHRyZXR1cm4gU3RyaW5nKGh0bWwpLnJlcGxhY2UoL1tcIicmPD5dL2csIG1hdGNoID0+IGVzY2FwZWRbbWF0Y2hdKTtcbn1cblxuZnVuY3Rpb24gZWFjaChpdGVtcywgZm4pIHtcblx0bGV0IHN0ciA9ICcnO1xuXHRmb3IgKGxldCBpID0gMDsgaSA8IGl0ZW1zLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0c3RyICs9IGZuKGl0ZW1zW2ldLCBpKTtcblx0fVxuXHRyZXR1cm4gc3RyO1xufVxuXG5jb25zdCBtaXNzaW5nX2NvbXBvbmVudCA9IHtcblx0JCRyZW5kZXI6ICgpID0+ICcnXG59O1xuXG5mdW5jdGlvbiB2YWxpZGF0ZV9jb21wb25lbnQoY29tcG9uZW50LCBuYW1lKSB7XG5cdGlmICghY29tcG9uZW50IHx8ICFjb21wb25lbnQuJCRyZW5kZXIpIHtcblx0XHRpZiAobmFtZSA9PT0gJ3N2ZWx0ZTpjb21wb25lbnQnKSBuYW1lICs9ICcgdGhpcz17Li4ufSc7XG5cdFx0dGhyb3cgbmV3IEVycm9yKGA8JHtuYW1lfT4gaXMgbm90IGEgdmFsaWQgU1NSIGNvbXBvbmVudC4gWW91IG1heSBuZWVkIHRvIHJldmlldyB5b3VyIGJ1aWxkIGNvbmZpZyB0byBlbnN1cmUgdGhhdCBkZXBlbmRlbmNpZXMgYXJlIGNvbXBpbGVkLCByYXRoZXIgdGhhbiBpbXBvcnRlZCBhcyBwcmUtY29tcGlsZWQgbW9kdWxlc2ApO1xuXHR9XG5cblx0cmV0dXJuIGNvbXBvbmVudDtcbn1cblxuZnVuY3Rpb24gZGVidWcoZmlsZSwgbGluZSwgY29sdW1uLCB2YWx1ZXMpIHtcblx0Y29uc29sZS5sb2coYHtAZGVidWd9ICR7ZmlsZSA/IGZpbGUgKyAnICcgOiAnJ30oJHtsaW5lfToke2NvbHVtbn0pYCk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuXHRjb25zb2xlLmxvZyh2YWx1ZXMpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcblx0cmV0dXJuICcnO1xufVxuXG5sZXQgb25fZGVzdHJveTtcblxuZnVuY3Rpb24gY3JlYXRlX3Nzcl9jb21wb25lbnQoZm4pIHtcblx0ZnVuY3Rpb24gJCRyZW5kZXIocmVzdWx0LCBwcm9wcywgYmluZGluZ3MsIHNsb3RzKSB7XG5cdFx0Y29uc3QgcGFyZW50X2NvbXBvbmVudCA9IGN1cnJlbnRfY29tcG9uZW50O1xuXG5cdFx0Y29uc3QgJCQgPSB7XG5cdFx0XHRvbl9kZXN0cm95LFxuXHRcdFx0Y29udGV4dDogbmV3IE1hcChwYXJlbnRfY29tcG9uZW50ID8gcGFyZW50X2NvbXBvbmVudC4kJC5jb250ZXh0IDogW10pLFxuXG5cdFx0XHQvLyB0aGVzZSB3aWxsIGJlIGltbWVkaWF0ZWx5IGRpc2NhcmRlZFxuXHRcdFx0b25fbW91bnQ6IFtdLFxuXHRcdFx0YmVmb3JlX3JlbmRlcjogW10sXG5cdFx0XHRhZnRlcl9yZW5kZXI6IFtdLFxuXHRcdFx0Y2FsbGJhY2tzOiBibGFua19vYmplY3QoKVxuXHRcdH07XG5cblx0XHRzZXRfY3VycmVudF9jb21wb25lbnQoeyAkJCB9KTtcblxuXHRcdGNvbnN0IGh0bWwgPSBmbihyZXN1bHQsIHByb3BzLCBiaW5kaW5ncywgc2xvdHMpO1xuXG5cdFx0c2V0X2N1cnJlbnRfY29tcG9uZW50KHBhcmVudF9jb21wb25lbnQpO1xuXHRcdHJldHVybiBodG1sO1xuXHR9XG5cblx0cmV0dXJuIHtcblx0XHRyZW5kZXI6IChwcm9wcyA9IHt9LCBvcHRpb25zID0ge30pID0+IHtcblx0XHRcdG9uX2Rlc3Ryb3kgPSBbXTtcblxuXHRcdFx0Y29uc3QgcmVzdWx0ID0geyBoZWFkOiAnJywgY3NzOiBuZXcgU2V0KCkgfTtcblx0XHRcdGNvbnN0IGh0bWwgPSAkJHJlbmRlcihyZXN1bHQsIHByb3BzLCB7fSwgb3B0aW9ucyk7XG5cblx0XHRcdHJ1bl9hbGwob25fZGVzdHJveSk7XG5cblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGh0bWwsXG5cdFx0XHRcdGNzczoge1xuXHRcdFx0XHRcdGNvZGU6IEFycmF5LmZyb20ocmVzdWx0LmNzcykubWFwKGNzcyA9PiBjc3MuY29kZSkuam9pbignXFxuJyksXG5cdFx0XHRcdFx0bWFwOiBudWxsIC8vIFRPRE9cblx0XHRcdFx0fSxcblx0XHRcdFx0aGVhZDogcmVzdWx0LmhlYWRcblx0XHRcdH07XG5cdFx0fSxcblxuXHRcdCQkcmVuZGVyXG5cdH07XG59XG5cbmZ1bmN0aW9uIGdldF9zdG9yZV92YWx1ZShzdG9yZSkge1xuXHRsZXQgdmFsdWU7XG5cdHN0b3JlLnN1YnNjcmliZShfID0+IHZhbHVlID0gXykoKTtcblx0cmV0dXJuIHZhbHVlO1xufVxuXG5mdW5jdGlvbiBiaW5kKGNvbXBvbmVudCwgbmFtZSwgY2FsbGJhY2spIHtcblx0aWYgKGNvbXBvbmVudC4kJC5wcm9wcy5pbmRleE9mKG5hbWUpID09PSAtMSkgcmV0dXJuO1xuXHRjb21wb25lbnQuJCQuYm91bmRbbmFtZV0gPSBjYWxsYmFjaztcblx0Y2FsbGJhY2soY29tcG9uZW50LiQkLmN0eFtuYW1lXSk7XG59XG5cbmZ1bmN0aW9uIG1vdW50X2NvbXBvbmVudChjb21wb25lbnQsIHRhcmdldCwgYW5jaG9yKSB7XG5cdGNvbnN0IHsgZnJhZ21lbnQsIG9uX21vdW50LCBvbl9kZXN0cm95LCBhZnRlcl9yZW5kZXIgfSA9IGNvbXBvbmVudC4kJDtcblxuXHRmcmFnbWVudC5tKHRhcmdldCwgYW5jaG9yKTtcblxuXHQvLyBvbk1vdW50IGhhcHBlbnMgYWZ0ZXIgdGhlIGluaXRpYWwgYWZ0ZXJVcGRhdGUuIEJlY2F1c2Vcblx0Ly8gYWZ0ZXJVcGRhdGUgY2FsbGJhY2tzIGhhcHBlbiBpbiByZXZlcnNlIG9yZGVyIChpbm5lciBmaXJzdClcblx0Ly8gd2Ugc2NoZWR1bGUgb25Nb3VudCBjYWxsYmFja3MgYmVmb3JlIGFmdGVyVXBkYXRlIGNhbGxiYWNrc1xuXHRhZGRfcmVuZGVyX2NhbGxiYWNrKCgpID0+IHtcblx0XHRjb25zdCBuZXdfb25fZGVzdHJveSA9IG9uX21vdW50Lm1hcChydW4pLmZpbHRlcihpc19mdW5jdGlvbik7XG5cdFx0aWYgKG9uX2Rlc3Ryb3kpIHtcblx0XHRcdG9uX2Rlc3Ryb3kucHVzaCguLi5uZXdfb25fZGVzdHJveSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIEVkZ2UgY2FzZSAtIGNvbXBvbmVudCB3YXMgZGVzdHJveWVkIGltbWVkaWF0ZWx5LFxuXHRcdFx0Ly8gbW9zdCBsaWtlbHkgYXMgYSByZXN1bHQgb2YgYSBiaW5kaW5nIGluaXRpYWxpc2luZ1xuXHRcdFx0cnVuX2FsbChuZXdfb25fZGVzdHJveSk7XG5cdFx0fVxuXHRcdGNvbXBvbmVudC4kJC5vbl9tb3VudCA9IFtdO1xuXHR9KTtcblxuXHRhZnRlcl9yZW5kZXIuZm9yRWFjaChhZGRfcmVuZGVyX2NhbGxiYWNrKTtcbn1cblxuZnVuY3Rpb24gZGVzdHJveShjb21wb25lbnQsIGRldGFjaGluZykge1xuXHRpZiAoY29tcG9uZW50LiQkKSB7XG5cdFx0cnVuX2FsbChjb21wb25lbnQuJCQub25fZGVzdHJveSk7XG5cdFx0Y29tcG9uZW50LiQkLmZyYWdtZW50LmQoZGV0YWNoaW5nKTtcblxuXHRcdC8vIFRPRE8gbnVsbCBvdXQgb3RoZXIgcmVmcywgaW5jbHVkaW5nIGNvbXBvbmVudC4kJCAoYnV0IG5lZWQgdG9cblx0XHQvLyBwcmVzZXJ2ZSBmaW5hbCBzdGF0ZT8pXG5cdFx0Y29tcG9uZW50LiQkLm9uX2Rlc3Ryb3kgPSBjb21wb25lbnQuJCQuZnJhZ21lbnQgPSBudWxsO1xuXHRcdGNvbXBvbmVudC4kJC5jdHggPSB7fTtcblx0fVxufVxuXG5mdW5jdGlvbiBtYWtlX2RpcnR5KGNvbXBvbmVudCwga2V5KSB7XG5cdGlmICghY29tcG9uZW50LiQkLmRpcnR5KSB7XG5cdFx0ZGlydHlfY29tcG9uZW50cy5wdXNoKGNvbXBvbmVudCk7XG5cdFx0c2NoZWR1bGVfdXBkYXRlKCk7XG5cdFx0Y29tcG9uZW50LiQkLmRpcnR5ID0gYmxhbmtfb2JqZWN0KCk7XG5cdH1cblx0Y29tcG9uZW50LiQkLmRpcnR5W2tleV0gPSB0cnVlO1xufVxuXG5mdW5jdGlvbiBpbml0KGNvbXBvbmVudCwgb3B0aW9ucywgaW5zdGFuY2UsIGNyZWF0ZV9mcmFnbWVudCwgbm90X2VxdWFsJCQxLCBwcm9wX25hbWVzKSB7XG5cdGNvbnN0IHBhcmVudF9jb21wb25lbnQgPSBjdXJyZW50X2NvbXBvbmVudDtcblx0c2V0X2N1cnJlbnRfY29tcG9uZW50KGNvbXBvbmVudCk7XG5cblx0Y29uc3QgcHJvcHMgPSBvcHRpb25zLnByb3BzIHx8IHt9O1xuXG5cdGNvbnN0ICQkID0gY29tcG9uZW50LiQkID0ge1xuXHRcdGZyYWdtZW50OiBudWxsLFxuXHRcdGN0eDogbnVsbCxcblxuXHRcdC8vIHN0YXRlXG5cdFx0cHJvcHM6IHByb3BfbmFtZXMsXG5cdFx0dXBkYXRlOiBub29wLFxuXHRcdG5vdF9lcXVhbDogbm90X2VxdWFsJCQxLFxuXHRcdGJvdW5kOiBibGFua19vYmplY3QoKSxcblxuXHRcdC8vIGxpZmVjeWNsZVxuXHRcdG9uX21vdW50OiBbXSxcblx0XHRvbl9kZXN0cm95OiBbXSxcblx0XHRiZWZvcmVfcmVuZGVyOiBbXSxcblx0XHRhZnRlcl9yZW5kZXI6IFtdLFxuXHRcdGNvbnRleHQ6IG5ldyBNYXAocGFyZW50X2NvbXBvbmVudCA/IHBhcmVudF9jb21wb25lbnQuJCQuY29udGV4dCA6IFtdKSxcblxuXHRcdC8vIGV2ZXJ5dGhpbmcgZWxzZVxuXHRcdGNhbGxiYWNrczogYmxhbmtfb2JqZWN0KCksXG5cdFx0ZGlydHk6IG51bGxcblx0fTtcblxuXHRsZXQgcmVhZHkgPSBmYWxzZTtcblxuXHQkJC5jdHggPSBpbnN0YW5jZVxuXHRcdD8gaW5zdGFuY2UoY29tcG9uZW50LCBwcm9wcywgKGtleSwgdmFsdWUpID0+IHtcblx0XHRcdGlmICgkJC5jdHggJiYgbm90X2VxdWFsJCQxKCQkLmN0eFtrZXldLCAkJC5jdHhba2V5XSA9IHZhbHVlKSkge1xuXHRcdFx0XHRpZiAoJCQuYm91bmRba2V5XSkgJCQuYm91bmRba2V5XSh2YWx1ZSk7XG5cdFx0XHRcdGlmIChyZWFkeSkgbWFrZV9kaXJ0eShjb21wb25lbnQsIGtleSk7XG5cdFx0XHR9XG5cdFx0fSlcblx0XHQ6IHByb3BzO1xuXG5cdCQkLnVwZGF0ZSgpO1xuXHRyZWFkeSA9IHRydWU7XG5cdHJ1bl9hbGwoJCQuYmVmb3JlX3JlbmRlcik7XG5cdCQkLmZyYWdtZW50ID0gY3JlYXRlX2ZyYWdtZW50KCQkLmN0eCk7XG5cblx0aWYgKG9wdGlvbnMudGFyZ2V0KSB7XG5cdFx0aWYgKG9wdGlvbnMuaHlkcmF0ZSkge1xuXHRcdFx0JCQuZnJhZ21lbnQubChjaGlsZHJlbihvcHRpb25zLnRhcmdldCkpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQkJC5mcmFnbWVudC5jKCk7XG5cdFx0fVxuXG5cdFx0aWYgKG9wdGlvbnMuaW50cm8gJiYgY29tcG9uZW50LiQkLmZyYWdtZW50LmkpIGNvbXBvbmVudC4kJC5mcmFnbWVudC5pKCk7XG5cdFx0bW91bnRfY29tcG9uZW50KGNvbXBvbmVudCwgb3B0aW9ucy50YXJnZXQsIG9wdGlvbnMuYW5jaG9yKTtcblx0XHRmbHVzaCgpO1xuXHR9XG5cblx0c2V0X2N1cnJlbnRfY29tcG9uZW50KHBhcmVudF9jb21wb25lbnQpO1xufVxuXG5sZXQgU3ZlbHRlRWxlbWVudDtcbmlmICh0eXBlb2YgSFRNTEVsZW1lbnQgIT09ICd1bmRlZmluZWQnKSB7XG5cdFN2ZWx0ZUVsZW1lbnQgPSBjbGFzcyBleHRlbmRzIEhUTUxFbGVtZW50IHtcblx0XHRjb25zdHJ1Y3RvcigpIHtcblx0XHRcdHN1cGVyKCk7XG5cdFx0XHR0aGlzLmF0dGFjaFNoYWRvdyh7IG1vZGU6ICdvcGVuJyB9KTtcblx0XHR9XG5cblx0XHRjb25uZWN0ZWRDYWxsYmFjaygpIHtcblx0XHRcdGZvciAoY29uc3Qga2V5IGluIHRoaXMuJCQuc2xvdHRlZCkge1xuXHRcdFx0XHR0aGlzLmFwcGVuZENoaWxkKHRoaXMuJCQuc2xvdHRlZFtrZXldKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2soYXR0ciQkMSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG5cdFx0XHR0aGlzW2F0dHIkJDFdID0gbmV3VmFsdWU7XG5cdFx0fVxuXG5cdFx0JGRlc3Ryb3koKSB7XG5cdFx0XHRkZXN0cm95KHRoaXMsIHRydWUpO1xuXHRcdFx0dGhpcy4kZGVzdHJveSA9IG5vb3A7XG5cdFx0fVxuXG5cdFx0JG9uKHR5cGUsIGNhbGxiYWNrKSB7XG5cdFx0XHQvLyBUT0RPIHNob3VsZCB0aGlzIGRlbGVnYXRlIHRvIGFkZEV2ZW50TGlzdGVuZXI/XG5cdFx0XHRjb25zdCBjYWxsYmFja3MgPSAodGhpcy4kJC5jYWxsYmFja3NbdHlwZV0gfHwgKHRoaXMuJCQuY2FsbGJhY2tzW3R5cGVdID0gW10pKTtcblx0XHRcdGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcblxuXHRcdFx0cmV0dXJuICgpID0+IHtcblx0XHRcdFx0Y29uc3QgaW5kZXggPSBjYWxsYmFja3MuaW5kZXhPZihjYWxsYmFjayk7XG5cdFx0XHRcdGlmIChpbmRleCAhPT0gLTEpIGNhbGxiYWNrcy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0fTtcblx0XHR9XG5cblx0XHQkc2V0KCkge1xuXHRcdFx0Ly8gb3ZlcnJpZGRlbiBieSBpbnN0YW5jZSwgaWYgaXQgaGFzIHByb3BzXG5cdFx0fVxuXHR9O1xufVxuXG5jbGFzcyBTdmVsdGVDb21wb25lbnQge1xuXHQkZGVzdHJveSgpIHtcblx0XHRkZXN0cm95KHRoaXMsIHRydWUpO1xuXHRcdHRoaXMuJGRlc3Ryb3kgPSBub29wO1xuXHR9XG5cblx0JG9uKHR5cGUsIGNhbGxiYWNrKSB7XG5cdFx0Y29uc3QgY2FsbGJhY2tzID0gKHRoaXMuJCQuY2FsbGJhY2tzW3R5cGVdIHx8ICh0aGlzLiQkLmNhbGxiYWNrc1t0eXBlXSA9IFtdKSk7XG5cdFx0Y2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuXG5cdFx0cmV0dXJuICgpID0+IHtcblx0XHRcdGNvbnN0IGluZGV4ID0gY2FsbGJhY2tzLmluZGV4T2YoY2FsbGJhY2spO1xuXHRcdFx0aWYgKGluZGV4ICE9PSAtMSkgY2FsbGJhY2tzLnNwbGljZShpbmRleCwgMSk7XG5cdFx0fTtcblx0fVxuXG5cdCRzZXQoKSB7XG5cdFx0Ly8gb3ZlcnJpZGRlbiBieSBpbnN0YW5jZSwgaWYgaXQgaGFzIHByb3BzXG5cdH1cbn1cblxuY2xhc3MgU3ZlbHRlQ29tcG9uZW50RGV2IGV4dGVuZHMgU3ZlbHRlQ29tcG9uZW50IHtcblx0Y29uc3RydWN0b3Iob3B0aW9ucykge1xuXHRcdGlmICghb3B0aW9ucyB8fCAoIW9wdGlvbnMudGFyZ2V0ICYmICFvcHRpb25zLiQkaW5saW5lKSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGAndGFyZ2V0JyBpcyBhIHJlcXVpcmVkIG9wdGlvbmApO1xuXHRcdH1cblxuXHRcdHN1cGVyKCk7XG5cdH1cblxuXHQkZGVzdHJveSgpIHtcblx0XHRzdXBlci4kZGVzdHJveSgpO1xuXHRcdHRoaXMuJGRlc3Ryb3kgPSAoKSA9PiB7XG5cdFx0XHRjb25zb2xlLndhcm4oYENvbXBvbmVudCB3YXMgYWxyZWFkeSBkZXN0cm95ZWRgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG5cdFx0fTtcblx0fVxufVxuXG5leHBvcnQgeyBjcmVhdGVfYW5pbWF0aW9uLCBmaXhfcG9zaXRpb24sIGhhbmRsZV9wcm9taXNlLCBhcHBlbmQsIGluc2VydCwgZGV0YWNoLCBkZXRhY2hfYmV0d2VlbiwgZGV0YWNoX2JlZm9yZSwgZGV0YWNoX2FmdGVyLCBkZXN0cm95X2VhY2gsIGVsZW1lbnQsIG9iamVjdF93aXRob3V0X3Byb3BlcnRpZXMsIHN2Z19lbGVtZW50LCB0ZXh0LCBzcGFjZSwgZW1wdHksIGxpc3RlbiwgcHJldmVudF9kZWZhdWx0LCBzdG9wX3Byb3BhZ2F0aW9uLCBhdHRyLCBzZXRfYXR0cmlidXRlcywgc2V0X2N1c3RvbV9lbGVtZW50X2RhdGEsIHhsaW5rX2F0dHIsIGdldF9iaW5kaW5nX2dyb3VwX3ZhbHVlLCB0b19udW1iZXIsIHRpbWVfcmFuZ2VzX3RvX2FycmF5LCBjaGlsZHJlbiwgY2xhaW1fZWxlbWVudCwgY2xhaW1fdGV4dCwgc2V0X2RhdGEsIHNldF9pbnB1dF90eXBlLCBzZXRfc3R5bGUsIHNlbGVjdF9vcHRpb24sIHNlbGVjdF9vcHRpb25zLCBzZWxlY3RfdmFsdWUsIHNlbGVjdF9tdWx0aXBsZV92YWx1ZSwgYWRkX3Jlc2l6ZV9saXN0ZW5lciwgdG9nZ2xlX2NsYXNzLCBjdXN0b21fZXZlbnQsIGRlc3Ryb3lfYmxvY2ssIG91dHJvX2FuZF9kZXN0cm95X2Jsb2NrLCBmaXhfYW5kX291dHJvX2FuZF9kZXN0cm95X2Jsb2NrLCB1cGRhdGVfa2V5ZWRfZWFjaCwgbWVhc3VyZSwgY3VycmVudF9jb21wb25lbnQsIHNldF9jdXJyZW50X2NvbXBvbmVudCwgYmVmb3JlVXBkYXRlLCBvbk1vdW50LCBhZnRlclVwZGF0ZSwgb25EZXN0cm95LCBjcmVhdGVFdmVudERpc3BhdGNoZXIsIHNldENvbnRleHQsIGdldENvbnRleHQsIGJ1YmJsZSwgY2xlYXJfbG9vcHMsIGxvb3AsIGRpcnR5X2NvbXBvbmVudHMsIGludHJvcywgc2NoZWR1bGVfdXBkYXRlLCB0aWNrLCBhZGRfYmluZGluZ19jYWxsYmFjaywgYWRkX3JlbmRlcl9jYWxsYmFjaywgYWRkX2ZsdXNoX2NhbGxiYWNrLCBmbHVzaCwgZ2V0X3NwcmVhZF91cGRhdGUsIGludmFsaWRfYXR0cmlidXRlX25hbWVfY2hhcmFjdGVyLCBzcHJlYWQsIGVzY2FwZWQsIGVzY2FwZSwgZWFjaCwgbWlzc2luZ19jb21wb25lbnQsIHZhbGlkYXRlX2NvbXBvbmVudCwgZGVidWcsIGNyZWF0ZV9zc3JfY29tcG9uZW50LCBnZXRfc3RvcmVfdmFsdWUsIGdyb3VwX291dHJvcywgY2hlY2tfb3V0cm9zLCBvbl9vdXRybywgY3JlYXRlX2luX3RyYW5zaXRpb24sIGNyZWF0ZV9vdXRfdHJhbnNpdGlvbiwgY3JlYXRlX2JpZGlyZWN0aW9uYWxfdHJhbnNpdGlvbiwgbm9vcCwgaWRlbnRpdHksIGFzc2lnbiwgaXNfcHJvbWlzZSwgYWRkX2xvY2F0aW9uLCBydW4sIGJsYW5rX29iamVjdCwgcnVuX2FsbCwgaXNfZnVuY3Rpb24sIHNhZmVfbm90X2VxdWFsLCBub3RfZXF1YWwsIHZhbGlkYXRlX3N0b3JlLCBzdWJzY3JpYmUsIGNyZWF0ZV9zbG90LCBnZXRfc2xvdF9jb250ZXh0LCBnZXRfc2xvdF9jaGFuZ2VzLCBleGNsdWRlX2ludGVybmFsX3Byb3BzLCBiaW5kLCBtb3VudF9jb21wb25lbnQsIGluaXQsIFN2ZWx0ZUVsZW1lbnQsIFN2ZWx0ZUNvbXBvbmVudCwgU3ZlbHRlQ29tcG9uZW50RGV2IH07XG4iLCIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IHN0ciA9PiBlbmNvZGVVUklDb21wb25lbnQoc3RyKS5yZXBsYWNlKC9bIScoKSpdL2csIHggPT4gYCUke3guY2hhckNvZGVBdCgwKS50b1N0cmluZygxNikudG9VcHBlckNhc2UoKX1gKTtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciB0b2tlbiA9ICclW2EtZjAtOV17Mn0nO1xudmFyIHNpbmdsZU1hdGNoZXIgPSBuZXcgUmVnRXhwKHRva2VuLCAnZ2knKTtcbnZhciBtdWx0aU1hdGNoZXIgPSBuZXcgUmVnRXhwKCcoJyArIHRva2VuICsgJykrJywgJ2dpJyk7XG5cbmZ1bmN0aW9uIGRlY29kZUNvbXBvbmVudHMoY29tcG9uZW50cywgc3BsaXQpIHtcblx0dHJ5IHtcblx0XHQvLyBUcnkgdG8gZGVjb2RlIHRoZSBlbnRpcmUgc3RyaW5nIGZpcnN0XG5cdFx0cmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChjb21wb25lbnRzLmpvaW4oJycpKTtcblx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0Ly8gRG8gbm90aGluZ1xuXHR9XG5cblx0aWYgKGNvbXBvbmVudHMubGVuZ3RoID09PSAxKSB7XG5cdFx0cmV0dXJuIGNvbXBvbmVudHM7XG5cdH1cblxuXHRzcGxpdCA9IHNwbGl0IHx8IDE7XG5cblx0Ly8gU3BsaXQgdGhlIGFycmF5IGluIDIgcGFydHNcblx0dmFyIGxlZnQgPSBjb21wb25lbnRzLnNsaWNlKDAsIHNwbGl0KTtcblx0dmFyIHJpZ2h0ID0gY29tcG9uZW50cy5zbGljZShzcGxpdCk7XG5cblx0cmV0dXJuIEFycmF5LnByb3RvdHlwZS5jb25jYXQuY2FsbChbXSwgZGVjb2RlQ29tcG9uZW50cyhsZWZ0KSwgZGVjb2RlQ29tcG9uZW50cyhyaWdodCkpO1xufVxuXG5mdW5jdGlvbiBkZWNvZGUoaW5wdXQpIHtcblx0dHJ5IHtcblx0XHRyZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KGlucHV0KTtcblx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0dmFyIHRva2VucyA9IGlucHV0Lm1hdGNoKHNpbmdsZU1hdGNoZXIpO1xuXG5cdFx0Zm9yICh2YXIgaSA9IDE7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlucHV0ID0gZGVjb2RlQ29tcG9uZW50cyh0b2tlbnMsIGkpLmpvaW4oJycpO1xuXG5cdFx0XHR0b2tlbnMgPSBpbnB1dC5tYXRjaChzaW5nbGVNYXRjaGVyKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gaW5wdXQ7XG5cdH1cbn1cblxuZnVuY3Rpb24gY3VzdG9tRGVjb2RlVVJJQ29tcG9uZW50KGlucHV0KSB7XG5cdC8vIEtlZXAgdHJhY2sgb2YgYWxsIHRoZSByZXBsYWNlbWVudHMgYW5kIHByZWZpbGwgdGhlIG1hcCB3aXRoIHRoZSBgQk9NYFxuXHR2YXIgcmVwbGFjZU1hcCA9IHtcblx0XHQnJUZFJUZGJzogJ1xcdUZGRkRcXHVGRkZEJyxcblx0XHQnJUZGJUZFJzogJ1xcdUZGRkRcXHVGRkZEJ1xuXHR9O1xuXG5cdHZhciBtYXRjaCA9IG11bHRpTWF0Y2hlci5leGVjKGlucHV0KTtcblx0d2hpbGUgKG1hdGNoKSB7XG5cdFx0dHJ5IHtcblx0XHRcdC8vIERlY29kZSBhcyBiaWcgY2h1bmtzIGFzIHBvc3NpYmxlXG5cdFx0XHRyZXBsYWNlTWFwW21hdGNoWzBdXSA9IGRlY29kZVVSSUNvbXBvbmVudChtYXRjaFswXSk7XG5cdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHR2YXIgcmVzdWx0ID0gZGVjb2RlKG1hdGNoWzBdKTtcblxuXHRcdFx0aWYgKHJlc3VsdCAhPT0gbWF0Y2hbMF0pIHtcblx0XHRcdFx0cmVwbGFjZU1hcFttYXRjaFswXV0gPSByZXN1bHQ7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0bWF0Y2ggPSBtdWx0aU1hdGNoZXIuZXhlYyhpbnB1dCk7XG5cdH1cblxuXHQvLyBBZGQgYCVDMmAgYXQgdGhlIGVuZCBvZiB0aGUgbWFwIHRvIG1ha2Ugc3VyZSBpdCBkb2VzIG5vdCByZXBsYWNlIHRoZSBjb21iaW5hdG9yIGJlZm9yZSBldmVyeXRoaW5nIGVsc2Vcblx0cmVwbGFjZU1hcFsnJUMyJ10gPSAnXFx1RkZGRCc7XG5cblx0dmFyIGVudHJpZXMgPSBPYmplY3Qua2V5cyhyZXBsYWNlTWFwKTtcblxuXHRmb3IgKHZhciBpID0gMDsgaSA8IGVudHJpZXMubGVuZ3RoOyBpKyspIHtcblx0XHQvLyBSZXBsYWNlIGFsbCBkZWNvZGVkIGNvbXBvbmVudHNcblx0XHR2YXIga2V5ID0gZW50cmllc1tpXTtcblx0XHRpbnB1dCA9IGlucHV0LnJlcGxhY2UobmV3IFJlZ0V4cChrZXksICdnJyksIHJlcGxhY2VNYXBba2V5XSk7XG5cdH1cblxuXHRyZXR1cm4gaW5wdXQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGVuY29kZWRVUkkpIHtcblx0aWYgKHR5cGVvZiBlbmNvZGVkVVJJICE9PSAnc3RyaW5nJykge1xuXHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIGBlbmNvZGVkVVJJYCB0byBiZSBvZiB0eXBlIGBzdHJpbmdgLCBnb3QgYCcgKyB0eXBlb2YgZW5jb2RlZFVSSSArICdgJyk7XG5cdH1cblxuXHR0cnkge1xuXHRcdGVuY29kZWRVUkkgPSBlbmNvZGVkVVJJLnJlcGxhY2UoL1xcKy9nLCAnICcpO1xuXG5cdFx0Ly8gVHJ5IHRoZSBidWlsdCBpbiBkZWNvZGVyIGZpcnN0XG5cdFx0cmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChlbmNvZGVkVVJJKTtcblx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0Ly8gRmFsbGJhY2sgdG8gYSBtb3JlIGFkdmFuY2VkIGRlY29kZXJcblx0XHRyZXR1cm4gY3VzdG9tRGVjb2RlVVJJQ29tcG9uZW50KGVuY29kZWRVUkkpO1xuXHR9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IChzdHJpbmcsIHNlcGFyYXRvcikgPT4ge1xuXHRpZiAoISh0eXBlb2Ygc3RyaW5nID09PSAnc3RyaW5nJyAmJiB0eXBlb2Ygc2VwYXJhdG9yID09PSAnc3RyaW5nJykpIHtcblx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCdFeHBlY3RlZCB0aGUgYXJndW1lbnRzIHRvIGJlIG9mIHR5cGUgYHN0cmluZ2AnKTtcblx0fVxuXG5cdGlmIChzZXBhcmF0b3IgPT09ICcnKSB7XG5cdFx0cmV0dXJuIFtzdHJpbmddO1xuXHR9XG5cblx0Y29uc3Qgc2VwYXJhdG9ySW5kZXggPSBzdHJpbmcuaW5kZXhPZihzZXBhcmF0b3IpO1xuXG5cdGlmIChzZXBhcmF0b3JJbmRleCA9PT0gLTEpIHtcblx0XHRyZXR1cm4gW3N0cmluZ107XG5cdH1cblxuXHRyZXR1cm4gW1xuXHRcdHN0cmluZy5zbGljZSgwLCBzZXBhcmF0b3JJbmRleCksXG5cdFx0c3RyaW5nLnNsaWNlKHNlcGFyYXRvckluZGV4ICsgc2VwYXJhdG9yLmxlbmd0aClcblx0XTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5jb25zdCBzdHJpY3RVcmlFbmNvZGUgPSByZXF1aXJlKCdzdHJpY3QtdXJpLWVuY29kZScpO1xuY29uc3QgZGVjb2RlQ29tcG9uZW50ID0gcmVxdWlyZSgnZGVjb2RlLXVyaS1jb21wb25lbnQnKTtcbmNvbnN0IHNwbGl0T25GaXJzdCA9IHJlcXVpcmUoJ3NwbGl0LW9uLWZpcnN0Jyk7XG5cbmZ1bmN0aW9uIGVuY29kZXJGb3JBcnJheUZvcm1hdChvcHRpb25zKSB7XG5cdHN3aXRjaCAob3B0aW9ucy5hcnJheUZvcm1hdCkge1xuXHRcdGNhc2UgJ2luZGV4Jzpcblx0XHRcdHJldHVybiBrZXkgPT4gKHJlc3VsdCwgdmFsdWUpID0+IHtcblx0XHRcdFx0Y29uc3QgaW5kZXggPSByZXN1bHQubGVuZ3RoO1xuXHRcdFx0XHRpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdHJldHVybiByZXN1bHQ7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAodmFsdWUgPT09IG51bGwpIHtcblx0XHRcdFx0XHRyZXR1cm4gWy4uLnJlc3VsdCwgW2VuY29kZShrZXksIG9wdGlvbnMpLCAnWycsIGluZGV4LCAnXSddLmpvaW4oJycpXTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiBbXG5cdFx0XHRcdFx0Li4ucmVzdWx0LFxuXHRcdFx0XHRcdFtlbmNvZGUoa2V5LCBvcHRpb25zKSwgJ1snLCBlbmNvZGUoaW5kZXgsIG9wdGlvbnMpLCAnXT0nLCBlbmNvZGUodmFsdWUsIG9wdGlvbnMpXS5qb2luKCcnKVxuXHRcdFx0XHRdO1xuXHRcdFx0fTtcblxuXHRcdGNhc2UgJ2JyYWNrZXQnOlxuXHRcdFx0cmV0dXJuIGtleSA9PiAocmVzdWx0LCB2YWx1ZSkgPT4ge1xuXHRcdFx0XHRpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdHJldHVybiByZXN1bHQ7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAodmFsdWUgPT09IG51bGwpIHtcblx0XHRcdFx0XHRyZXR1cm4gWy4uLnJlc3VsdCwgW2VuY29kZShrZXksIG9wdGlvbnMpLCAnW10nXS5qb2luKCcnKV07XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gWy4uLnJlc3VsdCwgW2VuY29kZShrZXksIG9wdGlvbnMpLCAnW109JywgZW5jb2RlKHZhbHVlLCBvcHRpb25zKV0uam9pbignJyldO1xuXHRcdFx0fTtcblxuXHRcdGNhc2UgJ2NvbW1hJzpcblx0XHRcdHJldHVybiBrZXkgPT4gKHJlc3VsdCwgdmFsdWUsIGluZGV4KSA9PiB7XG5cdFx0XHRcdGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHRcdHJldHVybiByZXN1bHQ7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoaW5kZXggPT09IDApIHtcblx0XHRcdFx0XHRyZXR1cm4gW1tlbmNvZGUoa2V5LCBvcHRpb25zKSwgJz0nLCBlbmNvZGUodmFsdWUsIG9wdGlvbnMpXS5qb2luKCcnKV07XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gW1tyZXN1bHQsIGVuY29kZSh2YWx1ZSwgb3B0aW9ucyldLmpvaW4oJywnKV07XG5cdFx0XHR9O1xuXG5cdFx0ZGVmYXVsdDpcblx0XHRcdHJldHVybiBrZXkgPT4gKHJlc3VsdCwgdmFsdWUpID0+IHtcblx0XHRcdFx0aWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRyZXR1cm4gcmVzdWx0O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHZhbHVlID09PSBudWxsKSB7XG5cdFx0XHRcdFx0cmV0dXJuIFsuLi5yZXN1bHQsIGVuY29kZShrZXksIG9wdGlvbnMpXTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiBbLi4ucmVzdWx0LCBbZW5jb2RlKGtleSwgb3B0aW9ucyksICc9JywgZW5jb2RlKHZhbHVlLCBvcHRpb25zKV0uam9pbignJyldO1xuXHRcdFx0fTtcblx0fVxufVxuXG5mdW5jdGlvbiBwYXJzZXJGb3JBcnJheUZvcm1hdChvcHRpb25zKSB7XG5cdGxldCByZXN1bHQ7XG5cblx0c3dpdGNoIChvcHRpb25zLmFycmF5Rm9ybWF0KSB7XG5cdFx0Y2FzZSAnaW5kZXgnOlxuXHRcdFx0cmV0dXJuIChrZXksIHZhbHVlLCBhY2N1bXVsYXRvcikgPT4ge1xuXHRcdFx0XHRyZXN1bHQgPSAvXFxbKFxcZCopXFxdJC8uZXhlYyhrZXkpO1xuXG5cdFx0XHRcdGtleSA9IGtleS5yZXBsYWNlKC9cXFtcXGQqXFxdJC8sICcnKTtcblxuXHRcdFx0XHRpZiAoIXJlc3VsdCkge1xuXHRcdFx0XHRcdGFjY3VtdWxhdG9yW2tleV0gPSB2YWx1ZTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoYWNjdW11bGF0b3Jba2V5XSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0YWNjdW11bGF0b3Jba2V5XSA9IHt9O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0YWNjdW11bGF0b3Jba2V5XVtyZXN1bHRbMV1dID0gdmFsdWU7XG5cdFx0XHR9O1xuXG5cdFx0Y2FzZSAnYnJhY2tldCc6XG5cdFx0XHRyZXR1cm4gKGtleSwgdmFsdWUsIGFjY3VtdWxhdG9yKSA9PiB7XG5cdFx0XHRcdHJlc3VsdCA9IC8oXFxbXFxdKSQvLmV4ZWMoa2V5KTtcblx0XHRcdFx0a2V5ID0ga2V5LnJlcGxhY2UoL1xcW1xcXSQvLCAnJyk7XG5cblx0XHRcdFx0aWYgKCFyZXN1bHQpIHtcblx0XHRcdFx0XHRhY2N1bXVsYXRvcltrZXldID0gdmFsdWU7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGFjY3VtdWxhdG9yW2tleV0gPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdGFjY3VtdWxhdG9yW2tleV0gPSBbdmFsdWVdO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGFjY3VtdWxhdG9yW2tleV0gPSBbXS5jb25jYXQoYWNjdW11bGF0b3Jba2V5XSwgdmFsdWUpO1xuXHRcdFx0fTtcblxuXHRcdGNhc2UgJ2NvbW1hJzpcblx0XHRcdHJldHVybiAoa2V5LCB2YWx1ZSwgYWNjdW11bGF0b3IpID0+IHtcblx0XHRcdFx0Y29uc3QgaXNBcnJheSA9IHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgJiYgdmFsdWUuc3BsaXQoJycpLmluZGV4T2YoJywnKSA+IC0xO1xuXHRcdFx0XHRjb25zdCBuZXdWYWx1ZSA9IGlzQXJyYXkgPyB2YWx1ZS5zcGxpdCgnLCcpIDogdmFsdWU7XG5cdFx0XHRcdGFjY3VtdWxhdG9yW2tleV0gPSBuZXdWYWx1ZTtcblx0XHRcdH07XG5cblx0XHRkZWZhdWx0OlxuXHRcdFx0cmV0dXJuIChrZXksIHZhbHVlLCBhY2N1bXVsYXRvcikgPT4ge1xuXHRcdFx0XHRpZiAoYWNjdW11bGF0b3Jba2V5XSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0YWNjdW11bGF0b3Jba2V5XSA9IHZhbHVlO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGFjY3VtdWxhdG9yW2tleV0gPSBbXS5jb25jYXQoYWNjdW11bGF0b3Jba2V5XSwgdmFsdWUpO1xuXHRcdFx0fTtcblx0fVxufVxuXG5mdW5jdGlvbiBlbmNvZGUodmFsdWUsIG9wdGlvbnMpIHtcblx0aWYgKG9wdGlvbnMuZW5jb2RlKSB7XG5cdFx0cmV0dXJuIG9wdGlvbnMuc3RyaWN0ID8gc3RyaWN0VXJpRW5jb2RlKHZhbHVlKSA6IGVuY29kZVVSSUNvbXBvbmVudCh2YWx1ZSk7XG5cdH1cblxuXHRyZXR1cm4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIGRlY29kZSh2YWx1ZSwgb3B0aW9ucykge1xuXHRpZiAob3B0aW9ucy5kZWNvZGUpIHtcblx0XHRyZXR1cm4gZGVjb2RlQ29tcG9uZW50KHZhbHVlKTtcblx0fVxuXG5cdHJldHVybiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24ga2V5c1NvcnRlcihpbnB1dCkge1xuXHRpZiAoQXJyYXkuaXNBcnJheShpbnB1dCkpIHtcblx0XHRyZXR1cm4gaW5wdXQuc29ydCgpO1xuXHR9XG5cblx0aWYgKHR5cGVvZiBpbnB1dCA9PT0gJ29iamVjdCcpIHtcblx0XHRyZXR1cm4ga2V5c1NvcnRlcihPYmplY3Qua2V5cyhpbnB1dCkpXG5cdFx0XHQuc29ydCgoYSwgYikgPT4gTnVtYmVyKGEpIC0gTnVtYmVyKGIpKVxuXHRcdFx0Lm1hcChrZXkgPT4gaW5wdXRba2V5XSk7XG5cdH1cblxuXHRyZXR1cm4gaW5wdXQ7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUhhc2goaW5wdXQpIHtcblx0Y29uc3QgaGFzaFN0YXJ0ID0gaW5wdXQuaW5kZXhPZignIycpO1xuXHRpZiAoaGFzaFN0YXJ0ICE9PSAtMSkge1xuXHRcdGlucHV0ID0gaW5wdXQuc2xpY2UoMCwgaGFzaFN0YXJ0KTtcblx0fVxuXG5cdHJldHVybiBpbnB1dDtcbn1cblxuZnVuY3Rpb24gZXh0cmFjdChpbnB1dCkge1xuXHRpbnB1dCA9IHJlbW92ZUhhc2goaW5wdXQpO1xuXHRjb25zdCBxdWVyeVN0YXJ0ID0gaW5wdXQuaW5kZXhPZignPycpO1xuXHRpZiAocXVlcnlTdGFydCA9PT0gLTEpIHtcblx0XHRyZXR1cm4gJyc7XG5cdH1cblxuXHRyZXR1cm4gaW5wdXQuc2xpY2UocXVlcnlTdGFydCArIDEpO1xufVxuXG5mdW5jdGlvbiBwYXJzZVZhbHVlKHZhbHVlLCBvcHRpb25zKSB7XG5cdGlmIChvcHRpb25zLnBhcnNlTnVtYmVycyAmJiAhTnVtYmVyLmlzTmFOKE51bWJlcih2YWx1ZSkpICYmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnICYmIHZhbHVlLnRyaW0oKSAhPT0gJycpKSB7XG5cdFx0dmFsdWUgPSBOdW1iZXIodmFsdWUpO1xuXHR9IGVsc2UgaWYgKG9wdGlvbnMucGFyc2VCb29sZWFucyAmJiB2YWx1ZSAhPT0gbnVsbCAmJiAodmFsdWUudG9Mb3dlckNhc2UoKSA9PT0gJ3RydWUnIHx8IHZhbHVlLnRvTG93ZXJDYXNlKCkgPT09ICdmYWxzZScpKSB7XG5cdFx0dmFsdWUgPSB2YWx1ZS50b0xvd2VyQ2FzZSgpID09PSAndHJ1ZSc7XG5cdH1cblxuXHRyZXR1cm4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIHBhcnNlKGlucHV0LCBvcHRpb25zKSB7XG5cdG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHtcblx0XHRkZWNvZGU6IHRydWUsXG5cdFx0c29ydDogdHJ1ZSxcblx0XHRhcnJheUZvcm1hdDogJ25vbmUnLFxuXHRcdHBhcnNlTnVtYmVyczogZmFsc2UsXG5cdFx0cGFyc2VCb29sZWFuczogZmFsc2Vcblx0fSwgb3B0aW9ucyk7XG5cblx0Y29uc3QgZm9ybWF0dGVyID0gcGFyc2VyRm9yQXJyYXlGb3JtYXQob3B0aW9ucyk7XG5cblx0Ly8gQ3JlYXRlIGFuIG9iamVjdCB3aXRoIG5vIHByb3RvdHlwZVxuXHRjb25zdCByZXQgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG5cdGlmICh0eXBlb2YgaW5wdXQgIT09ICdzdHJpbmcnKSB7XG5cdFx0cmV0dXJuIHJldDtcblx0fVxuXG5cdGlucHV0ID0gaW5wdXQudHJpbSgpLnJlcGxhY2UoL15bPyMmXS8sICcnKTtcblxuXHRpZiAoIWlucHV0KSB7XG5cdFx0cmV0dXJuIHJldDtcblx0fVxuXG5cdGZvciAoY29uc3QgcGFyYW0gb2YgaW5wdXQuc3BsaXQoJyYnKSkge1xuXHRcdGxldCBba2V5LCB2YWx1ZV0gPSBzcGxpdE9uRmlyc3QocGFyYW0ucmVwbGFjZSgvXFwrL2csICcgJyksICc9Jyk7XG5cblx0XHQvLyBNaXNzaW5nIGA9YCBzaG91bGQgYmUgYG51bGxgOlxuXHRcdC8vIGh0dHA6Ly93My5vcmcvVFIvMjAxMi9XRC11cmwtMjAxMjA1MjQvI2NvbGxlY3QtdXJsLXBhcmFtZXRlcnNcblx0XHR2YWx1ZSA9IHZhbHVlID09PSB1bmRlZmluZWQgPyBudWxsIDogZGVjb2RlKHZhbHVlLCBvcHRpb25zKTtcblx0XHRmb3JtYXR0ZXIoZGVjb2RlKGtleSwgb3B0aW9ucyksIHZhbHVlLCByZXQpO1xuXHR9XG5cblx0Zm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMocmV0KSkge1xuXHRcdGNvbnN0IHZhbHVlID0gcmV0W2tleV07XG5cdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IG51bGwpIHtcblx0XHRcdGZvciAoY29uc3QgayBvZiBPYmplY3Qua2V5cyh2YWx1ZSkpIHtcblx0XHRcdFx0dmFsdWVba10gPSBwYXJzZVZhbHVlKHZhbHVlW2tdLCBvcHRpb25zKTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0W2tleV0gPSBwYXJzZVZhbHVlKHZhbHVlLCBvcHRpb25zKTtcblx0XHR9XG5cdH1cblxuXHRpZiAob3B0aW9ucy5zb3J0ID09PSBmYWxzZSkge1xuXHRcdHJldHVybiByZXQ7XG5cdH1cblxuXHRyZXR1cm4gKG9wdGlvbnMuc29ydCA9PT0gdHJ1ZSA/IE9iamVjdC5rZXlzKHJldCkuc29ydCgpIDogT2JqZWN0LmtleXMocmV0KS5zb3J0KG9wdGlvbnMuc29ydCkpLnJlZHVjZSgocmVzdWx0LCBrZXkpID0+IHtcblx0XHRjb25zdCB2YWx1ZSA9IHJldFtrZXldO1xuXHRcdGlmIChCb29sZWFuKHZhbHVlKSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmICFBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuXHRcdFx0Ly8gU29ydCBvYmplY3Qga2V5cywgbm90IHZhbHVlc1xuXHRcdFx0cmVzdWx0W2tleV0gPSBrZXlzU29ydGVyKHZhbHVlKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmVzdWx0W2tleV0gPSB2YWx1ZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gcmVzdWx0O1xuXHR9LCBPYmplY3QuY3JlYXRlKG51bGwpKTtcbn1cblxuZXhwb3J0cy5leHRyYWN0ID0gZXh0cmFjdDtcbmV4cG9ydHMucGFyc2UgPSBwYXJzZTtcblxuZXhwb3J0cy5zdHJpbmdpZnkgPSAob2JqZWN0LCBvcHRpb25zKSA9PiB7XG5cdGlmICghb2JqZWN0KSB7XG5cdFx0cmV0dXJuICcnO1xuXHR9XG5cblx0b3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe1xuXHRcdGVuY29kZTogdHJ1ZSxcblx0XHRzdHJpY3Q6IHRydWUsXG5cdFx0YXJyYXlGb3JtYXQ6ICdub25lJ1xuXHR9LCBvcHRpb25zKTtcblxuXHRjb25zdCBmb3JtYXR0ZXIgPSBlbmNvZGVyRm9yQXJyYXlGb3JtYXQob3B0aW9ucyk7XG5cdGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhvYmplY3QpO1xuXG5cdGlmIChvcHRpb25zLnNvcnQgIT09IGZhbHNlKSB7XG5cdFx0a2V5cy5zb3J0KG9wdGlvbnMuc29ydCk7XG5cdH1cblxuXHRyZXR1cm4ga2V5cy5tYXAoa2V5ID0+IHtcblx0XHRjb25zdCB2YWx1ZSA9IG9iamVjdFtrZXldO1xuXG5cdFx0aWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcblx0XHRcdHJldHVybiAnJztcblx0XHR9XG5cblx0XHRpZiAodmFsdWUgPT09IG51bGwpIHtcblx0XHRcdHJldHVybiBlbmNvZGUoa2V5LCBvcHRpb25zKTtcblx0XHR9XG5cblx0XHRpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcblx0XHRcdHJldHVybiB2YWx1ZVxuXHRcdFx0XHQucmVkdWNlKGZvcm1hdHRlcihrZXkpLCBbXSlcblx0XHRcdFx0LmpvaW4oJyYnKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZW5jb2RlKGtleSwgb3B0aW9ucykgKyAnPScgKyBlbmNvZGUodmFsdWUsIG9wdGlvbnMpO1xuXHR9KS5maWx0ZXIoeCA9PiB4Lmxlbmd0aCA+IDApLmpvaW4oJyYnKTtcbn07XG5cbmV4cG9ydHMucGFyc2VVcmwgPSAoaW5wdXQsIG9wdGlvbnMpID0+IHtcblx0cmV0dXJuIHtcblx0XHR1cmw6IHJlbW92ZUhhc2goaW5wdXQpLnNwbGl0KCc/JylbMF0gfHwgJycsXG5cdFx0cXVlcnk6IHBhcnNlKGV4dHJhY3QoaW5wdXQpLCBvcHRpb25zKVxuXHR9O1xufTtcbiIsInZhciBkZWZhdWx0RXhwb3J0ID0gLypAX19QVVJFX18qLyhmdW5jdGlvbiAoRXJyb3IpIHtcbiAgZnVuY3Rpb24gZGVmYXVsdEV4cG9ydChyb3V0ZSwgcGF0aCkge1xuICAgIHZhciBtZXNzYWdlID0gXCJVbnJlYWNoYWJsZSAnXCIgKyByb3V0ZSArIFwiJywgc2VnbWVudCAnXCIgKyBwYXRoICsgXCInIGlzIG5vdCBkZWZpbmVkXCI7XG4gICAgRXJyb3IuY2FsbCh0aGlzLCBtZXNzYWdlKTtcbiAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xuICB9XG5cbiAgaWYgKCBFcnJvciApIGRlZmF1bHRFeHBvcnQuX19wcm90b19fID0gRXJyb3I7XG4gIGRlZmF1bHRFeHBvcnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggRXJyb3IgJiYgRXJyb3IucHJvdG90eXBlICk7XG4gIGRlZmF1bHRFeHBvcnQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gZGVmYXVsdEV4cG9ydDtcblxuICByZXR1cm4gZGVmYXVsdEV4cG9ydDtcbn0oRXJyb3IpKTtcblxuZnVuY3Rpb24gYnVpbGRNYXRjaGVyKHBhdGgsIHBhcmVudCkge1xuICB2YXIgcmVnZXg7XG5cbiAgdmFyIF9pc1NwbGF0O1xuXG4gIHZhciBfcHJpb3JpdHkgPSAtMTAwO1xuXG4gIHZhciBrZXlzID0gW107XG4gIHJlZ2V4ID0gcGF0aC5yZXBsYWNlKC9bLSQuXS9nLCAnXFxcXCQmJykucmVwbGFjZSgvXFwoL2csICcoPzonKS5yZXBsYWNlKC9cXCkvZywgJyk/JykucmVwbGFjZSgvKFs6Kl1cXHcrKSg/OjwoW148Pl0rPyk+KT8vZywgZnVuY3Rpb24gKF8sIGtleSwgZXhwcikge1xuICAgIGtleXMucHVzaChrZXkuc3Vic3RyKDEpKTtcblxuICAgIGlmIChrZXkuY2hhckF0KCkgPT09ICc6Jykge1xuICAgICAgX3ByaW9yaXR5ICs9IDEwMDtcbiAgICAgIHJldHVybiAoXCIoKD8hIylcIiArIChleHByIHx8ICdbXiMvXSs/JykgKyBcIilcIik7XG4gICAgfVxuXG4gICAgX2lzU3BsYXQgPSB0cnVlO1xuICAgIF9wcmlvcml0eSArPSA1MDA7XG4gICAgcmV0dXJuIChcIigoPyEjKVwiICsgKGV4cHIgfHwgJ1teI10rPycpICsgXCIpXCIpO1xuICB9KTtcblxuICB0cnkge1xuICAgIHJlZ2V4ID0gbmV3IFJlZ0V4cCgoXCJeXCIgKyByZWdleCArIFwiJFwiKSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKChcIkludmFsaWQgcm91dGUgZXhwcmVzc2lvbiwgZ2l2ZW4gJ1wiICsgcGFyZW50ICsgXCInXCIpKTtcbiAgfVxuXG4gIHZhciBfaGFzaGVkID0gcGF0aC5pbmNsdWRlcygnIycpID8gMC41IDogMTtcblxuICB2YXIgX2RlcHRoID0gcGF0aC5sZW5ndGggKiBfcHJpb3JpdHkgKiBfaGFzaGVkO1xuXG4gIHJldHVybiB7XG4gICAga2V5czoga2V5cyxcbiAgICByZWdleDogcmVnZXgsXG4gICAgX2RlcHRoOiBfZGVwdGgsXG4gICAgX2lzU3BsYXQ6IF9pc1NwbGF0XG4gIH07XG59XG52YXIgUGF0aE1hdGNoZXIgPSBmdW5jdGlvbiBQYXRoTWF0Y2hlcihwYXRoLCBwYXJlbnQpIHtcbiAgdmFyIHJlZiA9IGJ1aWxkTWF0Y2hlcihwYXRoLCBwYXJlbnQpO1xuICB2YXIga2V5cyA9IHJlZi5rZXlzO1xuICB2YXIgcmVnZXggPSByZWYucmVnZXg7XG4gIHZhciBfZGVwdGggPSByZWYuX2RlcHRoO1xuICB2YXIgX2lzU3BsYXQgPSByZWYuX2lzU3BsYXQ7XG4gIHJldHVybiB7XG4gICAgX2lzU3BsYXQ6IF9pc1NwbGF0LFxuICAgIF9kZXB0aDogX2RlcHRoLFxuICAgIG1hdGNoOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHZhciBtYXRjaGVzID0gdmFsdWUubWF0Y2gocmVnZXgpO1xuXG4gICAgICBpZiAobWF0Y2hlcykge1xuICAgICAgICByZXR1cm4ga2V5cy5yZWR1Y2UoZnVuY3Rpb24gKHByZXYsIGN1ciwgaSkge1xuICAgICAgICAgIHByZXZbY3VyXSA9IHR5cGVvZiBtYXRjaGVzW2kgKyAxXSA9PT0gJ3N0cmluZycgPyBkZWNvZGVVUklDb21wb25lbnQobWF0Y2hlc1tpICsgMV0pIDogbnVsbDtcbiAgICAgICAgICByZXR1cm4gcHJldjtcbiAgICAgICAgfSwge30pO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbn07XG5cblBhdGhNYXRjaGVyLnB1c2ggPSBmdW5jdGlvbiBwdXNoIChrZXksIHByZXYsIGxlYWYsIHBhcmVudCkge1xuICB2YXIgcm9vdCA9IHByZXZba2V5XSB8fCAocHJldltrZXldID0ge30pO1xuXG4gIGlmICghcm9vdC5wYXR0ZXJuKSB7XG4gICAgcm9vdC5wYXR0ZXJuID0gbmV3IFBhdGhNYXRjaGVyKGtleSwgcGFyZW50KTtcbiAgICByb290LnJvdXRlID0gKGxlYWYgfHwgJycpLnJlcGxhY2UoL1xcLyQvLCAnJykgfHwgJy8nO1xuICB9XG5cbiAgcHJldi5rZXlzID0gcHJldi5rZXlzIHx8IFtdO1xuXG4gIGlmICghcHJldi5rZXlzLmluY2x1ZGVzKGtleSkpIHtcbiAgICBwcmV2LmtleXMucHVzaChrZXkpO1xuICAgIFBhdGhNYXRjaGVyLnNvcnQocHJldik7XG4gIH1cblxuICByZXR1cm4gcm9vdDtcbn07XG5cblBhdGhNYXRjaGVyLnNvcnQgPSBmdW5jdGlvbiBzb3J0IChyb290KSB7XG4gIHJvb3Qua2V5cy5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgcmV0dXJuIHJvb3RbYV0ucGF0dGVybi5fZGVwdGggLSByb290W2JdLnBhdHRlcm4uX2RlcHRoO1xuICB9KTtcbn07XG5cbmZ1bmN0aW9uIG1lcmdlKHBhdGgsIHBhcmVudCkge1xuICByZXR1cm4gKFwiXCIgKyAocGFyZW50ICYmIHBhcmVudCAhPT0gJy8nID8gcGFyZW50IDogJycpICsgKHBhdGggfHwgJycpKTtcbn1cbmZ1bmN0aW9uIHdhbGsocGF0aCwgY2IpIHtcbiAgdmFyIG1hdGNoZXMgPSBwYXRoLm1hdGNoKC88W148Pl0qXFwvW148Pl0qPi8pO1xuXG4gIGlmIChtYXRjaGVzKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcigoXCJSZWdFeHAgY2Fubm90IGNvbnRhaW4gc2xhc2hlcywgZ2l2ZW4gJ1wiICsgbWF0Y2hlcyArIFwiJ1wiKSk7XG4gIH1cblxuICB2YXIgcGFydHMgPSBwYXRoICE9PSAnLycgPyBwYXRoLnNwbGl0KCcvJykgOiBbJyddO1xuICB2YXIgcm9vdCA9IFtdO1xuICBwYXJ0cy5zb21lKGZ1bmN0aW9uICh4LCBpKSB7XG4gICAgdmFyIHBhcmVudCA9IHJvb3QuY29uY2F0KHgpLmpvaW4oJy8nKSB8fCBudWxsO1xuICAgIHZhciBzZWdtZW50ID0gcGFydHMuc2xpY2UoaSArIDEpLmpvaW4oJy8nKSB8fCBudWxsO1xuICAgIHZhciByZXR2YWwgPSBjYigoXCIvXCIgKyB4KSwgcGFyZW50LCBzZWdtZW50ID8gKCh4ID8gKFwiL1wiICsgeCkgOiAnJykgKyBcIi9cIiArIHNlZ21lbnQpIDogbnVsbCk7XG4gICAgcm9vdC5wdXNoKHgpO1xuICAgIHJldHVybiByZXR2YWw7XG4gIH0pO1xufVxuZnVuY3Rpb24gcmVkdWNlKGtleSwgcm9vdCwgX3NlZW4pIHtcbiAgdmFyIHBhcmFtcyA9IHt9O1xuICB2YXIgb3V0ID0gW107XG4gIHZhciBzcGxhdDtcbiAgd2FsayhrZXksIGZ1bmN0aW9uICh4LCBsZWFmLCBleHRyYSkge1xuICAgIHZhciBmb3VuZDtcblxuICAgIGlmICghcm9vdC5rZXlzKSB7XG4gICAgICB0aHJvdyBuZXcgZGVmYXVsdEV4cG9ydChrZXksIHgpO1xuICAgIH1cblxuICAgIHJvb3Qua2V5cy5zb21lKGZ1bmN0aW9uIChrKSB7XG4gICAgICBpZiAoX3NlZW4uaW5jbHVkZXMoaykpIHsgcmV0dXJuIGZhbHNlOyB9XG4gICAgICB2YXIgcmVmID0gcm9vdFtrXS5wYXR0ZXJuO1xuICAgICAgdmFyIG1hdGNoID0gcmVmLm1hdGNoO1xuICAgICAgdmFyIF9pc1NwbGF0ID0gcmVmLl9pc1NwbGF0O1xuICAgICAgdmFyIG1hdGNoZXMgPSBtYXRjaChfaXNTcGxhdCA/IGV4dHJhIHx8IHggOiB4KTtcblxuICAgICAgaWYgKG1hdGNoZXMpIHtcbiAgICAgICAgT2JqZWN0LmFzc2lnbihwYXJhbXMsIG1hdGNoZXMpO1xuXG4gICAgICAgIGlmIChyb290W2tdLnJvdXRlKSB7XG4gICAgICAgICAgdmFyIHJvdXRlSW5mbyA9IE9iamVjdC5hc3NpZ24oe30sIHJvb3Rba10uaW5mbyk7IC8vIHByb3Blcmx5IGhhbmRsZSBleGFjdC1yb3V0ZXMhXG5cbiAgICAgICAgICB2YXIgaGFzTWF0Y2ggPSBmYWxzZTtcblxuICAgICAgICAgIGlmIChyb3V0ZUluZm8uZXhhY3QpIHtcbiAgICAgICAgICAgIGhhc01hdGNoID0gZXh0cmEgPT09IG51bGw7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGhhc01hdGNoID0geCAmJiBsZWFmID09PSBudWxsIHx8IHggPT09IGxlYWYgfHwgX2lzU3BsYXQgfHwgIWV4dHJhO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJvdXRlSW5mby5tYXRjaGVzID0gaGFzTWF0Y2g7XG4gICAgICAgICAgcm91dGVJbmZvLnBhcmFtcyA9IE9iamVjdC5hc3NpZ24oe30sIHBhcmFtcyk7XG4gICAgICAgICAgcm91dGVJbmZvLnJvdXRlID0gcm9vdFtrXS5yb3V0ZTtcbiAgICAgICAgICByb3V0ZUluZm8ucGF0aCA9IF9pc1NwbGF0ID8gZXh0cmEgOiBsZWFmIHx8IHg7XG4gICAgICAgICAgb3V0LnB1c2gocm91dGVJbmZvKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChleHRyYSA9PT0gbnVsbCAmJiAhcm9vdFtrXS5rZXlzKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoayAhPT0gJy8nKSB7IF9zZWVuLnB1c2goayk7IH1cbiAgICAgICAgc3BsYXQgPSBfaXNTcGxhdDtcbiAgICAgICAgcm9vdCA9IHJvb3Rba107XG4gICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9KTtcblxuICAgIGlmICghKGZvdW5kIHx8IHJvb3Qua2V5cy5zb21lKGZ1bmN0aW9uIChrKSB7IHJldHVybiByb290W2tdLnBhdHRlcm4ubWF0Y2goeCk7IH0pKSkge1xuICAgICAgdGhyb3cgbmV3IGRlZmF1bHRFeHBvcnQoa2V5LCB4KTtcbiAgICB9XG5cbiAgICByZXR1cm4gc3BsYXQgfHwgIWZvdW5kO1xuICB9KTtcbiAgcmV0dXJuIG91dDtcbn1cbmZ1bmN0aW9uIGZpbmQocGF0aCwgcm91dGVzLCByZXRyaWVzKSB7XG4gIHZhciBnZXQgPSByZWR1Y2UuYmluZChudWxsLCBwYXRoLCByb3V0ZXMpO1xuICB2YXIgc2V0ID0gW107XG5cbiAgd2hpbGUgKHJldHJpZXMgPiAwKSB7XG4gICAgcmV0cmllcyAtPSAxO1xuXG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBnZXQoc2V0KTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAocmV0cmllcyA+IDApIHtcbiAgICAgICAgcmV0dXJuIGdldChzZXQpO1xuICAgICAgfVxuXG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxufVxuZnVuY3Rpb24gYWRkKHBhdGgsIHJvdXRlcywgcGFyZW50LCByb3V0ZUluZm8pIHtcbiAgdmFyIGZ1bGxwYXRoID0gbWVyZ2UocGF0aCwgcGFyZW50KTtcbiAgdmFyIHJvb3QgPSByb3V0ZXM7XG4gIHdhbGsoZnVsbHBhdGgsIGZ1bmN0aW9uICh4LCBsZWFmKSB7XG4gICAgcm9vdCA9IFBhdGhNYXRjaGVyLnB1c2goeCwgcm9vdCwgbGVhZiwgZnVsbHBhdGgpO1xuXG4gICAgaWYgKHggIT09ICcvJykge1xuICAgICAgcm9vdC5pbmZvID0gcm9vdC5pbmZvIHx8IE9iamVjdC5hc3NpZ24oe30sIHJvdXRlSW5mbyk7XG4gICAgfVxuICB9KTtcbiAgcm9vdC5pbmZvID0gcm9vdC5pbmZvIHx8IE9iamVjdC5hc3NpZ24oe30sIHJvdXRlSW5mbyk7XG4gIHJldHVybiBmdWxscGF0aDtcbn1cbmZ1bmN0aW9uIHJtKHBhdGgsIHJvdXRlcywgcGFyZW50KSB7XG4gIHZhciBmdWxscGF0aCA9IG1lcmdlKHBhdGgsIHBhcmVudCk7XG4gIHZhciByb290ID0gcm91dGVzO1xuICB2YXIgbGVhZiA9IG51bGw7XG4gIHZhciBrZXkgPSBudWxsO1xuICB3YWxrKGZ1bGxwYXRoLCBmdW5jdGlvbiAoeCkge1xuICAgIGlmICghcm9vdCkge1xuICAgICAgbGVhZiA9IG51bGw7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBrZXkgPSB4O1xuICAgIGxlYWYgPSB4ID09PSAnLycgPyByb3V0ZXNbJy8nXSA6IHJvb3Q7XG5cbiAgICBpZiAoIWxlYWYua2V5cykge1xuICAgICAgdGhyb3cgbmV3IGRlZmF1bHRFeHBvcnQocGF0aCwgeCk7XG4gICAgfVxuXG4gICAgcm9vdCA9IHJvb3RbeF07XG4gIH0pO1xuXG4gIGlmICghKGxlYWYgJiYga2V5KSkge1xuICAgIHRocm93IG5ldyBkZWZhdWx0RXhwb3J0KHBhdGgsIGtleSk7XG4gIH1cblxuICBkZWxldGUgbGVhZltrZXldO1xuXG4gIGlmIChrZXkgPT09ICcvJykge1xuICAgIGRlbGV0ZSBsZWFmLmluZm87XG4gICAgZGVsZXRlIGxlYWYucm91dGU7XG4gIH1cblxuICB2YXIgb2Zmc2V0ID0gbGVhZi5rZXlzLmluZGV4T2Yoa2V5KTtcblxuICBpZiAob2Zmc2V0ICE9PSAtMSkge1xuICAgIGxlYWYua2V5cy5zcGxpY2UobGVhZi5rZXlzLmluZGV4T2Yoa2V5KSwgMSk7XG4gICAgUGF0aE1hdGNoZXIuc29ydChsZWFmKTtcbiAgfVxufVxuXG52YXIgUm91dGVyID0gZnVuY3Rpb24gUm91dGVyKCkge1xuICB2YXIgcm91dGVzID0ge307XG4gIHZhciBzdGFjayA9IFtdO1xuICByZXR1cm4ge1xuICAgIHJlc29sdmU6IGZ1bmN0aW9uIChwYXRoLCBjYikge1xuICAgICAgdmFyIHJlZiA9IHBhdGguc3BsaXQoLyg/PVsjP10pLyk7XG4gICAgICB2YXIgdXJpID0gcmVmWzBdO1xuICAgICAgdmFyIGhhc2ggPSByZWZbMV07XG4gICAgICB2YXIgcXVlcnkgPSByZWZbMl07XG4gICAgICB2YXIgc2VnbWVudHMgPSB1cmkuc3Vic3RyKDEpLnNwbGl0KCcvJyk7XG4gICAgICB2YXIgcHJlZml4ID0gW107XG4gICAgICB2YXIgc2VlbiA9IFtdO1xuICAgICAgc2VnbWVudHMuc29tZShmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIHZhciBzdWIgPSBwcmVmaXguY29uY2F0KChcIi9cIiArIGtleSkpLmpvaW4oJycpO1xuICAgICAgICBpZiAoa2V5Lmxlbmd0aCkgeyBwcmVmaXgucHVzaCgoXCIvXCIgKyBrZXkpKTsgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgdmFyIG5leHQgPSBmaW5kKHN1Yiwgcm91dGVzLCAxKTtcbiAgICAgICAgICBjYihudWxsLCBuZXh0LmZpbHRlcihmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgaWYgKCFzZWVuLmluY2x1ZGVzKHgucm91dGUpKSB7XG4gICAgICAgICAgICAgIHNlZW4ucHVzaCh4LnJvdXRlKTtcbiAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9KSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBjYihlLCBbXSk7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9KTtcblxuICAgICAgaWYgKGhhc2gpIHtcbiAgICAgICAgY2IobnVsbCwgZmluZCgoXCJcIiArIHVyaSArIGhhc2gpLCByb3V0ZXMsIDEpKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIG1vdW50OiBmdW5jdGlvbiAocGF0aCwgY2IpIHtcbiAgICAgIGlmIChwYXRoICE9PSAnLycpIHtcbiAgICAgICAgc3RhY2sucHVzaChwYXRoKTtcbiAgICAgIH1cblxuICAgICAgY2IoKTtcbiAgICAgIHN0YWNrLnBvcCgpO1xuICAgIH0sXG4gICAgZmluZDogZnVuY3Rpb24gKHBhdGgsIHJldHJpZXMpIHsgcmV0dXJuIGZpbmQocGF0aCwgcm91dGVzLCByZXRyaWVzID09PSB0cnVlID8gMiA6IHJldHJpZXMgfHwgMSk7IH0sXG4gICAgYWRkOiBmdW5jdGlvbiAocGF0aCwgcm91dGVJbmZvKSB7IHJldHVybiBhZGQocGF0aCwgcm91dGVzLCBzdGFjay5qb2luKCcnKSwgcm91dGVJbmZvKTsgfSxcbiAgICBybTogZnVuY3Rpb24gKHBhdGgpIHsgcmV0dXJuIHJtKHBhdGgsIHJvdXRlcywgc3RhY2suam9pbignJykpOyB9XG4gIH07XG59O1xuXG5leHBvcnQgZGVmYXVsdCBSb3V0ZXI7XG4iLCJpbXBvcnQgeyBydW5fYWxsLCBub29wLCBnZXRfc3RvcmVfdmFsdWUsIHNhZmVfbm90X2VxdWFsIH0gZnJvbSAnLi9pbnRlcm5hbCc7XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkYWJsZSh2YWx1ZSwgc3RhcnQpIHtcblx0cmV0dXJuIHtcblx0XHRzdWJzY3JpYmU6IHdyaXRhYmxlKHZhbHVlLCBzdGFydCkuc3Vic2NyaWJlXG5cdH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cml0YWJsZSh2YWx1ZSwgc3RhcnQgPSBub29wKSB7XG5cdGxldCBzdG9wO1xuXHRjb25zdCBzdWJzY3JpYmVycyA9IFtdO1xuXG5cdGZ1bmN0aW9uIHNldChuZXdfdmFsdWUpIHtcblx0XHRpZiAoc2FmZV9ub3RfZXF1YWwodmFsdWUsIG5ld192YWx1ZSkpIHtcblx0XHRcdHZhbHVlID0gbmV3X3ZhbHVlO1xuXHRcdFx0aWYgKCFzdG9wKSByZXR1cm47IC8vIG5vdCByZWFkeVxuXHRcdFx0c3Vic2NyaWJlcnMuZm9yRWFjaChzID0+IHNbMV0oKSk7XG5cdFx0XHRzdWJzY3JpYmVycy5mb3JFYWNoKHMgPT4gc1swXSh2YWx1ZSkpO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIHVwZGF0ZShmbikge1xuXHRcdHNldChmbih2YWx1ZSkpO1xuXHR9XG5cblx0ZnVuY3Rpb24gc3Vic2NyaWJlKHJ1biwgaW52YWxpZGF0ZSA9IG5vb3ApIHtcblx0XHRjb25zdCBzdWJzY3JpYmVyID0gW3J1biwgaW52YWxpZGF0ZV07XG5cdFx0c3Vic2NyaWJlcnMucHVzaChzdWJzY3JpYmVyKTtcblx0XHRpZiAoc3Vic2NyaWJlcnMubGVuZ3RoID09PSAxKSBzdG9wID0gc3RhcnQoc2V0KSB8fCBub29wO1xuXHRcdHJ1bih2YWx1ZSk7XG5cblx0XHRyZXR1cm4gKCkgPT4ge1xuXHRcdFx0Y29uc3QgaW5kZXggPSBzdWJzY3JpYmVycy5pbmRleE9mKHN1YnNjcmliZXIpO1xuXHRcdFx0aWYgKGluZGV4ICE9PSAtMSkgc3Vic2NyaWJlcnMuc3BsaWNlKGluZGV4LCAxKTtcblx0XHRcdGlmIChzdWJzY3JpYmVycy5sZW5ndGggPT09IDApIHN0b3AoKTtcblx0XHR9O1xuXHR9XG5cblx0cmV0dXJuIHsgc2V0LCB1cGRhdGUsIHN1YnNjcmliZSB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVyaXZlZChzdG9yZXMsIGZuLCBpbml0aWFsX3ZhbHVlKSB7XG5cdGNvbnN0IHNpbmdsZSA9ICFBcnJheS5pc0FycmF5KHN0b3Jlcyk7XG5cdGlmIChzaW5nbGUpIHN0b3JlcyA9IFtzdG9yZXNdO1xuXG5cdGNvbnN0IGF1dG8gPSBmbi5sZW5ndGggPCAyO1xuXHRsZXQgdmFsdWUgPSB7fTtcblxuXHRyZXR1cm4gcmVhZGFibGUoaW5pdGlhbF92YWx1ZSwgc2V0ID0+IHtcblx0XHRsZXQgaW5pdGVkID0gZmFsc2U7XG5cdFx0Y29uc3QgdmFsdWVzID0gW107XG5cblx0XHRsZXQgcGVuZGluZyA9IDA7XG5cdFx0bGV0IGNsZWFudXAgPSBub29wO1xuXG5cdFx0Y29uc3Qgc3luYyA9ICgpID0+IHtcblx0XHRcdGlmIChwZW5kaW5nKSByZXR1cm47XG5cdFx0XHRjbGVhbnVwKCk7XG5cdFx0XHRjb25zdCByZXN1bHQgPSBmbihzaW5nbGUgPyB2YWx1ZXNbMF0gOiB2YWx1ZXMsIHNldCk7XG5cdFx0XHRpZiAoYXV0bykgc2V0KHJlc3VsdCk7XG5cdFx0XHRlbHNlIGNsZWFudXAgPSByZXN1bHQgfHwgbm9vcDtcblx0XHR9O1xuXG5cdFx0Y29uc3QgdW5zdWJzY3JpYmVycyA9IHN0b3Jlcy5tYXAoKHN0b3JlLCBpKSA9PiBzdG9yZS5zdWJzY3JpYmUoXG5cdFx0XHR2YWx1ZSA9PiB7XG5cdFx0XHRcdHZhbHVlc1tpXSA9IHZhbHVlO1xuXHRcdFx0XHRwZW5kaW5nICY9IH4oMSA8PCBpKTtcblx0XHRcdFx0aWYgKGluaXRlZCkgc3luYygpO1xuXHRcdFx0fSxcblx0XHRcdCgpID0+IHtcblx0XHRcdFx0cGVuZGluZyB8PSAoMSA8PCBpKTtcblx0XHRcdH0pXG5cdFx0KTtcblxuXHRcdGluaXRlZCA9IHRydWU7XG5cdFx0c3luYygpO1xuXG5cdFx0cmV0dXJuIGZ1bmN0aW9uIHN0b3AoKSB7XG5cdFx0XHRydW5fYWxsKHVuc3Vic2NyaWJlcnMpO1xuXHRcdFx0Y2xlYW51cCgpO1xuXHRcdH07XG5cdH0pO1xufVxuXG5leHBvcnQgeyBnZXRfc3RvcmVfdmFsdWUgYXMgZ2V0IH07XG4iLCJpbXBvcnQgeyB3cml0YWJsZSB9IGZyb20gJ3N2ZWx0ZS9zdG9yZSc7XG5pbXBvcnQgcXVlcnlTdHJpbmcgZnJvbSAncXVlcnktc3RyaW5nJztcblxuY29uc3QgYmFzZVRhZyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdiYXNlJyk7XG5jb25zdCBiYXNlUHJlZml4ID0gKGJhc2VUYWdbMF0gJiYgYmFzZVRhZ1swXS5ocmVmLnJlcGxhY2UoL1xcLyQvLCAnJykpIHx8ICcvJztcblxuZXhwb3J0IGNvbnN0IFJPT1RfVVJMID0gYmFzZVByZWZpeC5yZXBsYWNlKHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4sICcnKTtcblxuZXhwb3J0IGNvbnN0IHJvdXRlciA9IHdyaXRhYmxlKHtcbiAgcGF0aDogJy8nLFxuICBwYXJhbXM6IHt9LFxufSk7XG5cbmV4cG9ydCBjb25zdCBDVFhfUk9VVEVSID0ge307XG5leHBvcnQgY29uc3QgQ1RYX1JPVVRFID0ge307XG5cbi8vIHVzZSBsb2NhdGlvbi5oYXNoIG9uIGVtYmVkZGVkIHBhZ2VzLCBlLmcuIFN2ZWx0ZSBSRVBMXG5leHBvcnQgbGV0IEhBU0hDSEFOR0UgPSBsb2NhdGlvbi5vcmlnaW4gPT09ICdudWxsJztcblxuZXhwb3J0IGZ1bmN0aW9uIGhhc2hjaGFuZ2VFbmFibGUodmFsdWUpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgSEFTSENIQU5HRSA9ICEhdmFsdWU7XG4gIH1cblxuICByZXR1cm4gSEFTSENIQU5HRTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpeGVkTG9jYXRpb24ocGF0aCwgY2FsbGJhY2spIHtcbiAgY29uc3QgYmFzZVVyaSA9IGhhc2hjaGFuZ2VFbmFibGUoKSA/IGxvY2F0aW9uLmhhc2gucmVwbGFjZSgnIycsICcnKSA6IGxvY2F0aW9uLnBhdGhuYW1lO1xuXG4gIC8vIHRoaXMgd2lsbCByZWJhc2UgYW5jaG9ycyB0byBhdm9pZCBsb2NhdGlvbiBjaGFuZ2VzXG4gIGlmIChwYXRoLmNoYXJBdCgpICE9PSAnLycpIHtcbiAgICBwYXRoID0gYmFzZVVyaSArIHBhdGg7XG4gIH1cblxuICAvLyBkbyBub3QgY2hhbmdlIGxvY2F0aW9uIGV0IGFsbC4uLlxuICBpZiAoKGJhc2VVcmkgKyBsb2NhdGlvbi5zZWFyY2gpICE9PSBwYXRoKSB7XG4gICAgY2FsbGJhY2socGF0aCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5hdmlnYXRlVG8ocGF0aCwgb3B0aW9ucykge1xuICBjb25zdCB7XG4gICAgcmVsb2FkLCByZXBsYWNlLFxuICAgIHBhcmFtcywgcXVlcnlQYXJhbXMsXG4gIH0gPSBvcHRpb25zIHx8IHt9O1xuXG4gIC8vIElmIHBhdGggZW1wdHkgb3Igbm8gc3RyaW5nLCB0aHJvd3MgZXJyb3JcbiAgaWYgKCFwYXRoIHx8IHR5cGVvZiBwYXRoICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBFcnJvcihgeXJ2IGV4cGVjdHMgbmF2aWdhdGVUbygpIHRvIGhhdmUgYSBzdHJpbmcgcGFyYW1ldGVyLiBUaGUgcGFyYW1ldGVyIHByb3ZpZGVkIHdhczogJHtwYXRofSBvZiB0eXBlICR7dHlwZW9mIHBhdGh9IGluc3RlYWQuYCk7XG4gIH1cblxuICBpZiAocGF0aFswXSAhPT0gJy8nICYmIHBhdGhbMF0gIT09ICcjJykge1xuICAgIHRocm93IG5ldyBFcnJvcihgeXJ2IGV4cGVjdHMgbmF2aWdhdGVUbygpIHBhcmFtIHRvIHN0YXJ0IHdpdGggc2xhc2ggb3IgaGFzaCwgZS5nLiBcIi8ke3BhdGh9XCIgb3IgXCIjJHtwYXRofVwiIGluc3RlYWQgb2YgXCIke3BhdGh9XCIuYCk7XG4gIH1cblxuICBpZiAocGFyYW1zKSB7XG4gICAgcGF0aCA9IHBhdGgucmVwbGFjZSgvOihbYS16QS1aXVthLXpBLVowLTlfLV0qKS9nLCAoXywga2V5KSA9PiBwYXJhbXNba2V5XSk7XG4gIH1cblxuICAvLyByZWJhc2UgYWN0aXZlIFVSTFxuICBpZiAoUk9PVF9VUkwgIT09ICcvJyAmJiBwYXRoLmluZGV4T2YoUk9PVF9VUkwpICE9PSAwKSB7XG4gICAgcGF0aCA9IFJPT1RfVVJMICsgcGF0aDtcbiAgfVxuXG4gIGlmIChxdWVyeVBhcmFtcykge1xuICAgIGNvbnN0IHFzID0gcXVlcnlTdHJpbmcuc3RyaW5naWZ5KHF1ZXJ5UGFyYW1zKTtcblxuICAgIGlmIChxcykge1xuICAgICAgcGF0aCArPSBgPyR7cXN9YDtcbiAgICB9XG4gIH1cblxuICBpZiAoaGFzaGNoYW5nZUVuYWJsZSgpKSB7XG4gICAgbG9jYXRpb24uaGFzaCA9IHBhdGgucmVwbGFjZSgvXiMvLCAnJyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gSWYgbm8gSGlzdG9yeSBBUEkgc3VwcG9ydCwgZmFsbGJhY2tzIHRvIFVSTCByZWRpcmVjdFxuICBpZiAocmVsb2FkIHx8ICFoaXN0b3J5LnB1c2hTdGF0ZSB8fCAhZGlzcGF0Y2hFdmVudCkge1xuICAgIGxvY2F0aW9uLmhyZWYgPSBwYXRoO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIElmIGhhcyBIaXN0b3J5IEFQSSBzdXBwb3J0LCB1c2VzIGl0XG4gIGZpeGVkTG9jYXRpb24ocGF0aCwgbmV4dFVSTCA9PiB7XG4gICAgaGlzdG9yeVtyZXBsYWNlID8gJ3JlcGxhY2VTdGF0ZScgOiAncHVzaFN0YXRlJ10obnVsbCwgJycsIG5leHRVUkwpO1xuICAgIGRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KCdwb3BzdGF0ZScpKTtcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0FjdGl2ZSh1cmksIHBhdGgsIGV4YWN0KSB7XG4gIGlmIChleGFjdCAhPT0gdHJ1ZSAmJiBwYXRoLmluZGV4T2YodXJpKSA9PT0gMCkge1xuICAgIHJldHVybiAvXlsjLz9dPyQvLnRlc3QocGF0aC5zdWJzdHIodXJpLmxlbmd0aCwgMSkpO1xuICB9XG5cbiAgcmV0dXJuIHBhdGggPT09IHVyaTtcbn1cbiIsIjxzY3JpcHQgY29udGV4dD1cIm1vZHVsZVwiPlxuICBpbXBvcnQgcXVlcnlTdHJpbmcgZnJvbSAncXVlcnktc3RyaW5nJztcbiAgaW1wb3J0IFJvdXRlciBmcm9tICdhYnN0cmFjdC1uZXN0ZWQtcm91dGVyJztcblxuICBpbXBvcnQge1xuICAgIENUWF9ST1VURVIsIFJPT1RfVVJMLCBoYXNoY2hhbmdlRW5hYmxlLCBuYXZpZ2F0ZVRvLCBpc0FjdGl2ZSwgcm91dGVyLFxuICB9IGZyb20gJy4vdXRpbHMnO1xuXG4gIGNvbnN0IGJhc2VSb3V0ZXIgPSBuZXcgUm91dGVyKCk7XG48L3NjcmlwdD5cblxuPHNjcmlwdD5cbiAgaW1wb3J0IHtcbiAgICBvbk1vdW50LCBvbkRlc3Ryb3ksIGdldENvbnRleHQsIHNldENvbnRleHQsXG4gIH0gZnJvbSAnc3ZlbHRlJztcblxuICBpbXBvcnQgeyB3cml0YWJsZSB9IGZyb20gJ3N2ZWx0ZS9zdG9yZSc7XG5cbiAgbGV0IGZhaWx1cmU7XG4gIGxldCBmYWxsYmFjaztcblxuICBleHBvcnQgbGV0IHBhdGggPSAnLyc7XG4gIGV4cG9ydCBsZXQgZXhhY3QgPSBudWxsO1xuICBleHBvcnQgbGV0IG5vZmFsbGJhY2sgPSBmYWxzZTtcblxuICBjb25zdCBpc0V4YWN0ID0gZXhhY3Q7XG4gIGNvbnN0IHJvdXRlckNvbnRleHQgPSBnZXRDb250ZXh0KENUWF9ST1VURVIpO1xuICBjb25zdCByb3V0ZUluZm8gPSByb3V0ZXJDb250ZXh0ID8gcm91dGVyQ29udGV4dC5yb3V0ZUluZm8gOiB3cml0YWJsZSh7fSk7XG4gIGNvbnN0IGJhc2VQYXRoID0gcm91dGVyQ29udGV4dCA/IHJvdXRlckNvbnRleHQuYmFzZVBhdGggOiB3cml0YWJsZShwYXRoKTtcblxuICBjb25zdCBmaXhlZFJvb3QgPSAkYmFzZVBhdGggIT09IHBhdGggJiYgJGJhc2VQYXRoICE9PSAnLydcbiAgICA/IGAkeyRiYXNlUGF0aH0ke3BhdGggIT09ICcvJyA/IHBhdGggOiAnJ31gXG4gICAgOiBwYXRoO1xuXG4gIGZ1bmN0aW9uIGRvRmFsbGJhY2soZSwgX3BhdGgsIHF1ZXJ5UGFyYW1zKSB7XG4gICAgJHJvdXRlSW5mbyA9IHtcbiAgICAgIFtmYWxsYmFja106IHtcbiAgICAgICAgZmFpbHVyZTogZSxcbiAgICAgICAgcXVlcnk6IHF1ZXJ5UGFyYW1zLFxuICAgICAgICBwYXJhbXM6IHsgXzogX3BhdGguc3Vic3RyKDEpIHx8IHVuZGVmaW5lZCB9LFxuICAgICAgfSxcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gaGFuZGxlUm91dGVzKG1hcCwgX3BhdGgsIF9xdWVyeSwgX3NoYXJlZCkge1xuICAgIGNvbnN0IF9wYXJhbXMgPSBtYXAucmVkdWNlKChwcmV2LCBjdXIpID0+IHtcbiAgICAgIGlmIChjdXIua2V5KSB7XG4gICAgICAgIE9iamVjdC5hc3NpZ24oX3NoYXJlZCwgY3VyLnBhcmFtcyk7XG5cbiAgICAgICAgcHJldltjdXIua2V5XSA9IE9iamVjdC5hc3NpZ24ocHJldltjdXIua2V5XSB8fCB7fSwgY3VyLnBhcmFtcyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBwcmV2O1xuICAgIH0sIHt9KTtcblxuICAgIG1hcC5zb21lKHggPT4ge1xuICAgICAgaWYgKHgua2V5ICYmIHgubWF0Y2hlcyAmJiAhJHJvdXRlSW5mb1t4LmtleV0pIHtcbiAgICAgICAgaWYgKHR5cGVvZiB4LmNvbmRpdGlvbiA9PT0gJ2Jvb2xlYW4nIHx8IHR5cGVvZiB4LmNvbmRpdGlvbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIGNvbnN0IG9rID0gdHlwZW9mIHguY29uZGl0aW9uID09PSAnZnVuY3Rpb24nID8geC5jb25kaXRpb24oJHJvdXRlcikgOiB4LmNvbmRpdGlvbjtcblxuICAgICAgICAgIGlmIChvayAhPT0gdHJ1ZSAmJiB4LnJlZGlyZWN0KSB7XG4gICAgICAgICAgICBuYXZpZ2F0ZVRvKHgucmVkaXJlY3QpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHgucmVkaXJlY3QgJiYgIXguY29uZGl0aW9uKSB7XG4gICAgICAgICAgbmF2aWdhdGVUbyh4LnJlZGlyZWN0KTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgheC5mYWxsYmFjaykge1xuICAgICAgICAgICRyb3V0ZUluZm9beC5rZXldID0ge1xuICAgICAgICAgICAgLi4ueCxcbiAgICAgICAgICAgIHF1ZXJ5OiBfcXVlcnksXG4gICAgICAgICAgICBwYXJhbXM6IF9wYXJhbXNbeC5rZXldLFxuICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZG9GYWxsYmFjayhudWxsLCBfcGF0aCwgX3F1ZXJ5KTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiByZXNvbHZlUm91dGVzKCkge1xuICAgIGNsZWFyVGltZW91dChyZXNvbHZlUm91dGVzLnQpO1xuXG4gICAgcmVzb2x2ZVJvdXRlcy50ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBmYWlsdXJlID0gbnVsbDtcbiAgICAgICRyb3V0ZUluZm8gPSB7fTtcblxuICAgICAgbGV0IGJhc2VVcmkgPSAhaGFzaGNoYW5nZUVuYWJsZSgpID8gbG9jYXRpb24uaHJlZi5yZXBsYWNlKGxvY2F0aW9uLm9yaWdpbiwgJycpIDogbG9jYXRpb24uaGFzaDtcblxuICAgICAgLy8gdW5wcmVmaXggYWN0aXZlIFVSTFxuICAgICAgaWYgKFJPT1RfVVJMICE9PSAnLycpIHtcbiAgICAgICAgYmFzZVVyaSA9IGJhc2VVcmkucmVwbGFjZShST09UX1VSTCwgJycpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBbZnVsbHBhdGgsIHNlYXJjaFF1ZXJ5XSA9IGAvJHtiYXNlVXJpLnJlcGxhY2UoL14jP1xcLy8sICcnKX1gLnNwbGl0KCc/Jyk7XG4gICAgICBjb25zdCBxdWVyeSA9IHF1ZXJ5U3RyaW5nLnBhcnNlKHNlYXJjaFF1ZXJ5KTtcbiAgICAgIGNvbnN0IGN0eCA9IHt9O1xuXG4gICAgICB0cnkge1xuICAgICAgICBpZiAoaXNBY3RpdmUoZml4ZWRSb290LCBmdWxscGF0aCwgZmFsc2UpIHx8IGZpeGVkUm9vdCA9PT0gJy8nKSB7XG4gICAgICAgICAgYmFzZVJvdXRlci5yZXNvbHZlKGZ1bGxwYXRoLCAoZXJyLCByZXN1bHQpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgZmFpbHVyZSA9IGVycjtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBoYW5kbGVSb3V0ZXMocmVzdWx0LCBmdWxscGF0aCwgcXVlcnksIGN0eCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgZmFpbHVyZSA9IGU7XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICAkcm91dGVyLnBhdGggPSBmdWxscGF0aDtcbiAgICAgICAgJHJvdXRlci5xdWVyeSA9IHF1ZXJ5O1xuICAgICAgICAkcm91dGVyLnBhcmFtcyA9IGN0eDtcbiAgICAgIH1cblxuICAgICAgaWYgKGZhaWx1cmUgJiYgZmFsbGJhY2spIHtcbiAgICAgICAgZG9GYWxsYmFjayhmYWlsdXJlLCBmdWxscGF0aCwgcXVlcnkpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGJhc2VSb3V0ZXIuZmluZChmdWxscGF0aCkuZm9yRWFjaChzdWIgPT4ge1xuICAgICAgICAgIC8vIGNsZWFyIHJvdXRlcyB0aGF0IGFyZSBub3QgbG9uZ2VyIG1hdGNoZXMhXG4gICAgICAgICAgaWYgKCFzdWIubWF0Y2hlcyAmJiBzdWIuZXhhY3QgJiYgc3ViLmtleSkge1xuICAgICAgICAgICAgJHJvdXRlSW5mb1tzdWIua2V5XSA9IG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgLy8gdGhpcyBpcyBmaW5lXG4gICAgICB9XG4gICAgfSwgNTApO1xuICB9XG5cbiAgZnVuY3Rpb24gYXNzaWduUm91dGUoa2V5LCByb3V0ZSwgZGV0YWlsKSB7XG4gICAga2V5ID0ga2V5IHx8IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cigyKTtcblxuICAgIGNvbnN0IGhhbmRsZXIgPSB7IGtleSwgLi4uZGV0YWlsIH07XG5cbiAgICBsZXQgZnVsbHBhdGg7XG5cbiAgICBiYXNlUm91dGVyLm1vdW50KGZpeGVkUm9vdCwgKCkgPT4ge1xuICAgICAgZnVsbHBhdGggPSBiYXNlUm91dGVyLmFkZChyb3V0ZSwgaGFuZGxlcik7XG4gICAgICBmYWxsYmFjayA9IChoYW5kbGVyLmZhbGxiYWNrICYmIGtleSkgfHwgZmFsbGJhY2s7XG4gICAgfSk7XG5cbiAgICByZXNvbHZlUm91dGVzKCk7XG5cbiAgICByZXR1cm4gW2tleSwgZnVsbHBhdGhdO1xuICB9XG5cbiAgZnVuY3Rpb24gdW5hc3NpZ25Sb3V0ZShyb3V0ZSkge1xuICAgIGJhc2VSb3V0ZXIucm0ocm91dGUpO1xuICAgIHJlc29sdmVSb3V0ZXMoKTtcbiAgfVxuXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdwb3BzdGF0ZScsIHJlc29sdmVSb3V0ZXMsIGZhbHNlKTtcblxuICBvbkRlc3Ryb3koKCkgPT4ge1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdwb3BzdGF0ZScsIHJlc29sdmVSb3V0ZXMsIGZhbHNlKTtcbiAgfSk7XG5cbiAgc2V0Q29udGV4dChDVFhfUk9VVEVSLCB7XG4gICAgaXNFeGFjdCxcbiAgICBiYXNlUGF0aCxcbiAgICByb3V0ZUluZm8sXG4gICAgYXNzaWduUm91dGUsXG4gICAgdW5hc3NpZ25Sb3V0ZSxcbiAgfSk7XG48L3NjcmlwdD5cblxuPHN0eWxlPlxuICAueXJ2LWZhaWx1cmUge1xuICAgIG1hcmdpbjogMTBweDtcbiAgICBib3JkZXI6IDFweCBkYXNoZWQgc2lsdmVyO1xuICB9XG48L3N0eWxlPlxuXG57I2lmIGZhaWx1cmUgJiYgIWZhbGxiYWNrICYmICFub2ZhbGxiYWNrfVxuICA8ZmllbGRzZXQgY2xhc3M9XCJ5cnYtZmFpbHVyZVwiPlxuICAgIDxsZWdlbmQ+Um91dGVyIGZhaWx1cmU6IHtwYXRofTwvbGVnZW5kPlxuICAgIDxwcmU+e2ZhaWx1cmV9PC9wcmU+XG4gIDwvZmllbGRzZXQ+XG57L2lmfVxuXG48c2xvdCAvPlxuIiwiPHNjcmlwdCBjb250ZXh0PVwibW9kdWxlXCI+XG4gIGltcG9ydCB7IENUWF9ST1VURVIsIENUWF9ST1VURSB9IGZyb20gJy4vdXRpbHMnO1xuPC9zY3JpcHQ+XG5cbjxzY3JpcHQ+XG4gIGltcG9ydCB7IHdyaXRhYmxlIH0gZnJvbSAnc3ZlbHRlL3N0b3JlJztcbiAgaW1wb3J0IHsgb25EZXN0cm95LCBnZXRDb250ZXh0LCBzZXRDb250ZXh0IH0gZnJvbSAnc3ZlbHRlJztcblxuICBleHBvcnQgbGV0IGtleSA9IG51bGw7XG4gIGV4cG9ydCBsZXQgcGF0aCA9ICcvJztcbiAgZXhwb3J0IGxldCBwcm9wcyA9IG51bGw7XG4gIGV4cG9ydCBsZXQgZXhhY3QgPSBudWxsO1xuICBleHBvcnQgbGV0IGZhbGxiYWNrID0gbnVsbDtcbiAgZXhwb3J0IGxldCBjb21wb25lbnQgPSBudWxsO1xuICBleHBvcnQgbGV0IGNvbmRpdGlvbiA9IG51bGw7XG4gIGV4cG9ydCBsZXQgcmVkaXJlY3QgPSBudWxsO1xuXG4gIGNvbnN0IHJvdXRlQ29udGV4dCA9IGdldENvbnRleHQoQ1RYX1JPVVRFKTtcbiAgY29uc3Qgcm91dGVQYXRoID0gcm91dGVDb250ZXh0ID8gcm91dGVDb250ZXh0LnJvdXRlUGF0aCA6IHdyaXRhYmxlKHBhdGgpO1xuXG4gIGNvbnN0IHtcbiAgICBhc3NpZ25Sb3V0ZSwgdW5hc3NpZ25Sb3V0ZSwgcm91dGVJbmZvLCBpc0V4YWN0LFxuICB9ID0gZ2V0Q29udGV4dChDVFhfUk9VVEVSKTtcblxuICAvLyBpbmhlcml0IGV4YWN0IGZyb20gcGFyZW50IFJvdXRlclxuICBpZiAoaXNFeGFjdCkgZXhhY3QgPSB0cnVlO1xuXG4gIGxldCBhY3RpdmVSb3V0ZXIgPSBudWxsO1xuICBsZXQgYWN0aXZlUHJvcHMgPSB7fTtcbiAgbGV0IGZ1bGxwYXRoO1xuXG4gIGZ1bmN0aW9uIGdldFByb3BzKGdpdmVuLCByZXF1aXJlZCkge1xuICAgIGNvbnN0IHsgcHJvcHM6IHN1YiwgLi4ub3RoZXJzIH0gPSBnaXZlbjtcblxuICAgIC8vIHBydW5lIGFsbCBkZWNsYXJlZCBwcm9wcyBmcm9tIHRoaXMgY29tcG9uZW50XG4gICAgcmVxdWlyZWQuZm9yRWFjaChrID0+IHtcbiAgICAgIGRlbGV0ZSBvdGhlcnNba107XG4gICAgfSk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgLi4uc3ViLFxuICAgICAgLi4ub3RoZXJzLFxuICAgIH07XG4gIH1cblxuICBjb25zdCBmaXhlZFJvb3QgPSAkcm91dGVQYXRoICE9PSBwYXRoICYmICRyb3V0ZVBhdGggIT09ICcvJ1xuICAgID8gYCR7JHJvdXRlUGF0aH0ke3BhdGggIT09ICcvJyA/IHBhdGggOiAnJ31gXG4gICAgOiBwYXRoO1xuXG4gIFtrZXksIGZ1bGxwYXRoXSA9IGFzc2lnblJvdXRlKGtleSwgZml4ZWRSb290LCB7XG4gICAgY29uZGl0aW9uLCByZWRpcmVjdCwgZmFsbGJhY2ssIGV4YWN0LFxuICB9KTtcblxuICAkOiB7XG4gICAgYWN0aXZlUm91dGVyID0gJHJvdXRlSW5mb1trZXldO1xuICAgIGFjdGl2ZVByb3BzID0gZ2V0UHJvcHMoJCRwcm9wcywgYXJndW1lbnRzWzBdLiQkLnByb3BzKTtcbiAgfVxuXG4gIG9uRGVzdHJveSgoKSA9PiB7XG4gICAgdW5hc3NpZ25Sb3V0ZShmdWxscGF0aCk7XG4gIH0pO1xuXG4gIHNldENvbnRleHQoQ1RYX1JPVVRFLCB7XG4gICAgcm91dGVQYXRoLFxuICB9KTtcbjwvc2NyaXB0PlxuXG57I2lmIGFjdGl2ZVJvdXRlcn1cbiAgeyNpZiBjb21wb25lbnR9XG4gICAgPHN2ZWx0ZTpjb21wb25lbnQgdGhpcz17Y29tcG9uZW50fSByb3V0ZXI9e2FjdGl2ZVJvdXRlcn0gey4uLmFjdGl2ZVByb3BzfSAvPlxuICB7OmVsc2V9XG4gICAgPHNsb3Qgcm91dGVyPXthY3RpdmVSb3V0ZXJ9IHByb3BzPXthY3RpdmVQcm9wc30gLz5cbiAgey9pZn1cbnsvaWZ9XG4iLCI8c2NyaXB0PlxuICBpbXBvcnQgeyBvbk1vdW50LCBjcmVhdGVFdmVudERpc3BhdGNoZXIgfSBmcm9tICdzdmVsdGUnO1xuXG4gIGltcG9ydCB7XG4gICAgUk9PVF9VUkwsIGZpeGVkTG9jYXRpb24sIG5hdmlnYXRlVG8sIGlzQWN0aXZlLCByb3V0ZXIsXG4gIH0gZnJvbSAnLi91dGlscyc7XG5cbiAgbGV0IHJlZjtcbiAgbGV0IGFjdGl2ZTtcbiAgbGV0IGNzc0NsYXNzID0gJyc7XG4gIGxldCBmaXhlZEhyZWYgPSBudWxsO1xuXG4gIGV4cG9ydCBsZXQgZ28gPSBudWxsO1xuICBleHBvcnQgbGV0IGhyZWYgPSAnLyc7XG4gIGV4cG9ydCBsZXQgdGl0bGUgPSAnJztcbiAgZXhwb3J0IGxldCBidXR0b24gPSBmYWxzZTtcbiAgZXhwb3J0IGxldCBleGFjdCA9IGZhbHNlO1xuICBleHBvcnQgbGV0IHJlbG9hZCA9IGZhbHNlO1xuICBleHBvcnQgbGV0IHJlcGxhY2UgPSBmYWxzZTtcbiAgZXhwb3J0IGxldCBjbGFzc05hbWUgPSAnJztcbiAgZXhwb3J0IHsgY3NzQ2xhc3MgYXMgY2xhc3MgfTtcblxuICAvLyByZWJhc2UgYWN0aXZlIFVSTFxuICBpZiAoUk9PVF9VUkwgIT09ICcvJykge1xuICAgIGZpeGVkSHJlZiA9IFJPT1RfVVJMICsgaHJlZjtcbiAgfSBlbHNlIHtcbiAgICBmaXhlZEhyZWYgPSBocmVmO1xuICB9XG5cbiAgJDogaWYgKHJlZiAmJiAkcm91dGVyLnBhdGgpIHtcbiAgICBpZiAoaXNBY3RpdmUoaHJlZiwgJHJvdXRlci5wYXRoLCBleGFjdCkpIHtcbiAgICAgIGlmICghYWN0aXZlKSB7XG4gICAgICAgIGFjdGl2ZSA9IHRydWU7XG4gICAgICAgIHJlZi5zZXRBdHRyaWJ1dGUoJ2FyaWEtY3VycmVudCcsICdwYWdlJyk7XG5cbiAgICAgICAgaWYgKGJ1dHRvbikge1xuICAgICAgICAgIHJlZi5zZXRBdHRyaWJ1dGUoJ2Rpc2FibGVkJywgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGFjdGl2ZSkge1xuICAgICAgYWN0aXZlID0gZmFsc2U7XG4gICAgICByZWYucmVtb3ZlQXR0cmlidXRlKCdkaXNhYmxlZCcpO1xuICAgICAgcmVmLnJlbW92ZUF0dHJpYnV0ZSgnYXJpYS1jdXJyZW50Jyk7XG4gICAgfVxuICB9XG5cbiAgb25Nb3VudCgoKSA9PiB7XG4gICAgY2xhc3NOYW1lID0gY2xhc3NOYW1lIHx8IGNzc0NsYXNzO1xuICB9KTtcblxuICBjb25zdCBkaXNwYXRjaCA9IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlcigpO1xuXG4gIC8vIHRoaXMgd2lsbCBlbmFibGUgYDxMaW5rIG9uOmNsaWNrPXsuLi59IC8+YCBjYWxsc1xuICBmdW5jdGlvbiBvbkNsaWNrKGUpIHtcbiAgICBpZiAodHlwZW9mIGdvID09PSAnc3RyaW5nJyAmJiBoaXN0b3J5Lmxlbmd0aCA+IDEpIHtcbiAgICAgIGlmIChnbyA9PT0gJ2JhY2snKSBoaXN0b3J5LmJhY2soKTtcbiAgICAgIGVsc2UgaWYgKGdvID09PSAnZndkJykgaGlzdG9yeS5mb3J3YXJkKCk7XG4gICAgICBlbHNlIGhpc3RvcnkuZ28ocGFyc2VJbnQoZ28sIDEwKSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZml4ZWRMb2NhdGlvbihocmVmLCBuZXh0VVJMID0+IHtcbiAgICAgIG5hdmlnYXRlVG8obmV4dFVSTCwgeyByZWxvYWQsIHJlcGxhY2UgfSk7XG4gICAgICBkaXNwYXRjaCgnY2xpY2snLCBlKTtcbiAgICB9KTtcbiAgfVxuPC9zY3JpcHQ+XG5cbnsjaWYgYnV0dG9ufVxuICA8YnV0dG9uIGJpbmQ6dGhpcz17cmVmfSBjbGFzcz17Y2xhc3NOYW1lfSB7dGl0bGV9IG9uOmNsaWNrfHByZXZlbnREZWZhdWx0PXtvbkNsaWNrfT5cbiAgICA8c2xvdCAvPlxuICA8L2J1dHRvbj5cbns6ZWxzZX1cbiAgPGEgaHJlZj17Zml4ZWRIcmVmfSBiaW5kOnRoaXM9e3JlZn0gY2xhc3M9e2NsYXNzTmFtZX0ge3RpdGxlfSBvbjpjbGlja3xwcmV2ZW50RGVmYXVsdD17b25DbGlja30+XG4gICAgPHNsb3QgLz5cbiAgPC9hPlxuey9pZn1cbiIsImltcG9ydCBSb3V0ZXIgZnJvbSAnLi9Sb3V0ZXIuc3ZlbHRlJztcbmltcG9ydCBSb3V0ZSBmcm9tICcuL1JvdXRlLnN2ZWx0ZSc7XG5pbXBvcnQgTGluayBmcm9tICcuL0xpbmsuc3ZlbHRlJztcblxuaW1wb3J0IHsgaGFzaGNoYW5nZUVuYWJsZSwgbmF2aWdhdGVUbywgcm91dGVyIH0gZnJvbSAnLi91dGlscyc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShSb3V0ZXIsICdoYXNoY2hhbmdlJywge1xuICBzZXQ6IHZhbHVlID0+IGhhc2hjaGFuZ2VFbmFibGUodmFsdWUpLFxuICBnZXQ6ICgpID0+IGhhc2hjaGFuZ2VFbmFibGUoKSxcbiAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgZW51bWVyYWJsZTogZmFsc2UsXG59KTtcblxuZXhwb3J0IHtcbiAgUm91dGVyLFxuICBSb3V0ZSxcbiAgTGluayxcbiAgcm91dGVyLFxuICBuYXZpZ2F0ZVRvLFxufTtcbiIsIjxzY3JpcHQ+XG4gIGltcG9ydCB7IFJvdXRlciwgUm91dGUsIExpbmsgfSBmcm9tICd5cnYnO1xuXG4gIGltcG9ydCBOb3RGb3VuZCBmcm9tICcuL3BhZ2VzL05vdEZvdW5kLnN2ZWx0ZSc7XG4gIGltcG9ydCBIb21lIGZyb20gJy4vcGFnZXMvSG9tZS5zdmVsdGUnO1xuPC9zY3JpcHQ+XG5cbjxSb3V0ZXIgcGF0aD1cIi9hZG1pblwiPlxuICA8bmF2PlxuICAgIDxuYXY+XG4gICAgICA8TGluayBleGFjdCBocmVmPVwiL2FkbWluL1wiPkRhc2hib2FyZDwvTGluaz5cbiAgICAgIHwgPExpbmsgZXhhY3QgaHJlZj1cIi9hZG1pbi9ub3QtZm91bmRcIj5QYWdlIG5vdCBmb3VuZDwvTGluaz5cbiAgICA8L25hdj5cbiAgPC9uYXY+XG4gIDxtYWluPlxuICAgIDxSb3V0ZSBleGFjdCBwYXRoPVwiL1wiIGNvbXBvbmVudD17SG9tZX0gLz5cbiAgICA8Um91dGUgZmFsbGJhY2sgY29tcG9uZW50PXtOb3RGb3VuZH0gLz5cbiAgPC9tYWluPlxuPC9Sb3V0ZXI+XG4iLCJpbXBvcnQgQXBwIGZyb20gJy4vY29tcG9uZW50cy9BcHAuc3ZlbHRlJztcblxubmV3IEFwcCh7IC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbiAgdGFyZ2V0OiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYXBwJyksXG59KTtcbiJdLCJuYW1lcyI6WyJkZWNvZGUiLCJkZWNvZGVDb21wb25lbnQiLCJSb3V0ZXIiXSwibWFwcGluZ3MiOiI7Q0FBQSxTQUFTLElBQUksR0FBRyxFQUFFO0FBQ2xCLEFBRUE7Q0FDQSxTQUFTLE1BQU0sQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFO0NBQzFCLENBQUMsS0FBSyxNQUFNLENBQUMsSUFBSSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUN0QyxDQUFDLE9BQU8sR0FBRyxDQUFDO0NBQ1osQ0FBQztBQUNELEFBVUE7Q0FDQSxTQUFTLEdBQUcsQ0FBQyxFQUFFLEVBQUU7Q0FDakIsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDO0NBQ2IsQ0FBQzs7Q0FFRCxTQUFTLFlBQVksR0FBRztDQUN4QixDQUFDLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztDQUM1QixDQUFDOztDQUVELFNBQVMsT0FBTyxDQUFDLEdBQUcsRUFBRTtDQUN0QixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7Q0FDbEIsQ0FBQzs7Q0FFRCxTQUFTLFdBQVcsQ0FBQyxLQUFLLEVBQUU7Q0FDNUIsQ0FBQyxPQUFPLE9BQU8sS0FBSyxLQUFLLFVBQVUsQ0FBQztDQUNwQyxDQUFDOztDQUVELFNBQVMsY0FBYyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUU7Q0FDOUIsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxLQUFLLFFBQVEsS0FBSyxPQUFPLENBQUMsS0FBSyxVQUFVLENBQUMsQ0FBQztDQUMvRixDQUFDO0FBQ0QsQUFVQTtDQUNBLFNBQVMsU0FBUyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFO0NBQy9DLENBQUMsTUFBTSxLQUFL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QUFDO0NBQ2xCLEVBQUUsSUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDO0NBQ2pCLEVBQUUsT0FBTztDQUNULElBQUksT0FBTyxFQUFFLFVBQVUsSUFBSSxFQUFFLEVBQUUsRUFBRTtDQUNqQyxNQUFNLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7Q0FDdkMsTUFBTSxJQUFJLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDdkIsTUFBTSxJQUFJLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDeEIsTUFBTSxJQUFJLEtBQUssR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDekIsTUFBTSxJQUFJLFFBQVEsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUM5QyxNQUFNLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztDQUN0QixNQUFNLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQztDQUNwQixNQUFNLFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxHQUFHLEVBQUU7Q0FDbkMsUUFBUSxJQUFJLEdBQUcsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLEdBQUcsR0FBRyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7Q0FDdEQsUUFBUSxJQUFJLEdBQUcsQ0FBQyxNQUFNLEVBQUUsRUFBRSxNQUFNLENBQUMsSUFBSSxFQUFFLEdBQUcsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFOztDQUVyRCxRQUFRLElBQUk7Q0FDWixVQUFVLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0NBQzFDLFVBQVUsRUFBRSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxFQUFFO0NBQzVDLFlBQVksSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFO0NBQ3pDLGNBQWMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7Q0FDakMsY0FBYyxPQUFPLElBQUksQ0FBQztDQUMxQixhQUFhOztDQUViLFlBQVksT0FBTyxLQUFLLENBQUM7Q0FDekIsV0FBVyxDQUFDLENBQUMsQ0FBQztDQUNkLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRTtDQUNwQixVQUFVLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7Q0FDcEIsVUFBVSxPQUFPLElBQUksQ0FBQztDQUN0QixTQUFTOztDQUVULFFBQVEsT0FBTyxLQUFLLENBQUM7Q0FDckIsT0FBTyxDQUFDLENBQUM7O0NBRVQsTUFBTSxJQUFJLElBQUksRUFBRTtDQUNoQixRQUFRLEVBQUUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEVBQUUsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ3JELE9BQU87Q0FDUCxLQUFLO0NBQ0wsSUFBSSxLQUFLLEVBQUUsVUFBVSxJQUFJLEVBQUUsRUFBRSxFQUFFO0NBQy9CLE1BQU0sSUFBSSxJQUFJLEtBQUssR0FBRyxFQUFFO0NBQ3hCLFFBQVEsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztDQUN6QixPQUFPOztDQUVQLE1BQU0sRUFBRSxFQUFFLENBQUM7Q0FDWCxNQUFNLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQztDQUNsQixLQUFLO0NBQ0wsSUFBSSxJQUFJLEVBQUUsVUFBVSxJQUFJLEVBQUUsT0FBTyxFQUFFLEVBQUUsT0FBTyxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLEtBQUssSUFBSSxHQUFHLENBQUMsR0FBRyxPQUFPLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRTtDQUN0RyxJQUFJLEdBQUcsRUFBRSxVQUFVLElBQUksRUFBRSxTQUFTLEVBQUUsRUFBRSxPQUFPLEdBQUcsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUMsRUFBRTtDQUM1RixJQUFJLEVBQUUsRUFBRSxVQUFVLElBQUksRUFBRSxFQUFFLE9BQU8sRUFBRSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUU7Q0FDcEUsR0FBRyxDQUFDO0NBQ0osQ0FBQyxDQUFDOztDQ3BTSyxTQUFTLFFBQVEsQ0FBQyxLQUFLLEVBQUUsS0FBSyxHQUFHLElBQUksRUFBRTtDQUM5QyxDQUFDLElBQUksSUFBSSxDQUFDO0NBQ1YsQ0FBQyxNQUFNLFdBQVcsR0FBRyxFQUFFLENBQUM7O0NBRXhCLENBQUMsU0FBUyxHQUFHLENBQUMsU0FBUyxFQUFFO0NBQ3pCLEVBQUUsSUFBSSxjQUFjLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxFQUFFO0NBQ3hDLEdBQUcsS0FBSyxHQUFHLFNBQVMsQ0FBQztDQUNyQixHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsT0FBTztDQUNyQixHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7Q0FDcEMsR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztDQUN6QyxHQUFHO0NBQ0gsRUFBRTs7Q0FFRixDQUFDLFNBQVMsTUFBTSxDQUFDLEVBQUUsRUFBRTtDQUNyQixFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztDQUNqQixFQUFFOztDQUVGLENBQUMsU0FBUyxTQUFTLENBQUMsR0FBRyxFQUFFLFVBQVUsR0FBRyxJQUFJLEVBQUU7Q0FDNUMsRUFBRSxNQUFNLFVBQVUsR0FBRyxDQUFDLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQztDQUN2QyxFQUFFLFdBQVcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7Q0FDL0IsRUFBRSxJQUFJLFdBQVcsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLElBQUksR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDO0NBQzFELEVBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDOztDQUViLEVBQUUsT0FBTyxNQUFNO0NBQ2YsR0FBRyxNQUFNLEtBQUssR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0NBQ2pELEdBQUcsSUFBSSxLQUFLLEtBQUssQ0FBQyxDQUFDLEVBQUUsV0FBVyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7Q0FDbEQsR0FBRyxJQUFJLFdBQVcsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDO0NBQ3hDLEdBQUcsQ0FBQztDQUNKLEVBQUU7O0NBRUYsQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQztDQUNuQyxDQUFDOztDQ3BDRCxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsb0JBQW9CLENBQUMsTUFBTSxDQUFDLENBQUM7Q0FDdEQsTUFBTSxVQUFVLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxLQUFLLEdBQUcsQ0FBQzs7QUFFN0UsQ0FBTyxNQUFNLFFBQVEsR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDOztBQUV2RSxDQUFPLE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQztDQUMvQixFQUFFLElBQUksRUFBRSxHQUFHO0NBQ1gsRUFBRSxNQUFNLEVBQUUsRUFBRTtDQUNaLENBQUMsQ0FBQyxDQUFDOztBQUVILENBQU8sTUFBTSxVQUFVLEdBQUcsRUFBRSxDQUFDO0FBQzdCLENBQU8sTUFBTSxTQUFTLEdBQUcsRUFBRSxDQUFDOztDQUU1QjtBQUNBLENBQU8sSUFBSSxVQUFVLEdBQUcsUUFBUSxDQUFDLE1BQU0sS0FBSyxNQUFNLENBQUM7O0FBRW5ELENBQU8sU0FBUyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUU7Q0FDeEMsRUFBRSxJQUFJLE9BQU8sS0FBSyxLQUFLLFNBQVMsRUFBRTtDQUNsQyxJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDO0NBQ3pCLEdBQUc7O0NBRUgsRUFBRSxPQUFPLFVBQVUsQ0FBQztDQUNwQixDQUFDOztBQUVELENBQU8sU0FBUyxhQUFhLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRTtDQUM5QyxFQUFFLE1BQU0sT0FBTyxHQUFHLGdCQUFnQixFQUFFLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUM7O0NBRTFGO0NBQ0EsRUFBRSxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsS0FBSyxHQUFHLEVBQUU7Q0FDN0IsSUFBSSxJQUFJLEdBQUcsT0FBTyxHQUFHLElBQUksQ0FBQztDQUMxQixHQUFHOztDQUVIO0NBQ0EsRUFBRSxJQUFJLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQyxNQUFNLE1BQU0sSUFBSSxFQUFFO0NBQzVDLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO0NBQ25CLEdBQUc7Q0FDSCxDQUFDOztBQUVELENBQU8sU0FBUyxVQUFVLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRTtDQUMxQyxFQUFFLE1BQU07Q0FDUixJQUFJLE1BQU0sRUFBRSxPQUFPO0NBQ25CLElBQUksTUFBTSxFQUFFLFdBQVc7Q0FDdkIsR0FBRyxHQUFHLE9BQU8sSUFBSSxFQUFFLENBQUM7O0NBRXBCO0NBQ0EsRUFBRSxJQUFJLENBQUMsSUFBSSxJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRTtDQUN6QyxJQUFJLE1BQU0sSUFBSSxLQUFLLENBQUMsQ0FBQyxpRkFBaUYsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7Q0FDaEosR0FBRzs7Q0FFSCxFQUFFLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFO0NBQzFDLElBQUksTUFBTSxJQUFJLEtBQUssQ0FBQyxDQUFDLG1FQUFtRSxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztDQUN2SSxHQUFHOztDQUVILEVBQUUsSUFBSSxNQUFNLEVBQUU7Q0FDZCxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLDRCQUE0QixFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsS0FBSyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztDQUMvRSxHQUFHOztDQUVIO0NBQ0EsRUFBRSxJQUFJLFFBQVEsS0FBSyxHQUFHLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUU7Q0FDeEQsSUFBSSxJQUFJLEdBQUcsUUFBUSxHQUFHLElBQUksQ0FBQztDQUMzQixHQUFHOztDQUVILEVBQUUsSUFBSSxXQUFXLEVBQUU7Q0FDbkIsSUFBSSxNQUFNLEVBQUUsR0FBRyxXQUFXLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDOztDQUVsRCxJQUFJLElBQUksRUFBRSxFQUFFO0NBQ1osTUFBTSxJQUFJLElBQUksQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztDQUN2QixLQUFLO0NBQ0wsR0FBRzs7Q0FFSCxFQUFFLElBQUksZ0JBQWdCLEVBQUUsRUFBRTtDQUMxQixJQUFJLFFBQVEsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7Q0FDM0MsSUFBSSxPQUFPO0NBQ1gsR0FBRzs7Q0FFSDtDQUNBLEVBQUUsSUFBSSxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxJQUFJLENBQUMsYUFBYSxFQUFFO0NBQ3RELElBQUksUUFBUSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7Q0FDekIsSUFBSSxPQUFPO0NBQ1gsR0FBRzs7Q0FFSDtDQUNBLEVBQUUsYUFBYSxDQUFDLElBQUksRUFBRSxPQUFPLElBQUk7Q0FDakMsSUFBSSxPQUFPLENBQUMsT0FBTyxHQUFHLGNBQWMsR0FBRyxXQUFXLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0NBQ3ZFLElBQUksYUFBYSxDQUFDLElBQUksS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7Q0FDekMsR0FBRyxDQUFDLENBQUM7Q0FDTCxDQUFDOztBQUVELENBQU8sU0FBUyxRQUFRLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7Q0FDM0MsRUFBRSxJQUFJLEtBQUssS0FBSyxJQUFJLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUU7Q0FDakQsSUFBSSxPQUFPLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDdkQsR0FBRzs7Q0FFSCxFQUFFLE9BQU8sSUFBSSxLQUFLLEdBQUcsQ0FBQztDQUN0QixDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztrQkMyRjRCLElBQUk7OztrQkFDdkIsT0FBTzs7Ozs7Ozs7Ozs7Ozs7OztzQkFEWSxJQUFJOzs7O3NCQUN2QixPQUFPOzs7Ozs7Ozs7Ozs7Ozs7c0JBSFosT0FBTyxJQUFJLEtBQUMsUUFBUSxJQUFJLEtBQUMsVUFBVTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7WUFBbkMsT0FBTyxJQUFJLEtBQUMsUUFBUSxJQUFJLEtBQUMsVUFBVTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQWxMdEMsTUFBTSxVQUFVLEdBQUcsSUFBSSxNQUFNLEVBQUUsQ0FBQzs7Ozs7Ozs7O0dBVWhDLElBQUksT0FBTyxDQUFDO0dBQ1osSUFBSSxRQUFRLENBQUM7O0dBRU4sTUFBSSxJQUFJLEdBQUcsR0FBRyxFQUNWLEtBQUssR0FBRyxJQUFJLEVBQ1osVUFBVSxHQUFHLGlCQUFLLENBQUM7O0dBRTlCLE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQztHQUN0QixNQUFNLGFBQWEsR0FBRyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7R0FDN0MsTUFBTSxTQUFTLEdBQUcsYUFBYSxHQUFHLGFBQWEsQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDLEVBQUUsNkdBQUMsQ0FBQztHQUN6RSxNQUFNLFFBQVEsR0FBRyxhQUFhLEdBQUcsYUFBYSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUMsSUFBSSx5R0FBQyxDQUFDOztHQUV6RSxNQUFNLFNBQVMsR0FBRyxTQUFTLEtBQUssSUFBSSxJQUFJLFNBQVMsS0FBSyxHQUFHO09BQ3JELENBQUMsRUFBRSxTQUFTLENBQUMsRUFBRSxJQUFJLEtBQUssR0FBRyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUMsQ0FBQztPQUN6QyxJQUFJLENBQUM7O0dBRVQsU0FBUyxVQUFVLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUU7S0FDekMsVUFBVSxHQUFHO09BQ1gsQ0FBQyxRQUFRLEdBQUc7U0FDVixPQUFPLEVBQUUsQ0FBQztTQUNWLEtBQUssRUFBRSxXQUFXO1NBQ2xCLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLFNBQVMsRUFBRTtRQUM1QztNQUNGLDRCQUFDO0lBQ0g7O0dBRUQsU0FBUyxZQUFZLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFO0tBQ2pELE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxLQUFLO09BQ3hDLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRTtTQUNYLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQzs7U0FFbkMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNoRTs7T0FFRCxPQUFPLElBQUksQ0FBQztNQUNiLEVBQUUsRUFBRSxDQUFDLENBQUM7O0tBRVAsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUk7T0FDWixJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUU7U0FDNUMsSUFBSSxPQUFPLENBQUMsQ0FBQyxTQUFTLEtBQUssU0FBUyxJQUFJLE9BQU8sQ0FBQyxDQUFDLFNBQVMsS0FBSyxVQUFVLEVBQUU7V0FDekUsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLENBQUMsU0FBUyxLQUFLLFVBQVUsR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUM7O1dBRWxGLElBQUksRUFBRSxLQUFLLElBQUksSUFBSSxDQUFDLENBQUMsUUFBUSxFQUFFO2FBQzdCLFVBQVUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUM7YUFDdkIsT0FBTyxJQUFJLENBQUM7WUFDYjtVQUNGOztTQUVELElBQUksQ0FBQyxDQUFDLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUU7V0FDOUIsVUFBVSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQztXQUN2QixPQUFPLElBQUksQ0FBQztVQUNiOztTQUVELElBQUksQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFO1dBQ2YsVUFBVSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRzthQUNsQixHQUFHLENBQUM7YUFDSixLQUFLLEVBQUUsTUFBTTthQUNiLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztZQUN2Qiw0QkFBQztVQUNILE1BQU07V0FDTCxVQUFVLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztXQUNoQyxPQUFPLElBQUksQ0FBQztVQUNiO1FBQ0Y7O09BRUQsT0FBTyxLQUFLLENBQUM7TUFDZCxDQUFDLENBQUM7SUFDSjs7R0FFRCxTQUFTLGFBQWEsR0FBRztLQUN2QixZQUFZLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDOztLQUU5QixhQUFhLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNOytCQUNqQyxPQUFPLEdBQUcsS0FBSSxDQUFDO09BQ2YsVUFBVSxHQUFHLEVBQUUsNEJBQUM7O09BRWhCLElBQUksT0FBTyxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUM7OztPQUcvRixJQUFJLFFBQVEsS0FBSyxHQUFHLEVBQUU7U0FDcEIsT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3pDOztPQUVELE1BQU0sQ0FBQyxRQUFRLEVBQUUsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztPQUM5RSxNQUFNLEtBQUssR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDO09BQzdDLE1BQU0sR0FBRyxHQUFHLEVBQUUsQ0FBQzs7T0FFZixJQUFJO1NBQ0YsSUFBSSxRQUFRLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsSUFBSSxTQUFTLEtBQUssR0FBRyxFQUFFO1dBQzdELFVBQVUsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsR0FBRyxFQUFFLE1BQU0sS0FBSzthQUM1QyxJQUFJLEdBQUcsRUFBRTt1Q0FDUCxPQUFPLEdBQUcsSUFBRyxDQUFDO2VBQ2QsT0FBTztjQUNSOzthQUVELFlBQVksQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztZQUM1QyxDQUFDLENBQUM7VUFDSjtRQUNGLENBQUMsT0FBTyxDQUFDLEVBQUU7aUNBQ1YsT0FBTyxHQUFHLEVBQUMsQ0FBQztRQUNiLFNBQVM7U0FDUixPQUFPLENBQUMsSUFBSSxHQUFHLFFBQVEsc0JBQUM7U0FDeEIsT0FBTyxDQUFDLEtBQUssR0FBRyxLQUFLLHNCQUFDO1NBQ3RCLE9BQU8sQ0FBQyxNQUFNLEdBQUcsR0FBRyxzQkFBQztRQUN0Qjs7T0FFRCxJQUFJLE9BQU8sSUFBSSxRQUFRLEVBQUU7U0FDdkIsVUFBVSxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDckMsT0FBTztRQUNSOztPQUVELElBQUk7U0FDRixVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLElBQUk7O1dBRXZDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxJQUFJLEdBQUcsQ0FBQyxLQUFLLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRTthQUN4QyxVQUFVLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksNEJBQUM7WUFDNUI7VUFDRixDQUFDLENBQUM7UUFDSixDQUFDLE9BQU8sQ0FBQyxFQUFFOztRQUVYO01BQ0YsRUFBRSxFQUFFLENBQUMsK0NBQUM7SUFDUjs7R0FFRCxTQUFTLFdBQVcsQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRTtLQUN2QyxHQUFHLEdBQUcsR0FBRyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDOztLQUVsRCxNQUFNLE9BQU8sR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLE1BQU0sRUFBRSxDQUFDOztLQUVuQyxJQUFJLFFBQVEsQ0FBQzs7S0FFYixVQUFVLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxNQUFNO09BQ2hDLFFBQVEsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztnQ0FDMUMsUUFBUSxHQUFHLENBQUMsT0FBTyxDQUFDLFFBQVEsSUFBSSxHQUFHLEtBQUssU0FBUSxDQUFDO01BQ2xELENBQUMsQ0FBQzs7S0FFSCxhQUFhLEVBQUUsQ0FBQzs7S0FFaEIsT0FBTyxDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUN4Qjs7R0FFRCxTQUFTLGFBQWEsQ0FBQyxLQUFLLEVBQUU7S0FDNUIsVUFBVSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUNyQixhQUFhLEVBQUUsQ0FBQztJQUNqQjs7R0FFRCxNQUFNLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLGFBQWEsRUFBRSxLQUFLLENBQUMsQ0FBQzs7R0FFMUQsU0FBUyxDQUFDLE1BQU07S0FDZCxNQUFNLENBQUMsbUJBQW1CLENBQUMsVUFBVSxFQUFFLGFBQWEsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUM5RCxDQUFDLENBQUM7O0dBRUgsVUFBVSxDQUFDLFVBQVUsRUFBRTtLQUNyQixPQUFPO0tBQ1AsUUFBUTtLQUNSLFNBQVM7S0FDVCxXQUFXO0tBQ1gsYUFBYTtJQUNkLENBQUMsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1VDekdhLFlBQVk7U0FBUyxXQUFXOzs7Ozs7Ozs7Ozs7Ozs7V0FIM0MsU0FBUzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7aUJBQytCLFlBQVk7T0FBTSxXQUFXOzs7eUJBQWhELFNBQVM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7NkNBQVUsWUFBWTtrQ0FBTSxXQUFXOzs7NkNBQWhELFNBQVM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7c0JBRmhDLFlBQVk7Ozs7Ozs7Ozs7Ozs7OztZQUFaLFlBQVk7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FwQ2YsU0FBUyxRQUFRLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRTtDQUNuQyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsTUFBTSxFQUFFLEdBQUcsS0FBSyxDQUFDOztDQUU1QztDQUNFLEVBQUUsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUk7Q0FDeEIsSUFBSSxPQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUN2QixHQUFLLENBQUMsQ0FBQzs7Q0FFTCxFQUFFLE9BQU87Q0FDWCxJQUFNLEdBQUcsR0FBRztDQUNaLElBQU0sR0FBRyxNQUFNO0NBQ2IsR0FBRyxDQUFDO0NBQ0osQ0FBQzs7Ozs7OztHQW5DTSxNQUFJLEdBQUcsR0FBRyxJQUFJLEVBQ1YsSUFBSSxHQUFHLEdBQUcsRUFDVixLQUFLLEdBQUcsSUFBSSxFQUNaLEtBQUssR0FBRyxJQUFJLEVBQ1osUUFBUSxHQUFHLElBQUksRUFDZixTQUFTLEdBQUcsSUFBSSxFQUNoQixTQUFTLEdBQUcsSUFBSSxFQUNoQixRQUFRLEdBQUcsZ0JBQUksQ0FBQzs7R0FFM0IsTUFBTSxZQUFZLEdBQUcsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0dBQzNDLE1BQU0sU0FBUyxHQUFHLFlBQVksR0FBRyxZQUFZLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQyxJQUFJLDZHQUFDLENBQUM7O0dBRXpFLE1BQU07S0FDSixXQUFXLEVBQUUsYUFBYSxFQUFFLFNBQVMsRUFBRSxPQUFPO0lBQy9DLEdBQUcsVUFBVSxDQUFDLFVBQVUsNkdBQUMsQ0FBQzs7O0dBRzNCLElBQUksT0FBTyx3QkFBRSxLQUFLLEdBQUcsS0FBSSxDQUFDOztHQUUxQixJQUFJLFlBQVksR0FBRyxJQUFJLENBQUM7R0FDeEIsSUFBSSxXQUFXLEdBQUcsRUFBRSxDQUFDO0dBQ3JCLElBQUksUUFBUSxDQUFDOztHQWdCYixNQUFNLFNBQVMsR0FBRyxVQUFVLEtBQUssSUFBSSxJQUFJLFVBQVUsS0FBSyxHQUFHO09BQ3ZELENBQUMsRUFBRSxVQUFVLENBQUMsRUFBRSxJQUFJLEtBQUssR0FBRyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUMsQ0FBQztPQUMxQyxJQUFJLENBQUM7O0dBRVQsQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLEdBQUcsV0FBVyxDQUFDLEdBQUcsRUFBRSxTQUFTLEVBQUU7S0FDNUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsS0FBSztJQUNyQyxDQUFDLENBQUMsOERBS0Y7O0dBRUQsU0FBUyxDQUFDLE1BQU07S0FDZCxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDekIsQ0FBQyxDQUFDOztHQUVILFVBQVUsQ0FBQyxTQUFTLEVBQUU7S0FDcEIsU0FBUztJQUNWLENBQUMsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7OzRDQVhBO3NDQUNELFlBQVksR0FBRyxVQUFVLENBQUMsR0FBRyxFQUFDLENBQUM7cUNBQy9CLFdBQVcsR0FBRyxRQUFRLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFDLENBQUM7UUFDeEQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2lCQ2lCUSxTQUFTO3NCQUF5QixTQUFTO2tCQUFHLEtBQUs7cURBQTJCLE9BQU87Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2tCQUFyRixTQUFTOzs7O3VCQUF5QixTQUFTOzs7O21CQUFHLEtBQUs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7NkJBSjdCLFNBQVM7eUJBQUcsS0FBSzs0REFBMkIsT0FBTzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OEJBQW5ELFNBQVM7Ozs7MEJBQUcsS0FBSzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7V0FEN0MsTUFBTTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0E3RFQsSUFBSSxHQUFHLENBQUM7R0FDUixJQUFJLE1BQU0sQ0FBQztHQUNYLGFBQUksUUFBUSxHQUFHLGNBQUUsQ0FBQztHQUNsQixJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUM7O0dBRWQsTUFBSSxFQUFFLEdBQUcsSUFBSSxFQUNULElBQUksR0FBRyxHQUFHLEVBQ1YsS0FBSyxHQUFHLEVBQUUsRUFDVixNQUFNLEdBQUcsS0FBSyxFQUNkLEtBQUssR0FBRyxLQUFLLEVBQ2IsTUFBTSxHQUFHLEtBQUssRUFDZCxPQUFPLEdBQUcsS0FBSyxFQUNmLFNBQVMsR0FBRyxjQUFFLENBQUM7OztHQUkxQixJQUFJLFFBQVEsS0FBSyxHQUFHLEVBQUU7K0JBQ3BCLFNBQVMsR0FBRyxRQUFRLEdBQUcsS0FBSSxDQUFDO0lBQzdCLE1BQU07K0JBQ0wsU0FBUyxHQUFHLEtBQUksQ0FBQztJQUNsQjs7R0FtQkQsT0FBTyxDQUFDLE1BQU07K0JBQ1osU0FBUyxHQUFHLFNBQVMsSUFBSSxTQUFRLENBQUM7SUFDbkMsQ0FBQyxDQUFDOztHQUVILE1BQU0sUUFBUSxHQUFHLHFCQUFxQixFQUFFLENBQUM7OztHQUd6QyxTQUFTLE9BQU8sQ0FBQyxDQUFDLEVBQUU7S0FDbEIsSUFBSSxPQUFPLEVBQUUsS0FBSyxRQUFRLElBQUksT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7T0FDaEQsSUFBSSxFQUFFLEtBQUssTUFBTSxFQUFFLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUM3QixJQUFJLEVBQUUsS0FBSyxLQUFLLEVBQUUsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3BDLE9BQU8sQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO09BQ2xDLE9BQU87TUFDUjs7S0FFRCxhQUFhLENBQUMsSUFBSSxFQUFFLE9BQU8sSUFBSTtPQUM3QixVQUFVLENBQUMsT0FBTyxFQUFFLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7T0FDekMsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztNQUN0QixDQUFDLENBQUM7SUFDSjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs4R0FwQ0UsSUFBSSxHQUFHLElBQUksT0FBTyxDQUFDLElBQUksRUFBRTtTQUMxQixJQUFJLFFBQVEsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsRUFBRTtXQUN2QyxJQUFJLENBQUMsTUFBTSxFQUFFO29DQUNYLE1BQU0sR0FBRyxLQUFJLENBQUM7YUFDZCxHQUFHLENBQUMsWUFBWSxDQUFDLGNBQWMsRUFBRSxNQUFNLENBQUMsQ0FBQzs7YUFFekMsSUFBSSxNQUFNLEVBQUU7ZUFDVixHQUFHLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztjQUNwQztZQUNGO1VBQ0YsTUFBTSxJQUFJLE1BQU0sRUFBRTtrQ0FDakIsTUFBTSxHQUFHLE1BQUssQ0FBQztXQUNmLEdBQUcsQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLENBQUM7V0FDaEMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxjQUFjLENBQUMsQ0FBQztVQUNyQztRQUNGOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0N0Q0gsTUFBTSxDQUFDLGNBQWMsQ0FBQ0UsUUFBTSxFQUFFLFlBQVksRUFBRTtDQUM1QyxFQUFFLEdBQUcsRUFBRSxLQUFLLElBQUksZ0JBQWdCLENBQUMsS0FBSyxDQUFDO0NBQ3ZDLEVBQUUsR0FBRyxFQUFFLE1BQU0sZ0JBQWdCLEVBQUU7Q0FDL0IsRUFBRSxZQUFZLEVBQUUsS0FBSztDQUNyQixFQUFFLFVBQVUsRUFBRSxLQUFLO0NBQ25CLENBQUMsQ0FBQyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztjQ0lrQyxJQUFJOzs7Ozt1Q0FDVixRQUFROzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztpREFERixJQUFJOzs7O3FEQUNWLFFBQVE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NDZHZDLElBQUksR0FBRyxDQUFDO0dBQ04sTUFBTSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDO0VBQ3ZDLENBQUMsQ0FBQzs7OzsifQ==