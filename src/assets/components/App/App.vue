<template>
  <div>
    <h1>Counter {{value}}</h1>
    <button @click="dec">-</button>
    <button @click="inc">+</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      value: 0,
    };
  },
  methods: {
    inc() {
      this.value += 1;
    },
    dec() {
      this.value -= 1;
    },
  }
}
</script>
