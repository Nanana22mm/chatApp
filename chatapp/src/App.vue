<script setup>
import { provide, ref } from "vue"

const userName = ref("")
const roomName = ref("")

provide("userName", userName)
provide("roomName", roomName)
</script>

<template>
  <router-view />
</template>

<style scoped>
</style>
