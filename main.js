var __create = Object.create;
var __defProp = Object.defineProperty;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __markAsModule = (target) => __defProp(target, "__esModule", {value: true});
var __commonJS = (callback, module) => () => {
  if (!module) {
    module = {exports: {}};
    callback(module.exports, module);
  }
  return module.exports;
};
var __exportStar = (target, module, desc) => {
  if (module && typeof module === "object" || typeof module === "function") {
    for (let key of __getOwnPropNames(module))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, {get: () => module[key], enumerable: !(desc = __getOwnPropDesc(module, key)) || desc.enumerable});
  }
  return target;
};
var __toModule = (module) => {
  if (module && module.__esModule)
    return module;
  return __exportStar(__markAsModule(__defProp(module != null ? __create(__getProtoOf(module)) : {}, "default", {value: module, enumerable: true})), module);
};

// node_modules/svelte/internal/index.js
var require_internal = __commonJS((exports) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {value: true});
  function noop4() {
  }
  var identity = (x) => x;
  function assign3(tar, src) {
    for (const k in src)
      tar[k] = src[k];
    return tar;
  }
  function is_promise(value) {
    return value && typeof value === "object" && typeof value.then === "function";
  }
  function add_location(element6, file, line, column, char) {
    element6.__svelte_meta = {
      loc: {file, line, column, char}
    };
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
    return typeof thing === "function";
  }
  function safe_not_equal7(a, b) {
    return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
  }
  function not_equal(a, b) {
    return a != a ? b == b : a !== b;
  }
  function is_empty(obj) {
    return Object.keys(obj).length === 0;
  }
  function validate_store(store, name) {
    if (store != null && typeof store.subscribe !== "function") {
      throw new Error(`'${name}' is not a store with a 'subscribe' method`);
    }
  }
  function subscribe(store, ...callbacks) {
    if (store == null) {
      return noop4;
    }
    const unsub = store.subscribe(...callbacks);
    return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
  }
  function get_store_value(store) {
    let value;
    subscribe(store, (_) => value = _)();
    return value;
  }
  function component_subscribe4(component, store, callback) {
    component.$$.on_destroy.push(subscribe(store, callback));
  }
  function create_slot4(definition, ctx, $$scope, fn) {
    if (definition) {
      const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
      return definition[0](slot_ctx);
    }
  }
  function get_slot_context(definition, ctx, $$scope, fn) {
    return definition[1] && fn ? assign3($$scope.ctx.slice(), definition[1](fn(ctx))) : $$scope.ctx;
  }
  function get_slot_changes(definition, $$scope, dirty, fn) {
    if (definition[2] && fn) {
      const lets = definition[2](fn(dirty));
      if ($$scope.dirty === void 0) {
        return lets;
      }
      if (typeof lets === "object") {
        const merged = [];
        const len = Math.max($$scope.dirty.length, lets.length);
        for (let i = 0; i < len; i += 1) {
          merged[i] = $$scope.dirty[i] | lets[i];
        }
        return merged;
      }
      return $$scope.dirty | lets;
    }
    return $$scope.dirty;
  }
  function update_slot4(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
    const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
    if (slot_changes) {
      const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
      slot.p(slot_context, slot_changes);
    }
  }
  function update_slot_spread(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_spread_changes_fn, get_slot_context_fn) {
    const slot_changes = get_slot_spread_changes_fn(dirty) | get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
    if (slot_changes) {
      const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
      slot.p(slot_context, slot_changes);
    }
  }
  function exclude_internal_props3(props) {
    const result = {};
    for (const k in props)
      if (k[0] !== "$")
        result[k] = props[k];
    return result;
  }
  function compute_rest_props(props, keys) {
    const rest = {};
    keys = new Set(keys);
    for (const k in props)
      if (!keys.has(k) && k[0] !== "$")
        rest[k] = props[k];
    return rest;
  }
  function compute_slots(slots) {
    const result = {};
    for (const key in slots) {
      result[key] = true;
    }
    return result;
  }
  function once(fn) {
    let ran = false;
    return function(...args) {
      if (ran)
        return;
      ran = true;
      fn.call(this, ...args);
    };
  }
  function null_to_empty(value) {
    return value == null ? "" : value;
  }
  function set_store_value(store, ret, value = ret) {
    store.set(value);
    return ret;
  }
  var has_prop = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);
  function action_destroyer(action_result) {
    return action_result && is_function(action_result.destroy) ? action_result.destroy : noop4;
  }
  var is_client = typeof window !== "undefined";
  exports.now = is_client ? () => window.performance.now() : () => Date.now();
  exports.raf = is_client ? (cb) => requestAnimationFrame(cb) : noop4;
  function set_now(fn) {
    exports.now = fn;
  }
  function set_raf(fn) {
    exports.raf = fn;
  }
  var tasks = new Set();
  function run_tasks(now) {
    tasks.forEach((task) => {
      if (!task.c(now)) {
        tasks.delete(task);
        task.f();
      }
    });
    if (tasks.size !== 0)
      exports.raf(run_tasks);
  }
  function clear_loops() {
    tasks.clear();
  }
  function loop(callback) {
    let task;
    if (tasks.size === 0)
      exports.raf(run_tasks);
    return {
      promise: new Promise((fulfill) => {
        tasks.add(task = {c: callback, f: fulfill});
      }),
      abort() {
        tasks.delete(task);
      }
    };
  }
  function append2(target, node) {
    target.appendChild(node);
  }
  function insert7(target, node, anchor) {
    target.insertBefore(node, anchor || null);
  }
  function detach7(node) {
    node.parentNode.removeChild(node);
  }
  function destroy_each(iterations, detaching) {
    for (let i = 0; i < iterations.length; i += 1) {
      if (iterations[i])
        iterations[i].d(detaching);
    }
  }
  function element5(name) {
    return document.createElement(name);
  }
  function element_is(name, is) {
    return document.createElement(name, {is});
  }
  function object_without_properties(obj, exclude) {
    const target = {};
    for (const k in obj) {
      if (has_prop(obj, k) && exclude.indexOf(k) === -1) {
        target[k] = obj[k];
      }
    }
    return target;
  }
  function svg_element(name) {
    return document.createElementNS("http://www.w3.org/2000/svg", name);
  }
  function text3(data) {
    return document.createTextNode(data);
  }
  function space2() {
    return text3(" ");
  }
  function empty4() {
    return text3("");
  }
  function listen2(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
  }
  function prevent_default(fn) {
    return function(event) {
      event.preventDefault();
      return fn.call(this, event);
    };
  }
  function stop_propagation(fn) {
    return function(event) {
      event.stopPropagation();
      return fn.call(this, event);
    };
  }
  function self(fn) {
    return function(event) {
      if (event.target === this)
        fn.call(this, event);
    };
  }
  function attr(node, attribute, value) {
    if (value == null)
      node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value)
      node.setAttribute(attribute, value);
  }
  function set_attributes2(node, attributes) {
    const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
    for (const key in attributes) {
      if (attributes[key] == null) {
        node.removeAttribute(key);
      } else if (key === "style") {
        node.style.cssText = attributes[key];
      } else if (key === "__value") {
        node.value = node[key] = attributes[key];
      } else if (descriptors[key] && descriptors[key].set) {
        node[key] = attributes[key];
      } else {
        attr(node, key, attributes[key]);
      }
    }
  }
  function set_svg_attributes(node, attributes) {
    for (const key in attributes) {
      attr(node, key, attributes[key]);
    }
  }
  function set_custom_element_data(node, prop, value) {
    if (prop in node) {
      node[prop] = value;
    } else {
      attr(node, prop, value);
    }
  }
  function xlink_attr(node, attribute, value) {
    node.setAttributeNS("http://www.w3.org/1999/xlink", attribute, value);
  }
  function get_binding_group_value(group, __value, checked) {
    const value = new Set();
    for (let i = 0; i < group.length; i += 1) {
      if (group[i].checked)
        value.add(group[i].__value);
    }
    if (!checked) {
      value.delete(__value);
    }
    return Array.from(value);
  }
  function to_number(value) {
    return value === "" ? null : +value;
  }
  function time_ranges_to_array(ranges) {
    const array = [];
    for (let i = 0; i < ranges.length; i += 1) {
      array.push({start: ranges.start(i), end: ranges.end(i)});
    }
    return array;
  }
  function children(element6) {
    return Array.from(element6.childNodes);
  }
  function claim_element(nodes, name, attributes, svg) {
    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];
      if (node.nodeName === name) {
        let j = 0;
        const remove = [];
        while (j < node.attributes.length) {
          const attribute = node.attributes[j++];
          if (!attributes[attribute.name]) {
            remove.push(attribute.name);
          }
        }
        for (let k = 0; k < remove.length; k++) {
          node.removeAttribute(remove[k]);
        }
        return nodes.splice(i, 1)[0];
      }
    }
    return svg ? svg_element(name) : element5(name);
  }
  function claim_text(nodes, data) {
    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];
      if (node.nodeType === 3) {
        node.data = "" + data;
        return nodes.splice(i, 1)[0];
      }
    }
    return text3(data);
  }
  function claim_space(nodes) {
    return claim_text(nodes, " ");
  }
  function set_data2(text4, data) {
    data = "" + data;
    if (text4.wholeText !== data)
      text4.data = data;
  }
  function set_input_value(input, value) {
    input.value = value == null ? "" : value;
  }
  function set_input_type(input, type) {
    try {
      input.type = type;
    } catch (e) {
    }
  }
  function set_style(node, key, value, important) {
    node.style.setProperty(key, value, important ? "important" : "");
  }
  function select_option(select, value) {
    for (let i = 0; i < select.options.length; i += 1) {
      const option = select.options[i];
      if (option.__value === value) {
        option.selected = true;
        return;
      }
    }
  }
  function select_options(select, value) {
    for (let i = 0; i < select.options.length; i += 1) {
      const option = select.options[i];
      option.selected = ~value.indexOf(option.__value);
    }
  }
  function select_value(select) {
    const selected_option = select.querySelector(":checked") || select.options[0];
    return selected_option && selected_option.__value;
  }
  function select_multiple_value(select) {
    return [].map.call(select.querySelectorAll(":checked"), (option) => option.__value);
  }
  var crossorigin;
  function is_crossorigin() {
    if (crossorigin === void 0) {
      crossorigin = false;
      try {
        if (typeof window !== "undefined" && window.parent) {
          void window.parent.document;
        }
      } catch (error) {
        crossorigin = true;
      }
    }
    return crossorigin;
  }
  function add_resize_listener(node, fn) {
    const computed_style = getComputedStyle(node);
    if (computed_style.position === "static") {
      node.style.position = "relative";
    }
    const iframe = element5("iframe");
    iframe.setAttribute("style", "display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden; border: 0; opacity: 0; pointer-events: none; z-index: -1;");
    iframe.setAttribute("aria-hidden", "true");
    iframe.tabIndex = -1;
    const crossorigin2 = is_crossorigin();
    let unsubscribe;
    if (crossorigin2) {
      iframe.src = "data:text/html,<script>onresize=function(){parent.postMessage(0,'*')}</script>";
      unsubscribe = listen2(window, "message", (event) => {
        if (event.source === iframe.contentWindow)
          fn();
      });
    } else {
      iframe.src = "about:blank";
      iframe.onload = () => {
        unsubscribe = listen2(iframe.contentWindow, "resize", fn);
      };
    }
    append2(node, iframe);
    return () => {
      if (crossorigin2) {
        unsubscribe();
      } else if (unsubscribe && iframe.contentWindow) {
        unsubscribe();
      }
      detach7(iframe);
    };
  }
  function toggle_class(element6, name, toggle) {
    element6.classList[toggle ? "add" : "remove"](name);
  }
  function custom_event(type, detail) {
    const e = document.createEvent("CustomEvent");
    e.initCustomEvent(type, false, false, detail);
    return e;
  }
  function query_selector_all(selector, parent = document.body) {
    return Array.from(parent.querySelectorAll(selector));
  }
  var HtmlTag = class {
    constructor(anchor = null) {
      this.a = anchor;
      this.e = this.n = null;
    }
    m(html, target, anchor = null) {
      if (!this.e) {
        this.e = element5(target.nodeName);
        this.t = target;
        this.h(html);
      }
      this.i(anchor);
    }
    h(html) {
      this.e.innerHTML = html;
      this.n = Array.from(this.e.childNodes);
    }
    i(anchor) {
      for (let i = 0; i < this.n.length; i += 1) {
        insert7(this.t, this.n[i], anchor);
      }
    }
    p(html) {
      this.d();
      this.h(html);
      this.i(this.a);
    }
    d() {
      this.n.forEach(detach7);
    }
  };
  function attribute_to_object(attributes) {
    const result = {};
    for (const attribute of attributes) {
      result[attribute.name] = attribute.value;
    }
    return result;
  }
  function get_custom_elements_slots(element6) {
    const result = {};
    element6.childNodes.forEach((node) => {
      result[node.slot || "default"] = true;
    });
    return result;
  }
  var active_docs = new Set();
  var active = 0;
  function hash(str) {
    let hash2 = 5381;
    let i = str.length;
    while (i--)
      hash2 = (hash2 << 5) - hash2 ^ str.charCodeAt(i);
    return hash2 >>> 0;
  }
  function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
    const step = 16.666 / duration;
    let keyframes = "{\n";
    for (let p = 0; p <= 1; p += step) {
      const t = a + (b - a) * ease(p);
      keyframes += p * 100 + `%{${fn(t, 1 - t)}}
`;
    }
    const rule = keyframes + `100% {${fn(b, 1 - b)}}
}`;
    const name = `__svelte_${hash(rule)}_${uid}`;
    const doc = node.ownerDocument;
    active_docs.add(doc);
    const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element5("style")).sheet);
    const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
    if (!current_rules[name]) {
      current_rules[name] = true;
      stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
    }
    const animation = node.style.animation || "";
    node.style.animation = `${animation ? `${animation}, ` : ""}${name} ${duration}ms linear ${delay}ms 1 both`;
    active += 1;
    return name;
  }
  function delete_rule(node, name) {
    const previous = (node.style.animation || "").split(", ");
    const next = previous.filter(name ? (anim) => anim.indexOf(name) < 0 : (anim) => anim.indexOf("__svelte") === -1);
    const deleted = previous.length - next.length;
    if (deleted) {
      node.style.animation = next.join(", ");
      active -= deleted;
      if (!active)
        clear_rules();
    }
  }
  function clear_rules() {
    exports.raf(() => {
      if (active)
        return;
      active_docs.forEach((doc) => {
        const stylesheet = doc.__svelte_stylesheet;
        let i = stylesheet.cssRules.length;
        while (i--)
          stylesheet.deleteRule(i);
        doc.__svelte_rules = {};
      });
      active_docs.clear();
    });
  }
  function create_animation(node, from, fn, params) {
    if (!from)
      return noop4;
    const to = node.getBoundingClientRect();
    if (from.left === to.left && from.right === to.right && from.top === to.top && from.bottom === to.bottom)
      return noop4;
    const {
      delay = 0,
      duration = 300,
      easing = identity,
      start: start_time = exports.now() + delay,
      end = start_time + duration,
      tick: tick2 = noop4,
      css
    } = fn(node, {from, to}, params);
    let running = true;
    let started = false;
    let name;
    function start() {
      if (css) {
        name = create_rule(node, 0, 1, duration, delay, easing, css);
      }
      if (!delay) {
        started = true;
      }
    }
    function stop() {
      if (css)
        delete_rule(node, name);
      running = false;
    }
    loop((now) => {
      if (!started && now >= start_time) {
        started = true;
      }
      if (started && now >= end) {
        tick2(1, 0);
        stop();
      }
      if (!running) {
        return false;
      }
      if (started) {
        const p = now - start_time;
        const t = 0 + 1 * easing(p / duration);
        tick2(t, 1 - t);
      }
      return true;
    });
    start();
    tick2(0, 1);
    return stop;
  }
  function fix_position(node) {
    const style = getComputedStyle(node);
    if (style.position !== "absolute" && style.position !== "fixed") {
      const {width, height} = style;
      const a = node.getBoundingClientRect();
      node.style.position = "absolute";
      node.style.width = width;
      node.style.height = height;
      add_transform(node, a);
    }
  }
  function add_transform(node, a) {
    const b = node.getBoundingClientRect();
    if (a.left !== b.left || a.top !== b.top) {
      const style = getComputedStyle(node);
      const transform = style.transform === "none" ? "" : style.transform;
      node.style.transform = `${transform} translate(${a.left - b.left}px, ${a.top - b.top}px)`;
    }
  }
  function set_current_component(component) {
    exports.current_component = component;
  }
  function get_current_component() {
    if (!exports.current_component)
      throw new Error("Function called outside component initialization");
    return exports.current_component;
  }
  function beforeUpdate(fn) {
    get_current_component().$$.before_update.push(fn);
  }
  function onMount2(fn) {
    get_current_component().$$.on_mount.push(fn);
  }
  function afterUpdate(fn) {
    get_current_component().$$.after_update.push(fn);
  }
  function onDestroy3(fn) {
    get_current_component().$$.on_destroy.push(fn);
  }
  function createEventDispatcher2() {
    const component = get_current_component();
    return (type, detail) => {
      const callbacks = component.$$.callbacks[type];
      if (callbacks) {
        const event = custom_event(type, detail);
        callbacks.slice().forEach((fn) => {
          fn.call(component, event);
        });
      }
    };
  }
  function setContext3(key, context) {
    get_current_component().$$.context.set(key, context);
  }
  function getContext3(key) {
    return get_current_component().$$.context.get(key);
  }
  function hasContext(key) {
    return get_current_component().$$.context.has(key);
  }
  function bubble(component, event) {
    const callbacks = component.$$.callbacks[event.type];
    if (callbacks) {
      callbacks.slice().forEach((fn) => fn(event));
    }
  }
  var dirty_components = [];
  var intros = {enabled: false};
  var binding_callbacks2 = [];
  var render_callbacks = [];
  var flush_callbacks = [];
  var resolved_promise = Promise.resolve();
  var update_scheduled = false;
  function schedule_update() {
    if (!update_scheduled) {
      update_scheduled = true;
      resolved_promise.then(flush);
    }
  }
  function tick() {
    schedule_update();
    return resolved_promise;
  }
  function add_render_callback(fn) {
    render_callbacks.push(fn);
  }
  function add_flush_callback(fn) {
    flush_callbacks.push(fn);
  }
  var flushing = false;
  var seen_callbacks = new Set();
  function flush() {
    if (flushing)
      return;
    flushing = true;
    do {
      for (let i = 0; i < dirty_components.length; i += 1) {
        const component = dirty_components[i];
        set_current_component(component);
        update(component.$$);
      }
      set_current_component(null);
      dirty_components.length = 0;
      while (binding_callbacks2.length)
        binding_callbacks2.pop()();
      for (let i = 0; i < render_callbacks.length; i += 1) {
        const callback = render_callbacks[i];
        if (!seen_callbacks.has(callback)) {
          seen_callbacks.add(callback);
          callback();
        }
      }
      render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
      flush_callbacks.pop()();
    }
    update_scheduled = false;
    flushing = false;
    seen_callbacks.clear();
  }
  function update($$) {
    if ($$.fragment !== null) {
      $$.update();
      run_all($$.before_update);
      const dirty = $$.dirty;
      $$.dirty = [-1];
      $$.fragment && $$.fragment.p($$.ctx, dirty);
      $$.after_update.forEach(add_render_callback);
    }
  }
  var promise;
  function wait() {
    if (!promise) {
      promise = Promise.resolve();
      promise.then(() => {
        promise = null;
      });
    }
    return promise;
  }
  function dispatch(node, direction, kind) {
    node.dispatchEvent(custom_event(`${direction ? "intro" : "outro"}${kind}`));
  }
  var outroing = new Set();
  var outros;
  function group_outros4() {
    outros = {
      r: 0,
      c: [],
      p: outros
    };
  }
  function check_outros4() {
    if (!outros.r) {
      run_all(outros.c);
    }
    outros = outros.p;
  }
  function transition_in5(block, local) {
    if (block && block.i) {
      outroing.delete(block);
      block.i(local);
    }
  }
  function transition_out5(block, local, detach8, callback) {
    if (block && block.o) {
      if (outroing.has(block))
        return;
      outroing.add(block);
      outros.c.push(() => {
        outroing.delete(block);
        if (callback) {
          if (detach8)
            block.d(1);
          callback();
        }
      });
      block.o(local);
    }
  }
  var null_transition = {duration: 0};
  function create_in_transition(node, fn, params) {
    let config = fn(node, params);
    let running = false;
    let animation_name;
    let task;
    let uid = 0;
    function cleanup() {
      if (animation_name)
        delete_rule(node, animation_name);
    }
    function go() {
      const {delay = 0, duration = 300, easing = identity, tick: tick2 = noop4, css} = config || null_transition;
      if (css)
        animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
      tick2(0, 1);
      const start_time = exports.now() + delay;
      const end_time = start_time + duration;
      if (task)
        task.abort();
      running = true;
      add_render_callback(() => dispatch(node, true, "start"));
      task = loop((now) => {
        if (running) {
          if (now >= end_time) {
            tick2(1, 0);
            dispatch(node, true, "end");
            cleanup();
            return running = false;
          }
          if (now >= start_time) {
            const t = easing((now - start_time) / duration);
            tick2(t, 1 - t);
          }
        }
        return running;
      });
    }
    let started = false;
    return {
      start() {
        if (started)
          return;
        delete_rule(node);
        if (is_function(config)) {
          config = config();
          wait().then(go);
        } else {
          go();
        }
      },
      invalidate() {
        started = false;
      },
      end() {
        if (running) {
          cleanup();
          running = false;
        }
      }
    };
  }
  function create_out_transition(node, fn, params) {
    let config = fn(node, params);
    let running = true;
    let animation_name;
    const group = outros;
    group.r += 1;
    function go() {
      const {delay = 0, duration = 300, easing = identity, tick: tick2 = noop4, css} = config || null_transition;
      if (css)
        animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
      const start_time = exports.now() + delay;
      const end_time = start_time + duration;
      add_render_callback(() => dispatch(node, false, "start"));
      loop((now) => {
        if (running) {
          if (now >= end_time) {
            tick2(0, 1);
            dispatch(node, false, "end");
            if (!--group.r) {
              run_all(group.c);
            }
            return false;
          }
          if (now >= start_time) {
            const t = easing((now - start_time) / duration);
            tick2(1 - t, t);
          }
        }
        return running;
      });
    }
    if (is_function(config)) {
      wait().then(() => {
        config = config();
        go();
      });
    } else {
      go();
    }
    return {
      end(reset) {
        if (reset && config.tick) {
          config.tick(1, 0);
        }
        if (running) {
          if (animation_name)
            delete_rule(node, animation_name);
          running = false;
        }
      }
    };
  }
  function create_bidirectional_transition(node, fn, params, intro) {
    let config = fn(node, params);
    let t = intro ? 0 : 1;
    let running_program = null;
    let pending_program = null;
    let animation_name = null;
    function clear_animation() {
      if (animation_name)
        delete_rule(node, animation_name);
    }
    function init8(program, duration) {
      const d = program.b - t;
      duration *= Math.abs(d);
      return {
        a: t,
        b: program.b,
        d,
        duration,
        start: program.start,
        end: program.start + duration,
        group: program.group
      };
    }
    function go(b) {
      const {delay = 0, duration = 300, easing = identity, tick: tick2 = noop4, css} = config || null_transition;
      const program = {
        start: exports.now() + delay,
        b
      };
      if (!b) {
        program.group = outros;
        outros.r += 1;
      }
      if (running_program || pending_program) {
        pending_program = program;
      } else {
        if (css) {
          clear_animation();
          animation_name = create_rule(node, t, b, duration, delay, easing, css);
        }
        if (b)
          tick2(0, 1);
        running_program = init8(program, duration);
        add_render_callback(() => dispatch(node, b, "start"));
        loop((now) => {
          if (pending_program && now > pending_program.start) {
            running_program = init8(pending_program, duration);
            pending_program = null;
            dispatch(node, running_program.b, "start");
            if (css) {
              clear_animation();
              animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
            }
          }
          if (running_program) {
            if (now >= running_program.end) {
              tick2(t = running_program.b, 1 - t);
              dispatch(node, running_program.b, "end");
              if (!pending_program) {
                if (running_program.b) {
                  clear_animation();
                } else {
                  if (!--running_program.group.r)
                    run_all(running_program.group.c);
                }
              }
              running_program = null;
            } else if (now >= running_program.start) {
              const p = now - running_program.start;
              t = running_program.a + running_program.d * easing(p / running_program.duration);
              tick2(t, 1 - t);
            }
          }
          return !!(running_program || pending_program);
        });
      }
    }
    return {
      run(b) {
        if (is_function(config)) {
          wait().then(() => {
            config = config();
            go(b);
          });
        } else {
          go(b);
        }
      },
      end() {
        clear_animation();
        running_program = pending_program = null;
      }
    };
  }
  function handle_promise(promise2, info) {
    const token2 = info.token = {};
    function update2(type, index, key, value) {
      if (info.token !== token2)
        return;
      info.resolved = value;
      let child_ctx = info.ctx;
      if (key !== void 0) {
        child_ctx = child_ctx.slice();
        child_ctx[key] = value;
      }
      const block = type && (info.current = type)(child_ctx);
      let needs_flush = false;
      if (info.block) {
        if (info.blocks) {
          info.blocks.forEach((block2, i) => {
            if (i !== index && block2) {
              group_outros4();
              transition_out5(block2, 1, 1, () => {
                if (info.blocks[i] === block2) {
                  info.blocks[i] = null;
                }
              });
              check_outros4();
            }
          });
        } else {
          info.block.d(1);
        }
        block.c();
        transition_in5(block, 1);
        block.m(info.mount(), info.anchor);
        needs_flush = true;
      }
      info.block = block;
      if (info.blocks)
        info.blocks[index] = block;
      if (needs_flush) {
        flush();
      }
    }
    if (is_promise(promise2)) {
      const current_component = get_current_component();
      promise2.then((value) => {
        set_current_component(current_component);
        update2(info.then, 1, info.value, value);
        set_current_component(null);
      }, (error) => {
        set_current_component(current_component);
        update2(info.catch, 2, info.error, error);
        set_current_component(null);
        if (!info.hasCatch) {
          throw error;
        }
      });
      if (info.current !== info.pending) {
        update2(info.pending, 0);
        return true;
      }
    } else {
      if (info.current !== info.then) {
        update2(info.then, 1, info.value, promise2);
        return true;
      }
      info.resolved = promise2;
    }
  }
  var globals = typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : global;
  function destroy_block(block, lookup) {
    block.d(1);
    lookup.delete(block.key);
  }
  function outro_and_destroy_block(block, lookup) {
    transition_out5(block, 1, 1, () => {
      lookup.delete(block.key);
    });
  }
  function fix_and_destroy_block(block, lookup) {
    block.f();
    destroy_block(block, lookup);
  }
  function fix_and_outro_and_destroy_block(block, lookup) {
    block.f();
    outro_and_destroy_block(block, lookup);
  }
  function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
    let o = old_blocks.length;
    let n = list.length;
    let i = o;
    const old_indexes = {};
    while (i--)
      old_indexes[old_blocks[i].key] = i;
    const new_blocks = [];
    const new_lookup = new Map();
    const deltas = new Map();
    i = n;
    while (i--) {
      const child_ctx = get_context(ctx, list, i);
      const key = get_key(child_ctx);
      let block = lookup.get(key);
      if (!block) {
        block = create_each_block(key, child_ctx);
        block.c();
      } else if (dynamic) {
        block.p(child_ctx, dirty);
      }
      new_lookup.set(key, new_blocks[i] = block);
      if (key in old_indexes)
        deltas.set(key, Math.abs(i - old_indexes[key]));
    }
    const will_move = new Set();
    const did_move = new Set();
    function insert8(block) {
      transition_in5(block, 1);
      block.m(node, next);
      lookup.set(block.key, block);
      next = block.first;
      n--;
    }
    while (o && n) {
      const new_block = new_blocks[n - 1];
      const old_block = old_blocks[o - 1];
      const new_key = new_block.key;
      const old_key = old_block.key;
      if (new_block === old_block) {
        next = new_block.first;
        o--;
        n--;
      } else if (!new_lookup.has(old_key)) {
        destroy(old_block, lookup);
        o--;
      } else if (!lookup.has(new_key) || will_move.has(new_key)) {
        insert8(new_block);
      } else if (did_move.has(old_key)) {
        o--;
      } else if (deltas.get(new_key) > deltas.get(old_key)) {
        did_move.add(new_key);
        insert8(new_block);
      } else {
        will_move.add(old_key);
        o--;
      }
    }
    while (o--) {
      const old_block = old_blocks[o];
      if (!new_lookup.has(old_block.key))
        destroy(old_block, lookup);
    }
    while (n)
      insert8(new_blocks[n - 1]);
    return new_blocks;
  }
  function validate_each_keys(ctx, list, get_context, get_key) {
    const keys = new Set();
    for (let i = 0; i < list.length; i++) {
      const key = get_key(get_context(ctx, list, i));
      if (keys.has(key)) {
        throw new Error("Cannot have duplicate keys in a keyed each");
      }
      keys.add(key);
    }
  }
  function get_spread_update3(levels, updates) {
    const update2 = {};
    const to_null_out = {};
    const accounted_for = {$$scope: 1};
    let i = levels.length;
    while (i--) {
      const o = levels[i];
      const n = updates[i];
      if (n) {
        for (const key in o) {
          if (!(key in n))
            to_null_out[key] = 1;
        }
        for (const key in n) {
          if (!accounted_for[key]) {
            update2[key] = n[key];
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
      if (!(key in update2))
        update2[key] = void 0;
    }
    return update2;
  }
  function get_spread_object2(spread_props) {
    return typeof spread_props === "object" && spread_props !== null ? spread_props : {};
  }
  var boolean_attributes = new Set([
    "allowfullscreen",
    "allowpaymentrequest",
    "async",
    "autofocus",
    "autoplay",
    "checked",
    "controls",
    "default",
    "defer",
    "disabled",
    "formnovalidate",
    "hidden",
    "ismap",
    "loop",
    "multiple",
    "muted",
    "nomodule",
    "novalidate",
    "open",
    "playsinline",
    "readonly",
    "required",
    "reversed",
    "selected"
  ]);
  var invalid_attribute_name_character = /[\s'">/=\u{FDD0}-\u{FDEF}\u{FFFE}\u{FFFF}\u{1FFFE}\u{1FFFF}\u{2FFFE}\u{2FFFF}\u{3FFFE}\u{3FFFF}\u{4FFFE}\u{4FFFF}\u{5FFFE}\u{5FFFF}\u{6FFFE}\u{6FFFF}\u{7FFFE}\u{7FFFF}\u{8FFFE}\u{8FFFF}\u{9FFFE}\u{9FFFF}\u{AFFFE}\u{AFFFF}\u{BFFFE}\u{BFFFF}\u{CFFFE}\u{CFFFF}\u{DFFFE}\u{DFFFF}\u{EFFFE}\u{EFFFF}\u{FFFFE}\u{FFFFF}\u{10FFFE}\u{10FFFF}]/u;
  function spread(args, classes_to_add) {
    const attributes = Object.assign({}, ...args);
    if (classes_to_add) {
      if (attributes.class == null) {
        attributes.class = classes_to_add;
      } else {
        attributes.class += " " + classes_to_add;
      }
    }
    let str = "";
    Object.keys(attributes).forEach((name) => {
      if (invalid_attribute_name_character.test(name))
        return;
      const value = attributes[name];
      if (value === true)
        str += " " + name;
      else if (boolean_attributes.has(name.toLowerCase())) {
        if (value)
          str += " " + name;
      } else if (value != null) {
        str += ` ${name}="${String(value).replace(/"/g, "&#34;").replace(/'/g, "&#39;")}"`;
      }
    });
    return str;
  }
  var escaped = {
    '"': "&quot;",
    "'": "&#39;",
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;"
  };
  function escape(html) {
    return String(html).replace(/["'&<>]/g, (match) => escaped[match]);
  }
  function each(items, fn) {
    let str = "";
    for (let i = 0; i < items.length; i += 1) {
      str += fn(items[i], i);
    }
    return str;
  }
  var missing_component = {
    $$render: () => ""
  };
  function validate_component(component, name) {
    if (!component || !component.$$render) {
      if (name === "svelte:component")
        name += " this={...}";
      throw new Error(`<${name}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules`);
    }
    return component;
  }
  function debug(file, line, column, values) {
    console.log(`{@debug} ${file ? file + " " : ""}(${line}:${column})`);
    console.log(values);
    return "";
  }
  var on_destroy;
  function create_ssr_component(fn) {
    function $$render(result, props, bindings, slots) {
      const parent_component = exports.current_component;
      const $$ = {
        on_destroy,
        context: new Map(parent_component ? parent_component.$$.context : []),
        on_mount: [],
        before_update: [],
        after_update: [],
        callbacks: blank_object()
      };
      set_current_component({$$});
      const html = fn(result, props, bindings, slots);
      set_current_component(parent_component);
      return html;
    }
    return {
      render: (props = {}, options = {}) => {
        on_destroy = [];
        const result = {title: "", head: "", css: new Set()};
        const html = $$render(result, props, {}, options);
        run_all(on_destroy);
        return {
          html,
          css: {
            code: Array.from(result.css).map((css) => css.code).join("\n"),
            map: null
          },
          head: result.title + result.head
        };
      },
      $$render
    };
  }
  function add_attribute(name, value, boolean) {
    if (value == null || boolean && !value)
      return "";
    return ` ${name}${value === true ? "" : `=${typeof value === "string" ? JSON.stringify(escape(value)) : `"${value}"`}`}`;
  }
  function add_classes(classes) {
    return classes ? ` class="${classes}"` : "";
  }
  function bind(component, name, callback) {
    const index = component.$$.props[name];
    if (index !== void 0) {
      component.$$.bound[index] = callback;
      callback(component.$$.ctx[index]);
    }
  }
  function create_component3(block) {
    block && block.c();
  }
  function claim_component(block, parent_nodes) {
    block && block.l(parent_nodes);
  }
  function mount_component3(component, target, anchor, customElement) {
    const {fragment, on_mount, on_destroy: on_destroy2, after_update} = component.$$;
    fragment && fragment.m(target, anchor);
    if (!customElement) {
      add_render_callback(() => {
        const new_on_destroy = on_mount.map(run).filter(is_function);
        if (on_destroy2) {
          on_destroy2.push(...new_on_destroy);
        } else {
          run_all(new_on_destroy);
        }
        component.$$.on_mount = [];
      });
    }
    after_update.forEach(add_render_callback);
  }
  function destroy_component3(component, detaching) {
    const $$ = component.$$;
    if ($$.fragment !== null) {
      run_all($$.on_destroy);
      $$.fragment && $$.fragment.d(detaching);
      $$.on_destroy = $$.fragment = null;
      $$.ctx = [];
    }
  }
  function make_dirty(component, i) {
    if (component.$$.dirty[0] === -1) {
      dirty_components.push(component);
      schedule_update();
      component.$$.dirty.fill(0);
    }
    component.$$.dirty[i / 31 | 0] |= 1 << i % 31;
  }
  function init7(component, options, instance4, create_fragment7, not_equal2, props, dirty = [-1]) {
    const parent_component = exports.current_component;
    set_current_component(component);
    const $$ = component.$$ = {
      fragment: null,
      ctx: null,
      props,
      update: noop4,
      not_equal: not_equal2,
      bound: blank_object(),
      on_mount: [],
      on_destroy: [],
      on_disconnect: [],
      before_update: [],
      after_update: [],
      context: new Map(parent_component ? parent_component.$$.context : []),
      callbacks: blank_object(),
      dirty,
      skip_bound: false
    };
    let ready = false;
    $$.ctx = instance4 ? instance4(component, options.props || {}, (i, ret, ...rest) => {
      const value = rest.length ? rest[0] : ret;
      if ($$.ctx && not_equal2($$.ctx[i], $$.ctx[i] = value)) {
        if (!$$.skip_bound && $$.bound[i])
          $$.bound[i](value);
        if (ready)
          make_dirty(component, i);
      }
      return ret;
    }) : [];
    $$.update();
    ready = true;
    run_all($$.before_update);
    $$.fragment = create_fragment7 ? create_fragment7($$.ctx) : false;
    if (options.target) {
      if (options.hydrate) {
        const nodes = children(options.target);
        $$.fragment && $$.fragment.l(nodes);
        nodes.forEach(detach7);
      } else {
        $$.fragment && $$.fragment.c();
      }
      if (options.intro)
        transition_in5(component.$$.fragment);
      mount_component3(component, options.target, options.anchor, options.customElement);
      flush();
    }
    set_current_component(parent_component);
  }
  if (typeof HTMLElement === "function") {
    exports.SvelteElement = class extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({mode: "open"});
      }
      connectedCallback() {
        const {on_mount} = this.$$;
        this.$$.on_disconnect = on_mount.map(run).filter(is_function);
        for (const key in this.$$.slotted) {
          this.appendChild(this.$$.slotted[key]);
        }
      }
      attributeChangedCallback(attr2, _oldValue, newValue) {
        this[attr2] = newValue;
      }
      disconnectedCallback() {
        run_all(this.$$.on_disconnect);
      }
      $destroy() {
        destroy_component3(this, 1);
        this.$destroy = noop4;
      }
      $on(type, callback) {
        const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
        callbacks.push(callback);
        return () => {
          const index = callbacks.indexOf(callback);
          if (index !== -1)
            callbacks.splice(index, 1);
        };
      }
      $set($$props) {
        if (this.$$set && !is_empty($$props)) {
          this.$$.skip_bound = true;
          this.$$set($$props);
          this.$$.skip_bound = false;
        }
      }
    };
  }
  var SvelteComponent7 = class {
    $destroy() {
      destroy_component3(this, 1);
      this.$destroy = noop4;
    }
    $on(type, callback) {
      const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
      callbacks.push(callback);
      return () => {
        const index = callbacks.indexOf(callback);
        if (index !== -1)
          callbacks.splice(index, 1);
      };
    }
    $set($$props) {
      if (this.$$set && !is_empty($$props)) {
        this.$$.skip_bound = true;
        this.$$set($$props);
        this.$$.skip_bound = false;
      }
    }
  };
  function dispatch_dev(type, detail) {
    document.dispatchEvent(custom_event(type, Object.assign({version: "3.34.0"}, detail)));
  }
  function append_dev(target, node) {
    dispatch_dev("SvelteDOMInsert", {target, node});
    append2(target, node);
  }
  function insert_dev(target, node, anchor) {
    dispatch_dev("SvelteDOMInsert", {target, node, anchor});
    insert7(target, node, anchor);
  }
  function detach_dev(node) {
    dispatch_dev("SvelteDOMRemove", {node});
    detach7(node);
  }
  function detach_between_dev(before, after) {
    while (before.nextSibling && before.nextSibling !== after) {
      detach_dev(before.nextSibling);
    }
  }
  function detach_before_dev(after) {
    while (after.previousSibling) {
      detach_dev(after.previousSibling);
    }
  }
  function detach_after_dev(before) {
    while (before.nextSibling) {
      detach_dev(before.nextSibling);
    }
  }
  function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
    const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
    if (has_prevent_default)
      modifiers.push("preventDefault");
    if (has_stop_propagation)
      modifiers.push("stopPropagation");
    dispatch_dev("SvelteDOMAddEventListener", {node, event, handler, modifiers});
    const dispose = listen2(node, event, handler, options);
    return () => {
      dispatch_dev("SvelteDOMRemoveEventListener", {node, event, handler, modifiers});
      dispose();
    };
  }
  function attr_dev(node, attribute, value) {
    attr(node, attribute, value);
    if (value == null)
      dispatch_dev("SvelteDOMRemoveAttribute", {node, attribute});
    else
      dispatch_dev("SvelteDOMSetAttribute", {node, attribute, value});
  }
  function prop_dev(node, property, value) {
    node[property] = value;
    dispatch_dev("SvelteDOMSetProperty", {node, property, value});
  }
  function dataset_dev(node, property, value) {
    node.dataset[property] = value;
    dispatch_dev("SvelteDOMSetDataset", {node, property, value});
  }
  function set_data_dev(text4, data) {
    data = "" + data;
    if (text4.wholeText === data)
      return;
    dispatch_dev("SvelteDOMSetData", {node: text4, data});
    text4.data = data;
  }
  function validate_each_argument(arg) {
    if (typeof arg !== "string" && !(arg && typeof arg === "object" && "length" in arg)) {
      let msg = "{#each} only iterates over array-like objects.";
      if (typeof Symbol === "function" && arg && Symbol.iterator in arg) {
        msg += " You can use a spread to convert this iterable into an array.";
      }
      throw new Error(msg);
    }
  }
  function validate_slots(name, slot, keys) {
    for (const slot_key of Object.keys(slot)) {
      if (!~keys.indexOf(slot_key)) {
        console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
      }
    }
  }
  var SvelteComponentDev = class extends SvelteComponent7 {
    constructor(options) {
      if (!options || !options.target && !options.$$inline) {
        throw new Error("'target' is a required option");
      }
      super();
    }
    $destroy() {
      super.$destroy();
      this.$destroy = () => {
        console.warn("Component was already destroyed");
      };
    }
    $capture_state() {
    }
    $inject_state() {
    }
  };
  var SvelteComponentTyped = class extends SvelteComponentDev {
    constructor(options) {
      super(options);
    }
  };
  function loop_guard(timeout) {
    const start = Date.now();
    return () => {
      if (Date.now() - start > timeout) {
        throw new Error("Infinite loop detected");
      }
    };
  }
  exports.HtmlTag = HtmlTag;
  exports.SvelteComponent = SvelteComponent7;
  exports.SvelteComponentDev = SvelteComponentDev;
  exports.SvelteComponentTyped = SvelteComponentTyped;
  exports.action_destroyer = action_destroyer;
  exports.add_attribute = add_attribute;
  exports.add_classes = add_classes;
  exports.add_flush_callback = add_flush_callback;
  exports.add_location = add_location;
  exports.add_render_callback = add_render_callback;
  exports.add_resize_listener = add_resize_listener;
  exports.add_transform = add_transform;
  exports.afterUpdate = afterUpdate;
  exports.append = append2;
  exports.append_dev = append_dev;
  exports.assign = assign3;
  exports.attr = attr;
  exports.attr_dev = attr_dev;
  exports.attribute_to_object = attribute_to_object;
  exports.beforeUpdate = beforeUpdate;
  exports.bind = bind;
  exports.binding_callbacks = binding_callbacks2;
  exports.blank_object = blank_object;
  exports.bubble = bubble;
  exports.check_outros = check_outros4;
  exports.children = children;
  exports.claim_component = claim_component;
  exports.claim_element = claim_element;
  exports.claim_space = claim_space;
  exports.claim_text = claim_text;
  exports.clear_loops = clear_loops;
  exports.component_subscribe = component_subscribe4;
  exports.compute_rest_props = compute_rest_props;
  exports.compute_slots = compute_slots;
  exports.createEventDispatcher = createEventDispatcher2;
  exports.create_animation = create_animation;
  exports.create_bidirectional_transition = create_bidirectional_transition;
  exports.create_component = create_component3;
  exports.create_in_transition = create_in_transition;
  exports.create_out_transition = create_out_transition;
  exports.create_slot = create_slot4;
  exports.create_ssr_component = create_ssr_component;
  exports.custom_event = custom_event;
  exports.dataset_dev = dataset_dev;
  exports.debug = debug;
  exports.destroy_block = destroy_block;
  exports.destroy_component = destroy_component3;
  exports.destroy_each = destroy_each;
  exports.detach = detach7;
  exports.detach_after_dev = detach_after_dev;
  exports.detach_before_dev = detach_before_dev;
  exports.detach_between_dev = detach_between_dev;
  exports.detach_dev = detach_dev;
  exports.dirty_components = dirty_components;
  exports.dispatch_dev = dispatch_dev;
  exports.each = each;
  exports.element = element5;
  exports.element_is = element_is;
  exports.empty = empty4;
  exports.escape = escape;
  exports.escaped = escaped;
  exports.exclude_internal_props = exclude_internal_props3;
  exports.fix_and_destroy_block = fix_and_destroy_block;
  exports.fix_and_outro_and_destroy_block = fix_and_outro_and_destroy_block;
  exports.fix_position = fix_position;
  exports.flush = flush;
  exports.getContext = getContext3;
  exports.get_binding_group_value = get_binding_group_value;
  exports.get_current_component = get_current_component;
  exports.get_custom_elements_slots = get_custom_elements_slots;
  exports.get_slot_changes = get_slot_changes;
  exports.get_slot_context = get_slot_context;
  exports.get_spread_object = get_spread_object2;
  exports.get_spread_update = get_spread_update3;
  exports.get_store_value = get_store_value;
  exports.globals = globals;
  exports.group_outros = group_outros4;
  exports.handle_promise = handle_promise;
  exports.hasContext = hasContext;
  exports.has_prop = has_prop;
  exports.identity = identity;
  exports.init = init7;
  exports.insert = insert7;
  exports.insert_dev = insert_dev;
  exports.intros = intros;
  exports.invalid_attribute_name_character = invalid_attribute_name_character;
  exports.is_client = is_client;
  exports.is_crossorigin = is_crossorigin;
  exports.is_empty = is_empty;
  exports.is_function = is_function;
  exports.is_promise = is_promise;
  exports.listen = listen2;
  exports.listen_dev = listen_dev;
  exports.loop = loop;
  exports.loop_guard = loop_guard;
  exports.missing_component = missing_component;
  exports.mount_component = mount_component3;
  exports.noop = noop4;
  exports.not_equal = not_equal;
  exports.null_to_empty = null_to_empty;
  exports.object_without_properties = object_without_properties;
  exports.onDestroy = onDestroy3;
  exports.onMount = onMount2;
  exports.once = once;
  exports.outro_and_destroy_block = outro_and_destroy_block;
  exports.prevent_default = prevent_default;
  exports.prop_dev = prop_dev;
  exports.query_selector_all = query_selector_all;
  exports.run = run;
  exports.run_all = run_all;
  exports.safe_not_equal = safe_not_equal7;
  exports.schedule_update = schedule_update;
  exports.select_multiple_value = select_multiple_value;
  exports.select_option = select_option;
  exports.select_options = select_options;
  exports.select_value = select_value;
  exports.self = self;
  exports.setContext = setContext3;
  exports.set_attributes = set_attributes2;
  exports.set_current_component = set_current_component;
  exports.set_custom_element_data = set_custom_element_data;
  exports.set_data = set_data2;
  exports.set_data_dev = set_data_dev;
  exports.set_input_type = set_input_type;
  exports.set_input_value = set_input_value;
  exports.set_now = set_now;
  exports.set_raf = set_raf;
  exports.set_store_value = set_store_value;
  exports.set_style = set_style;
  exports.set_svg_attributes = set_svg_attributes;
  exports.space = space2;
  exports.spread = spread;
  exports.stop_propagation = stop_propagation;
  exports.subscribe = subscribe;
  exports.svg_element = svg_element;
  exports.text = text3;
  exports.tick = tick;
  exports.time_ranges_to_array = time_ranges_to_array;
  exports.to_number = to_number;
  exports.toggle_class = toggle_class;
  exports.transition_in = transition_in5;
  exports.transition_out = transition_out5;
  exports.update_keyed_each = update_keyed_each;
  exports.update_slot = update_slot4;
  exports.update_slot_spread = update_slot_spread;
  exports.validate_component = validate_component;
  exports.validate_each_argument = validate_each_argument;
  exports.validate_each_keys = validate_each_keys;
  exports.validate_slots = validate_slots;
  exports.validate_store = validate_store;
  exports.xlink_attr = xlink_attr;
});

// node_modules/svelte/store/index.js
var require_store = __commonJS((exports) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {value: true});
  var internal = require_internal();
  var subscriber_queue = [];
  function readable(value, start) {
    return {
      subscribe: writable5(value, start).subscribe
    };
  }
  function writable5(value, start = internal.noop) {
    let stop;
    const subscribers = [];
    function set(new_value) {
      if (internal.safe_not_equal(value, new_value)) {
        value = new_value;
        if (stop) {
          const run_queue = !subscriber_queue.length;
          for (let i = 0; i < subscribers.length; i += 1) {
            const s = subscribers[i];
            s[1]();
            subscriber_queue.push(s, value);
          }
          if (run_queue) {
            for (let i = 0; i < subscriber_queue.length; i += 2) {
              subscriber_queue[i][0](subscriber_queue[i + 1]);
            }
            subscriber_queue.length = 0;
          }
        }
      }
    }
    function update(fn) {
      set(fn(value));
    }
    function subscribe(run, invalidate = internal.noop) {
      const subscriber = [run, invalidate];
      subscribers.push(subscriber);
      if (subscribers.length === 1) {
        stop = start(set) || internal.noop;
      }
      run(value);
      return () => {
        const index = subscribers.indexOf(subscriber);
        if (index !== -1) {
          subscribers.splice(index, 1);
        }
        if (subscribers.length === 0) {
          stop();
          stop = null;
        }
      };
    }
    return {set, update, subscribe};
  }
  function derived(stores, fn, initial_value) {
    const single = !Array.isArray(stores);
    const stores_array = single ? [stores] : stores;
    const auto = fn.length < 2;
    return readable(initial_value, (set) => {
      let inited = false;
      const values = [];
      let pending = 0;
      let cleanup = internal.noop;
      const sync = () => {
        if (pending) {
          return;
        }
        cleanup();
        const result = fn(single ? values[0] : values, set);
        if (auto) {
          set(result);
        } else {
          cleanup = internal.is_function(result) ? result : internal.noop;
        }
      };
      const unsubscribers = stores_array.map((store, i) => internal.subscribe(store, (value) => {
        values[i] = value;
        pending &= ~(1 << i);
        if (inited) {
          sync();
        }
      }, () => {
        pending |= 1 << i;
      }));
      inited = true;
      sync();
      return function stop() {
        internal.run_all(unsubscribers);
        cleanup();
      };
    });
  }
  Object.defineProperty(exports, "get", {
    enumerable: true,
    get: function() {
      return internal.get_store_value;
    }
  });
  exports.derived = derived;
  exports.readable = readable;
  exports.writable = writable5;
});

