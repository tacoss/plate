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

// test.js
target.appendChild(S(["img", { src: inches_small_default }]));
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibm9kZV9tb2R1bGVzL3NvbWVkb20vZGlzdC9zb21lZG9tLmVzLmpzIiwgInJlc291cmNlOi9ob21lL3J1bm5lci93b3JrL3BsYXRlL3BsYXRlL3NyYy9yZXNvdXJjZXMvaW1hZ2VzLzEyaW5jaGVzX3NtYWxsLnBuZyIsICJ0ZXN0LmpzIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFBLElBQXFELElBQUU7QUFBdkQsSUFBc0YsSUFBRTtBQUFvSixjQUFPO0FBQUEsRUFBQyxjQUFhO0FBQUMsU0FBSyxhQUFXLElBQUcsS0FBSyxXQUFTLElBQUcsS0FBSyxTQUFPO0FBQUE7QUFBQSxFQUFFLFlBQVksR0FBRTtBQUFDLGlCQUFhLElBQUUsRUFBRSxXQUFXLFFBQVMsUUFBRztBQUFDLFdBQUssWUFBWTtBQUFBLFNBQU8sTUFBSyxXQUFXLEtBQUssSUFBRyxLQUFLLFVBQVE7QUFBQTtBQUFBLEVBQUcsc0JBQXFCO0FBQUMsVUFBTSxJQUFFLFNBQVM7QUFBeUIsV0FBTyxLQUFLLE1BQU0sSUFBRztBQUFBO0FBQUEsRUFBRSxPQUFPLEdBQUU7QUFBQyxXQUFPLElBQUUsS0FBSSxTQUFHLE9BQUssUUFBUSxVQUFVLEtBQU0sTUFBSSxFQUFHLE1BQUksS0FBSyxTQUFTLElBQUssUUFBRyxNQUFHLEdBQUU7QUFBQTtBQUFBLEVBQWUsTUFBTSxHQUFFLEdBQUU7QUFBQyxXQUFPLGVBQWUsTUFBSyxjQUFhLEVBQUMsY0FBYSxNQUFHLE9BQU07QUFBSSxVQUFNLElBQUUsS0FBSztBQUFzQixRQUFFLEVBQUUsYUFBYSxHQUFFLEtBQUcsRUFBRSxZQUFZO0FBQUE7QUFBQSxFQUFHLE1BQU0sR0FBRTtBQUFDLFNBQUssV0FBVyxVQUFTLE1BQUssU0FBTyxTQUFTLGVBQWUsS0FBSSxLQUFLLFdBQVcsS0FBSyxLQUFLLFNBQVEsS0FBSyxTQUFPLElBQUcsS0FBSyxTQUFPLEtBQUssV0FBVyxJQUFHLEtBQUssT0FBTyxZQUFVLE1BQUssS0FBSyxXQUFXLFFBQVMsT0FBRztB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UUFBRyxBQUFRLE1BQVI7QUFBVTtBQUFPLFFBQUcsQUFBUSxNQUFSO0FBQVUsYUFBTyxLQUFLLEdBQUUsV0FBUyxRQUFHO0FBQUMsVUFBRSxHQUFHLFVBQVE7QUFBQTtBQUFJLFFBQUksSUFBRSxBQUFLLEVBQUUsT0FBUCxPQUFVLEVBQUUsS0FBRztBQUFFLE1BQUUsTUFBSyxLQUFFLEVBQUUsT0FBSSxHQUFFLEdBQUUsR0FBRSxNQUFJLEdBQUUsSUFBRSxNQUFJLElBQUUsSUFBRSxNQUFLLElBQUUsRUFBRSxLQUFHLEVBQUUsS0FBSyxNQUFJO0FBQUcsVUFBTSxLQUFFLEVBQUUsSUFBRyxLQUFFLEVBQUUsUUFBUSxZQUFXO0FBQUksU0FBRyxNQUFJLEtBQUUsS0FBRSxFQUFFLGtCQUFrQixHQUFFLE1BQUcsRUFBRSxlQUFlLEdBQUUsSUFBRSxLQUFHLEtBQUUsRUFBRSxnQkFBZ0IsS0FBRyxFQUFFLE1BQUksRUFBRSxhQUFhLEdBQUU7QUFBQTtBQUFBO0FBQTRHLFdBQVcsR0FBRSxHQUFFLEdBQUU7QUFBQyxNQUFHLENBQUMsRUFBRTtBQUFHLFdBQU8sRUFBRSxLQUFHLEVBQUUsS0FBTSxRQUFHLEVBQUUsSUFBRSxHQUFFLElBQUksS0FBRyxFQUFFLE1BQUksU0FBUyxlQUFlLE1BQUk7QUFBRSxPQUFJLElBQUUsRUFBRSxJQUFHLEtBQUcsRUFBRSxFQUFFO0FBQUssUUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFHLEVBQUUsS0FBSSxJQUFFLEVBQUU7QUFBRyxNQUFHLENBQUMsRUFBRTtBQUFHLFdBQU8sYUFBYSxJQUFFLElBQUUsRUFBRSxTQUFPLEVBQUUsU0FBTztBQUFFLE1BQUcsS0FBRyxFQUFFLFFBQU0sRUFBRSxLQUFLLEVBQUU7QUFBSSxXQUFPLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLElBQUcsRUFBRSxJQUFHLElBQUcsR0FBRTtBQUFHLE1BQUcsQ0FBQyxFQUFFO0FBQUcsV0FBTyxFQUFFLEtBQU0sUUFBRyxFQUFFLElBQUUsR0FBRSxJQUFJO0FBQUcsUUFBTSxLQUFFLEtBQUcs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
