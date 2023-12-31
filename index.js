const express = require("express");
const app = express();
const http = require("http");
var cors = require("cors");

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
    members.sort();

    if (members[0] in characters) characters[members[1]] = characterId;
    else characters[members[0]] = characterId;

    if (members.length === 2) {
      io.to(roomCode).emit("startGame", { members: members, characters });
    }
  });

  socket.on("syncPosition", ({ enemy, player, roomCode }) => {
    socket.broadcast.to(roomCode).emit("syncPosition", {
      enemy,
      player,
    });
  });

  socket.on("syncHealth", ({ enemy, player, roomCode }) => {
    socket.broadcast.to(roomCode).emit("syncHealth", {
      enemy,
      player,
    });
  });

  socket.on("keyPress", (action, roomCode) => {
    socket.broadcast.to(roomCode).emit("keyPress", action);
  });

  socket.on("disconnecting", function () {
    const rooms = Array.from(socket.rooms);
    socket.broadcast.to(rooms[1]).emit("opponentLeft");
  });

  socket.on("disconnect", () => {
    delete characters[socket.id];
    console.log("User Disconnected", socket.id);
  });
});

app.use(cors());

app.get("/checkRoom/:roomCode", (req, res) => {
  console.log(io.sockets.adapter.rooms.get(req.params.roomCode)?.size);

  try {
    if (io.sockets.adapter.rooms.get(req.params.roomCode).size < 2)
      return res.status(200).json({ vacant: true });
    return res.status(500).json({ vacant: false });
  } catch {
    return res.status(200).json({ vacant: true });
  }
});

app.get("/", (req, res) => {
  res.send("welcome to animeXfusion Backend");
});

server.listen(5000, () => console.log("server running "));
