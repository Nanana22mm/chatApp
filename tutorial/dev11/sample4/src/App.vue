<script setup>
const handleClick = () => {
  alert("ボタンがクリックされました")
}
const handleMouseOver = () => {
  alert("ボタンがマウスオーバーされました")
}
</script>

<template>
  <h1>Sample4</h1>
  <button @click="handleClick">Click</button>
  <button @click="handleMouseOver">MouseOver</button>
</template>




