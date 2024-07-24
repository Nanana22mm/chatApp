<script setup>
import { inject, ref } from "vue"
import { useRouter } from "vue-router"
import socketManager from '../socketManager.js'

// #region global state
const userName = inject("userName")
// #endregion

// #region local variable
const router = useRouter()
const socket = socketManager.getInstance()
// #endregion

// #region reactive variable
const inputUserName = ref("")
// #endregion

// #region browser event handler
// 入室メッセージをクライアントに送信する
const onEnter = (data) => {
  // ユーザー名が入力されているかチェック
<<<<<<< HEAD
  if (!data) {
    return // TODO: error dialog
  }

  // 入室メッセージを送信
  
=======
  if (!inputUserName.value) {
    alert("ユーザー名を入力してください。")
    return
  }
  // 入室メッセージを送信
  socket.emit("enterEvent", inputUserName.value)
>>>>>>> f2ec4b0 (入室と退室の表示)

  // 全体で使用するnameに入力されたユーザー名を格納
  userName.value = inputUserName.value
  
  // チャット画面へ遷移
  router.push({ name: "chat" })
}
// #endregion
</script>

<template>
  <div class="mx-auto my-5 px-4">
    <h1 class="text-h3 font-weight-medium">Vue.js Chat サンプル</h1>
    <div class="mt-10">
      <p>ユーザー名</p>
      <input v-model="inputUserName" type="text" class="user-name-text" />
    </div>
    <button type="button" @click="onEnter" class="button-normal">入室する</button>
  </div>
</template>

<style scoped>
.user-name-text {
  width: 200px;
  border: 1px solid #888;
  margin-bottom: 16px;
}
</style>