// node_modules/svelte/index.js
var require_svelte = __commonJS((exports) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {value: true});
  var internal = require_internal();
  Object.defineProperty(exports, "SvelteComponent", {
    enumerable: true,
    get: function() {
      return internal.SvelteComponentDev;
    }
  });
  Object.defineProperty(exports, "SvelteComponentTyped", {
    enumerable: true,
    get: function() {
      return internal.SvelteComponentTyped;
    }
  });
  Object.defineProperty(exports, "afterUpdate", {
    enumerable: true,
    get: function() {
      return internal.afterUpdate;
    }
  });
  Object.defineProperty(exports, "beforeUpdate", {
    enumerable: true,
    get: function() {
      return internal.beforeUpdate;
    }
  });
  Object.defineProperty(exports, "createEventDispatcher", {
    enumerable: true,
    get: function() {
      return internal.createEventDispatcher;
    }
  });
  Object.defineProperty(exports, "getContext", {
    enumerable: true,
    get: function() {
      return internal.getContext;
    }
  });
  Object.defineProperty(exports, "hasContext", {
    enumerable: true,
    get: function() {
      return internal.hasContext;
    }
  });
  Object.defineProperty(exports, "onDestroy", {
    enumerable: true,
    get: function() {
      return internal.onDestroy;
    }
  });
  Object.defineProperty(exports, "onMount", {
    enumerable: true,
    get: function() {
      return internal.onMount;
    }
  });
  Object.defineProperty(exports, "setContext", {
    enumerable: true,
    get: function() {
      return internal.setContext;
    }
  });
  Object.defineProperty(exports, "tick", {
    enumerable: true,
    get: function() {
      return internal.tick;
    }
  });
});

