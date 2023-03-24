var N="http://www.w3.org/1999/xlink",O=/^([\w-]*|[.#]\w+)(#[\w-]+)?(\.[\w-][\w-.]*)*$/,f=class{constructor(){this.childNodes=[],this.nodeType=11,this.length=0}appendChild(t){f.valid(t)?t.childNodes.forEach(e=>{this.appendChild(e)}):(this.childNodes.push(t),this.length+=1)}getDocumentFragment(){let t=document.createDocumentFragment();return this.childNodes.forEach(e=>t.appendChild(e)),this.childNodes=[],t}mount(t,e){if(Object.defineProperties(this,{parentNode:{configurable:!0,value:t},isConnected:{configurable:!0,value:!0}}),t){let i=this.getDocumentFragment();e?t.insertBefore(i,e):t.appendChild(i)}}static valid(t){if(t instanceof f)return!0}static from(t,e){let i=new f;return i.vnode=e,e.forEach(l=>{i.appendChild(t(l))}),i}},a=t=>typeof t=="function",v=t=>t==null,C=t=>t!==null&&Object.prototype.toString.call(t)==="[object Object]",E=t=>t!==null&&(typeof t=="function"||typeof t=="object"),y=t=>(e=>typeof e=="string")(t)||typeof t=="number"||typeof t=="boolean",u=t=>Array.isArray(t),A=t=>u(t)&&!g(t);function j(t){return!a(t)&&(u(t)?t.length===0:C(t)?Object.keys(t).length===0:v(t)||t===!1)}function g(t){return!!u(t)&&(typeof t[0]=="function"||typeof t[1]=="object"&&!u(t[1]))}var k=(t,e)=>{e&&(f.valid(e)?e.mount(t.parentNode,t):t.parentNode.insertBefore(e,t)),((i,l)=>{i&&i.removeChild(l)})(t.parentNode,t)};function S(t,e,i,l){Object.keys(e).forEach(r=>{if(r==="key"||r.charAt()===":")return;if(r==="ref")return void(t.oncreate=n=>{e[r].current=n});if(r==="@html")return void(t.innerHTML=e[r]);if(r.charAt()==="@")return void t.setAttribute(`data-${r.substr(1)}`,e[r]);if(r.indexOf("class:")===0)return void(e[r]?t.classList.add(r.substr(6)):t.classList.remove(r.substr(6)));if(r.indexOf("style:")===0)return void(t.style[(n=>n.replace(/-([a-z])/g,(c,h)=>h.toUpperCase()))(r.substr(6))]=e[r]);let s=e[r]!==!0?e[r]:r;E(s)&&(s=a(l)&&l(t,r,s)||s,s=s!==t?s:null,s=u(s)?s.join(""):s);let d=j(s),o=r.replace(/^xlink:?/,"");i&&r!==o?d?t.removeAttributeNS(N,o):t.setAttributeNS(N,o,s):d?t.removeAttribute(r):y(s)&&t.setAttribute(r,s)})}function p(t,e,i){if(v(t))throw new Error(`Invalid vnode, given '${t}'`);if(!g(t))return u(t)?f.from(n=>p(n,e,i),t):y(t)&&document.createTextNode(String(t))||t;for(;t&&a(t[0]);)t=t[0](t[1],t.slice(2));if(!u(t))return f.valid(t)?t:t.target?t.target:t;if(i&&i.tags&&i.tags[t[0]])return p(i.tags[t[0]](t[1],t.slice(2),i),e,i);if(!g(t))return f.from(n=>p(n,e,i),t);let l=e||t[0].indexOf("svg")===0,[r,s,d]=function(n){if(A(n))return n;n=[n[0],n[1],n.slice(2)];let c=C(n[1])?{...n[1]}:null,h=n[0].match(O);if(n[0]=h[1]||"div",h[2]&&(c=n[1]=c||{},c.id=h[2].substr(1)),h[3]){c=n[1]=c||{};let b=h[3].substr(1).split(".");u(c.class)||y(c.class)?(c.class=u(c.class)?c.class:c.class.split(/\W/),c.class=b.concat(c.class).reduce((m,w)=>(m.indexOf(w)===-1&&m.push(w),m),[])):E(c.class)?b.forEach(m=>{c.class[m]=1}):c.class=b}return n}(t),o=l?document.createElementNS("http://www.w3.org/2000/svg",r):document.createElement(r);return a(i)&&(o=i(o,r,s,d)||o),a(o)?p(o(),l,i):(j(s)||S(o,s,l,i),a(o.oncreate)&&o.oncreate(o),a(o.enter)&&o.enter(),o.remove=()=>Promise.resolve().then(()=>a(o.ondestroy)&&o.ondestroy(o)).then(()=>a(o.teardown)&&o.teardown()).then(()=>a(o.exit)&&o.exit()).then(()=>k(o)),d.forEach(n=>{x(o,n,l,i)}),o)}function x(t,e,i,l){if(a(e)&&(l=e,e=t,t=void 0),a(i)&&(l=i,i=null),v(e)&&(e=t,t=void 0),t||(t=document.body),typeof t=="string"&&(t=document.querySelector(t)),u(e)&&!g(e))e.forEach(r=>{x(t,r,i,l)});else if(!v(e)){let r=p(e,i,l);return((s,d)=>{f.valid(d)?d.mount(s):s.appendChild(d)})(t,r),r}return t}var T="images/12inches_small.png";target.appendChild(p(["img",{src:T}]));
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL3Jlc291cmNlcy9zY3JpcHRzL25vZGVfbW9kdWxlcy9zb21lZG9tL2Rpc3Qvc29tZWRvbS5tanMiLCAic3JjL3Jlc291cmNlcy9zY3JpcHRzL3Jlc291cmNlOi9ob21lL3J1bm5lci93b3JrL3BsYXRlL3BsYXRlL3NyYy9yZXNvdXJjZXMvaW1hZ2VzLzEyaW5jaGVzX3NtYWxsLnBuZyIsICJzcmMvcmVzb3VyY2VzL3NjcmlwdHMvc3JjL3Jlc291cmNlcy9zY3JpcHRzL3Rlc3QuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IHQ9Lyg+KSg8KShcXC8qKS9nLGU9Ly4rPFxcL1xcd1tePl0qPiQvLG49L148XFwvXFx3LyxyPVwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiLG89L14oW1xcdy1dKnxbLiNdXFx3KykoI1tcXHctXSspPyhcXC5bXFx3LV1bXFx3LS5dKikqJC8scz1bXCJvbmNyZWF0ZVwiLFwib251cGRhdGVcIixcIm9uZGVzdHJveVwiXSxpPVtcImNvbnN0cnVjdG9yXCIsXCJpbnN0YW5jZVwiLFwiY2hpbGRyZW5cIixcInJlbmRlclwiLFwic3RhdGVcIixcInByb3BzXCJdO2NsYXNzIGN7Y29uc3RydWN0b3IoKXt0aGlzLmNoaWxkTm9kZXM9W10sdGhpcy5ub2RlVHlwZT0xMSx0aGlzLmxlbmd0aD0wfWFwcGVuZENoaWxkKHQpe2MudmFsaWQodCk/dC5jaGlsZE5vZGVzLmZvckVhY2goKHQ9Pnt0aGlzLmFwcGVuZENoaWxkKHQpfSkpOih0aGlzLmNoaWxkTm9kZXMucHVzaCh0KSx0aGlzLmxlbmd0aCs9MSl9Z2V0RG9jdW1lbnRGcmFnbWVudCgpe2NvbnN0IHQ9ZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO3JldHVybiB0aGlzLmNoaWxkTm9kZXMuZm9yRWFjaCgoZT0+dC5hcHBlbmRDaGlsZChlKSkpLHRoaXMuY2hpbGROb2Rlcz1bXSx0fW1vdW50KHQsZSl7aWYoT2JqZWN0LmRlZmluZVByb3BlcnRpZXModGhpcyx7cGFyZW50Tm9kZTp7Y29uZmlndXJhYmxlOiEwLHZhbHVlOnR9LGlzQ29ubmVjdGVkOntjb25maWd1cmFibGU6ITAsdmFsdWU6ITB9fSksdCl7Y29uc3Qgbj10aGlzLmdldERvY3VtZW50RnJhZ21lbnQoKTtlP3QuaW5zZXJ0QmVmb3JlKG4sZSk6dC5hcHBlbmRDaGlsZChuKX19c3RhdGljIHZhbGlkKHQpe2lmKHQgaW5zdGFuY2VvZiBjKXJldHVybiEwfXN0YXRpYyBmcm9tKHQsZSl7Y29uc3Qgbj1uZXcgYztyZXR1cm4gbi52bm9kZT1lLGUuZm9yRWFjaCgoZT0+e24uYXBwZW5kQ2hpbGQodChlKSl9KSksbn19Y29uc3QgYT10PT5cImZ1bmN0aW9uXCI9PXR5cGVvZiB0LHU9dD0+bnVsbD09dCxsPXQ9Pm51bGwhPT10JiZcIltvYmplY3QgT2JqZWN0XVwiPT09T2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHQpLGY9dD0+bnVsbCE9PXQmJihcImZ1bmN0aW9uXCI9PXR5cGVvZiB0fHxcIm9iamVjdFwiPT10eXBlb2YgdCksZD10PT4odD0+XCJzdHJpbmdcIj09dHlwZW9mIHQpKHQpfHxcIm51bWJlclwiPT10eXBlb2YgdHx8XCJib29sZWFuXCI9PXR5cGVvZiB0LGg9dD0+QXJyYXkuaXNBcnJheSh0KSxwPXQ9PmgodCkmJiF2KHQpO2Z1bmN0aW9uIGcodCl7cmV0dXJuIGgodCk/dC5yZWR1Y2UoKCh0LGUpPT50LmNvbmNhdCh2KGUpP1tlXTpnKGUpKSksW10pOnR9ZnVuY3Rpb24gbSh0KXtyZXR1cm4hYSh0KSYmKGgodCk/MD09PXQubGVuZ3RoOmwodCk/MD09PU9iamVjdC5rZXlzKHQpLmxlbmd0aDp1KHQpfHwhMT09PXQpfWZ1bmN0aW9uIHYodCl7cmV0dXJuISFoKHQpJiYoXCJmdW5jdGlvblwiPT10eXBlb2YgdFswXXx8XCJvYmplY3RcIj09dHlwZW9mIHRbMV0mJiFoKHRbMV0pKX1mdW5jdGlvbiB5KHQsZSxuLHIsbyxzPTApe2NvbnN0IGk9TWF0aC5tYXgoZS5sZW5ndGgsbi5sZW5ndGgpO2xldCBjPTAsYT0wLGw9MDtmb3IoO2M8aTtjKyspe2NvbnN0IGk9dFtyXSxjPWcoZVthXSksZj1nKG5bbF0pO2lmKHUoYykpbyh7YWRkOmZ9KTtlbHNlIGlmKHUoZikpaWYocChjKSl7bGV0IGU9Yy5sZW5ndGg7Zm9yKDtlLS07KW8oe3JtOnRbcisrXX0pfWVsc2UgaSYmKG8oe3JtOml9KSxyKyspO2Vsc2UgcChjKSYmcChmKT8oeSh0LGMsZixyLG8scysxKSxyKz1mLmxlbmd0aCsyKTpwKGYpPyhvKHtwYXRjaDpbY10sd2l0aDpmLHRhcmdldDppfSkscis9Zi5sZW5ndGgpOmk/KG8oe3BhdGNoOmMsd2l0aDpmLHRhcmdldDppfSkscisrKToobyh7YWRkOmZ9KSxyKyspO2ErKyxsKyt9aWYociE9PXQubGVuZ3RoKWZvcihsZXQgZT1yO2U8dC5sZW5ndGg7ZSsrKW8oe3JtOnRbZV19KX1mdW5jdGlvbiB3KHQsZSl7aWYodHlwZW9mIHQhPXR5cGVvZiBlKXJldHVybiEwO2lmKGgodCkpe2lmKCFoKGUpfHx0Lmxlbmd0aCE9PWUubGVuZ3RoKXJldHVybiEwO2ZvcihsZXQgbj0wO248ZS5sZW5ndGg7bis9MSlpZih3KHRbbl0sZVtuXSkpcmV0dXJuITB9ZWxzZXtpZighbCh0KXx8IWwoZSkpcmV0dXJuIHQhPT1lO3tjb25zdCBuPU9iamVjdC5rZXlzKHQpLnNvcnQoKSxyPU9iamVjdC5rZXlzKGUpLnNvcnQoKTtpZih3KG4scikpcmV0dXJuITA7Zm9yKGxldCBvPTA7bzxuLmxlbmd0aDtvKz0xKWlmKHcodFtuW29dXSxlW3Jbb11dKSlyZXR1cm4hMH19fWNvbnN0IGI9KHQsZSk9PnQuZmlsdGVyKGV8fCh0PT4hbSh0KSkpO2Z1bmN0aW9uIE8ocil7bGV0IG89XCJcIixzPTA7cmV0dXJuKHI9ci5yZXBsYWNlKHQsXCIkMVxcbiQyJDNcIikpLnNwbGl0KFwiXFxuXCIpLmZvckVhY2goKHQ9PntsZXQgcj0wO2UudGVzdCh0KT9yPTA6bi50ZXN0KHQpPzAhPT1zJiYocy09MSk6cj0xO2NvbnN0IGk9QXJyYXkuZnJvbSh7bGVuZ3RoOnMrMX0pLmpvaW4oXCIgIFwiKTtvKz1gJHtpK3R9XFxuYCxzKz1yfSkpLG8udHJpbSgpfWZ1bmN0aW9uIEUodCl7cmV0dXJuIHQmJmYodCk/aCh0KT90Lm1hcCgodD0+RSh0KSkpOnQgaW5zdGFuY2VvZiBEYXRlP25ldyBEYXRlKHQuZ2V0VGltZSgpKTp0IGluc3RhbmNlb2YgUmVnRXhwP25ldyBSZWdFeHAodC5zb3VyY2UsdC5mbGFncyk6T2JqZWN0LmtleXModCkucmVkdWNlKCgoZSxuKT0+T2JqZWN0LmFzc2lnbihlLHtbbl06RSh0W25dKX0pKSx7fSk6dH1jb25zdCBqPSh0LGUsbj17fSk9PiguLi5yKT0+ZT09PXIubGVuZ3RoJiZ0KC4uLnIsbiksaz10PT4oXCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdyYmd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZXx8c2V0VGltZW91dCkodCkseD10PT5Qcm9taXNlLnJlc29sdmUoKS50aGVuKHQpLnRoZW4oKCgpPT5uZXcgUHJvbWlzZSgodD0+ayh0KSkpKSksUD0odCxlKT0+e2UmJihjLnZhbGlkKGUpP2UubW91bnQodC5wYXJlbnROb2RlLHQpOnQucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoZSx0KSksKCh0LGUpPT57dCYmdC5yZW1vdmVDaGlsZChlKX0pKHQucGFyZW50Tm9kZSx0KX07ZnVuY3Rpb24gTih0LGUsbixvKXtPYmplY3Qua2V5cyhlKS5mb3JFYWNoKChzPT57aWYoXCJrZXlcIj09PXN8fFwiOlwiPT09cy5jaGFyQXQoKSlyZXR1cm47aWYoXCJyZWZcIj09PXMpcmV0dXJuIHZvaWQodC5vbmNyZWF0ZT10PT57ZVtzXS5jdXJyZW50PXR9KTtpZihcIkBodG1sXCI9PT1zKXJldHVybiB2b2lkKHQuaW5uZXJIVE1MPWVbc10pO2lmKFwiQFwiPT09cy5jaGFyQXQoKSlyZXR1cm4gdm9pZCB0LnNldEF0dHJpYnV0ZShgZGF0YS0ke3Muc3Vic3RyKDEpfWAsZVtzXSk7aWYoMD09PXMuaW5kZXhPZihcImNsYXNzOlwiKSlyZXR1cm4gdm9pZChlW3NdP3QuY2xhc3NMaXN0LmFkZChzLnN1YnN0cig2KSk6dC5jbGFzc0xpc3QucmVtb3ZlKHMuc3Vic3RyKDYpKSk7aWYoMD09PXMuaW5kZXhPZihcInN0eWxlOlwiKSlyZXR1cm4gdm9pZCh0LnN0eWxlWyh0PT50LnJlcGxhY2UoLy0oW2Etel0pL2csKCh0LGUpPT5lLnRvVXBwZXJDYXNlKCkpKSkocy5zdWJzdHIoNikpXT1lW3NdKTtsZXQgaT0hMCE9PWVbc10/ZVtzXTpzO2YoaSkmJihpPWEobykmJm8odCxzLGkpfHxpLGk9aSE9PXQ/aTpudWxsLGk9aChpKT9pLmpvaW4oXCJcIik6aSk7Y29uc3QgYz1tKGkpLHU9cy5yZXBsYWNlKC9eeGxpbms6Py8sXCJcIik7biYmcyE9PXU/Yz90LnJlbW92ZUF0dHJpYnV0ZU5TKHIsdSk6dC5zZXRBdHRyaWJ1dGVOUyhyLHUsaSk6Yz90LnJlbW92ZUF0dHJpYnV0ZShzKTpkKGkpJiZ0LnNldEF0dHJpYnV0ZShzLGkpfSkpfWZ1bmN0aW9uIFQodCxlLG4scixvKXtsZXQgcztjb25zdCBpPU9iamVjdC5rZXlzKGUpLmNvbmNhdChPYmplY3Qua2V5cyhuKSkucmVkdWNlKCgodCxyKT0+KFwiQGh0bWxcIiE9PXImJihyIGluIGUmJiEociBpbiBuKT8odFtyXT1udWxsLHM9ITApOncoZVtyXSxuW3JdKSYmKHRbcl09bltyXSxzPSEwKSksdCkpLHt9KTtyZXR1cm4gcyYmTih0LGkscixvKSxzfWZ1bmN0aW9uICQodCxlPSh0PT50KCkpKXtjb25zdCBuPSgpPT50JiZ0LnJlbW92ZSgpO3JldHVybiExPT09ZT9uKCk6UHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKCk9PmUobikpKX1mdW5jdGlvbiBDKHQsZSxuKXtpZih1KHQpKXRocm93IG5ldyBFcnJvcihgSW52YWxpZCB2bm9kZSwgZ2l2ZW4gJyR7dH0nYCk7aWYoIXYodCkpcmV0dXJuIGgodCk/Yy5mcm9tKCh0PT5DKHQsZSxuKSksdCk6ZCh0KSYmZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoU3RyaW5nKHQpKXx8dDtmb3IoO3QmJmEodFswXSk7KXQ9dFswXSh0WzFdLHQuc2xpY2UoMikpO2lmKCFoKHQpKXJldHVybiBjLnZhbGlkKHQpP3Q6dC50YXJnZXQ/dC50YXJnZXQ6dDtpZihuJiZuLnRhZ3MmJm4udGFnc1t0WzBdXSlyZXR1cm4gQyhuLnRhZ3NbdFswXV0odFsxXSx0LnNsaWNlKDIpLG4pLGUsbik7aWYoIXYodCkpcmV0dXJuIGMuZnJvbSgodD0+Qyh0LGUsbikpLHQpO2NvbnN0IHI9ZXx8MD09PXRbMF0uaW5kZXhPZihcInN2Z1wiKSxbcyxpLGddPWZ1bmN0aW9uKHQpe2lmKHAodCkpcmV0dXJuIHQ7dD1bdFswXSx0WzFdLHQuc2xpY2UoMildO2xldCBlPWwodFsxXSk/ey4uLnRbMV19Om51bGw7Y29uc3Qgbj10WzBdLm1hdGNoKG8pO2lmKHRbMF09blsxXXx8XCJkaXZcIixuWzJdJiYoZT10WzFdPWV8fHt9LGUuaWQ9blsyXS5zdWJzdHIoMSkpLG5bM10pe2U9dFsxXT1lfHx7fTtjb25zdCByPW5bM10uc3Vic3RyKDEpLnNwbGl0KFwiLlwiKTtoKGUuY2xhc3MpfHxkKGUuY2xhc3MpPyhlLmNsYXNzPWgoZS5jbGFzcyk/ZS5jbGFzczplLmNsYXNzLnNwbGl0KC9cXFcvKSxlLmNsYXNzPXIuY29uY2F0KGUuY2xhc3MpLnJlZHVjZSgoKHQsZSk9PigtMT09PXQuaW5kZXhPZihlKSYmdC5wdXNoKGUpLHQpKSxbXSkpOmYoZS5jbGFzcyk/ci5mb3JFYWNoKCh0PT57ZS5jbGFzc1t0XT0xfSkpOmUuY2xhc3M9cn1yZXR1cm4gdH0odCk7bGV0IHk9cj9kb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLHMpOmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQocyk7cmV0dXJuIGEobikmJih5PW4oeSxzLGksZyl8fHkpLGEoeSk/Qyh5KCkscixuKToobShpKXx8Tih5LGkscixuKSxhKHkub25jcmVhdGUpJiZ5Lm9uY3JlYXRlKHkpLGEoeS5lbnRlcikmJnkuZW50ZXIoKSx5LnJlbW92ZT0oKT0+UHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKCk9PmEoeS5vbmRlc3Ryb3kpJiZ5Lm9uZGVzdHJveSh5KSkpLnRoZW4oKCgpPT5hKHkudGVhcmRvd24pJiZ5LnRlYXJkb3duKCkpKS50aGVuKCgoKT0+YSh5LmV4aXQpJiZ5LmV4aXQoKSkpLnRoZW4oKCgpPT5QKHkpKSksZy5mb3JFYWNoKCh0PT57QSh5LHQscixuKX0pKSx5KX1mdW5jdGlvbiBBKHQsZSxuLHIpe2lmKGEoZSkmJihyPWUsZT10LHQ9dm9pZCAwKSxhKG4pJiYocj1uLG49bnVsbCksdShlKSYmKGU9dCx0PXZvaWQgMCksdHx8KHQ9ZG9jdW1lbnQuYm9keSksXCJzdHJpbmdcIj09dHlwZW9mIHQmJih0PWRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IodCkpLGgoZSkmJiF2KGUpKWUuZm9yRWFjaCgoZT0+e0EodCxlLG4scil9KSk7ZWxzZSBpZighdShlKSl7Y29uc3Qgbz1DKGUsbixyKTtyZXR1cm4oKHQsZSk9PntjLnZhbGlkKGUpP2UubW91bnQodCk6dC5hcHBlbmRDaGlsZChlKX0pKHQsbyksb31yZXR1cm4gdH1hc3luYyBmdW5jdGlvbiBMKHQsZSxuLHIsbyl7aWYoIXYoZSl8fGVbMF0hPT1uWzBdfHwxIT09dC5ub2RlVHlwZSl7Y29uc3QgZT1DKG4scixvKTtyZXR1cm4gYy52YWxpZChlKT9QKHQsZSk6dC5yZXBsYWNlV2l0aChlKSxlfXJldHVybiBUKHQsZVsxXXx8e30sblsxXXx8e30scixvKSYmKGEodC5vbnVwZGF0ZSkmJmF3YWl0IHQub251cGRhdGUodCksYSh0LnVwZGF0ZSkmJmF3YWl0IHQudXBkYXRlKCkpLG5bMV0mJm5bMV1bXCJAaHRtbFwiXT8odC5pbm5lckhUTUw9blsxXVtcIkBodG1sXCJdLHQpOlModCxlLnNsaWNlKDIpLG4uc2xpY2UoMikscixvKX1hc3luYyBmdW5jdGlvbiBfKHQsZSxuLHIsbyxzKXtjb25zdCBpPVtdLGE9dC5jaGlsZE5vZGVzO3Aobil8fChuPVtuXSkseShhLGUsbixzfHwwLCh0PT5pLnB1c2godCkpKTtjb25zdCBsPWkuZmlsdGVyKCh0PT50LnBhdGNoKSk7Zm9yKGNvbnN0IGUgb2YgaSlpZihlLnJtJiYhbC5maW5kKCh0PT50LnRhcmdldD09PWUucm0pKSYmYXdhaXQgJChlLnJtKSx1KGUucGF0Y2gpfHxhd2FpdCBEKGUudGFyZ2V0LGUucGF0Y2gsZS53aXRoLHIsbyksIXUoZS5hZGQpKXtjb25zdCBuPUMoZS5hZGQscixvKTtjLnZhbGlkKG4pP24ubW91bnQodCk6dC5hcHBlbmRDaGlsZChuKX19YXN5bmMgZnVuY3Rpb24gUyh0LGUsbixyLG8scyxpKXtyZXR1cm4gdC5fX3VwZGF0ZT90Ll9fdXBkYXRlKHQsZSxuLHIsbyxzLGkpOiFlfHx2KGUpJiZ2KG4pP0wodCxlLG4scixvKTp2KGUpPygxPT09bi5sZW5ndGgmJihuPW5bMF0pLFModCxbZV0sbixyLG8pKTp2KG4pP0wodCxlLG4scixvKTooYXdhaXQgXyh0LGUsbixyLG8scyksdCl9YXN5bmMgZnVuY3Rpb24gRCh0LGUsbixyLG8pe2lmKGF3YWl0IGFzeW5jIGZ1bmN0aW9uKHQsZSxuLHIpe2lmKGEoZVswXSkpe2NvbnN0IG89QyhlLG4scik7cmV0dXJuIGMudmFsaWQobyk/KFAodCxvKSx0KToodC5yZXBsYWNlV2l0aChvKSxvKX19KHQsbixyLG8pLHcoZSxuKSlpZigzPT09dC5ub2RlVHlwZSlpZih2KG4pKXQ9YXdhaXQgTCh0LGUsbixyLG8pO2Vsc2V7Zm9yKGxldCByPW4ubGVuZ3RoLWUubGVuZ3RoO3I+MDtyLS0pYXdhaXQgJCh0Lm5leHRTaWJsaW5nfHxudWxsKTtwKGUpJiZwKG4pP1AodCxDKG4scixvKSk6dC5ub2RlVmFsdWU9U3RyaW5nKG4pfWVsc2UgdD1hd2FpdCBMKHQsZSxuLHIsbyk7cmV0dXJuIHR9Y29uc3QgRj1bXTtmdW5jdGlvbiBNKCl7Y29uc3QgdD1GW0YubGVuZ3RoLTFdO2lmKCF0KXRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBpbnZva2UgaG9va3Mgb3V0c2lkZSBjcmVhdGVDb250ZXh0KClcIik7cmV0dXJuIHR9ZnVuY3Rpb24gSCh0KXtyZXR1cm4gbnVsbD09dH1mdW5jdGlvbiBSKHQpe3JldHVybiB0JiZmdW5jdGlvbih0KXtyZXR1cm4gbnVsbCE9PXQmJlwib2JqZWN0XCI9PXR5cGVvZiB0fSh0KT9BcnJheS5pc0FycmF5KHQpP3QubWFwKCh0PT5SKHQpKSk6dCBpbnN0YW5jZW9mIERhdGU/bmV3IERhdGUodC5nZXRUaW1lKCkpOnQgaW5zdGFuY2VvZiBSZWdFeHA/bmV3IFJlZ0V4cCh0LnNvdXJjZSx0LmZsYWdzKTpPYmplY3Qua2V5cyh0KS5yZWR1Y2UoKChlLG4pPT5PYmplY3QuYXNzaWduKGUse1tuXTpSKHRbbl0pfSkpLHt9KTp0fWZ1bmN0aW9uIHEodCxlKXtpZih0eXBlb2YgdD09dHlwZW9mIGUpe2lmKHQgaW5zdGFuY2VvZiBBcnJheSl7aWYodC5sZW5ndGghPT1lLmxlbmd0aClyZXR1cm47Zm9yKGxldCBuPTA7bjx0Lmxlbmd0aDtuKz0xKWlmKCFxKHRbbl0sZVtuXSkpcmV0dXJuO3JldHVybiEwfWlmKHQmJmUmJnQuY29uc3RydWN0b3I9PT1PYmplY3Qpe2NvbnN0IG49T2JqZWN0LmtleXModCkuc29ydCgpO2lmKCFxKG4sT2JqZWN0LmtleXMoZSkuc29ydCgpKSlyZXR1cm47Zm9yKGxldCByPTA7cjxuLmxlbmd0aDtyKz0xKWlmKCFxKHRbbltyXV0sZVtuW3JdXSkpcmV0dXJuO3JldHVybiEwfXJldHVybiB0PT09ZX19Y2xhc3MgQntjb25zdHJ1Y3Rvcih0LGUsbil7Y29uc3Qgcj10aGlzO2Z1bmN0aW9uIG8odCl7dHJ5e3IuZ2V0LmZvckVhY2goKGU9PntpZihlLm9mZiYmIWUub25jZSYmKGUub2ZmKCksZS5vZmY9bnVsbCksZS5vbmNlJiZlLmNiJiYhZS5vZmYpe2NvbnN0IHQ9ZS5jYigpO2Uub25jZT0hMSxcImZ1bmN0aW9uXCI9PXR5cGVvZiB0JiYoZS5vZmY9dCl9aWYobnVsbD09PXQmJmUub24mJmUuY2Ipe2NvbnN0IHQ9ZS5jYigpO2Uub249ITEsXCJmdW5jdGlvblwiPT10eXBlb2YgdCYmKGUub2ZmPXQpfSExPT09dCYmZS5vZmYmJihlLm9mZigpLGUub2ZmPW51bGwpfSkpfWNhdGNoKHQpe3JldHVybiBQcm9taXNlLnJlamVjdCh0KX19bGV0IHM7ZnVuY3Rpb24gaSh0KXt0LmNhdGNoKCh0PT57aWYoci5nZXQmJnNldFRpbWVvdXQoKCgpPT5vKCEwKSkpLCFyLm9uRXJyb3IpdGhyb3cgdDtyLm9uRXJyb3IodCl9KSkudGhlbigoKCk9PntzPW51bGx9KSl9ZnVuY3Rpb24gYyh0KXtyLmdldCYmaShQcm9taXNlLnJlc29sdmUobyh0KSkpfXIuYz0wLHIuZGVmZXI9dD0+UHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKCk9Pm5ldyBQcm9taXNlKChlPT5zZXRUaW1lb3V0KCgoKT0+ZShyKSksdCkpKSkpLHIuY2xlYXI9KCk9PntyLmdldCYmYyghMSl9LHIuc3luYz0oKT0+KHM9aShyLnNldCgpKSxzKSxyLnJ1bj1uKCgoKT0+KGZ1bmN0aW9uIG4oKXtyLnNldD1yLnNldHx8KCgpPT5Qcm9taXNlLnJlc29sdmUoKS50aGVuKCgoKT0+e3Eoci52YWwsci5vbGQpfHxuKCl9KSkpLHIub2xkPVIoci52YWwpLHIua2V5PTAsci5meD0wLHIubT0wLHIuYys9MSxmdW5jdGlvbih0KXtGLnB1c2godCl9KHIpO3RyeXtyLnJlc3VsdD1lKC4uLnQpO2NvbnN0IG49W3Iua2V5LHIuZngsci5tXS5qb2luKFwiLlwiKTtpZihyLmhhc2gpe2lmKHIuaGFzaCE9PW4pdGhyb3cgbmV3IEVycm9yKFwiSG9va3MgbXVzdCBiZSBjYWxsZWQgaW4gYSBwcmVkaWN0YWJsZSB3YXlcIil9ZWxzZSByLmhhc2g9bjtyZXR1cm4gci5yZXN1bHR9Y2F0Y2godCl7dGhyb3cgbmV3IEVycm9yKGBVbmV4cGVjdGVkIGZhaWx1cmUgaW4gY29udGV4dFxcbiR7dC5tZXNzYWdlfWApfWZpbmFsbHl7IWZ1bmN0aW9uKHQpe0ZbRi5pbmRleE9mKHQpXT1udWxsfShyKSxjKG51bGwpfX0oKSxyKSksKHQ9PntyLnNldD10fSkpfX1mdW5jdGlvbiBJKHQsZSl7Y29uc3Qgbj1NKCkscj1uLm07bi5tKz0xLG4udj1uLnZ8fFtdLG4uZD1uLmR8fFtdO2NvbnN0IG89bi5kW3JdO3JldHVybiFIKG8pJiZxKG8sZSl8fChuLnZbcl09dCgpLG4uZFtyXT1lKSxuLnZbcl19dmFyIEo9cSxXPUIsVT1mdW5jdGlvbih0LGU9KHQ9PnQoKSkpe2lmKFwiZnVuY3Rpb25cIiE9dHlwZW9mIHR8fFwiZnVuY3Rpb25cIiE9dHlwZW9mIGUpdGhyb3cgbmV3IFR5cGVFcnJvcihcIkludmFsaWQgaW5wdXQgZm9yIGNyZWF0ZUNvbnRleHQoKVwiKTtyZXR1cm4oLi4ubik9Pm5ldyBCKG4sdCxlKS5ydW59LFY9ZnVuY3Rpb24odCl7TSgpLm9uRXJyb3I9dH0sej1JLFo9ZnVuY3Rpb24odCl7cmV0dXJuIEkoKCgpPT57bGV0IGU9Uih0KTtyZXR1cm4gT2JqZWN0LmRlZmluZVByb3BlcnR5KHt9LFwiY3VycmVudFwiLHtjb25maWd1cmFibGU6ITEsZW51bWVyYWJsZTohMCxzZXQ6dD0+e2U9dH0sZ2V0OigpPT5lfSl9KSxbXSl9LEc9ZnVuY3Rpb24odCl7Y29uc3QgZT1NKCksbj1lLmtleTtyZXR1cm4gZS5rZXkrPTEsZS52YWw9ZS52YWx8fFtdLEgoZS52YWxbbl0pJiYoZS52YWxbbl09dCksW2UudmFsW25dLHQ9PihlLnZhbFtuXT1cImZ1bmN0aW9uXCI9PXR5cGVvZiB0P3QoZS52YWxbbl0pOnQsZS5zeW5jKCksZS52YWxbbl0pXX0sSz1mdW5jdGlvbih0LGUpe2NvbnN0IG49TSgpLHI9bi5meDtuLmZ4Kz0xLG4uaW49bi5pbnx8W10sbi5nZXQ9bi5nZXR8fFtdO2NvbnN0IG89bi5pbltyXSxzPSFlfHwhZS5sZW5ndGgsaT0hcyYmIXEobyxlKTtuLmluW3JdPWUsbi5nZXRbcl09bi5nZXRbcl18fHt9LE9iamVjdC5hc3NpZ24obi5nZXRbcl0se2NiOnQsb246aSxvbmNlOnN9KX07ZnVuY3Rpb24gUSh0LGUpe3JldHVybiBVKHQsKCh0LG4pPT5lKCgoLi4uZSk9PnQoLi4uZSkpLG4pKSl9ZnVuY3Rpb24gWCh0LGUsbixyKXtpZihsKHQpJiZhKHQucmVuZGVyKSl7Y29uc3Qgbz10O3Q9KHQsZSk9Pm8ucmVuZGVyKHQsZSxyKSxlPWEoby5zdGF0ZSk/by5zdGF0ZShlKTpvLnN0YXRlfHxlLG49T2JqZWN0LmtleXMobykucmVkdWNlKCgodCxlKT0+KCFpLmluY2x1ZGVzKGUpJiZhKG9bZV0pJiYodFtlXT0oLi4udCk9Pm9bZV0oLi4udCkpLHQpKSx7fSl9bGV0IG87cmV0dXJuIGEodCkmJnQucHJvdG90eXBlJiZhKHQucHJvdG90eXBlLnJlbmRlcikmJnQuY29uc3RydWN0b3I9PT1GdW5jdGlvbiYmdC5wcm90b3R5cGUuY29uc3RydWN0b3IhPT1GdW5jdGlvbiYmKG89bmV3IHQoZSxyKSxvLnByb3BzPUUoZXx8e30pLHQ9dD0+KG8uc3RhdGU9dCxvLnJlbmRlcigpKSxlPWEoby5zdGF0ZSk/by5zdGF0ZShlKTpvLnN0YXRlfHxlLG49ZnVuY3Rpb24odCl7Y29uc3QgZT1bXTtkb3tlLnB1c2godCl9d2hpbGUodD1PYmplY3QuZ2V0UHJvdG90eXBlT2YodCkpO3JldHVybiBlLnBvcCgpLGUucmVkdWNlKCgodCxlKT0+KE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGUpLmZvckVhY2goKG49PntpLmluY2x1ZGVzKG4pfHwhYShlW25dKXx8dC5pbmNsdWRlcyhuKXx8dC5wdXNoKG4pfSkpLHQpKSxbXSl9KG8pLnJlZHVjZSgoKHQsZSk9PntpZihcIl9cIiE9PWUuY2hhckF0KCkpe2NvbnN0IG49b1tlXS5iaW5kKG8pO3RbZV09KC4uLnQpPT4oKT0+biguLi50KSxvW2VdPSguLi5uKT0+dFtlXSguLi5uKX1yZXR1cm4gdH0pLHt9KSkse1RhZzp0LHN0YXRlOmUsYWN0aW9uczpuLGluc3RhbmNlOm99fWZ1bmN0aW9uIFkodCxlLG4scil7Y29uc3Qgbz1oKG4pP246dm9pZCAwO249bChuKT9uOnt9LGEoZSkmJihyPWUsZT1udWxsKTtjb25zdHtUYWc6cyxzdGF0ZTppLGFjdGlvbnM6YyxpbnN0YW5jZTp1fT1YKHQsZSxuLG8pO3JldHVybiF1JiZhKHQpJiYxPT09YXJndW1lbnRzLmxlbmd0aD9RKHQsWSk6KHQsZT1DLG49cik9Pntjb25zdCBvPUUoaXx8e30pLGQ9W107bGV0IGgscCxnO2Z1bmN0aW9uIG0oKXtsZXQgdD1zKEUobyksZyk7cmV0dXJuIGg9bnVsbCx0JiZ0IGluc3RhbmNlb2YgVyYmKGg9dCx0PXQucmVzdWx0KSx0fWFzeW5jIGZ1bmN0aW9uIHYodCl7cmV0dXJuIGF3YWl0IFByb21pc2UuYWxsKGQubWFwKCh0PT50KG8sZykpKSksZy50YXJnZXQ9YXdhaXQgUyhnLnRhcmdldCxwLHA9bSgpLG51bGwsZSksdH1yZXR1cm4gbiYmbigodD0+dihPYmplY3QuYXNzaWduKG8sdCkpKSksZz1PYmplY3Qua2V5cyhjKS5yZWR1Y2UoKCh0LGUpPT57Y29uc3Qgbj1jW2VdO2lmKCFhKG4pKXRocm93IG5ldyBFcnJvcihgSW52YWxpZCBhY3Rpb24sIGdpdmVuICR7bn0gKCR7ZX0pYCk7cmV0dXJuIHRbZV09KC4uLnQpPT57Y29uc3QgZT1uKC4uLnQpKG8sZyk7cmV0dXJuIGYoZSkmJmEoZS50aGVuKT9lLnRoZW4oKHQ9PmwodCk/dihPYmplY3QuYXNzaWduKG8sdCkpOnQpKToobChlKSYmdihPYmplY3QuYXNzaWduKG8sZSkpLGUpfSx1JiYodVtlXT10W2VdKSx0fSksT2JqZWN0LmNyZWF0ZShudWxsKSksZy5zdWJzY3JpYmU9dD0+KFByb21pc2UucmVzb2x2ZSh0KG8sZykpLnRoZW4oKCgpPT5kLnB1c2godCkpKSwoKT0+e2Quc3BsaWNlKGQuaW5kZXhPZih0KSwxKX0pLGcudGVhcmRvd249KCk9PmgmJmguY2xlYXIoKSxnLmRlZmVyPXQ9Pm5ldyBQcm9taXNlKCh0PT5rKHQpKSkudGhlbih0KSxnLnRhcmdldD1BKHQscD1tKCksbnVsbCxlKSxnLnVubW91bnQ9dD0+JChnLnRhcmdldCx0fHwhMSksT2JqZWN0LmRlZmluZVByb3BlcnR5KGcsXCJzdGF0ZVwiLHtjb25maWd1cmFibGU6ITEsZW51bWVyYWJsZTohMCxnZXQ6KCk9Pmh8fG99KSx1JiYoZy5pbnN0YW5jZT11KSxnfX1mdW5jdGlvbiB0dCh0LGUsbj1DKXtcImZ1bmN0aW9uXCI9PXR5cGVvZiBlJiYobj1lLGU9bnVsbCk7Y29uc3Qgcj17cmVmczp7fSxzdGFjazpbXSxyZW5kZXI6bixzb3VyY2U6bnVsbCx2bm9kZTp0fHxbXCJkaXZcIixudWxsXSx0aHVuazpZKCgoKT0+ci52bm9kZSksbnVsbCksZGVmZXI6dD0+bmV3IFByb21pc2UoKHQ9PmsodCkpKS50aGVuKHQpLHBhdGNoOih0LHIsbyk9PlModCxyLG8sZSxuKSx1bm1vdW50OmFzeW5jKCk9Pntjb25zdCB0PVtdO09iamVjdC5rZXlzKHIucmVmcykuZm9yRWFjaCgoZT0+e3IucmVmc1tlXS5mb3JFYWNoKChlPT57dC5wdXNoKGUudGFyZ2V0LnJlbW92ZSgpKX0pKX0pKSxhd2FpdCBQcm9taXNlLmFsbCh0KX0sbW91bnQ6YXN5bmModCxlKT0+KGF3YWl0IHIudW5tb3VudCgpLHIudm5vZGU9ZXx8ci52bm9kZSxyLnNvdXJjZT1yLnRodW5rKHQsci5yZW5kZXIpLHIpLGNsZWFyOigpPT57ci5zdGFjay5mb3JFYWNoKCh0PT50KCkpKX0sd3JhcDoodCxlKT0+e2lmKCFhKHQpKXRocm93IG5ldyBFcnJvcihgRXhwZWN0aW5nIGEgdmlldyBmYWN0b3J5LCBnaXZlbiAnJHt0fSdgKTtyZXR1cm4obixvKT0+e2NvbnN0IHM9ZXx8dC5uYW1lfHxcIlRodW5rXCIsaT1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwieC1mcmFnbWVudFwiKSxjPXQobixvKShpLHIucmVuZGVyKTtjLnRlYXJkb3duJiZyLnN0YWNrLnB1c2goYy50ZWFyZG93biksci5yZWZzW3NdPXIucmVmc1tzXXx8W10sci5yZWZzW3NdLnB1c2goYyk7Y29uc3QgYT1jLnRhcmdldC5yZW1vdmUuYmluZChjLnRhcmdldCk7cmV0dXJuIGMudGFyZ2V0LnJlbW92ZT1pLnJlbW92ZT1hc3luYyB0PT4oYy50ZWFyZG93biYmKGMudGVhcmRvd24oKSxyLnN0YWNrLnNwbGljZShyLnN0YWNrLmluZGV4T2YoYy50ZWFyZG93biksMSkpLHIucmVmc1tzXS5zcGxpY2Uoci5yZWZzW3NdLmluZGV4T2YoYyksMSksci5yZWZzW3NdLmxlbmd0aHx8ZGVsZXRlIHIucmVmc1tzXSxhKHQpKSxpfX19O3JldHVybiByfWZ1bmN0aW9uIGV0KHQsZSl7cmV0dXJuIHUodCk/W106Zih0KT9oKHQpP2IodCk6YihPYmplY3Qua2V5cyh0KS5yZWR1Y2UoKChuLHIpPT4odSh0W3JdKXx8bi5wdXNoKGUodFtyXSxyKSksbikpLFtdKSk6dH1mdW5jdGlvbiBudCh0KXtyZXR1cm4gZXQodCwoKHQsZSk9PnQ/ZTp2b2lkIDApKX1mdW5jdGlvbiBydCh0LGUsbixyKXtpZihmKHIpKXtpZihhKHIpKXJldHVybiByKG4sZSx0KTtpZihhKHJbZV0pKXJldHVybiByW2VdKG4sZSx0KX1mKG4pJiZmdW5jdGlvbih0LGUsbil7aChuKT90LnNldEF0dHJpYnV0ZShgZGF0YS0ke2V9YCxKU09OLnN0cmluZ2lmeShuKSk6YShuKXx8T2JqZWN0LmtleXMobikuZm9yRWFjaCgocj0+e2NvbnN0IG89ZChuW3JdKT9uW3JdOkpTT04uc3RyaW5naWZ5KG5bcl0pO3Quc2V0QXR0cmlidXRlKGAke1wiZGF0YVwiIT09ZT9cImRhdGEtXCI6XCJcIn0ke2V9LSR7cn1gLG8pfSkpfSh0LGUsbil9Y29uc3Qgb3Q9dD0+e3JldHVybihlPXQsZXQoZSwoKHQsZSk9PntyZXR1cm5gJHtuPWUsbi5yZXBsYWNlKC9bQS1aXS9nLFwiLSQmXCIpLnRvTG93ZXJDYXNlKCl9OiAke3R9YDt2YXIgbn0pKSkuam9pbihcIjsgXCIpO3ZhciBlfSxzdD10PT5udCh0KS5qb2luKFwiIFwiKSxpdD0odCxlLG4pPT57bltlXT1mdW5jdGlvbih0LGUpe3JldHVybigpPT5uZXcgUHJvbWlzZSgobj0+e2xldCByO2Z1bmN0aW9uIG8oKXt0LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJhbmltYXRpb25lbmRcIixvKSxlLm1hcCgoZT0+dC5jbGFzc0xpc3QucmVtb3ZlKGUpKSksY2xlYXJUaW1lb3V0KHIpLG4oKX1yPXNldFRpbWVvdXQobyw1MDApLHQuYWRkRXZlbnRMaXN0ZW5lcihcImFuaW1hdGlvbmVuZFwiLG8pLGsoKCgpPT57ZS5tYXAoKGU9PnQuY2xhc3NMaXN0LmFkZChlKSkpfSkpfSkpfShuLG50KHQpKX07ZnVuY3Rpb24gY3QodCl7cmV0dXJuIHQuY3VycmVudFRhcmdldC5ldmVudHNbdC50eXBlXSh0KX1mdW5jdGlvbiBhdCh0LGUsbixyKXtpZihhKG4pKWlmKHQuZXZlbnRzPXQuZXZlbnRzfHx7fSx0LnRlYXJkb3dufHwodC50ZWFyZG93bj0oKT0+e09iamVjdC5rZXlzKHQuZXZlbnRzKS5mb3JFYWNoKChlPT57dC5yZW1vdmVFdmVudExpc3RlbmVyKGUsY3QpLHQuZXZlbnRzW2VdPVtdfSkpfSksXCJvblwiPT09ZS5zdWJzdHIoMCwyKSYmLTE9PT1zLmluZGV4T2YoZSkpe2NvbnN0IG89ZS5zdWJzdHIoMik7dC5ldmVudHNbb118fHQuYWRkRXZlbnRMaXN0ZW5lcihvLGN0LCExKSx0LmV2ZW50c1tvXT10PT5mdW5jdGlvbih0LGUsbixyKXtsZXQgbztmKHIpJiYoYShyKT9vPSExPT09cihlLHQpOmEocltlXSkmJihvPSExPT09cltlXSh0KSkpLG98fG4odCl9KHQsZSxuLHIpfWVsc2Uocy5pbmRleE9mKGUpPi0xP3Q6dC5ldmVudHMpW2VdPW59Y29uc3QgdXQ9bmV3IE1hcDtmdW5jdGlvbiBsdCh0KXtpZighcCh0KSl0aHJvdyBuZXcgRXJyb3IoYEZyYWdtZW50cyBzaG91bGQgYmUgbGlzdHMgb2Ygbm9kZXMsIGdpdmVuICcke0pTT04uc3RyaW5naWZ5KHQpfSdgKX1sZXQgZnQ9W107Y2xhc3MgZHR7Y29uc3RydWN0b3IodCxlLG49Qyl7dCBpbnN0YW5jZW9mIHdpbmRvdy5IVE1MRWxlbWVudD8odGhpcy5wcm9wcz17fSx0aGlzLnZub2RlPWUsdGhpcy50YXJnZXQ9dCx0aGlzLnJlbmRlcj1uKToodGhpcy50YXJnZXQ9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0LnRhZ3x8XCJ4LWZyYWdtZW50XCIpLGRlbGV0ZSB0LnRhZyx0aGlzLnByb3BzPXt9LHRoaXMudm5vZGU9bnVsbCx0aGlzLnJlbmRlcj1uLHRoaXMudG91Y2godCxlKSksdGhpcy50YXJnZXQuX191cGRhdGU9KHQsZSxuKT0+e3RoaXMudm5vZGU9ZSx0aGlzLnBhdGNoKG4pfTtsZXQgcj1Qcm9taXNlLnJlc29sdmUoKTtPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcyxcIl9fZGVmZXJcIix7c2V0OnQ9PnIudGhlbigoKCk9PntyPXR9KSksZ2V0OigpPT5yfSl9YXN5bmMgdXBkYXRlKHQpe3RyeXt0aGlzLnBhdGNoKHQpLGF3YWl0IHgoKX1maW5hbGx5e2F3YWl0IHRoaXMuX19kZWZlcn1yZXR1cm4gdGhpc31wcmVwZW5kKHQpe3JldHVybiB0aGlzLnN5bmModCwtMSl9YXBwZW5kKHQpe3JldHVybiB0aGlzLnN5bmModCwxKX1wYXRjaCh0KXtpZih0aGlzLnZub2RlKXRoaXMuX19kZWZlcj1fKHRoaXMudGFyZ2V0LHRoaXMudm5vZGUsdGhpcy52bm9kZT10LG51bGwsdGhpcy5yZW5kZXIpO2Vsc2V7Y29uc3QgZT10aGlzLnJlbmRlcih0aGlzLnZub2RlPXQpLG49dGhpcy50YXJnZXQuZmlyc3RDaGlsZDtlLmNoaWxkTm9kZXMuZm9yRWFjaCgodD0+dGhpcy50YXJnZXQuaW5zZXJ0QmVmb3JlKHQsbikpKX1yZXR1cm4gdGhpc310b3VjaCh0LGUpe3JldHVybiBkZWxldGUgdC50YWcsbHQoZSksVCh0aGlzLnRhcmdldCx0aGlzLnByb3BzLHQsbnVsbCx0aGlzLnJlbmRlciksdGhpcy5wYXRjaChlKX1hc3luYyBzeW5jKHQsZSl7aWYobHQodCksZXx8YXdhaXQgdGhpcy5wYXRjaCh0KSx0aGlzLm1vdW50ZWQpe2U8MD90aGlzLnZub2RlLnVuc2hpZnQoLi4udCk6dGhpcy52bm9kZS5wdXNoKC4uLnQpO2NvbnN0IG49dGhpcy5yZW5kZXIodCk7ZTwwP2F3YWl0IG4ubW91bnQodGhpcy50YXJnZXQsdGhpcy50YXJnZXQuZmlyc3RDaGlsZCk6YXdhaXQgbi5tb3VudCh0aGlzLnRhcmdldCl9cmV0dXJuIHRoaXN9Z2V0IHJvb3QoKXtyZXR1cm4gdGhpcy50YXJnZXQmJnRoaXMudGFyZ2V0LnBhcmVudE5vZGV9Z2V0IG1vdW50ZWQoKXtyZXR1cm4hISh0aGlzLnJvb3QmJnRoaXMucm9vdC5pc0Nvbm5lY3RlZCYmdGhpcy50YXJnZXQuaXNDb25uZWN0ZWQpfXN0YXRpYyBhc3luYyB3aXRoKHQsZSl7Y29uc3Qgbj1kdC5nZXQodCkscj1hd2FpdCBlKG4pO3JldHVyblwiZnVuY3Rpb25cIj09dHlwZW9mIHImJmZ0LnB1c2gociksbn1zdGF0aWMgZnJvbSh0LGUsbil7bGV0IHI7cmV0dXJuXCJzdHJpbmdcIj09dHlwZW9mIHQ/cj11dC5nZXQodCk6dXQuaGFzKHQubmFtZSk/cj11dC5nZXQodC5uYW1lKS50b3VjaCh0LGUpOnV0LnNldCh0Lm5hbWUscj1uZXcgZHQodCxlLG4pKSxyfXN0YXRpYyBzdG9wKCl7dHJ5e2Z0LmZvckVhY2goKHQ9PnQoKSkpfWZpbmFsbHl7ZnQ9W119fXN0YXRpYyBkZWwodCl7dXQuZGVsZXRlKHQpfXN0YXRpYyBoYXModCl7cmV0dXJuIHV0Lmhhcyh0KSYmdXQuZ2V0KHQpLm1vdW50ZWR9c3RhdGljIGdldCh0KXtyZXR1cm4gdXQuZ2V0KHQpfX1jb25zdCBodD0odD1cImRpdlwiLGU9bnVsbCwuLi5uKT0+ZChlKT9bdCxudWxsLFtlXS5jb25jYXQobikuZmlsdGVyKCh0PT4hdSh0KSkpXTpoKGUpP1t0LG51bGwsZV06W3QsZXx8bnVsbCxuXSxwdD0odCxlLG49Qyk9Pm4oW1wicHJlXCIse2NsYXNzOlwiaGlnaGxpZ2h0XCJ9LE8obih0LGUpLm91dGVySFRNTCldLGUpLGd0PSh0LC4uLmUpPT57Y29uc3Qgbj1iKGUsYSkscj0oLi4udCk9Pm4ucmVkdWNlKCgoZSxuKT0+biguLi50KXx8ZSksdm9pZCAwKSxvPSguLi5lKT0+ZS5sZW5ndGg8PTI/dChlWzBdLGVbMV0scik6ciguLi5lKSxzPSgpPT5kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwieC1mcmFnbWVudFwiKTtyZXR1cm4gby50YWdzPXIudGFncz1PYmplY3QuYXNzaWduKHt9LC4uLmIoZSwodD0+aCh0KXx8bCh0KSkpLnJlZHVjZSgoKHQsZSk9PnQuY29uY2F0KGUpKSxbXSkuZmlsdGVyKGwpKSxvLnZpZXc9KHQsZSk9PntmdW5jdGlvbiBuKGUscixpKXtyZXR1cm4haSYmaChyKSYmKGk9cixyPWV8fG51bGwsZT1udWxsKSx0aGlzIGluc3RhbmNlb2Ygbj8odShyKSYmKHI9ZSxlPW51bGwpLFkodCkocixpKShlLG8pKTpZKHQpKHIsaSkoZXx8cygpLG8pfXJldHVybiBPYmplY3QuZGVmaW5lUHJvcGVydHkobixcIm5hbWVcIix7dmFsdWU6ZXx8dC5uYW1lfHxcIlZpZXdcIn0pLG59LG8udGFnPSh0LGUpPT57Y29uc3Qgbj1vLnZpZXcodCxlKTtyZXR1cm4odCxlKT0+bihzKCksdCxlKS50YXJnZXR9LG99LG10PXQ9PmooYXQsMyx0KSx2dD10PT5qKHJ0LDMsdCk7ZXhwb3J0e2R0IGFzIEZyYWdtZW50TGlzdCxpdCBhcyBhbmltYXRpb24sdnQgYXMgYXR0cmlidXRlcyxndCBhcyBiaW5kLHN0IGFzIGNsYXNzZXMsVSBhcyBjcmVhdGVDb250ZXh0LEogYXMgZXF1YWxzLE8gYXMgZm9ybWF0LGh0IGFzIGgsbXQgYXMgbGlzdGVuZXJzLEEgYXMgbW91bnQsViBhcyBvbkVycm9yLFMgYXMgcGF0Y2gscHQgYXMgcHJlLGsgYXMgcmFmLEMgYXMgcmVuZGVyLG90IGFzIHN0eWxlcyx0dCBhcyB0aHVuayx4IGFzIHRpY2ssJCBhcyB1bm1vdW50LEsgYXMgdXNlRWZmZWN0LHogYXMgdXNlTWVtbyxaIGFzIHVzZVJlZixHIGFzIHVzZVN0YXRlLFkgYXMgdmlld307XG4iLCAiZXhwb3J0IGRlZmF1bHQgXCIjIUBAbG9jYXRlPC9ob21lL3J1bm5lci93b3JrL3BsYXRlL3BsYXRlL3NyYy9yZXNvdXJjZXMvaW1hZ2VzLzEyaW5jaGVzX3NtYWxsLnBuZz5cIiIsICJpbXBvcnQgeyByZW5kZXIgfSBmcm9tICdzb21lZG9tJztcbmltcG9ydCB1cmwgZnJvbSAnLi4vaW1hZ2VzLzEyaW5jaGVzX3NtYWxsLnBuZyc7XG5cbnRhcmdldC5hcHBlbmRDaGlsZChyZW5kZXIoWydpbWcnLCB7IHNyYzogdXJsIH1dKSk7XG4iXSwKICAibWFwcGluZ3MiOiAiQUFBQSxJQUFxREEsRUFBRSwrQkFBK0JDLEVBQUUsZ0RBQTZKQyxFQUFOLEtBQU8sQ0FBQyxhQUFhLENBQUMsS0FBSyxXQUFXLENBQUMsRUFBRSxLQUFLLFNBQVMsR0FBRyxLQUFLLE9BQU8sQ0FBQyxDQUFDLFlBQVksRUFBRSxDQUFDQSxFQUFFLE1BQU0sQ0FBQyxFQUFFLEVBQUUsV0FBVyxRQUFTQyxHQUFHLENBQUMsS0FBSyxZQUFZQSxDQUFDLENBQUMsQ0FBRSxHQUFHLEtBQUssV0FBVyxLQUFLLENBQUMsRUFBRSxLQUFLLFFBQVEsRUFBRSxDQUFDLHFCQUFxQixDQUFDLElBQU0sRUFBRSxTQUFTLHVCQUF1QixFQUFFLE9BQU8sS0FBSyxXQUFXLFFBQVNDLEdBQUcsRUFBRSxZQUFZQSxDQUFDLENBQUUsRUFBRSxLQUFLLFdBQVcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUVBLEVBQUUsQ0FBQyxHQUFHLE9BQU8saUJBQWlCLEtBQUssQ0FBQyxXQUFXLENBQUMsYUFBYSxHQUFHLE1BQU0sQ0FBQyxFQUFFLFlBQVksQ0FBQyxhQUFhLEdBQUcsTUFBTSxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFNQyxFQUFFLEtBQUssb0JBQW9CLEVBQUVELEVBQUUsRUFBRSxhQUFhQyxFQUFFRCxDQUFDLEVBQUUsRUFBRSxZQUFZQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLE1BQU0sRUFBRSxDQUFDLEdBQUcsYUFBYUgsRUFBRSxNQUFNLEVBQUUsQ0FB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QUFFRCxDQUFDLElBQUlMLEVBQUVLLEVBQUVBLEVBQUUsTUFBTUUsRUFBRUgsQ0FBQyxJQUFJQSxFQUFFRCxFQUFFQSxFQUFFLFFBQVFBLElBQUlBLEVBQUUsU0FBUyxNQUFnQixPQUFPQSxHQUFqQixXQUFxQkEsRUFBRSxTQUFTLGNBQWNBLENBQUMsR0FBR1EsRUFBRVAsQ0FBQyxHQUFHLENBQUNTLEVBQUVULENBQUMsRUFBRUEsRUFBRSxRQUFTQSxHQUFHLENBQUNrQixFQUFFbkIsRUFBRUMsRUFBRUMsRUFBRUwsQ0FBQyxDQUFDLENBQUUsVUFBVSxDQUFDTyxFQUFFSCxDQUFDLEVBQUUsQ0FBQyxJQUFNSCxFQUFFa0IsRUFBRWYsRUFBRUMsRUFBRUwsQ0FBQyxFQUFFLE9BQU8sQ0FBQ0csRUFBRUMsSUFBSSxDQUFDRixFQUFFLE1BQU1FLENBQUMsRUFBRUEsRUFBRSxNQUFNRCxDQUFDLEVBQUVBLEVBQUUsWUFBWUMsQ0FBQyxDQUFDLEdBQUdELEVBQUVGLENBQUMsRUFBRUEsRUFBRSxPQUFPRSxDQUFDLENDQTE3SyxJQUFPb0IsRUFBUSw0QkFBQSxPQUFBLFlBQUEsRUFBQSxDQUFBLE1BQUEsQ0FBQSxJQUFBUixDQUFBLENBQUEsQ0FBQSxDQUFBIiwKICAibmFtZXMiOiBbInIiLCAibyIsICJjIiwgInQiLCAiZSIsICJuIiwgImEiLCAidSIsICJsIiwgImYiLCAiZCIsICJoIiwgInAiLCAidiIsICJtIiwgIlAiLCAiTiIsICJzIiwgImkiLCAiQyIsICJnIiwgInkiLCAiQSIsICJpbmNoZXNfc21hbGxfZGVmYXVsdCJdCn0K
