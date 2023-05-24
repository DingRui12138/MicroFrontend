<template>
  <nav>
    <p>vue global red nav</p>
    <router-link to="/vue-app">Home</router-link> |
    <router-link to="/vue-app/about">About</router-link>
  </nav>
  <div>count: {{ count }}</div>

  <button @click="() => onIncrease()">+</button>
  <router-view />
</template>

<script lang="ts" setup>
import { defineProps, onMounted, ref } from 'vue'

const props = defineProps<{ name: string }>()
const count = ref<number>((window as any).count ?? 0)
const setCount = (v: number) => {
  count.value = v
  ;(window as any).count = v
}

const onIncrease = () => {
  setCount(count.value + 1)
}

onMounted(() => {
  console.log('🚀 ~ file: App.vue:20 ~ onMounted ~ props, window', props, window)
})
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

nav {
  padding: 30px;
  background-color: red;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
}

nav a.router-link-exact-active {
  color: #42b983;
}
</style>
