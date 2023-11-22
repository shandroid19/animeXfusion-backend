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
    const mems = Array.from(io.sockets.adapter.rooms.get(roomCode));
    const members = mems.sort();
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
