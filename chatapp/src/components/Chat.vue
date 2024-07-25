<script setup>
import { inject, ref, reactive, onMounted } from "vue";
import { useRouter } from 'vue-router';
import socketManager from '../socketManager.js';

const userName = inject('userName', ref(''));
const router = useRouter();
const socket = socketManager.getInstance();
const chatContent = ref('');
const chatList = reactive([]);

onMounted(() => {
  registerSocketEvent();
})

// 投稿メッセージをサーバに送信する
const onPublish = () => {

  if (!chatContent.value) return

  //投稿時の処理
  const  message = { user: userName.value, content: chatContent.value };
  socket.emit( 'publishEvent', message );

  //投稿後メッセージ入力欄を空にする
  chatContent.value = '';
}

// 退室メッセージをサーバに送信する
const onExit = () => {
  socket.emit('existEvent', userName.value );
  router.push({ name: 'enter'});
}

// メモを画面上に表示する
const onMemo = () => {
  // 入力が空の場合の処理
  if (!chatContent.value) return

  // メモの内容を表示
  chatList.push(chatContent.value);

  // 入力欄を初期化
  chatContent.value = '';
}

// サーバから受信した入室メッセージ画面上に表示する
const onReceiveEnter = (data) => {
  chatList.push(`${data}さんが入室しました。`);
}

// サーバから受信した退室メッセージを受け取り画面上に表示する
const onReceiveExit = (data) => {
  chatList.push(`${data}さんが退出しました。`);
}

// サーバから受信した投稿メッセージを画面上に表示する
const onReceivePublish = (data) => {
  chatList.push(`${data.user}さん: ${data.content}`);
}

// イベント登録をまとめる
const registerSocketEvent = () => {
  // 入室イベントを受け取ったら実行
  socket.on("enterEvent", onReceiveEnter);
  // 退室イベントを受け取ったら実行
  socket.on("exitEvent", onReceiveExit);
  // 投稿イベントを受け取ったら実行
  socket.on("publishEvent", onReceivePublish);
}

</script>

<template>
  <div class="mx-auto my-5 px-4">
    <h1 class="text-h3 font-weight-medium">Vue.js Chat チャットルーム</h1>
    <div class="mt-10">
      <p>ログインユーザ：{{ userName }}さん</p>
      <textarea v-model="chatContent" variant="outlined" placeholder="投稿文を入力してください" rows="4" class="area"></textarea>
      <div class="mt-5">
        <button @click="onPublish" class="button-normal">投稿</button>
        <button @click="onMemo" class="button-normal util-ml-8px">メモ</button>
      </div>
      <div class="mt-5" v-if="chatList.length !== 0">
        <ul>
          <li class="item mt-4" v-for="(chat, i) in chatList" :key="i">{{ chat }}</li>
        </ul>
      </div>
    </div>
    <router-link to="/" class="link">
      <button type="button" class="button-normal button-exit" @click="onExit">退室する</button>
    </router-link>
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
}

.util-ml-8px {
  margin-left: 8px;
}

.button-exit {
  color: #000;
  margin-top: 8px;
}
</style>