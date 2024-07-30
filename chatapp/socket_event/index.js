export default (io, socket) => {
  // 入室メッセージをクライアントに送信する
  socket.on("enterEvent", (data) => {
    socket.broadcast.emit("enterEvent", data)
  })

  // 退室メッセージをクライアントに送信する
  socket.on("exitEvent", (data) => {
    socket.broadcast.emit("exitEvent", data)
  })

  // 投稿メッセージを送信する
  socket.on("publishEvent", (time, name, data) => {
    io.sockets.emit("publishEvent", time, name, data)
  })

  // クライアントからの編集イベントを受け取る
  socket.on("editPublishEvent", function(data) {
    socket.broadcast.emit("receiveEditPublishEvent", data);
  })

  // クライアントからの削除イベントを受け取る
  socket.on("deletePublishEvent", function(data) {
    socket.broadcast.emit("receiveDeletePublishEvent", data);
  })

}