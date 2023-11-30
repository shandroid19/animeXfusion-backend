const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const server = http.createServer(app);
const io = require("socket.io")(server, { cors: { origin: "*" } });

const rooms = {}; // Store room information, including players and interval

io.on("connection", (socket) => {
  socket.on("joinRoom", (roomCode, characterId) => {
    if (!rooms[roomCode]) {
      rooms[roomCode] = {
        players: {},
        intervalId: null,
      };
    }

    const room = rooms[roomCode];

    if (Object.keys(room.players).length >= 2) {
      socket.emit("roomFull");
      return;
    }

    socket.join(roomCode);

    room.players[socket.id] = {
      characterId,
      x: 1024 * Math.random(),
      y: 0,
      sequenceNumber: 0,
    };

    console.log(rooms);

    if (Object.keys(rooms[roomCode].players).length == 2 && !room.intervalId) {
      room.intervalId = setInterval(() => {
        io.to(roomCode).emit("updatePlayers", Object.values(room.players));
      }, 15);
      io.to(roomCode).emit("startGame", { players: room.players });
    }
  });

  socket.on("syncHealth", ({ enemy, player, roomCode }) => {
    socket.broadcast.to(roomCode).emit("syncHealth", {
      enemy,
      player,
    });
  });

  socket.on("disconnecting", function () {
    const roomsSocketIsIn = Array.from(socket.rooms);
    roomsSocketIsIn.forEach((roomCode) => {
      const room = rooms[roomCode];
      if (room) {
        delete room.players[socket.id];

        if (Object.keys(room.players).length < 2 && room.intervalId) {
          try {
            clearInterval(room.intervalId);
            room.intervalId = null;
            console.log("interval cleared");
          } catch (e) {
            console.log("interval failed to clear");
          }
        }

        io.to(roomCode).emit("opponentLeft");
      }
    });
  });

  socket.on("keyPress", (keycode) => {
    const speed = 15;
    const roomCode = Array.from(socket.rooms).find(
      (code) => rooms[code]?.players[socket.id]
    );
    if (roomCode) {
      const player = rooms[roomCode].players[socket.id];
      switch (keycode) {
        case "rightDown":
          player.veclocity, (x = speed);
          break;

        case "leftDown":
          player.velocity.x -= speed;
          break;

        case "rightDown":
          player.veclocity.x = 0;
          break;

        case "leftUp":
          player.velocity.x = 0;
          break;

        default:
          socket.broadcast.to(roomCode).emit("keyPress", keycode);
      }
    }
  });

  socket.on("disconnect", () => {
    const roomsSocketIsIn = Array.from(socket.rooms);
    roomsSocketIsIn.forEach((roomCode) => {
      const room = rooms[roomCode];
      if (room) {
        delete room.players[socket.id];

        if (Object.keys(room.players).length < 2 && room.intervalId) {
          clearInterval(room.intervalId);
          room.intervalId = null;
        }
      }
    });

    console.log("User Disconnected", socket.id);
  });
});

app.use(cors());

app.get("/checkRoom/:roomCode", (req, res) => {
  const room = rooms[req.params.roomCode];

  if (!room || Object.keys(room.players).length < 2) {
    return res.status(200).json({ vacant: true });
  }

  return res.status(500).json({ vacant: false });
});

app.get("/", (req, res) => {
  res.send("welcome to animeXfusion Backend");
});

server.listen(5000, () => console.log("server running "));
