<script setup>
import { inject, ref, reactive, onMounted} from "vue"
import { useRouter } from "vue-router"
import socketManager from '../socketManager.js'

var ContentType = {
  post: 1,
  memo: 2
};

// #region global state
const userName = inject("userName")
const roomName = inject("roomName")
// #endregion

// #region local variable
const router = useRouter()
const socket = socketManager.getInstance()
// #endregion

// #region reactive variable
const Content = ref('')
const chatList = reactive([])
const memoList = reactive([])
const showModal = ref(false);
// #endregion

// #region lifecycle

// クライアントの起動
onMounted(() => {
  // サーバが DB のデータを送信してきた時に，それを取得できるように準備をしておく
  socket.on("initializeReplyEvent", async ({posts, memos}) => {
    posts.forEach(({name, time, data}) => {
      chatList.unshift(`${name}さんの投稿 [${time}]: ${data}`);
      console.log(`${name}さんの投稿 [${time}]: ${data}`);
    });
    memos.forEach(({name, time, data}) => {
      memoList.unshift(`${name}さんのメモ [${time}]: ${data}`);
      console.log(`${name}さんのメモ [${time}]: ${data}`)
    });
  });

  // イベントの登録
  registerSocketEvent()
  socket.emit("joinRoom", roomName.value)

  // DB のデータを送信するよう，サーバへリクエストを送信する
  socket.emit("initializeRequestEvent", roomName.value, userName.value);
})

// #endregion

// 投稿メッセージをサーバに送信する
const onPublish = () => {
  if (!Content.value || Content.value.match(/^\s*$/g)) {
    alert("投稿を入力してください。")
    return
  }
  const chatTime = new Date()
  var Time = chatTime.getFullYear() + '/' + ('0' + (chatTime.getMonth() + 1)).slice(-2) + '/' +('0' + chatTime.getDate()).slice(-2) + ' ' +  ('0' + chatTime.getHours()).slice(-2) + ':' + ('0' + chatTime.getMinutes()).slice(-2);

  socket.emit("publishEvent",roomName.value, Time, userName.value, Content.value)

  // 入力欄を初期化
  Content.value = ""
}

// 退室メッセージをサーバに送信する
const onExit = () => {
  showModal.value = false;
  socket.emit("exitEvent", userName.value, roomName.value)
}

// メモを画面上に表示する
const onMemo = () => {
  if (!Content.value || Content.value.match(/^\s*$/g)) {
    alert("メモを入力してください。")
    return
  }

  const memoTime = new Date()
  var Time = memoTime.getFullYear() + '/' + ('0' + (memoTime.getMonth() + 1)).slice(-2) + '/' +('0' + memoTime.getDate()).slice(-2) + ' ' +  ('0' + memoTime.getHours()).slice(-2) + ':' + ('0' + memoTime.getMinutes()).slice(-2);

  // メモの内容を自分のサーバに送信する
  socket.emit("publishMemo", roomName.value, Time, userName.value, Content.value)

  // // メモの内容を表示
  // chatList.unshift(`${userName.value}さんのメモ [${Time}]: ` + chatContent.value)
  memoList.unshift({
    time: Time,
    user: userName.value,
    content: chatContent.value,
    type: "memo"
  })

  // 入力欄を初期化
  Content.value = ""
}

// メモを削除する
const onDeleteMemo = (index) => {
  memoList.splice(index, 1)
}

// メモを編集する
const onEditMemo = (index) => {
  const newContent = prompt("メモを編集してください：", memoList[index].content)
  if (newContent !== null && newContent !== "") {
    memoList[index].content = newContent
  }
}

// サーバから受信した入室メッセージ画面上に表示する
const onReceiveEnter = (name) => {
  const memoTime = new Date()
  var Time = memoTime.getFullYear() + '/' + ('0' + (memoTime.getMonth() + 1)).slice(-2) + '/' +('0' + memoTime.getDate()).slice(-2) + ' ' +  ('0' + memoTime.getHours()).slice(-2) + ':' + ('0' + memoTime.getMinutes()).slice(-2);

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
  socket.emit("deletePublishEvent", roomName.value, {
      index: index
    });
}

// 投稿を編集する
const onEditPublish = (index) => {
  const newContent = prompt("投稿を編集してください：", chatList[index].content)
  if (newContent !== null && newContent !== "") {
    chatList[index].content = newContent;
    socket.emit("editPublishEvent", roomName.value, {
      index: index,
      newContent: newContent
    });
  }
}

// #endregion

// サーバから受信したメモを画面上に表示する
const onReceiveMemo = (time, name, data) => {
  memoList.unshift(`${name}さんのメモ [${time}]: ${data}`)
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
  socket.on("publishEvent", (time, name, data, room) => {
    onReceivePublish(time, name, data, room)
  })

  // 投稿イベントを受け取ったら実行
  socket.on("publishMemo", (time, name, data, room) => {
    onReceiveMemo(time, name, data, room)
  })
    // 編集された投稿を受信して更新する
    socket.on("receiveEditPublishEvent", function(data) {
    if (chatList[data.index]) {
      chatList[data.index].content = data.newContent;
    }
  })  
  // 削除された投稿を受信して更新する
  socket.on("receiveDeletePublishEvent", (data) => {
    if (chatList[data.index]) {
      chatList.splice(data.index, 1);
    }
  })


  // 投稿イベントを受け取ったら実行
  socket.on("publishMemo", (time, name, data, room) => {
    onReceiveMemo(time, name, data, room)
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
      <textarea variant="outlined" placeholder="投稿文を入力してください" rows="4" class="area" v-model="Content"></textarea>
      <div class="mt-5">
        <button class="button-normal" @click="onPublish">投稿</button>
        <button class="button-normal util-ml-8px"  @click="onMemo">メモ</button>
      </div>
      <div class="mt-5" v-if="memoList.length !== 0">
        <ul>
          <li v-for="(chat, i) in memoList" :key="i">
            <template v-if="chat.type === 'memo'">
              {{ chat.user }}さんのメモ [{{ chat.time }}]: {{ chat.content }}
              <button @click="onEditMemo(i)">編集</button>
              <button @click="onDeleteMemo(i)">削除</button>
            </template>
          </li>
        </ul>
      </div>
      <div class="mt-5" v-if="chatList.length !== 0">
        <ul>
          <li v-for="(chat, i) in chatList" :key="i">
            <template v-if="chat.type === 'publish'">
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
      <div class="mt-5" v-if="memoList.length !== 0">
        <ul>
          <li class="item mt-4" v-for="(chat, i) in memoList" :key="i">{{ chat }}</li>
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