// src/app/components/App.svelte
var import_internal6 = __toModule(require_internal());

// node_modules/yrv/build/lib/Router.svelte
var import_internal = __toModule(require_internal());

// node_modules/yrv/build/lib/router.js
var import_store2 = __toModule(require_store());

// node_modules/yrv/build/lib/vendor.js
var strictUriEncode = (str) => encodeURIComponent(str).replace(/[!'()*]/g, (x) => `%${x.charCodeAt(0).toString(16).toUpperCase()}`);
var token = "%[a-f0-9]{2}";
var singleMatcher = new RegExp(token, "gi");
var multiMatcher = new RegExp("(" + token + ")+", "gi");
function decodeComponents(components, split) {
  try {
    return decodeURIComponent(components.join(""));
  } catch (err) {
  }
  if (components.length === 1) {
    return components;
  }
  split = split || 1;
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
      input = decodeComponents(tokens, i).join("");
      tokens = input.match(singleMatcher);
    }
    return input;
  }
}
function customDecodeURIComponent(input) {
  var replaceMap = {
    "%FE%FF": "\uFFFD\uFFFD",
    "%FF%FE": "\uFFFD\uFFFD"
  };
  var match = multiMatcher.exec(input);
  while (match) {
    try {
      replaceMap[match[0]] = decodeURIComponent(match[0]);
    } catch (err) {
      var result = decode(match[0]);
      if (result !== match[0]) {
        replaceMap[match[0]] = result;
      }
    }
    match = multiMatcher.exec(input);
  }
  replaceMap["%C2"] = "\uFFFD";
  var entries = Object.keys(replaceMap);
  for (var i = 0; i < entries.length; i++) {
    var key = entries[i];
    input = input.replace(new RegExp(key, "g"), replaceMap[key]);
  }
  return input;
}
var decodeUriComponent = function(encodedURI) {
  if (typeof encodedURI !== "string") {
    throw new TypeError("Expected `encodedURI` to be of type `string`, got `" + typeof encodedURI + "`");
  }
  try {
    encodedURI = encodedURI.replace(/\+/g, " ");
    return decodeURIComponent(encodedURI);
  } catch (err) {
    return customDecodeURIComponent(encodedURI);
  }
};
var splitOnFirst = (string, separator) => {
  if (!(typeof string === "string" && typeof separator === "string")) {
    throw new TypeError("Expected the arguments to be of type `string`");
  }
  if (separator === "") {
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
    case "index":
      return (key) => (result, value) => {
        const index = result.length;
        if (value === void 0) {
          return result;
        }
        if (value === null) {
          return [...result, [encode(key, options), "[", index, "]"].join("")];
        }
        return [
          ...result,
          [encode(key, options), "[", encode(index, options), "]=", encode(value, options)].join("")
        ];
      };
    case "bracket":
      return (key) => (result, value) => {
        if (value === void 0) {
          return result;
        }
        if (value === null) {
          return [...result, [encode(key, options), "[]"].join("")];
        }
        return [...result, [encode(key, options), "[]=", encode(value, options)].join("")];
      };
    case "comma":
      return (key) => (result, value, index) => {
        if (value === null || value === void 0 || value.length === 0) {
          return result;
        }
        if (index === 0) {
          return [[encode(key, options), "=", encode(value, options)].join("")];
        }
        return [[result, encode(value, options)].join(",")];
      };
    default:
      return (key) => (result, value) => {
        if (value === void 0) {
          return result;
        }
        if (value === null) {
          return [...result, encode(key, options)];
        }
        return [...result, [encode(key, options), "=", encode(value, options)].join("")];
      };
  }
}
function parserForArrayFormat(options) {
  let result;
  switch (options.arrayFormat) {
    case "index":
      return (key, value, accumulator) => {
        result = /\[(\d*)\]$/.exec(key);
        key = key.replace(/\[\d*\]$/, "");
        if (!result) {
          accumulator[key] = value;
          return;
        }
        if (accumulator[key] === void 0) {
          accumulator[key] = {};
        }
        accumulator[key][result[1]] = value;
      };
    case "bracket":
      return (key, value, accumulator) => {
        result = /(\[\])$/.exec(key);
        key = key.replace(/\[\]$/, "");
        if (!result) {
          accumulator[key] = value;
          return;
        }
        if (accumulator[key] === void 0) {
          accumulator[key] = [value];
          return;
        }
        accumulator[key] = [].concat(accumulator[key], value);
      };
    case "comma":
      return (key, value, accumulator) => {
        const isArray = typeof value === "string" && value.split("").indexOf(",") > -1;
        const newValue = isArray ? value.split(",") : value;
        accumulator[key] = newValue;
      };
    default:
      return (key, value, accumulator) => {
        if (accumulator[key] === void 0) {
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
  if (typeof input === "object") {
    return keysSorter(Object.keys(input)).sort((a, b) => Number(a) - Number(b)).map((key) => input[key]);
  }
  return input;
}
function parseValue(value, options) {
  if (options.parseNumbers && !Number.isNaN(Number(value)) && (typeof value === "string" && value.trim() !== "")) {
    value = Number(value);
  } else if (options.parseBooleans && value !== null && (value.toLowerCase() === "true" || value.toLowerCase() === "false")) {
    value = value.toLowerCase() === "true";
  }
  return value;
}
function parse(input, options) {
  options = Object.assign({
    decode: true,
    sort: true,
    arrayFormat: "none",
    parseNumbers: false,
    parseBooleans: false
  }, options);
  const formatter = parserForArrayFormat(options);
  const ret = Object.create(null);
  if (typeof input !== "string") {
    return ret;
  }
  input = input.trim().replace(/^[?#&]/, "");
  if (!input) {
    return ret;
  }
  for (const param of input.split("&")) {
    let [key, value] = splitOnFirst(param.replace(/\+/g, " "), "=");
    value = value === void 0 ? null : decode$1(value, options);
    formatter(decode$1(key, options), value, ret);
  }
  for (const key of Object.keys(ret)) {
    const value = ret[key];
    if (typeof value === "object" && value !== null) {
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
    if (Boolean(value) && typeof value === "object" && !Array.isArray(value)) {
      result[key] = keysSorter(value);
    } else {
      result[key] = value;
    }
    return result;
  }, Object.create(null));
}
var parse_1 = parse;
var stringify = (object, options) => {
  if (!object) {
    return "";
  }
  options = Object.assign({
    encode: true,
    strict: true,
    arrayFormat: "none"
  }, options);
  const formatter = encoderForArrayFormat(options);
  const keys = Object.keys(object);
  if (options.sort !== false) {
    keys.sort(options.sort);
  }
  return keys.map((key) => {
    const value = object[key];
    if (value === void 0) {
      return "";
    }
    if (value === null) {
      return encode(key, options);
    }
    if (Array.isArray(value)) {
      return value.reduce(formatter(key), []).join("&");
    }
    return encode(key, options) + "=" + encode(value, options);
  }).filter((x) => x.length > 0).join("&");
};
var defaultExport = /* @__PURE__ */ function(Error2) {
  function defaultExport2(route, path) {
    var message = "Unreachable '" + (route !== "/" ? route.replace(/\/$/, "") : route) + "', segment '" + path + "' is not defined";
    Error2.call(this, message);
    this.message = message;
    this.route = route;
    this.path = path;
  }
  if (Error2)
    defaultExport2.__proto__ = Error2;
  defaultExport2.prototype = Object.create(Error2 && Error2.prototype);
  defaultExport2.prototype.constructor = defaultExport2;
  return defaultExport2;
}(Error);
function buildMatcher(path, parent) {
  var regex;
  var _isSplat;
  var _priority = -100;
  var keys = [];
  regex = path.replace(/[-$.]/g, "\\$&").replace(/\(/g, "(?:").replace(/\)/g, ")?").replace(/([:*]\w+)(?:<([^<>]+?)>)?/g, function(_, key, expr) {
    keys.push(key.substr(1));
    if (key.charAt() === ":") {
      _priority += 100;
      return "((?!#)" + (expr || "[^#/]+?") + ")";
    }
    _isSplat = true;
    _priority += 500;
    return "((?!#)" + (expr || "[^#]+?") + ")";
  });
  try {
    regex = new RegExp("^" + regex + "$");
  } catch (e) {
    throw new TypeError("Invalid route expression, given '" + parent + "'");
  }
  var _hashed = path.includes("#") ? 0.5 : 1;
  var _depth = path.length * _priority * _hashed;
  return {
    keys,
    regex,
    _depth,
    _isSplat
  };
}
var PathMatcher = function PathMatcher2(path, parent) {
  var ref = buildMatcher(path, parent);
  var keys = ref.keys;
  var regex = ref.regex;
  var _depth = ref._depth;
  var _isSplat = ref._isSplat;
  return {
    _isSplat,
    _depth,
    match: function(value) {
      var matches2 = value.match(regex);
      if (matches2) {
        return keys.reduce(function(prev, cur, i) {
          prev[cur] = typeof matches2[i + 1] === "string" ? decodeURIComponent(matches2[i + 1]) : null;
          return prev;
        }, {});
      }
    }
  };
};
PathMatcher.push = function push(key, prev, leaf, parent) {
  var root = prev[key] || (prev[key] = {});
  if (!root.pattern) {
    root.pattern = new PathMatcher(key, parent);
    root.route = (leaf || "").replace(/\/$/, "") || "/";
  }
  prev.keys = prev.keys || [];
  if (!prev.keys.includes(key)) {
    prev.keys.push(key);
    PathMatcher.sort(prev);
  }
  return root;
};
PathMatcher.sort = function sort(root) {
  root.keys.sort(function(a, b) {
    return root[a].pattern._depth - root[b].pattern._depth;
  });
};
function merge(path, parent) {
  return "" + (parent && parent !== "/" ? parent : "") + (path || "");
}
function walk(path, cb) {
  var matches2 = path.match(/<[^<>]*\/[^<>]*>/);
  if (matches2) {
    throw new TypeError("RegExp cannot contain slashes, given '" + matches2 + "'");
  }
  var parts = path.split(/(?=\/|#)/);
  var root = [];
  if (parts[0] !== "/") {
    parts.unshift("/");
  }
  parts.some(function(x, i) {
    var parent = root.slice(1).concat(x).join("") || null;
    var segment = parts.slice(i + 1).join("") || null;
    var retval = cb(x, parent, segment ? "" + (x !== "/" ? x : "") + segment : null);
    root.push(x);
    return retval;
  });
}
function reduce(key, root, _seen) {
  var params = {};
  var out = [];
  var splat;
  walk(key, function(x, leaf, extra) {
    var found;
    if (!root.keys) {
      throw new defaultExport(key, x);
    }
    root.keys.some(function(k) {
      if (_seen.includes(k)) {
        return false;
      }
      var ref = root[k].pattern;
      var match = ref.match;
      var _isSplat = ref._isSplat;
      var matches2 = match(_isSplat ? extra || x : x);
      if (matches2) {
        Object.assign(params, matches2);
        if (root[k].route) {
          var routeInfo2 = Object.assign({}, root[k].info);
          var hasMatch = false;
          if (routeInfo2.exact) {
            hasMatch = extra === null;
          } else {
            hasMatch = !(x && leaf === null) || x === leaf || _isSplat || !extra;
          }
          routeInfo2.matches = hasMatch;
          routeInfo2.params = Object.assign({}, params);
          routeInfo2.route = root[k].route;
          routeInfo2.path = _isSplat && extra || leaf || x;
          out.push(routeInfo2);
        }
        if (extra === null && !root[k].keys) {
          return true;
        }
        if (k !== "/") {
          _seen.push(k);
        }
        splat = _isSplat;
        root = root[k];
        found = true;
        return true;
      }
      return false;
    });
    if (!(found || root.keys.some(function(k) {
      return root[k].pattern.match(x);
    }))) {
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
function add(path, routes, parent, routeInfo2) {
  var fullpath = merge(path, parent);
  var root = routes;
  var key;
  if (routeInfo2 && routeInfo2.nested !== true) {
    key = routeInfo2.key;
    delete routeInfo2.key;
  }
  walk(fullpath, function(x, leaf) {
    root = PathMatcher.push(x, root, leaf, fullpath);
    if (x !== "/") {
      root.info = root.info || Object.assign({}, routeInfo2);
    }
  });
  root.info = root.info || Object.assign({}, routeInfo2);
  if (key) {
    root.info.key = key;
  }
  return fullpath;
}
function rm(path, routes, parent) {
  var fullpath = merge(path, parent);
  var root = routes;
  var leaf = null;
  var key = null;
  walk(fullpath, function(x) {
    if (!root) {
      leaf = null;
      return true;
    }
    if (!root.keys) {
      throw new defaultExport(path, x);
    }
    key = x;
    leaf = root;
    root = root[key];
  });
  if (!(leaf && key)) {
    throw new defaultExport(path, key);
  }
  if (leaf === routes) {
    leaf = routes["/"];
  }
  if (leaf.route !== key) {
    var offset = leaf.keys.indexOf(key);
    if (offset === -1) {
      throw new defaultExport(path, key);
    }
    leaf.keys.splice(offset, 1);
    PathMatcher.sort(leaf);
    delete leaf[key];
  }
  if (root.route === leaf.route && (!root.info || root.info.key === leaf.info.key)) {
    delete leaf.info;
  }
}
var Router = function Router2() {
  var routes = {};
  var stack = [];
  return {
    resolve: function(path, cb) {
      var url = path.split("?")[0];
      var seen = [];
      walk(url, function(x, leaf, extra) {
        try {
          cb(null, find(leaf, routes, 1).filter(function(r) {
            if (!seen.includes(r.path)) {
              seen.push(r.path);
              return true;
            }
            return false;
          }));
        } catch (e) {
          cb(e, []);
        }
      });
    },
    mount: function(path, cb) {
      if (path !== "/") {
        stack.push(path);
      }
      cb();
      stack.pop();
    },
    find: function(path, retries) {
      return find(path, routes, retries === true ? 2 : retries || 1);
    },
    add: function(path, routeInfo2) {
      return add(path, routes, stack.join(""), routeInfo2);
    },
    rm: function(path) {
      return rm(path, routes, stack.join(""));
    }
  };
};
Router.matches = function matches(uri, path) {
  return buildMatcher(uri, path).regex.test(path);
};

// node_modules/yrv/build/lib/utils.js
var import_store = __toModule(require_store());
function objectWithoutProperties(obj, exclude) {
  var target = {};
  for (var k in obj)
    if (Object.prototype.hasOwnProperty.call(obj, k) && exclude.indexOf(k) === -1)
      target[k] = obj[k];
  return target;
}
var cache = {};
var baseTag = document.getElementsByTagName("base");
var basePrefix = baseTag[0] && baseTag[0].href || "/";
var ROOT_URL = basePrefix.replace(window.location.origin, "");
var router = import_store.writable({
  path: "/",
  query: {},
  params: {},
  initial: true
});
var CTX_ROUTER = {};
var CTX_ROUTE = {};
var HASHCHANGE = window.location.origin === "null";
function hashchangeEnable(value) {
  if (typeof value === "boolean") {
    HASHCHANGE = !!value;
  }
  return HASHCHANGE;
}
function fixedLocation(path, callback, doFinally) {
  var baseUri = HASHCHANGE ? window.location.hash.replace("#", "") : window.location.pathname;
  if (path.charAt() !== "/") {
    path = baseUri + path;
  }
  var currentURL2 = baseUri + window.location.hash + window.location.search;
  if (currentURL2 !== path) {
    callback(path);
  }
  if (typeof doFinally === "function") {
    doFinally();
  }
}
function cleanPath(uri, fix) {
  return uri !== "/" || fix ? uri.replace(/\/$/, "") : uri;
}
function navigateTo(path, options) {
  var ref = options || {};
  var reload = ref.reload;
  var replace = ref.replace;
  var params = ref.params;
  var queryParams = ref.queryParams;
  if (!path || typeof path !== "string" || path[0] !== "/" && path[0] !== "#") {
    throw new Error("Expecting '/" + path + "' or '#" + path + "', given '" + path + "'");
  }
  if (params) {
    path = path.replace(/:([a-zA-Z][a-zA-Z0-9_-]*)/g, function(_, key) {
      return params[key];
    });
  }
  if (queryParams) {
    var qs = stringify(queryParams);
    if (qs) {
      path += "?" + qs;
    }
  }
  if (HASHCHANGE) {
    var fixedURL = path.replace(/^#|#$/g, "");
    if (ROOT_URL !== "/") {
      fixedURL = fixedURL.replace(cleanPath(ROOT_URL), "");
    }
    window.location.hash = fixedURL !== "/" ? fixedURL : "";
    return;
  }
  if (reload || !window.history.pushState || !window.dispatchEvent) {
    window.location.href = path;
    return;
  }
  fixedLocation(path, function(nextURL) {
    window.history[replace ? "replaceState" : "pushState"](null, "", nextURL);
    window.dispatchEvent(new Event("popstate"));
  });
}
function getProps(given, required) {
  var sub = given.props;
  var rest = objectWithoutProperties(given, ["props"]);
  var others = rest;
  required.forEach(function(k) {
    delete others[k];
  });
  return Object.assign({}, sub, others);
}
function isActive(uri, path, exact) {
  if (!cache[[uri, path, exact]]) {
    if (exact !== true && path.indexOf(uri) === 0) {
      cache[[uri, path, exact]] = /^[#/?]?$/.test(path.substr(uri.length, 1));
    } else if (uri.includes("*") || uri.includes(":")) {
      cache[[uri, path, exact]] = Router.matches(uri, path);
    } else {
      cache[[uri, path, exact]] = cleanPath(path) === uri;
    }
  }
  return cache[[uri, path, exact]];
}
function isPromise(object) {
  return object && typeof object.then === "function";
}
function isSvelteComponent(object) {
  return object && object.prototype;
}

// node_modules/yrv/build/lib/router.js
var baseRouter = new Router();
var routeInfo = import_store2.writable({});
var onError = {};
var shared = {};
var errors = [];
var routers = 0;
var interval;
var currentURL;
router.subscribe(function(value) {
  shared.router = value;
});
routeInfo.subscribe(function(value) {
  shared.routeInfo = value;
});
function doFallback(failure, fallback) {
  routeInfo.update(function(defaults) {
    var obj;
    return Object.assign({}, defaults, (obj = {}, obj[fallback] = Object.assign({}, shared.router, {failure}), obj));
  });
}
function handleRoutes(map, params) {
  var keys = [];
  map.some(function(x) {
    if (x.key && x.matches && !shared.routeInfo[x.key]) {
      if (x.redirect && (x.condition === null || x.condition(shared.router) !== true)) {
        if (x.exact && shared.router.path !== x.path) {
          return false;
        }
        navigateTo(x.redirect);
        return true;
      }
      if (x.exact) {
        keys.push(x.key);
      }
      Object.assign(params, x.params);
      routeInfo.update(function(defaults) {
        var obj;
        return Object.assign({}, defaults, (obj = {}, obj[x.key] = Object.assign({}, shared.router, x), obj));
      });
    }
    return false;
  });
  return keys;
}
function evtHandler() {
  var baseUri = !HASHCHANGE ? window.location.href.replace(window.location.origin, "") : window.location.hash || "/";
  var failure;
  if (ROOT_URL !== "/") {
    baseUri = baseUri.replace(cleanPath(ROOT_URL), "");
  }
  if (/^#[\w-]+$/.test(window.location.hash) && document.querySelector(window.location.hash) && currentURL === baseUri.split("#")[0]) {
    return;
  }
  var ref = baseUri.replace("/#", "#").replace(/^#\//, "/").split("?");
  var fixedUri = ref[0];
  var qs = ref[1];
  var fullpath = fixedUri.replace(/\/?$/, "/");
  var query = parse_1(qs);
  var params = {};
  var keys = [];
  routeInfo.set({});
  if (currentURL !== baseUri) {
    currentURL = baseUri;
    router.set({
      path: cleanPath(fullpath),
      query,
      params
    });
  }
  baseRouter.resolve(fullpath, function(err, result) {
    if (err) {
      failure = err;
      return;
    }
    keys.push.apply(keys, handleRoutes(result, params));
  });
  var toDelete = {};
  if (failure && failure.path !== "/") {
    keys.reduce(function(prev, cur) {
      prev[cur] = null;
      return prev;
    }, toDelete);
  } else {
    failure = null;
  }
  errors.forEach(function(cb) {
    return cb();
  });
  errors = [];
  try {
    baseRouter.find(cleanPath(fullpath)).forEach(function(sub) {
      if (sub.exact && !sub.matches) {
        toDelete[sub.key] = null;
      }
    });
  } catch (e) {
  }
  routeInfo.update(function(defaults) {
    return Object.assign({}, defaults, toDelete);
  });
  var fallback;
  Object.keys(onError).forEach(function(root) {
    if (isActive(root, fullpath, false)) {
      var fn = onError[root].callback;
      fn(failure);
      errors.push(fn);
    }
    if (!fallback && onError[root].fallback) {
      fallback = onError[root].fallback;
    }
  });
  if (failure && fallback) {
    doFallback(failure, fallback);
  }
}
function findRoutes() {
  clearTimeout(interval);
  interval = setTimeout(evtHandler);
}
function addRouter(root, fallback, callback) {
  if (!routers) {
    window.addEventListener("popstate", findRoutes, false);
  }
  if (!onError[root] || fallback) {
    onError[root] = {fallback, callback};
  }
  routers += 1;
  return function() {
    routers -= 1;
    if (!routers) {
      window.removeEventListener("popstate", findRoutes, false);
    }
  };
}

// node_modules/yrv/build/lib/Router.svelte
var import_store3 = __toModule(require_store());
var import_svelte = __toModule(require_svelte());
function create_if_block(ctx) {
  let current;
  const default_slot_template = ctx[6].default;
  const default_slot = import_internal.create_slot(default_slot_template, ctx, ctx[5], null);
  return {
    c() {
      if (default_slot)
        default_slot.c();
    },
    m(target, anchor) {
      if (default_slot) {
        default_slot.m(target, anchor);
      }
      current = true;
    },
    p(ctx2, dirty) {
      if (default_slot) {
        if (default_slot.p && dirty & 32) {
          import_internal.update_slot(default_slot, default_slot_template, ctx2, ctx2[5], dirty, null, null);
        }
      }
    },
    i(local) {
      if (current)
        return;
      import_internal.transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      import_internal.transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (default_slot)
        default_slot.d(detaching);
    }
  };
}
function create_fragment(ctx) {
  let if_block_anchor;
  let current;
  let if_block = !ctx[0] && create_if_block(ctx);
  return {
    c() {
      if (if_block)
        if_block.c();
      if_block_anchor = import_internal.empty();
    },
    m(target, anchor) {
      if (if_block)
        if_block.m(target, anchor);
      import_internal.insert(target, if_block_anchor, anchor);
      current = true;
    },
    p(ctx2, [dirty]) {
      if (!ctx2[0]) {
        if (if_block) {
          if_block.p(ctx2, dirty);
          if (dirty & 1) {
            import_internal.transition_in(if_block, 1);
          }
        } else {
          if_block = create_if_block(ctx2);
          if_block.c();
          import_internal.transition_in(if_block, 1);
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        }
      } else if (if_block) {
        import_internal.group_outros();
        import_internal.transition_out(if_block, 1, 1, () => {
          if_block = null;
        });
        import_internal.check_outros();
      }
    },
    i(local) {
      if (current)
        return;
      import_internal.transition_in(if_block);
      current = true;
    },
    o(local) {
      import_internal.transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if (if_block)
        if_block.d(detaching);
      if (detaching)
        import_internal.detach(if_block_anchor);
    }
  };
}
function unassignRoute(route) {
  try {
    baseRouter.rm(route);
  } catch (e) {
  }
  findRoutes();
}
function instance($$self, $$props, $$invalidate) {
  let $basePath;
  let $router;
  import_internal.component_subscribe($$self, router, ($$value) => $$invalidate(4, $router = $$value));
  let {$$slots: slots = {}, $$scope} = $$props;
  let cleanup;
  let failure;
  let fallback;
  let {path = "/"} = $$props;
  let {disabled = false} = $$props;
  let {condition = null} = $$props;
  const routerContext = import_svelte.getContext(CTX_ROUTER);
  const basePath = routerContext ? routerContext.basePath : import_store3.writable(path);
  import_internal.component_subscribe($$self, basePath, (value) => $$invalidate(10, $basePath = value));
  const fixedRoot = $basePath !== path && $basePath !== "/" ? `${$basePath}${path !== "/" ? path : ""}` : path;
  function assignRoute(key, route, detail) {
    key = key || Math.random().toString(36).substr(2);
    const nested = !route.substr(1).includes("/");
    const handler = {key, nested, ...detail};
    let fullpath;
    baseRouter.mount(fixedRoot, () => {
      fullpath = baseRouter.add(route, handler);
      fallback = handler.fallback && key || fallback;
    });
    findRoutes();
    return [key, fullpath];
  }
  function onError2(err) {
    failure = err;
    if (failure && fallback) {
      doFallback(failure, fallback);
    }
  }
  import_svelte.onMount(() => {
    cleanup = addRouter(fixedRoot, fallback, onError2);
  });
  import_svelte.onDestroy(() => {
    if (cleanup)
      cleanup();
  });
  import_svelte.setContext(CTX_ROUTER, {basePath, assignRoute, unassignRoute});
  $$self.$$set = ($$props2) => {
    if ("path" in $$props2)
      $$invalidate(2, path = $$props2.path);
    if ("disabled" in $$props2)
      $$invalidate(0, disabled = $$props2.disabled);
    if ("condition" in $$props2)
      $$invalidate(3, condition = $$props2.condition);
    if ("$$scope" in $$props2)
      $$invalidate(5, $$scope = $$props2.$$scope);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty & 24) {
      $:
        if (condition) {
          $$invalidate(0, disabled = !condition($router));
        }
    }
  };
  return [disabled, basePath, path, condition, $router, $$scope, slots];
}
var Router3 = class extends import_internal.SvelteComponent {
  constructor(options) {
    super();
    import_internal.init(this, options, instance, create_fragment, import_internal.safe_not_equal, {path: 2, disabled: 0, condition: 3});
  }
};
var Router_default = Router3;

// node_modules/yrv/build/lib/Route.svelte
var import_internal2 = __toModule(require_internal());
var import_store4 = __toModule(require_store());
var import_svelte2 = __toModule(require_svelte());
var get_default_slot_changes = (dirty) => ({
  router: dirty & 4,
  props: dirty & 8
});
var get_default_slot_context = (ctx) => ({
  router: ctx[2],
  props: ctx[3]
});
function create_if_block2(ctx) {
  let current_block_type_index;
  let if_block;
  let if_block_anchor;
  let current;
  const if_block_creators = [create_if_block_1, create_if_block_4, create_else_block_1];
  const if_blocks = [];
  function select_block_type(ctx2, dirty) {
    if (!ctx2[4])
      return 0;
    if (ctx2[0])
      return 1;
    return 2;
  }
  current_block_type_index = select_block_type(ctx, -1);
  if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  return {
    c() {
      if_block.c();
      if_block_anchor = import_internal2.empty();
    },
    m(target, anchor) {
      if_blocks[current_block_type_index].m(target, anchor);
      import_internal2.insert(target, if_block_anchor, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type(ctx2, dirty);
      if (current_block_type_index === previous_block_index) {
        if_blocks[current_block_type_index].p(ctx2, dirty);
      } else {
        import_internal2.group_outros();
        import_internal2.transition_out(if_blocks[previous_block_index], 1, 1, () => {
          if_blocks[previous_block_index] = null;
        });
        import_internal2.check_outros();
        if_block = if_blocks[current_block_type_index];
        if (!if_block) {
          if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx2);
          if_block.c();
        } else {
          if_block.p(ctx2, dirty);
        }
        import_internal2.transition_in(if_block, 1);
        if_block.m(if_block_anchor.parentNode, if_block_anchor);
      }
    },
    i(local) {
      if (current)
        return;
      import_internal2.transition_in(if_block);
      current = true;
    },
    o(local) {
      import_internal2.transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if_blocks[current_block_type_index].d(detaching);
      if (detaching)
        import_internal2.detach(if_block_anchor);
    }
  };
}
function create_else_block_1(ctx) {
  let current;
  const default_slot_template = ctx[15].default;
  const default_slot = import_internal2.create_slot(default_slot_template, ctx, ctx[14], get_default_slot_context);
  return {
    c() {
      if (default_slot)
        default_slot.c();
    },
    m(target, anchor) {
      if (default_slot) {
        default_slot.m(target, anchor);
      }
      current = true;
    },
    p(ctx2, dirty) {
      if (default_slot) {
        if (default_slot.p && dirty & 16396) {
          import_internal2.update_slot(default_slot, default_slot_template, ctx2, ctx2[14], dirty, get_default_slot_changes, get_default_slot_context);
        }
      }
    },
    i(local) {
      if (current)
        return;
      import_internal2.transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      import_internal2.transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (default_slot)
        default_slot.d(detaching);
    }
  };
}
function create_if_block_4(ctx) {
  let switch_instance;
  let switch_instance_anchor;
  let current;
  const switch_instance_spread_levels = [{router: ctx[2]}, ctx[3]];
  var switch_value = ctx[0];
  function switch_props(ctx2) {
    let switch_instance_props = {};
    for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
      switch_instance_props = import_internal2.assign(switch_instance_props, switch_instance_spread_levels[i]);
    }
    return {props: switch_instance_props};
  }
  if (switch_value) {
    switch_instance = new switch_value(switch_props(ctx));
  }
  return {
    c() {
      if (switch_instance)
        import_internal2.create_component(switch_instance.$$.fragment);
      switch_instance_anchor = import_internal2.empty();
    },
    m(target, anchor) {
      if (switch_instance) {
        import_internal2.mount_component(switch_instance, target, anchor);
      }
      import_internal2.insert(target, switch_instance_anchor, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const switch_instance_changes = dirty & 12 ? import_internal2.get_spread_update(switch_instance_spread_levels, [
        dirty & 4 && {router: ctx2[2]},
        dirty & 8 && import_internal2.get_spread_object(ctx2[3])
      ]) : {};
      if (switch_value !== (switch_value = ctx2[0])) {
        if (switch_instance) {
          import_internal2.group_outros();
          const old_component = switch_instance;
          import_internal2.transition_out(old_component.$$.fragment, 1, 0, () => {
            import_internal2.destroy_component(old_component, 1);
          });
          import_internal2.check_outros();
        }
        if (switch_value) {
          switch_instance = new switch_value(switch_props(ctx2));
          import_internal2.create_component(switch_instance.$$.fragment);
          import_internal2.transition_in(switch_instance.$$.fragment, 1);
          import_internal2.mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
        } else {
          switch_instance = null;
        }
      } else if (switch_value) {
        switch_instance.$set(switch_instance_changes);
      }
    },
    i(local) {
      if (current)
        return;
      if (switch_instance)
        import_internal2.transition_in(switch_instance.$$.fragment, local);
      current = true;
    },
    o(local) {
      if (switch_instance)
        import_internal2.transition_out(switch_instance.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        import_internal2.detach(switch_instance_anchor);
      if (switch_instance)
        import_internal2.destroy_component(switch_instance, detaching);
    }
  };
}
function create_if_block_1(ctx) {
  let if_block_anchor;
  let current;
  let if_block = ctx[1] && create_if_block_2(ctx);
  return {
    c() {
      if (if_block)
        if_block.c();
      if_block_anchor = import_internal2.empty();
    },
    m(target, anchor) {
      if (if_block)
        if_block.m(target, anchor);
      import_internal2.insert(target, if_block_anchor, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      if (ctx2[1]) {
        if (if_block) {
          if_block.p(ctx2, dirty);
          if (dirty & 2) {
            import_internal2.transition_in(if_block, 1);
          }
        } else {
          if_block = create_if_block_2(ctx2);
          if_block.c();
          import_internal2.transition_in(if_block, 1);
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        }
      } else if (if_block) {
        import_internal2.group_outros();
        import_internal2.transition_out(if_block, 1, 1, () => {
          if_block = null;
        });
        import_internal2.check_outros();
      }
    },
    i(local) {
      if (current)
        return;
      import_internal2.transition_in(if_block);
      current = true;
    },
    o(local) {
      import_internal2.transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if (if_block)
        if_block.d(detaching);
      if (detaching)
        import_internal2.detach(if_block_anchor);
    }
  };
}
function create_if_block_2(ctx) {
  let show_if;
  let current_block_type_index;
  let if_block;
  let if_block_anchor;
  let current;
  const if_block_creators = [create_if_block_3, create_else_block];
  const if_blocks = [];
  function select_block_type_1(ctx2, dirty) {
    if (dirty & 2)
      show_if = !!isSvelteComponent(ctx2[1]);
    if (show_if)
      return 0;
    return 1;
  }
  current_block_type_index = select_block_type_1(ctx, -1);
  if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  return {
    c() {
      if_block.c();
      if_block_anchor = import_internal2.empty();
    },
    m(target, anchor) {
      if_blocks[current_block_type_index].m(target, anchor);
      import_internal2.insert(target, if_block_anchor, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type_1(ctx2, dirty);
      if (current_block_type_index === previous_block_index) {
        if_blocks[current_block_type_index].p(ctx2, dirty);
      } else {
        import_internal2.group_outros();
        import_internal2.transition_out(if_blocks[previous_block_index], 1, 1, () => {
          if_blocks[previous_block_index] = null;
        });
        import_internal2.check_outros();
        if_block = if_blocks[current_block_type_index];
        if (!if_block) {
          if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx2);
          if_block.c();
        } else {
          if_block.p(ctx2, dirty);
        }
        import_internal2.transition_in(if_block, 1);
        if_block.m(if_block_anchor.parentNode, if_block_anchor);
      }
    },
    i(local) {
      if (current)
        return;
      import_internal2.transition_in(if_block);
      current = true;
    },
    o(local) {
      import_internal2.transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if_blocks[current_block_type_index].d(detaching);
      if (detaching)
        import_internal2.detach(if_block_anchor);
    }
  };
}
function create_else_block(ctx) {
  let t;
  return {
    c() {
      t = import_internal2.text(ctx[1]);
    },
    m(target, anchor) {
      import_internal2.insert(target, t, anchor);
    },
    p(ctx2, dirty) {
      if (dirty & 2)
        import_internal2.set_data(t, ctx2[1]);
    },
    i: import_internal2.noop,
    o: import_internal2.noop,
    d(detaching) {
      if (detaching)
        import_internal2.detach(t);
    }
  };
}
function create_if_block_3(ctx) {
  let switch_instance;
  let switch_instance_anchor;
  let current;
  const switch_instance_spread_levels = [{router: ctx[2]}, ctx[3]];
  var switch_value = ctx[1];
  function switch_props(ctx2) {
    let switch_instance_props = {};
    for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
      switch_instance_props = import_internal2.assign(switch_instance_props, switch_instance_spread_levels[i]);
    }
    return {props: switch_instance_props};
  }
  if (switch_value) {
    switch_instance = new switch_value(switch_props(ctx));
  }
  return {
    c() {
      if (switch_instance)
        import_internal2.create_component(switch_instance.$$.fragment);
      switch_instance_anchor = import_internal2.empty();
    },
    m(target, anchor) {
      if (switch_instance) {
        import_internal2.mount_component(switch_instance, target, anchor);
      }
      import_internal2.insert(target, switch_instance_anchor, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const switch_instance_changes = dirty & 12 ? import_internal2.get_spread_update(switch_instance_spread_levels, [
        dirty & 4 && {router: ctx2[2]},
        dirty & 8 && import_internal2.get_spread_object(ctx2[3])
      ]) : {};
      if (switch_value !== (switch_value = ctx2[1])) {
        if (switch_instance) {
          import_internal2.group_outros();
          const old_component = switch_instance;
          import_internal2.transition_out(old_component.$$.fragment, 1, 0, () => {
            import_internal2.destroy_component(old_component, 1);
          });
          import_internal2.check_outros();
        }
        if (switch_value) {
          switch_instance = new switch_value(switch_props(ctx2));
          import_internal2.create_component(switch_instance.$$.fragment);
          import_internal2.transition_in(switch_instance.$$.fragment, 1);
          import_internal2.mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
        } else {
          switch_instance = null;
        }
      } else if (switch_value) {
        switch_instance.$set(switch_instance_changes);
      }
    },
    i(local) {
      if (current)
        return;
      if (switch_instance)
        import_internal2.transition_in(switch_instance.$$.fragment, local);
      current = true;
    },
    o(local) {
      if (switch_instance)
        import_internal2.transition_out(switch_instance.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        import_internal2.detach(switch_instance_anchor);
      if (switch_instance)
        import_internal2.destroy_component(switch_instance, detaching);
    }
  };
}
function create_fragment2(ctx) {
  let if_block_anchor;
  let current;
  let if_block = ctx[2] && create_if_block2(ctx);
  return {
    c() {
      if (if_block)
        if_block.c();
      if_block_anchor = import_internal2.empty();
    },
    m(target, anchor) {
      if (if_block)
        if_block.m(target, anchor);
      import_internal2.insert(target, if_block_anchor, anchor);
      current = true;
    },
    p(ctx2, [dirty]) {
      if (ctx2[2]) {
        if (if_block) {
          if_block.p(ctx2, dirty);
          if (dirty & 4) {
            import_internal2.transition_in(if_block, 1);
          }
        } else {
          if_block = create_if_block2(ctx2);
          if_block.c();
          import_internal2.transition_in(if_block, 1);
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        }
      } else if (if_block) {
        import_internal2.group_outros();
        import_internal2.transition_out(if_block, 1, 1, () => {
          if_block = null;
        });
        import_internal2.check_outros();
      }
    },
    i(local) {
      if (current)
        return;
      import_internal2.transition_in(if_block);
      current = true;
    },
    o(local) {
      import_internal2.transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if (if_block)
        if_block.d(detaching);
      if (detaching)
        import_internal2.detach(if_block_anchor);
    }
  };
}
function instance2($$self, $$props, $$invalidate) {
  let $routePath;
  let $routeInfo;
  import_internal2.component_subscribe($$self, routeInfo, ($$value) => $$invalidate(13, $routeInfo = $$value));
  let {$$slots: slots = {}, $$scope} = $$props;
  let {key = null} = $$props;
  let {path = "/"} = $$props;
  let {exact = null} = $$props;
  let {pending = null} = $$props;
  let {disabled = false} = $$props;
  let {fallback = null} = $$props;
  let {component = null} = $$props;
  let {condition = null} = $$props;
  let {redirect = null} = $$props;
  const thisProps = [
    "key",
    "path",
    "exact",
    "pending",
    "disabled",
    "fallback",
    "component",
    "condition",
    "redirect"
  ];
  const routeContext = import_svelte2.getContext(CTX_ROUTE);
  const routerContext = import_svelte2.getContext(CTX_ROUTER);
  const {assignRoute, unassignRoute: unassignRoute2} = routerContext || {};
  const routePath = routeContext ? routeContext.routePath : import_store4.writable(path);
  import_internal2.component_subscribe($$self, routePath, (value) => $$invalidate(17, $routePath = value));
  let activeRouter = null;
  let activeProps = {};
  let fullpath;
  let hasLoaded;
  const fixedRoot = $routePath !== path && $routePath !== "/" ? `${$routePath}${path !== "/" ? path : ""}` : path;
  function resolve() {
    const fixedRoute = path !== fixedRoot && fixedRoot.substr(-1) !== "/" ? `${fixedRoot}/` : fixedRoot;
    $$invalidate(6, [key, fullpath] = assignRoute(key, fixedRoute, {condition, redirect, fallback, exact}), key);
  }
  resolve();
  import_svelte2.onDestroy(() => {
    if (unassignRoute2) {
      unassignRoute2(fullpath);
    }
  });
  import_svelte2.setContext(CTX_ROUTE, {routePath});
  $$self.$$set = ($$new_props) => {
    $$invalidate(25, $$props = import_internal2.assign(import_internal2.assign({}, $$props), import_internal2.exclude_internal_props($$new_props)));
    if ("key" in $$new_props)
      $$invalidate(6, key = $$new_props.key);
    if ("path" in $$new_props)
      $$invalidate(7, path = $$new_props.path);
    if ("exact" in $$new_props)
      $$invalidate(8, exact = $$new_props.exact);
    if ("pending" in $$new_props)
      $$invalidate(1, pending = $$new_props.pending);
    if ("disabled" in $$new_props)
      $$invalidate(9, disabled = $$new_props.disabled);
    if ("fallback" in $$new_props)
      $$invalidate(10, fallback = $$new_props.fallback);
    if ("component" in $$new_props)
      $$invalidate(0, component = $$new_props.component);
    if ("condition" in $$new_props)
      $$invalidate(11, condition = $$new_props.condition);
    if ("redirect" in $$new_props)
      $$invalidate(12, redirect = $$new_props.redirect);
    if ("$$scope" in $$new_props)
      $$invalidate(14, $$scope = $$new_props.$$scope);
  };
  $$self.$$.update = () => {
    $:
      if (key) {
        $$invalidate(2, activeRouter = !disabled && $routeInfo[key]);
        $$invalidate(3, activeProps = getProps($$props, thisProps));
      }
    if ($$self.$$.dirty & 5) {
      $:
        if (activeRouter) {
          if (!component) {
            $$invalidate(4, hasLoaded = true);
          } else if (isSvelteComponent(component)) {
            $$invalidate(4, hasLoaded = true);
          } else if (isPromise(component)) {
            component.then((module) => {
              $$invalidate(0, component = module.default);
              $$invalidate(4, hasLoaded = true);
            });
          } else {
            component().then((module) => {
              $$invalidate(0, component = module.default);
              $$invalidate(4, hasLoaded = true);
            });
          }
        }
    }
  };
  $$props = import_internal2.exclude_internal_props($$props);
  return [
    component,
    pending,
    activeRouter,
    activeProps,
    hasLoaded,
    routePath,
    key,
    path,
    exact,
    disabled,
    fallback,
    condition,
    redirect,
    $routeInfo,
    $$scope,
    slots
  ];
}
var Route = class extends import_internal2.SvelteComponent {
  constructor(options) {
    super();
    import_internal2.init(this, options, instance2, create_fragment2, import_internal2.safe_not_equal, {
      key: 6,
      path: 7,
      exact: 8,
      pending: 1,
      disabled: 9,
      fallback: 10,
      component: 0,
      condition: 11,
      redirect: 12
    });
  }
};
var Route_default = Route;

// node_modules/yrv/build/lib/Link.svelte
var import_internal3 = __toModule(require_internal());
var import_svelte3 = __toModule(require_svelte());
function create_else_block2(ctx) {
  let a;
  let a_href_value;
  let current;
  let mounted;
  let dispose;
  const default_slot_template = ctx[17].default;
  const default_slot = import_internal3.create_slot(default_slot_template, ctx, ctx[16], null);
  let a_levels = [
    ctx[6],
    {
      href: a_href_value = cleanPath(ctx[5] || ctx[1])
    },
    {class: ctx[0]},
    {title: ctx[2]}
  ];
  let a_data = {};
  for (let i = 0; i < a_levels.length; i += 1) {
    a_data = import_internal3.assign(a_data, a_levels[i]);
  }
  return {
    c() {
      a = import_internal3.element("a");
      if (default_slot)
        default_slot.c();
      import_internal3.set_attributes(a, a_data);
    },
    m(target, anchor) {
      import_internal3.insert(target, a, anchor);
      if (default_slot) {
        default_slot.m(a, null);
      }
      ctx[19](a);
      current = true;
      if (!mounted) {
        dispose = import_internal3.listen(a, "click", ctx[8]);
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (default_slot) {
        if (default_slot.p && dirty & 65536) {
          import_internal3.update_slot(default_slot, default_slot_template, ctx2, ctx2[16], dirty, null, null);
        }
      }
      import_internal3.set_attributes(a, a_data = import_internal3.get_spread_update(a_levels, [
        dirty & 64 && ctx2[6],
        (!current || dirty & 34 && a_href_value !== (a_href_value = cleanPath(ctx2[5] || ctx2[1]))) && {href: a_href_value},
        (!current || dirty & 1) && {class: ctx2[0]},
        (!current || dirty & 4) && {title: ctx2[2]}
      ]));
    },
    i(local) {
      if (current)
        return;
      import_internal3.transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      import_internal3.transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        import_internal3.detach(a);
      if (default_slot)
        default_slot.d(detaching);
      ctx[19](null);
      mounted = false;
      dispose();
    }
  };
}
function create_if_block3(ctx) {
  let button_1;
  let current;
  let mounted;
  let dispose;
  const default_slot_template = ctx[17].default;
  const default_slot = import_internal3.create_slot(default_slot_template, ctx, ctx[16], null);
  let button_1_levels = [
    ctx[6],
    {class: ctx[0]},
    {title: ctx[2]}
  ];
  let button_1_data = {};
  for (let i = 0; i < button_1_levels.length; i += 1) {
    button_1_data = import_internal3.assign(button_1_data, button_1_levels[i]);
  }
  return {
    c() {
      button_1 = import_internal3.element("button");
      if (default_slot)
        default_slot.c();
      import_internal3.set_attributes(button_1, button_1_data);
    },
    m(target, anchor) {
      import_internal3.insert(target, button_1, anchor);
      if (default_slot) {
        default_slot.m(button_1, null);
      }
      ctx[18](button_1);
      current = true;
      if (!mounted) {
        dispose = import_internal3.listen(button_1, "click", ctx[7]);
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (default_slot) {
        if (default_slot.p && dirty & 65536) {
          import_internal3.update_slot(default_slot, default_slot_template, ctx2, ctx2[16], dirty, null, null);
        }
      }
      import_internal3.set_attributes(button_1, button_1_data = import_internal3.get_spread_update(button_1_levels, [
        dirty & 64 && ctx2[6],
        (!current || dirty & 1) && {class: ctx2[0]},
        (!current || dirty & 4) && {title: ctx2[2]}
      ]));
    },
    i(local) {
      if (current)
        return;
      import_internal3.transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      import_internal3.transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        import_internal3.detach(button_1);
      if (default_slot)
        default_slot.d(detaching);
      ctx[18](null);
      mounted = false;
      dispose();
    }
  };
}
function create_fragment3(ctx) {
  let current_block_type_index;
  let if_block;
  let if_block_anchor;
  let current;
  const if_block_creators = [create_if_block3, create_else_block2];
  const if_blocks = [];
  function select_block_type(ctx2, dirty) {
    if (ctx2[3])
      return 0;
    return 1;
  }
  current_block_type_index = select_block_type(ctx, -1);
  if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  return {
    c() {
      if_block.c();
      if_block_anchor = import_internal3.empty();
    },
    m(target, anchor) {
      if_blocks[current_block_type_index].m(target, anchor);
      import_internal3.insert(target, if_block_anchor, anchor);
      current = true;
    },
    p(ctx2, [dirty]) {
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type(ctx2, dirty);
      if (current_block_type_index === previous_block_index) {
        if_blocks[current_block_type_index].p(ctx2, dirty);
      } else {
        import_internal3.group_outros();
        import_internal3.transition_out(if_blocks[previous_block_index], 1, 1, () => {
          if_blocks[previous_block_index] = null;
        });
        import_internal3.check_outros();
        if_block = if_blocks[current_block_type_index];
        if (!if_block) {
          if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx2);
          if_block.c();
        } else {
          if_block.p(ctx2, dirty);
        }
        import_internal3.transition_in(if_block, 1);
        if_block.m(if_block_anchor.parentNode, if_block_anchor);
      }
    },
    i(local) {
      if (current)
        return;
      import_internal3.transition_in(if_block);
      current = true;
    },
    o(local) {
      import_internal3.transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if_blocks[current_block_type_index].d(detaching);
      if (detaching)
        import_internal3.detach(if_block_anchor);
    }
  };
}
function instance3($$self, $$props, $$invalidate) {
  let fixedProps;
  let $router;
  import_internal3.component_subscribe($$self, router, ($$value) => $$invalidate(15, $router = $$value));
  let {$$slots: slots = {}, $$scope} = $$props;
  let ref;
  let active;
  let {class: cssClass = ""} = $$props;
  let fixedHref = null;
  let {go = null} = $$props;
  let {open = null} = $$props;
  let {href = ""} = $$props;
  let {title = ""} = $$props;
  let {button = false} = $$props;
  let {exact = false} = $$props;
  let {reload = false} = $$props;
  let {replace = false} = $$props;
  const thisProps = ["go", "open", "href", "class", "title", "button", "exact", "reload", "replace"];
  const dispatch = import_svelte3.createEventDispatcher();
  function handleOnClick(e) {
    e.preventDefault();
    if (typeof go === "string" && window.history.length > 1) {
      if (go === "back")
        window.history.back();
      else if (go === "fwd")
        window.history.forward();
      else
        window.history.go(parseInt(go, 10));
      return;
    }
    if (!fixedHref && href !== "") {
      if (open) {
        let specs = typeof open === "string" ? open : "";
        const wmatch = specs.match(/width=(\d+)/);
        const hmatch = specs.match(/height=(\d+)/);
        if (wmatch)
          specs += `,left=${(window.screen.width - wmatch[1]) / 2}`;
        if (hmatch)
          specs += `,top=${(window.screen.height - hmatch[1]) / 2}`;
        if (wmatch && !hmatch) {
          specs += `,height=${wmatch[1]},top=${(window.screen.height - wmatch[1]) / 2}`;
        }
        const w = window.open(href, "", specs);
        const t = setInterval(() => {
          if (w.closed) {
            dispatch("close");
            clearInterval(t);
          }
        }, 120);
      } else
        window.location.href = href;
      return;
    }
    fixedLocation(href, () => {
      navigateTo(fixedHref || "/", {reload, replace});
    }, () => dispatch("click", e));
  }
  function handleAnchorOnClick(e) {
    if (e.metaKey || e.ctrlKey || e.button !== 0) {
      return;
    }
    handleOnClick(e);
  }
  function button_1_binding($$value) {
    import_internal3.binding_callbacks[$$value ? "unshift" : "push"](() => {
      ref = $$value;
      $$invalidate(4, ref);
    });
  }
  function a_binding($$value) {
    import_internal3.binding_callbacks[$$value ? "unshift" : "push"](() => {
      ref = $$value;
      $$invalidate(4, ref);
    });
  }
  $$self.$$set = ($$new_props) => {
    $$invalidate(22, $$props = import_internal3.assign(import_internal3.assign({}, $$props), import_internal3.exclude_internal_props($$new_props)));
    if ("class" in $$new_props)
      $$invalidate(0, cssClass = $$new_props.class);
    if ("go" in $$new_props)
      $$invalidate(9, go = $$new_props.go);
    if ("open" in $$new_props)
      $$invalidate(10, open = $$new_props.open);
    if ("href" in $$new_props)
      $$invalidate(1, href = $$new_props.href);
    if ("title" in $$new_props)
      $$invalidate(2, title = $$new_props.title);
    if ("button" in $$new_props)
      $$invalidate(3, button = $$new_props.button);
    if ("exact" in $$new_props)
      $$invalidate(11, exact = $$new_props.exact);
    if ("reload" in $$new_props)
      $$invalidate(12, reload = $$new_props.reload);
    if ("replace" in $$new_props)
      $$invalidate(13, replace = $$new_props.replace);
    if ("$$scope" in $$new_props)
      $$invalidate(16, $$scope = $$new_props.$$scope);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty & 2) {
      $:
        if (!/^(\w+:)?\/\//.test(href)) {
          $$invalidate(5, fixedHref = cleanPath(ROOT_URL, true) + cleanPath(HASHCHANGE ? `#${href}` : href));
        }
    }
    if ($$self.$$.dirty & 51226) {
      $:
        if (ref && $router.path) {
          if (isActive(href, $router.path, exact)) {
            if (!active) {
              $$invalidate(14, active = true);
              ref.setAttribute("aria-current", "page");
              if (button) {
                ref.setAttribute("disabled", true);
              }
            }
          } else if (active) {
            $$invalidate(14, active = false);
            ref.removeAttribute("disabled");
            ref.removeAttribute("aria-current");
          }
        }
    }
    $:
      $$invalidate(6, fixedProps = getProps($$props, thisProps));
  };
  $$props = import_internal3.exclude_internal_props($$props);
  return [
    cssClass,
    href,
    title,
    button,
    ref,
    fixedHref,
    fixedProps,
    handleOnClick,
    handleAnchorOnClick,
    go,
    open,
    exact,
    reload,
    replace,
    active,
    $router,
    $$scope,
    slots,
    button_1_binding,
    a_binding
  ];
}
var Link = class extends import_internal3.SvelteComponent {
  constructor(options) {
    super();
    import_internal3.init(this, options, instance3, create_fragment3, import_internal3.safe_not_equal, {
      class: 0,
      go: 9,
      open: 10,
      href: 1,
      title: 2,
      button: 3,
      exact: 11,
      reload: 12,
      replace: 13
    });
  }
};
var Link_default = Link;

// node_modules/yrv/build/index.js
Object.defineProperty(Router_default, "hashchange", {
  set: function(value) {
    return hashchangeEnable(value);
  },
  get: function() {
    return hashchangeEnable();
  },
  configurable: false,
  enumerable: false
});

// src/app/components/pages/NotFound.svelte
var import_internal4 = __toModule(require_internal());
function create_fragment4(ctx) {
  let h1;
  return {
    c() {
      h1 = import_internal4.element("h1");
      h1.textContent = "Not found";
    },
    m(target, anchor) {
      import_internal4.insert(target, h1, anchor);
    },
    p: import_internal4.noop,
    i: import_internal4.noop,
    o: import_internal4.noop,
    d(detaching) {
      if (detaching)
        import_internal4.detach(h1);
    }
  };
}
var NotFound = class extends import_internal4.SvelteComponent {
  constructor(options) {
    super();
    import_internal4.init(this, options, null, create_fragment4, import_internal4.safe_not_equal, {});
  }
};
var NotFound_default = NotFound;

// src/app/components/pages/Home.svelte
var import_internal5 = __toModule(require_internal());
function create_fragment5(ctx) {
  let h1;
  return {
    c() {
      h1 = import_internal5.element("h1");
      h1.textContent = "HOME";
    },
    m(target, anchor) {
      import_internal5.insert(target, h1, anchor);
    },
    p: import_internal5.noop,
    i: import_internal5.noop,
    o: import_internal5.noop,
    d(detaching) {
      if (detaching)
        import_internal5.detach(h1);
    }
  };
}
var Home = class extends import_internal5.SvelteComponent {
  constructor(options) {
    super();
    import_internal5.init(this, options, null, create_fragment5, import_internal5.safe_not_equal, {});
  }
};
var Home_default = Home;

// src/app/components/App.svelte
function create_default_slot_2(ctx) {
  let t;
  return {
    c() {
      t = import_internal6.text("Dashboard");
    },
    m(target, anchor) {
      import_internal6.insert(target, t, anchor);
    },
    d(detaching) {
      if (detaching)
        import_internal6.detach(t);
    }
  };
}
function create_default_slot_1(ctx) {
  let t;
  return {
    c() {
      t = import_internal6.text("Page not found");
    },
    m(target, anchor) {
      import_internal6.insert(target, t, anchor);
    },
    d(detaching) {
      if (detaching)
        import_internal6.detach(t);
    }
  };
}
function create_default_slot(ctx) {
  let nav1;
  let nav0;
  let link0;
  let t0;
  let link1;
  let t1;
  let main;
  let route0;
  let t2;
  let route1;
  let current;
  link0 = new Link_default({
    props: {
      exact: true,
      href: "/admin",
      $$slots: {default: [create_default_slot_2]},
      $$scope: {ctx}
    }
  });
  link1 = new Link_default({
    props: {
      exact: true,
      href: "/admin/not-found",
      $$slots: {default: [create_default_slot_1]},
      $$scope: {ctx}
    }
  });
  route0 = new Route_default({
    props: {exact: true, path: "/", component: Home_default}
  });
  route1 = new Route_default({
    props: {fallback: true, component: NotFound_default}
  });
  return {
    c() {
      nav1 = import_internal6.element("nav");
      nav0 = import_internal6.element("nav");
      import_internal6.create_component(link0.$$.fragment);
      t0 = import_internal6.text("\n      | ");
      import_internal6.create_component(link1.$$.fragment);
      t1 = import_internal6.space();
      main = import_internal6.element("main");
      import_internal6.create_component(route0.$$.fragment);
      t2 = import_internal6.space();
      import_internal6.create_component(route1.$$.fragment);
    },
    m(target, anchor) {
      import_internal6.insert(target, nav1, anchor);
      import_internal6.append(nav1, nav0);
      import_internal6.mount_component(link0, nav0, null);
      import_internal6.append(nav0, t0);
      import_internal6.mount_component(link1, nav0, null);
      import_internal6.insert(target, t1, anchor);
      import_internal6.insert(target, main, anchor);
      import_internal6.mount_component(route0, main, null);
      import_internal6.append(main, t2);
      import_internal6.mount_component(route1, main, null);
      current = true;
    },
    p(ctx2, dirty) {
      const link0_changes = {};
      if (dirty & 1) {
        link0_changes.$$scope = {dirty, ctx: ctx2};
      }
      link0.$set(link0_changes);
      const link1_changes = {};
      if (dirty & 1) {
        link1_changes.$$scope = {dirty, ctx: ctx2};
      }
      link1.$set(link1_changes);
    },
    i(local) {
      if (current)
        return;
      import_internal6.transition_in(link0.$$.fragment, local);
      import_internal6.transition_in(link1.$$.fragment, local);
      import_internal6.transition_in(route0.$$.fragment, local);
      import_internal6.transition_in(route1.$$.fragment, local);
      current = true;
    },
    o(local) {
      import_internal6.transition_out(link0.$$.fragment, local);
      import_internal6.transition_out(link1.$$.fragment, local);
      import_internal6.transition_out(route0.$$.fragment, local);
      import_internal6.transition_out(route1.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        import_internal6.detach(nav1);
      import_internal6.destroy_component(link0);
      import_internal6.destroy_component(link1);
      if (detaching)
        import_internal6.detach(t1);
      if (detaching)
        import_internal6.detach(main);
      import_internal6.destroy_component(route0);
      import_internal6.destroy_component(route1);
    }
  };
}
function create_fragment6(ctx) {
  let router2;
  let current;
  router2 = new Router_default({
    props: {
      path: "/admin",
      $$slots: {default: [create_default_slot]},
      $$scope: {ctx}
    }
  });
  return {
    c() {
      import_internal6.create_component(router2.$$.fragment);
    },
    m(target, anchor) {
      import_internal6.mount_component(router2, target, anchor);
      current = true;
    },
    p(ctx2, [dirty]) {
      const router_changes = {};
      if (dirty & 1) {
        router_changes.$$scope = {dirty, ctx: ctx2};
      }
      router2.$set(router_changes);
    },
    i(local) {
      if (current)
        return;
      import_internal6.transition_in(router2.$$.fragment, local);
      current = true;
    },
    o(local) {
      import_internal6.transition_out(router2.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      import_internal6.destroy_component(router2, detaching);
    }
  };
}
var App = class extends import_internal6.SvelteComponent {
  constructor(options) {
    super();
    import_internal6.init(this, options, null, create_fragment6, import_internal6.safe_not_equal, {});
  }
};
var App_default = App;

// src/app/main.js
new App_default({
  target: document.querySelector("#app")
});
