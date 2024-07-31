import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

var ContentType = {
  post: 1,
  memo: 2
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
async function insertData(name, data, time, room, type) {
  const db = await setupDB();
  if (!db) {
    console.log('cannot open database');
    return;
  }

  await db.run('INSERT INTO chatList (name, data, time, room, type) VALUES (?, ?, ?, ?, ?)', name, data, time, room, type).then(result => {
    console.log(`insert success: ${data}, ${name}, ${time}, ${room}, ${type}`);
  }).catch(error => {
    console.log(error);
  });

  // const data2 = await db.all('SELECT * FROM chatList WHERE room = ?', room);
  // console.log(data2);
}

// DB のデータを読み込み，データを返す
async function initializeData(room, name) {
  const db = await setupDB();
  if (!db) {
    console.log('cannot open database');
    return { posts: [], memos: [] };
  }

  const posts = await db.all('SELECT * FROM chatList WHERE room = ? AND type = ?', room, ContentType.post);
  const memos = await db.all('SELECT * FROM chatList WHERE name = ? AND type = ?', name, ContentType.memo);

  console.log('initializeData posts', posts);
  console.log('initializeData memos', memos);

  return { posts, memos };
}

export default (io, socket) => {
  // 初期化時: クライアントからリクエストを受け取ったら，DB のデータをクライアントに送信する
  socket.on("initializeRequestEvent", (room, name) => {
    initializeData(room, name).then(({ posts, memos }) => {

      console.log('request posts', posts);
      console.log('request memos', memos);

      socket.emit("initializeReplyEvent", ({ posts, memos }));
    })
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

  // 投稿メッセージを送信するとともに， DB にデータを追加する
  socket.on("publishEvent", (room, time, name, data) => {
    io.to(room).emit("publishEvent", time, name, data)
    insertData(name, data, time, room, ContentType.post)
  })

  // メモメッセージを送信するとともに， DB にデータを追加する
  socket.on("publishMemo", (room, time, name, data) => {
    socket.emit("publishMemo", time, name, data)
    insertData(name, data, time, room, ContentType.memo)
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