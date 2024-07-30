<script setup>
import { inject, ref, reactive, onMounted } from "vue"
import socketManager from '../socketManager.js'

// #region global state
const userName = inject("userName")
// #endregion

// #region local variable
const socket = socketManager.getInstance()
// #endregion

// #region reactive variable
const chatContent = ref("")
const chatList = reactive([])
// #endregion

// #region lifecycle
onMounted(() => {
  registerSocketEvent()
})
// #endregion

// #region browser event handler
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
  socket.emit("exitEvent", userName.value)
}

// メモを画面上に表示する
const onMemo = () => {
  if (!chatContent.value || chatContent.value.match(/^\s*$/g)) {
    alert("メモを入力してください。")
    return
  }

  const chatTime = new Date()
  var Time = chatTime.getFullYear() + '/' + ('0' + (chatTime.getMonth() + 1)).slice(-2) + '/' +('0' + chatTime.getDate()).slice(-2) + ' ' +  ('0' + chatTime.getHours()).slice(-2) + ':' + ('0' + chatTime.getMinutes()).slice(-2);

  // // メモの内容を表示
  // chatList.unshift(`${userName.value}さんのメモ [${Time}]: ` + chatContent.value)
  chatList.unshift({
    time: Time,
    user: userName.value,
    content: chatContent.value,
    type: "memo"
  })

  // 入力欄を初期化
  chatContent.value = ""
}

// メモを削除する
const onDeleteMemo = (index) => {
  chatList.splice(index, 1)
}

// メモを編集する
const onEditMemo = (index) => {
  const newContent = prompt("メモを編集してください：", chatList[index].content)
  if (newContent !== null && newContent !== "") {
    chatList[index].content = newContent
  }
}
// #endregion

// #region socket event handler
// サーバから受信した入室メッセージ画面上に表示する
const onReceiveEnter = (name) => {
  const chatTime = new Date()
  var Time = chatTime.getFullYear() + '/' + ('0' + (chatTime.getMonth() + 1)).slice(-2) + '/' +('0' + chatTime.getDate()).slice(-2) + ' ' +  ('0' + chatTime.getHours()).slice(-2) + ':' + ('0' + chatTime.getMinutes()).slice(-2);

  chatList.unshift({
    time: Time,
    user: name,
    content: `入室しました。`,
    type: "system"
  })
}

// サーバから受信した退室メッセージを受け取り画面上に表示する
const onReceiveExit = (name) => {
  const chatTime = new Date()
  var Time = chatTime.getFullYear() + '/' + ('0' + (chatTime.getMonth() + 1)).slice(-2) + '/' +('0' + chatTime.getDate()).slice(-2) + ' ' +  ('0' + chatTime.getHours()).slice(-2) + ':' + ('0' + chatTime.getMinutes()).slice(-2);

  chatList.unshift({
    time: Time,
    user: name,
    content: `退室しました。`,
    type: "system"
  })
}

// サーバから受信した投稿メッセージを画面上に表示する
const onReceivePublish = (time, name, data) => {
  // chatList.unshift(`${name}さんの投稿 [${time}]: ${data}`)
  chatList.unshift({
    time: time,
    user: name,
    content: data,
    type: "publish"
  })
}

// 投稿を削除する
const onDeletePublish = (index) => {
  chatList.splice(index, 1);
  socket.emit("deletePublishEvent", {
      index: index
    });
}

// 投稿を編集する
const onEditPublish = (index) => {
  const newContent = prompt("投稿を編集してください：", chatList[index].content)
  if (newContent !== null && newContent !== "") {
    chatList[index].content = newContent;
    socket.emit("editPublishEvent", {
      index: index,
      newContent: newContent
    });
  }
}

// #endregion

// #region local methods
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

  // 編集された投稿を受信して更新する
  socket.on("receiveEditPublishEvent", function(data) {
    if (chatList[data.index]) {
      chatList[data.index].content = data.newContent;
    }
  })

  socket.on("receiveDelitePublishEvent", function(data) {
    if (chatList[data.index]) {
      chatList[data.index].content = data.newContent;
    }
  })

  socket.on("receiveDeletePublishEvent", (data) => {
    if (chatList[data.index]) {
      chatList.splice(data.index, 1);
    }
  })
}
// #endregion
</script>

<template>
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
          <li v-for="(chat, i) in chatList" :key="i">
            <template v-if="chat.type === 'memo'">
              {{ chat.user }}さんのメモ [{{ chat.time }}]: {{ chat.content }}
              <button @click="onEditMemo(i)">編集</button>
              <button @click="onDeleteMemo(i)">削除</button>
            </template>
            <template v-else-if="chat.type === 'publish'">
              {{ chat.user }}さんの投稿 [{{ chat.time }}]: {{ chat.content }}
              <button v-if="chat.user === userName" @click="onEditPublish(i)">編集</button>
              <button v-if="chat.user === userName" @click="onDeletePublish(i)">削除</button>
            </template>
            <template v-else-if="chat.type === 'system'">
              {{ chat.user }}さんが{{ chat.content }}
            </template>
          </li>
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

.chat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.util-ml-8px {
  margin-left: 8px;
}

.button-exit {
  color: #000;
  margin-top: 8px;
}
</style>