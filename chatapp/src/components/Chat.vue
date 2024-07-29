<script setup>
import { inject, ref, reactive, onMounted } from "vue";
import { useRouter } from 'vue-router';
import socketManager from '../socketManager.js';

const userName = inject('userName', ref(''));
const router = useRouter();
const socket = socketManager.getInstance();
const chatContent = ref('');
const chatList = reactive([]);
const showModal = ref(false);

onMounted(() => {
  registerSocketEvent();
})

// 投稿メッセージをサーバに送信する
const onPublish = () => {
  if (!chatContent.value || chatContent.value.match(/^\s*$/g)) {
    alert("投稿を入力してください。")
    return
  }
  const chatTime = new Date()
  var Time = chatTime.getFullYear() + '/' + ('0' + (chatTime.getMonth() + 1)).slice(-2) + '/' +('0' + chatTime.getDate()).slice(-2) + ' ' +  ('0' + chatTime.getHours()).slice(-2) + ':' + ('0' + chatTime.getMinutes()).slice(-2);

  socket.emit("publishEvent", Time, userName.value, chatContent.value)

  // 入力欄を初期化
  chatContent.value = ""
}

// 退室メッセージをサーバに送信する
const onExit = () => {
  showModal.value = false;
  socket.emit("exitEvent", userName.value);
}

// メモを画面上に表示する
const onMemo = () => {
  if (!chatContent.value || chatContent.value.match(/^\s*$/g)) {
    alert("メモを入力してください。")
    return
  }

  const chatTime = new Date()
  var Time = chatTime.getFullYear() + '/' + ('0' + (chatTime.getMonth() + 1)).slice(-2) + '/' +('0' + chatTime.getDate()).slice(-2) + ' ' +  ('0' + chatTime.getHours()).slice(-2) + ':' + ('0' + chatTime.getMinutes()).slice(-2);

  // メモの内容を表示
  chatList.unshift(`${userName.value}さんのメモ [${Time}]: ` + chatContent.value)

  // 入力欄を初期化
  chatContent.value = ""
}

// サーバから受信した入室メッセージ画面上に表示する
const onReceiveEnter = (data) => {
  chatList.unshift(`${data}さんが入室しました。`)
}

// サーバから受信した退室メッセージを受け取り画面上に表示する
const onReceiveExit = (data) => {
  chatList.unshift(`${data}さんが退室しました。`)
}

// サーバから受信した投稿メッセージを画面上に表示する
const onReceivePublish = (time, name, data) => {
  chatList.unshift(`${name}さんの投稿 [${time}]: ${data}`)
}

// イベント登録をまとめる
const registerSocketEvent = () => {
  // 入室イベントを受け取ったら実行
  socket.on("enterEvent", (data) => {
    onReceiveEnter(data)
  })

  // 退室イベントを受け取ったら実行
  socket.on("exitEvent", (data) => {
    onReceiveExit(data)
  })

  // 投稿イベントを受け取ったら実行
  socket.on("publishEvent", (time, name, data) => {
    onReceivePublish(time, name, data)
  })
}
/*Open Modal*/
const openModal = () => {
  showModal.value = true;
}
/*Close Modal*/
const closeModal = () => {
  showModal.value = false;
}
</script>

<template>
  <!--Modal Window-->
  <div id="app">
    <div v-if="showModal" id="overlay" @click="closeModal">
      <div id="content" @click.stop>
        <p id="modal-message">本当に退室しますか？</p>
        <div class="d-flex justify-content-end">
          <router-link to="/" class="link">
            <button class="btn btn-primary" @click="onExit">はい</button>
          </router-link>
          <p>　</p>
          <button class="btn btn-secondary" @click="closeModal">いいえ</button>
        </div>
      </div>
    </div>
  <!--End Modal Window-->

  <div class="mx-auto my-5 px-4">
    <h1 class="text-h3 font-weight-medium">Vue.js Chat チャットルーム</h1>
    <div class="mt-10">
      <p>ログインユーザ：{{ userName }}さん</p>
      <textarea variant="outlined" placeholder="投稿文を入力してください" rows="4" class="area" v-model="chatContent"></textarea>
      <div class="mt-5">
        <button class="button-normal" @click="onPublish">投稿</button>
        <button class="button-normal util-ml-8px"  @click="onMemo">メモ</button>
      </div>
      <div class="mt-5" v-if="chatList.length !== 0">
        <ul>
          <li class="item mt-4" v-for="(chat, i) in chatList" :key="i">{{ chat }}</li>
        </ul>
      </div>
    </div>
    <button type="button" class="button-normal button-exit" @click="openModal">退室する</button>
  </div>
</div>
</template>

<style scoped>
.link {
  text-decoration: none;
}

.area {
  width: 500px;
  border: 1px solid #000;
  margin-top: 8px;
}

.item {
  display: block;
  white-space: pre-line;
}

.util-ml-8px {
  margin-left: 8px;
}

.button-exit {
  color: #000;
  margin-top: 8px;
}
/*Modal CSS*/
#overlay{
  z-index:1;
  position:fixed;
  top:0;
  left:0;
  width:100%;
  height:100%;
  background-color:rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}
#content{
  z-index:2;
  width:50%;
  padding: 1em;
  background:#fff;
  border-radius: 15px;
}
#modal-message{
  font-weight: bold;
  font-size: larger; 
}
</style>