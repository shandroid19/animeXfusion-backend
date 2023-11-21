const { uuid } = require("uuidv4");
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const io = require("socket.io")(server, { cors: { origin: "*" } });

const characters = {};

io.on("connection", (socket) => {
  socket.on("joinRoom", (roomCode, characterId) => {
    if (io.sockets.adapter.rooms.get(roomCode)) {
      socket.emit("roomFull");
    }
    socket.join(roomCode);
    const members = Array.from(io.sockets.adapter.rooms.get(roomCode));
    characters[members[members.length - 1]] = characterId;
    if (members.length === 2)
      io.to(roomCode).emit("startGame", { members: members, characters });
  });

  socket.on("keyPress", (action, roomCode) => {
    socket.broadcast.to(roomCode).emit("keyPress", action);
  });

  socket.on("disconnect", () => {
    delete characters[socket.id];
    console.log("User Disconnected");
  });
});

server.listen(5000, () =>
  console.log("server running => http://localhost:5000")
);
