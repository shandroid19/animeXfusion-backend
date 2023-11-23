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

    console.log(socket.id, "joined", members.length);

    if (members[0] in characters) characters[members[1]] = characterId;
    else characters[members[0]] = characterId;
    console.log(characters, members);

    if (members.length === 2) {
      io.to(roomCode).emit("startGame", { members: members, characters });
      console.log("join", characters, members);
    }
  });

  socket.on("syncValues", ({ enemy, player, roomCode }) => {
    socket.broadcast.to(roomCode).emit("syncValues", {
      enemy,
      player,
    });
  });

  socket.on("keyPress", (action, roomCode) => {
    socket.broadcast.to(roomCode).emit("keyPress", action);
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
