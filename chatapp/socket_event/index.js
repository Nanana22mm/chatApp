import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

async function setupDB() {
  const db = await open({
    filename: 'database.db',
    driver: sqlite3.Database
  });

  await db.exec('CREATE TABLE IF NOT EXISTS chatList (name TEXT, data TEXT, time TEXT)');
  return db
}

async function insertChatData(name, data, time) {
  const db = await setupDB();
  if (!db) {
    console.log('cannot open database');
    return;
  }

  await db.run('INSERT INTO chatList (name, data, time) VALUES (?, ?, ?)', name, data, time).then(result => {
    console.log(`insert success: ${data}, ${name}, ${time}`);
  }).catch(error => {
    console.log(error);
  });

  const data2 = await db.all('SELECT * FROM chatList');
  console.log(data2);
}

async function initializeData() {
  const db = await setupDB();
  if (!db) {
    console.log('cannot open database');
    return [];
  }

  const data = await db.all('SELECT * FROM chatList');
  return data;
}

export default (io, socket) => {
  // 初期化時: DB のデータをクライアントに送信する
  socket.on("initializeRequestEvent", _ => {
    initializeData().then(data => {
      socket.emit("initializeReplyEvent", data);
    });
  })

  // チャットルームに参加、メッセージをクライアントに送信する
  socket.on("enterEvent", (name, room) => {
    socket.join(room)
    socket.broadcast.to(room).emit("enterEvent", name)
  })

  // 退室メッセージをクライアントに送信する
  socket.on("exitEvent", (name, room) => {
    socket.leave(room)
    socket.broadcast.to(room).emit("exitEvent", name)
  })

  // 投稿メッセージを送信する
  socket.on("publishEvent", (room, time, name, data) => {
    io.to(room).emit("publishEvent", time, name, data)
    insertChatData(name, data, time)
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

}