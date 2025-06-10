import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const pedingRequest = [];

io.on("connection", (socket) => {
  socket.on("fileRequest", (data) => {
    pedingRequest.push(data);

    socket.emit("fileAcceptRequest", data);
  });

  socket.on("requestStatus", (data) => {
    const { isAccepted } = data;
    const index = pedingRequest.findIndex((item) => item.id === data.id);
    if (index !== -1) {
      pedingRequest.splice(index, 1);
    }
    if (isAccepted) {
      socket.emit("updatedRequestStatus", {
        ...data,
        status: "accepted",
      });
    } else {
      socket.emit("updatedRequestStatus", { status: "rejected" });
    }
  });
});

server.listen(3000, () => {
  console.log("Socket.IO server running on port 3000");
});
