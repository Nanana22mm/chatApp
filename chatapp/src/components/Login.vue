<script setup>
import { inject, ref, onMounted, watch } from "vue"
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

const inputUserName = ref(localStorage.getItem('userName') || "");
const selectedRoomName = ref("");
const newRoomName = ref("");
const selectedGrade = ref(localStorage.getItem('selectedGrade') || ""); // 学年
const selectedFaculty = ref(localStorage.getItem('selectedFaculty') || ""); // 学部
const selectedDepartment = ref(localStorage.getItem('selectedDepartment') || ""); // 学科
const chatRooms = ref([]);

// 学年、学部、学科のデータ
const grades = ref(['B1', 'B2', 'B3', 'B4', 'M1', 'M2', 'D1', 'D2', 'D3']);
const faculties = ref([
  { value: 'engineering', label: '工学部' },
  { value: 'science', label: '理学部' }
]); 
const facultyDepartments = {
  engineering: ['機械工学科', '電気工学科', '情報工学科'],
  science: ['物理学科', '化学科', '数学科']
}; 
const departments = ref([]); 

// 学部変更時に学科の選択肢を更新
const onFacultyChange = () => {
  departments.value = facultyDepartments[selectedFaculty.value] || [];
  selectedDepartment.value = ''; // 学部変更時に学科の選択をリセット
};

// 退室時に、もう一度ログイン画面で選択する手間を省くように過去の入力を取得
watch([selectedGrade, selectedFaculty, selectedDepartment, inputUserName], () => {
  localStorage.setItem('userName', inputUserName.value);
  localStorage.setItem('selectedGrade', selectedGrade.value);
  localStorage.setItem('selectedFaculty', selectedFaculty.value);
  localStorage.setItem('selectedDepartment', selectedDepartment.value);
});

//roomの取得
onMounted(() => {
  socket.emit('getRooms')
  socket.on('roomList', (rooms) => {
    chatRooms.value = rooms
  })

  // 初期設定として選択されている学部があれば学科を更新
  if (selectedFaculty.value) {
    departments.value = facultyDepartments[selectedFaculty.value] || [];
  }
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
  // 学年が選択されていない場合チェック
  if (!selectedGrade.value) {
    alert("学年を選択してください。");
    return;
  }
  // 学部が選択されていない場合チェック
  if (!selectedFaculty.value) {
    alert("学部を選択してください。");
    return;
  }
  // 学科が選択されていない場合チェック
  if (!selectedDepartment.value) {
    alert("学科を選択してください。");
    return;
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
  userName.value = `${selectedGrade.value}-${selectedDepartment.value}-${inputUserName.value}`
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

      <p>学年</p>
      <select v-model="selectedGrade" class="user-name-text">
        <option value="">学年を選択</option>
        <option v-for="grade in grades" :key="grade" :value="grade">{{ grade }}</option>
      </select>
    
      <p>学部</p>
      <select v-model="selectedFaculty" @change="onFacultyChange" class="user-name-text">
        <option value="">学部を選択</option>
        <option v-for="faculty in faculties" :key="faculty.value" :value="faculty.value">{{ faculty.label }}</option>
      </select>
    
      <p>学科</p>
      <select v-model="selectedDepartment" class="user-name-text">
        <option value="">学科を選択</option>
        <option v-for="department in departments" :key="department" :value="department">{{ department }}</option>
      </select>
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
