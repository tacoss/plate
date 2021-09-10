// node_modules/somedom/dist/somedom.es.js
var r = "http://www.w3.org/1999/xlink";
var o = /^(\w*|[.#]\w+)(#[\w-]+)?(\.[\w-][\w-.]*)*$/;
var c = class {
  constructor() {
    this.childNodes = [], this.nodeType = 11, this.length = 0;
  }
  appendChild(e) {
    e instanceof c ? e.childNodes.forEach((e2) => {
      this.appendChild(e2);
    }) : (this.childNodes.push(e), this.length += 1);
  }
  getDocumentFragment() {
    const e = document.createDocumentFragment();
    return this.flush(e), e;
  }
  remove(e) {
    return e = e || ((e2) => e2()), Promise.resolve().then(() => e(() => this.children.map((e2) => e2 && e2.remove())));
  }
  mount(e, t) {
    Object.defineProperty(this, "parentNode", { configurable: true, value: e });
    const n = this.getDocumentFragment();
    t ? e.insertBefore(n, t) : e.appendChild(n);
  }
  flush(e) {
    this.childNodes.length || (this.anchor = document.createTextNode(""), this.childNodes.push(this.anchor), this.length = 1), this.anchor = this.childNodes[0], this.anchor._anchored = this, this.childNodes.forEach((t) => {
      e.appendChild(t);
    }), this.childNodes = [];
  }
  get outerHTML() {
    return this.children.map((e) => e.outerHTML || e.nodeValue).join("");
  }
  get children() {
    if (this.root) {
      const e = [], { offset: t } = this;
      for (let n = 0; n < this.length; n += 1)
        e.push(this.root.childNodes[n + t]);
      return e;
    }
    return this.childNodes;
  }
  get offset() {
    const e = this.root.childNodes;
    let t = 0;
    for (let n = 0; n < e.length; n += 1)
      if (e[n] === this.anchor) {
        t = n;
        break;
      }
    return t;
  }
  get root() {
    let e = this;
    for (; e instanceof c; )
      e = e.parentNode;
    return e;
  }
  static from(e, t) {
    const n = new c();
    return n.vnode = t, t.forEach((t2) => {
      n.appendChild(e(t2));
    }), n;
  }
};
var a = (e) => Array.isArray(e);
var u = (e) => typeof e == "string";
var l = (e) => typeof e == "function";
var f = (e) => e == null;
var d = (e) => e !== null && Object.prototype.toString.call(e) === "[object Object]";
var h = (e) => e !== null && (typeof e == "function" || typeof e == "object");
var p = (e) => u(e) || typeof e == "number" || typeof e == "boolean";
var m = (e) => !l(e) && (a(e) ? e.length === 0 : d(e) ? Object.keys(e).length === 0 : f(e) || e === "" || e === false);
var y = (e) => {
  return a(e) && (typeof e[0] == "string" && (t = e[0], u(t) && o.test(t)) || l(e[0])) && (e[1] === null || d(e[1]) || l(e[0]));
  var t;
};
var b = (e) => {
  if (y(e)) {
    let t = [];
    for (let n = 2; n < e.length; n += 1)
      t = t.concat(y(e[n]) ? [e[n]] : e[n]);
    e.length = 2, e.push(t);
  } else if (a(e))
    return e.map(b);
  return e;
};
var T = (e, t) => {
  t && (t instanceof c ? t.mount(e.parentNode, e) : e.parentNode.insertBefore(t, e)), ((e2, t2) => {
    e2 && e2.removeChild(t2);
  })(e.parentNode, e);
};
function $(e, t, n, o2) {
  Object.keys(t).forEach((s) => {
    if (s === "key")
      return;
    if (s === "ref")
      return void (e.oncreate = (e2) => {
        t[s].current = e2;
      });
    let i = t[s] !== true ? t[s] : s;
    h(i) && (i = l(o2) && o2(e, s, i) || i, i = i !== e ? i : null, i = a(i) ? i.join("") : i);
    const c2 = m(i), u2 = s.replace(/^xlink:?/, "");
    n && s !== u2 ? c2 ? e.removeAttributeNS(r, u2) : e.setAttributeNS(r, u2, i) : c2 ? e.removeAttribute(s) : p(i) && e.setAttribute(s, i);
  });
}
function S(e, t, n) {
  if (!y(e))
    return a(e) ? c.from((e2) => S(e2, t, n), e) : p(e) && document.createTextNode(e) || e;
  for (e = b(e); e && l(e[0]); )
    e = e[0](e[1], e[2]), e = b(e);
  if (!a(e))
    return e instanceof c ? e : e.target ? e.target : e;
  if (n && n.tags && n.tags[e[0]])
    return S(n.tags[e[0]](e[1], e[2], n), t, n);
  if (!y(e))
    return c.from((e2) => S(e2, t, n), e);
  const r2 = t || e[0].indexOf("svg") === 0, [s, i, u2] = function(e2) {
    if (a(e2) && a(e2[1]) && (e2[2] = e2[1], e2[1] = null), !y(e2) || l(e2[0]))
      return e2;
    let t2 = d(e2[1]) ? { ...e2[1] } : null;
    const n2 = e2[0].match(o);
    if (e2[0] = n2[1] || "div", n2[2] && (t2 = e2[1] = t2 || {}, t2.id = n2[2].substr(1)), n2[3]) {
      t2 = e2[1] = t2 || {};
      const r3 = n2[3].substr(1).split(".");
      a(t2.class) || p(t2.class) ? (t2.class = a(t2.class) ? t2.class : t2.class.split(/\W/), t2.class = r3.concat(t2.class).reduce((e3, t3) => (e3.indexOf(t3) === -1 && e3.push(t3), e3), [])) : h(t2.class) ? r3.forEach((e3) => {
        t2.class[e3] = 1;
      }) : t2.class = r3;
    }
    return e2;
  }(e);
  let f2 = r2 ? document.createElementNS("http://www.w3.org/2000/svg", s) : document.createElement(s);
  return l(n) && (f2 = n(f2, s, i, u2) || f2), l(f2) ? S(f2(), r2, n) : (f2.nodeType === 1 && (m(i) || $(f2, i, r2, n), l(f2.oncreate) && f2.oncreate(f2), l(f2.enter) && f2.enter(), f2.remove = () => Promise.resolve().then(() => l(f2.ondestroy) && f2.ondestroy(f2)).then(() => l(f2.teardown) && f2.teardown()).then(() => l(f2.exit) && f2.exit()).then(() => T(f2)), u2.forEach((e2) => {
    C(f2, e2, r2, n);
  })), f2);
}
function C(e, t, n, r2) {
  if (l(t) && (r2 = t, t = e, e = void 0), l(n) && (r2 = n, n = null), f(t) && (t = e, e = void 0), e || (e = document.body), typeof e == "string" && (e = document.querySelector(e)), a(t) && !y(t))
    t.forEach((t2) => {
      C(e, t2, n, r2);
    });
  else if (!f(t)) {
    const o2 = S(t, n, r2);
    return ((e2, t2) => {
      t2 instanceof c ? t2.mount(e2) : e2.appendChild(t2);
    })(e, o2), o2;
  }
  return e;
}

// resource:/home/runner/work/plate/plate/src/resources/images/12inches_small.png
var inches_small_default = "images/12inches_small.png";

// src/resources/scripts/test.js
target.appendChild(S(["img", { src: inches_small_default }]));
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibm9kZV9tb2R1bGVzL3NvbWVkb20vZGlzdC9zb21lZG9tLmVzLmpzIiwgInJlc291cmNlOi9ob21lL3J1bm5lci93b3JrL3BsYXRlL3BsYXRlL3NyYy9yZXNvdXJjZXMvaW1hZ2VzLzEyaW5jaGVzX3NtYWxsLnBuZyIsICJzcmMvcmVzb3VyY2VzL3NjcmlwdHMvdGVzdC5qcyJdLAogICJtYXBwaW5ncyI6ICI7QUFBQSxJQUFxRCxJQUFFO0FBQXZELElBQXNGLElBQUU7QUFBb0osY0FBTztBQUFBLEVBQUMsY0FBYTtBQUFDLFNBQUssYUFBVyxJQUFHLEtBQUssV0FBUyxJQUFHLEtBQUssU0FBTztBQUFBO0FBQUEsRUFBRSxZQUFZLEdBQUU7QUFBQyxpQkFBYSxJQUFFLEVBQUUsV0FBVyxRQUFTLFFBQUc7QUFBQyxXQUFLLFlBQVk7QUFBQSxTQUFPLE1BQUssV0FBVyxLQUFLLElBQUcsS0FBSyxVQUFRO0FBQUE7QUFBQSxFQUFHLHNCQUFxQjtBQUFDLFVBQU0sSUFBRSxTQUFTO0FBQXlCLFdBQU8sS0FBSyxNQUFNLElBQUc7QUFBQTtBQUFBLEVBQUUsT0FBTyxHQUFFO0FBQUMsV0FBTyxJQUFFLEtBQUksU0FBRyxPQUFLLFFBQVEsVUFBVSxLQUFNLE1BQUksRUFBRyxNQUFJLEtBQUssU0FBUyxJQUFLLFFBQUcsTUFBRyxHQUFFO0FBQUE7QUFBQSxFQUFlLE1BQU0sR0FBRSxHQUFFO0FBQUMsV0FBTyxlQUFlLE1BQUssY0FBYSxFQUFDLGNBQWEsTUFBRyxPQUFNO0FBQUksVUFBTSxJQUFFLEtBQUs7QUFBc0IsUUFBRSxFQUFFLGFBQWEsR0FBRSxLQUFHLEVBQUUsWUFBWTtBQUFBO0FBQUEsRUFBRyxNQUFNLEdBQUU7QUFBQyxTQUFLLFdBQVcsVUFBUyxNQUFLLFNBQU8sU0FBUyxlQUFlLEtBQUksS0FBSyxXQUFXLEtBQUssS0FBSyxTQUFRLEtBQUssU0FBTyxJQUFHLEtBQUssU0FBTyxLQUFLLFdBQVcsSUFBRyxLQUFLLE9BQU8sWUFBVSxNQUFL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
