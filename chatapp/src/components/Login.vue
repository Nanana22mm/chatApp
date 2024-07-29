<script setup>
import { inject, ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import socketManager from '../socketManager.js'

// #region global state
const userName = inject("userName")
const roomName = inject("roomName")

// #endregion

// #region local variable
const router = useRouter()
const socket = socketManager.getInstance()
// #endregion

// #region reactive variable
const inputUserName = ref("")
const selectedRoomName = ref("")
const newRoomName = ref("")
const chatRooms = ref([])

//roomの取得
onMounted(() => {
  socket.emit('getRooms')
  socket.on('roomList', (rooms) => {
    chatRooms.value = rooms
  })
})

// #endregion



// #region browser event handler
// 入室メッセージをクライアントに送信する
const onEnter = (data) => {
  // ユーザー名が入力されているかチェック
  if (!inputUserName.value) {
    alert("ユーザー名を入力してください。")
    return
  }
  // ルーム名が入力されているかチェック
  let room = selectedRoomName.value || newRoomName.value
  if (!room) {
    alert("チャットルームを選択するか、新しいチャットルームを作成してください。")
    return
  }
  // 新しいルームの作成
  if (newRoomName.value) {
    socket.emit('createRoom', newRoomName.value)
    socket.on('createRoomSuccess', (flag) => {
      if (!flag){
        alert("このチャットルームはすでに存在します。")
      }
    })
  }

  // 入室メッセージを送信
  socket.emit("enterEvent", inputUserName.value, room)

  // 全体で使用するname, roomに入力されたユーザー名, ルーム名を格納
  userName.value = inputUserName.value
  roomName.value = room
  
  // チャット画面へ遷移
  router.push({ name: "chat", params: { roomName: room }})
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
    <div class="mt-10">
      <p>既存のチャットルームを選択</p>
      <select v-model="selectedRoomName" class="user-name-text">
        <option value="">チャットルームを選択</option>
        <option v-for="room in chatRooms" :key="room" :value="room">{{ room }}</option>
      </select>
    </div>
    <div class="mt-10">
      <p>新しいチャットルーム名</p>
      <input v-model="newRoomName" type="text" class="user-name-text" placeholder="新しいチャットルームを作成" />
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
