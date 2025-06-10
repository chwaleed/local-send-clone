import { io } from "socket.io-client";

const receiverIp = "http://192.168.1.101:3000";

const selectedDevice = {
  name: "Device 1",
  host: "Waleed",
  type: "laptop",
  ip: "192.168.100.145",
};

let sender = null;

function requestToReciver(requestName, data, ip) {
  const socket = io(`http://${ip}:3000`);

  socket.on("connect", () => {
    socket.emit(requestName, data);
    socket.disconnect();
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected after request");
  });
}
requestToReciver("fileRequest", selectedDevice, selectedDevice.ip);

const localSocket = io("http://localhost:3000");

localSocket.on("fileAcceptRequest", (data) => {
  sender = data;
  console.log("Request received  ", data);
});

// Request Accepted

requestToReciver(
  "requestStatus",
  { ...selectedDevice, isAccepted: true },
  sender.ip
);

localSocket.on("updatedRequestStatus", (data) => {
  console.log("Request status updated", data);
  if (data.status === "accepted") {
    console.log("File transfer started");
  } else {
    console.log("File transfer rejected");
  }
});
