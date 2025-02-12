const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Allow frontend to connect
    methods: ["GET", "POST"],
  },
});

const users = {}; // Store users by socket ID

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", ({ roomId, username }) => {
    users[socket.id] = { username, roomId };
    socket.join(roomId);

    io.to(roomId).emit("user-joined", { id: socket.id, username });
  });

  socket.on("offer", ({ offer, to }) => {
    socket.to(to).emit("offer", { offer, from: socket.id });
  });

  socket.on("answer", ({ answer, to }) => {
    socket.to(to).emit("answer", { answer, from: socket.id });
  });

  socket.on("ice-candidate", ({ candidate, to }) => {
    socket.to(to).emit("ice-candidate", { candidate, from: socket.id });
  });

  socket.on("disconnect", () => {
    const user = users[socket.id];
    if (user) {
      io.to(user.roomId).emit("user-left", socket.id);
      delete users[socket.id];
    }
  });
});

server.listen(5000, () => console.log("Server running on port 5000"));
