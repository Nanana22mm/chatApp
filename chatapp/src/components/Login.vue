<script setup>
import { inject, provide, ref, onMounted, watch } from "vue"
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
  { value: 'law', label: '法学部' },
  { value: 'economics', label: '経済学部' },
  { value: 'commerce', label: '商学部' },
  { value: 'science', label: '理学部' },
  { value: 'engineering', label: '工学部' },
  { value: 'agriculture', label: '農学部' }
]); 
const facultyDepartments = {
  law: ['法学科', '政治学科'],
  economics: ['経済学科', '経営学科'],
  commerce: ['商学科'],
  science: ['物理学科', '化学科', '生物学科', '数学科'],
  engineering: ['機械工学科', '電気工学科', '情報工学科', '建築学科'],
  agriculture: ['農学科']
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
    if (newRoomName.value.length > 20) {
      alert("ルーム名は20文字以内にしてください。")
      console.log(newRoomName.value.length)
      return
    } else {
      socket.emit('createRoom', newRoomName.value)
      socket.on('createRoomSuccess', (flag) => {
        if (!flag){
          alert("このチャットルームはすでに存在します。")
        }
      })
    }
  }

  // 全体で使用するname, roomに入力されたユーザー名, ルーム名を格納
  userName.value = `${selectedGrade.value}-${selectedDepartment.value}-${inputUserName.value}`
  roomName.value = room  

  // 入室メッセージを送信
  socket.emit("initializeMemberListRequest", inputUserName.value, roomName.value, selectedGrade.value, selectedFaculty.value, selectedDepartment.value);
  socket.emit("enterEvent", inputUserName.value, roomName.value, selectedGrade.value, selectedFaculty.value, selectedDepartment.value);
  //チャット画面へ遷移
  router.push({ name: "chat", params: { roomName: room }})
}
// #endregion

</script>

<template>
<body>
<div class="login-section">
  <div class="mx-auto my-5 px-4">
    <h1 class="pt-5 text-h3 font-weight-medium text-center">rakus質問箱</h1>

    <div class="layout-wrapper">
      <div class="left-column">
        <div class="mt-10">
          <p>ユーザー名</p>
          <input v-model="inputUserName" type="text" class="user-name-text"/>

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
      </div>

      <div class="right-column">
        <div class="mt-10">
          <p>チャットルームを作成</p>
          <input v-model="newRoomName" type="text" class="user-name-text" placeholder="新しいチャットルームを作成" />
        </div>
        
        <div class="mt-2">
          <p>チャットルームを選択</p>
          <select v-model="selectedRoomName" class="user-name-text" size="9">
            <option v-for="room in chatRooms" :key="room" :value="room">{{ room }}</option>
          </select>
        </div>
      </div>
    </div>

    <div class="text-center">
      <button type="button" @click="onEnter" class="button-normal">入室する</button>
    </div>
  </div>
</div>
</body>
</template>

<style scoped>
*{
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}


.user-name-text {
  width: 200px;
  border: 1px solid #888;
  margin-bottom: 16px;
}

body {
    font-family: Arial, sans-serif;
    display: flex;
    margin: 0px;
    padding: 0;
}

.qa-section {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgb(26, 98, 56);
  color: #000;
  font-size: 48px;
  flex: 1;
  height: 930px;
}

.question {
  background-color: lightblue;
    width: 100%;
    text-align: center;
    height: 515px;
    font-size:  400px;
    display: flex;
  }
  
  .and{
    display: inline-block;
  }
  
  .answer {
    background-color: lightcoral;
    width: 100%;
    text-align: center;
    height: 515px;
    font-size: 350px;
}

.login-section {
    background-color: #e0e0e0;
    flex: 1;
    height: 930px;
}

.login-section h1 {
    margin-bottom: 20px;
}

.login-section label {
    margin-right: 10px;
}

.login-section input {
    padding: 10px;
    margin-bottom: 10px;
    width: 200px;
}

.login-section button {
    padding: 10px;
    width: 200px;
    cursor: pointer;
}

.text-center {
  text-align: center;
}

.layout-wrapper {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-top: 20px;
}

.left-column, .right-column {
  flex: 1;
  max-width: 250px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.button-normal {
  margin-top: 20px;
}

@media (max-width: 768px) {
  .layout-wrapper {
    flex-direction: column;
    align-items: center;
  }

  .left-column, .right-column {
    width: 100%;
  }
}
</style>
