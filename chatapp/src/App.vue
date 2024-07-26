<script setup>
import { provide, ref } from "vue"

// #region reactive state
const userName = ref("")
const roomName = ref("")
// #endregion

// #region global variable
provide("userName", userName)
provide("roomName", roomName)
// #endregion
</script>

<template>
  <router-view />
</template>

<style scoped>
</style>
