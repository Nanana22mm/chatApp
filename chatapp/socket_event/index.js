import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

var ChatType = {
  post: 1,
  memo: 2
};
var EditType = {
  insert: 1,
  delete: 2,
  update: 3,
};

// DB の初期化
// database.db を読み込んで，table を作成する
async function setupDB() {
  const db = await open({
    filename: 'database.db',
    driver: sqlite3.Database
  });
  await db.exec('CREATE TABLE IF NOT EXISTS chatList (name TEXT, data TEXT, time TEXT, room TEXT, type INTEGER)');
  return db
}
// DB に chatList のデータを挿入する
async function editDatabase(chatType, editType, name, time, room, chatStruct) {
  const db = await setupDB();
  if (!db) {
    console.log('Error: Cannot open database');
    return;
  }
  // 変数の宣言と初期化
  var newData = null, oldData = null;
  switch (editType) {
    case EditType.insert:
      newData = chatStruct.newData;
      await db.run('INSERT INTO chatList (name, data, time, room, type) VALUES (?, ?, ?, ?, ?)', name, newData, time, room, chatType);
      break;
    case EditType.delete:
      oldData = chatStruct.oldData;
      switch (chatType) {
        case ChatType.post:
          await db.run('DELETE FROM chatList WHERE name = ? AND data = ? AND time = ? AND room = ? AND type = ?', name, oldData, time, room, chatType);
          break;
        case ChatType.memo:
          await db.run('DELETE FROM chatList WHERE name = ? AND data = ? AND time = ? AND type = ?', name, oldData, time, chatType);
          break;
      }
      break;
    case EditType.update:
      newData = chatStruct.newData;
      oldData = chatStruct.oldData;
      switch (chatType) {
        case chatType.post:
          await db.run('UPDATE chatList SET data = ? WHERE name = ? AND data = ? AND time = ? AND room = ? AND type = ?', newData, name, oldData, time, room, chatType);
          break;
        case chatType.memo:
          await db.run('UPDATE chatList SET data = ? WHERE name = ? AND data = ? AND time = ? AND type = ?', newData, name, oldData, time, chatType);
          break;
      }
      break;
  }
}
// DB のデータを読み込み，データを返す
async function initializeData(room, name) {
  const db = await setupDB();
  if (!db) {
    console.log('Error: Cannot open database');
    return { posts: [], memos: [] };
  }
  const posts = await db.all('SELECT * FROM chatList WHERE room = ? AND type = ?', room, ChatType.post);
  const memos = await db.all('SELECT * FROM chatList WHERE name = ? AND type = ?', name, ChatType.memo);

  return { posts, memos };
}

async function memberListDB() {
  const db = await open({
    filename: 'memberList.db',
    driver: sqlite3.Database
  });

  await db.exec('CREATE TABLE IF NOT EXISTS memberList (name TEXT, room TEXT)');
  return db
}

// DB に chatList のデータを挿入する
async function editMemberList(editType, name, room) {
  const db = await memberListDB();
  if (!db) {
    console.log('Error: Cannot open database');
    return;
  }
  switch (editType) {
    case EditType.insert:
      await db.run('INSERT INTO memberList (name, room) VALUES (?, ?)', name, room);
      break;
    case EditType.delete:
      await db.run('DELETE FROM memberList WHERE name = ? AND room = ?', name, room);
      break;
  }
  const members = await db.all('SELECT * FROM memberList WHERE room = ?', room);
  return { members };
}

export default (io, socket) => {
  // 初期化時: クライアントからリクエストを受け取ったら，DB のデータをクライアントに送信する
  socket.on("initializeRequestEvent", (room, name) => {
    initializeData(room, name).then(({ posts, memos }) => {
      socket.emit("initializeReplyEvent", ({ posts, memos }));
    })
  })

  socket.on("memberListRequestEvent", (room) => {
    memberListData(room).then(({ member }) => {
      socket.emit("memberListReplyEvent", ({ member }));
    })
  })

  // チャットルームに参加、メッセージをクライアントに送信する
  socket.on("enterEvent", (name, room) => {
    socket.join(room)
    socket.broadcast.to(room).emit("enterEvent", name, room)
  })
  // 退室メッセージをクライアントに送信する
  socket.on("exitEvent", (name, room) => {
    editMemberList(EditType.delete, name, room).then(members => {
      socket.leave(room)
      socket.broadcast.to(room).emit("exitEvent", name, members)
    })
  })
  // 投稿メッセージを送信するとともに， DB にデータを追加する
  socket.on("publishEvent", (room, time, name, data, type) => {
    editDatabase(type, EditType.insert, name, time, room, { newData: data });
    switch (type) {
      case ChatType.post:
        io.to(room).emit("publishEvent", time, name, data);
        break;
    }
  })

  socket.on("memberListInsert", (name, grade, faculty, department, room) => {
    editMemberList(EditType.insert, name, room, { grade, faculty, department });
    io.to(room).emit("memberListInsert", name, grade, faculty, department, room);
  })

  socket.on("memberListDelete", (name, room) => {
    editMemberList(EditType.delete, name, room, {});
    io.to(room).emit("memberListDelete", name, room);
  })

  // チャットルームのリストを取得する
  socket.on('getRooms', () => {
    const rooms = Array.from(io.sockets.adapter.rooms.keys()).filter(room => {
      return !io.sockets.adapter.sids.has(room)
    })
    socket.emit('roomList', rooms)
  })
  // チャットルームの作成
  socket.on('createRoom', (room) => {
    if (io.sockets.adapter.rooms.has(room)) {
      socket.emit('createRoomSuccess', false)
    } else {
      socket.emit('createRoomSuccess', true)
    }
  })
  // クライアントからの編集イベントを受け取る
  socket.on("editEvent", function (room, data) {
    const { index, name, time, oldData, newData, type } = data;
    editDatabase(type, EditType.update, name, time, room, { newData: newData, oldData: oldData });
    switch (type) {
      case ChatType.post:
        socket.broadcast.to(room).emit("receiveEditEvent", { index, newContent: newData });
        break;
    }
  })
  // クライアントからの削除イベントを受け取る
  socket.on("deleteEvent", function (room, data) {
    const { index, name, time, oldData, type } = data;
    editDatabase(type, EditType.delete, name, time, room, { oldData: oldData });
    switch (type) {
      case ChatType.post:
        socket.broadcast.to(room).emit("receiveDeleteEvent", { index });
        break;
    }
  })

  socket.on("initializeMemberListRequest", (name, room) => {
    editMemberList(EditType.insert, name, room).then(({ members }) => {
      socket.emit("initializeMemberListReply", ({ members }));
    })
  })
}