export default (io, socket) => {
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