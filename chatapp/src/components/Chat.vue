<script setup>
import { inject, ref, reactive, onMounted, nextTick } from "vue"
import { useRouter } from "vue-router"
import socketManager from '../socketManager.js'
var ChatType = {
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
const memberList = reactive([])
const memoList = reactive([])
const showModal = ref(false);
// #endregion
let connectUser = []
// クライアントの起動
onMounted(() => {
  // サーバが DB のデータを送信してきた時に，それを取得できるように準備をしておく
  socket.on("initializeReplyEvent", async ({posts, memos}) => {
    posts.forEach(({name, time, data}) => {
      chatList.unshift({
        time: time,
        user: name,
        content: data,
        type: "publish"
      })
      console.log(`${name}さんの投稿 [${time}]: ${data}`);
    });
    memos.forEach(({name, time, data}) => {
      memoList.unshift({
        time: time,
        user: name,
        content: data
      })
    });
  });
     
  // イベントの登録
  registerSocketEvent()
  socket.emit("joinRoom", roomName.value)
  // DB のデータを送信するよう，サーバへリクエストを送信する
  socket.emit("initializeRequestEvent", roomName.value, userName.value);
  socket.on("connectUser", (data)=>{
    console.log(data)
    connectUser = data
  
  })})
// #endregion
// 投稿メッセージをサーバに送信する
const onPublish = () => {
  if (!Content.value || Content.value.match(/^\s*$/g)) {
    alert("投稿を入力してください。")
    return
  }
  const chatTime = new Date()
  var Time = chatTime.getFullYear() + '/' + ('0' + (chatTime.getMonth() + 1)).slice(-2) + '/' +('0' + chatTime.getDate()).slice(-2) + ' ' +  ('0' + chatTime.getHours()).slice(-2) + ':' + ('0' + chatTime.getMinutes()).slice(-2);
  socket.emit("publishEvent",roomName.value, Time, userName.value, Content.value, ChatType.post)
  // 入力欄を初期化
  Content.value = ""
}
// 退室メッセージをサーバに送信する
const onExit = () => {
  showModal.value = false;

  // TODO: revise argument
  socket.emit("exitEvent", userName.value, roomName.value, name, grade, faculty, department)
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
  socket.emit("publishEvent", roomName.value, Time, userName.value, Content.value, ChatType.memo)
  memoList.unshift({
    time: Time,
    user: userName.value,
    room: roomName.value,
    content: Content.value
  })
  // 入力欄を初期化
  Content.value = ""
}
// メモを削除する
const onDeleteMemo = (index) => {
  socket.emit("deleteEvent", roomName.value, {
    index: index,
    name: userName.value,
    time: memoList[index].time,
    oldData: memoList[index].content,
    type: ChatType.memo
  });
  memoList.splice(index, 1)
}
// メモを下書きとして活用: メモに書いていたものを投稿できるようにする
// メモを投稿リストに追加．そのメモはメモリストから削除する
const onAddMemointoPublish = (index) => {
  socket.emit("publishEvent",roomName.value, memoList[index].time, userName.value, memoList[index].content, ChatType.post);
  onDeleteMemo(index);
}
// メモを編集する
const onEditMemo = (index) => {
  const newContent = prompt("メモを編集してください：", memoList[index].content)
  if (newContent !== null && newContent !== "") {
    socket.emit("editEvent", roomName.value, {
      index: index,
      name: userName.value,
      time: memoList[index].time,
      newData: newContent,
      oldData: memoList[index].content, 
      type: ChatType.memo
    });
    memoList[index].content = newContent
  }
}
// サーバから受信した入室メッセージ画面上に表示する
const onReceiveEnter = (name, grade, faculty, department) => {
  const memoTime = new Date()
  var Time = memoTime.getFullYear() + '/' + ('0' + (memoTime.getMonth() + 1)).slice(-2) + '/' +('0' + memoTime.getDate()).slice(-2) + ' ' +  ('0' + memoTime.getHours()).slice(-2) + ':' + ('0' + memoTime.getMinutes()).slice(-2);
  chatList.unshift({
    time: Time,
    user: name,
    content: `入室しました。`,
    type: "system"
  })}

// サーバから受信した退室メッセージを受け取り画面上に表示する
const onReceiveExit = ({name, grade, faculty, department}) => {
  const chatTime = new Date()
  var Time = chatTime.getFullYear() + '/' + ('0' + (chatTime.getMonth() + 1)).slice(-2) + '/' +('0' + chatTime.getDate()).slice(-2) + ' ' +  ('0' + chatTime.getHours()).slice(-2) + ':' + ('0' + chatTime.getMinutes()).slice(-2);
  chatList.unshift({
    time: Time,
    user: name,
    content: `退室しました。`,
    type: "system"
  })
  memberList = memberList.filter((i) => {
    if (!(i.name === name && i.grade === grade && i.faculty === faculty && i.department === department)) {
      return true;
    }
  })
  console.log("deletemember:", memberList);
}
// サーバから受信した投稿メッセージを画面上に表示する
const onReceivePublish = (time, name, data) => {
  chatList.unshift({
    time: time,
    user: name,
    content: data,
    type: "publish"
  })
}
const onReceiveMember = (name, grade, faculty, department, room) => {
  memberList.unshift({
    name: name,
    grade: grade,
    faculty:faculty,
    department: department,
    room : room
  })
}
// 投稿を削除する
const onDeletePublish = (index) => {
  socket.emit("deleteEvent", roomName.value, {
    index: index,
    name: userName.value,
    time: chatList[index].time,
    oldData: chatList[index].content,
    type: ChatType.post
  });
  chatList.splice(index, 1);
}
// 投稿を編集する
const onEditPublish = (index) => {
  const newContent = prompt("投稿を編集してください：", chatList[index].content)
  if (newContent !== null && newContent !== "") {
    socket.emit("editEvent", roomName.value, {
      index: index,
      name: userName.value,
      time: chatList[index].time,
      newData: newContent,
      oldData: chatList[index].content,
      type: ChatType.post
    });
    chatList[index].content = newContent;
  }
}
const onAddPublishintoMemo = (index) => {
  // メモの内容を自分のサーバに送信する
  socket.emit("publishEvent", roomName.value, chatList[index].time, userName.value, chatList[index].content, ChatType.memo)
  memoList.unshift({
    time: chatList[index].time,
    user: userName.value,
    room: roomName.value,
    content: chatList[index].content
  })
}
// #endregion
// イベント登録をまとめる
const registerSocketEvent = () => {
  // 入室イベントを受け取ったら実行
  socket.on("enterEvent", (name, grade, faculty, department) => {
    onReceiveEnter(name, grade, faculty, department)
  })
  // 退室イベントを受け取ったら実行
  socket.on("exitEvent", (name, grade, faculty, department) => {
    onReceiveExit(name, grade, faculty, department)
  })
  // 投稿イベントを受け取ったら実行
  socket.on("publishEvent", (time, name, data, room) => {
    onReceivePublish(time, name, data, room)
  })
  socket.on("memberListInsert", (name, grade, faculty, department, room) => {
    onReceiveMember(name, grade, faculty, department, room)
  })
  // 編集された投稿を受信して更新する
  socket.on("receiveEditEvent", function(data) {
    if (chatList[data.index]) {
      chatList[data.index].content = data.newContent;
    }
  })  
  // 削除された投稿を受信して更新する
  socket.on("receiveDeleteEvent", (data) => {
    if (chatList[data.index]) {
      console.log(chatList[data.index])
      console.log(data.index)
      console.log(data)
      chatList.splice(data.index, 1);
    }
  })
}
/*Open Modal*/
const openModal = () => {
  showModal.value = true; 
}
/*Close Modal*/
const closeModal = () => {
  showModal.value = false
}
/* Get Current Url */
const currentUrl = window.location.href;
/* Get Room Name */
const urlName = decodeURIComponent(currentUrl.substring(currentUrl.lastIndexOf('/') + 1));
</script>

<template>
  <!--Modal Window-->
  <div id="app">
    <div v-if="showModal" id="overlay" @click="closeModal">
      <div id="content" @click.stop>
        <p id="modal-message">本当に退室しますか？</p>
        <p>{{ memberList.name }}</p>
        <div class="d-flex justify-content-end">
          <router-link to="/" class="link">
            <button class="btn btn-primary" @click="onExit">はい</button>
          </router-link>
          <p></p>
          <button class="btn btn-secondary" @click="closeModal">いいえ</button>
        </div>
      </div>
    </div>
  <!--End Modal Window-->

  <div class="row" style="margin: 0;">
    <!-- Left side space -->
     <div class="col-3" style="padding: 0;">
      <div class="left-side-space">
        <div style="text-align: center;" >
          <h4 style="line-height: 10vh;" >{{ userName }}</h4>
        </div>
        <div class="bg-black text-white" style="text-align: center; padding: 10px 0;">
          <h4>{{ urlName }}</h4>
        </div>

        <!-- Room Member All -->
        <h5 style="text-align: center; padding: 5px 0;" ></h5>
       </div>
      </div>
    
    <!-- Center Space -->
     <div class="col-9" style="padding: 0;">
      <!-- Question Theme -->
       <div class="room-name" >
        <div class="row" style="margin: 0;">
          <div class="col-10">
            <h4 style="text-align: center; line-height: 10vh;"> {{ urlName }} </h4>
          </div>
          <div class="col-2" style="margin: auto 0">
            <button type="button" class="btn btn-light" @click="openModal">退室する</button>
          </div>
        </div>
       </div>

        <div class="row" style="margin: 0;">
          <!-- Center Space -->
          <div class="col-7" style="padding: 0;">
            <!-- Display Chat Message -->
            <div v-if="chatList.length !== 0" class="scroll-center-space">
              <ul style="width: 95%; margin: 0 auto;">
                <li v-for="(chat, i) in chatList" :key="i">
                  <template v-if="chat.type === 'publish'">
                    <div class="row message-container">
                      <div class="col-8">
                        {{ chat.user }} [{{ chat.time }}]: {{ chat.content }}
                      </div>
                      <div class="col-4 d-flex">
                        <button class="btn btn-secondary edit-delete-button" v-if="chat.user === userName" @click="onEditPublish(i)">編集</button>
                        <div>&nbsp;</div>
                        <button class="btn btn-danger edit-delete-button" v-if="chat.user === userName" @click="onDeletePublish(i)">削除</button>
                        <div>&nbsp;</div>
                        <button class="btn btn-secondary edit-delete-button" v-if="chat.user === userName" @click="onAddPublishintoMemo(i)" >→</button>
                      </div>
                    </div>
                  </template>
                  <template v-else-if="chat.type === 'system'">
                    {{ chat.user }} {{ chat.content }}
                  </template>
                </li>
              </ul>
            </div>
            <div class="position-fixed col-5 bottom-0" style="height: 30vh; padding: 0 10px;">
                <div style="height: 3vh;"></div>
                <textarea variant="outlined" style="height: 18vh" class="w-100" placeholder="Write a message" rows="4" v-model="Content"></textarea>
                <div class="d-flex justify-content-end" style="height: 7vh;min-height: 10px">
                  <button class="btn btn-warning"  @click="onMemo">memo</button>
                  <div>&nbsp;</div>
                  <button class="btn btn-warning" @click="onPublish">▶</button>
                </div>
                <div style="height: 2vh;"></div>
            </div>
          </div>
        <!-- Right side space -->
        <div class="col-5 right-side-space" style="padding: 0;">
          <div class="scroll-right-space" >
            <!-- output memo -->
            <div v-if="memoList.length !== 0">
              <ul style="width: 90%; margin: 0 auto;">
                <li v-for="(chat, i) in memoList" :key="i">
                  <div class="row">
                    <div class="col-7 message-container">[{{ chat.time }}]: {{ chat.content }}</div>
                    <div class="col-5 d-flex">
                      <button class="btn btn-secondary edit-delete-button"  @click="onEditMemo(i)">編集</button>
                      <div>&nbsp;</div>
                      <button class="btn btn-danger edit-delete-button" @click="onDeleteMemo(i)">削除</button>
                      <div>&nbsp;</div>
                      <button class="btn btn-secondary edit-delete-button" @click="onAddMemointoPublish(i)">←</button>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      </div>
  </div>
</div>
</template>
<style scoped>
li {
  list-style: none;
}
ul {
  padding-left: none;
}
.link {
  text-decoration: none;
}
textarea {
  border: 2px solid #000;
  border-radius: 4px;
  padding: 10px;
  box-sizing: border-box;
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
/* Room CSS */
.left-side-space {
  background-color: #E6E6E6;
  height: 100vh;
  width: 100%;
}
.right-side-space {
  background-color: #F5F5F5;
  height: 90vh;
}
.room-name {
  background-color: #D9D9D9;
  height: 10vh;
  line-height: 10vh;
}
.left-side-room-name {
  background-color: #E6E6E6;
  height: 10vh;
  line-height: 10vh;
}
.message-container {
  padding: 5px 0;
}
.edit-delete-button {
  margin: 7px 0;
}
.scroll-center-space {
  height: 60vh;
  overflow: auto;
}
.scroll-right-space {
  height: 90vh;
  overflow: auto;
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