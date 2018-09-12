import App from './components/App';

/* global Vue */

const vm = new Vue({
  el: '#app',
  render(h) {
    return h(App);
  },
});

console.log(vm);
