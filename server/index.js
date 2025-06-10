import express from "express";
import multer from "multer";
import cors from "cors";
import bonjourLib from "bonjour";
import path from "path";
import fs from "fs";
import { Server } from "socket.io";
import http from "http";
import os from "os";

const bonjour = bonjourLib();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = 5000;
const SERVICE_NAME = `FileShare-${Math.random().toString(36).substr(2, 4)}`;
const SERVICE_PATTERN = /^FileShare-[a-z0-9]{4}$/; // Pattern to match FileShare service names
const peers = new Map();
const pendingTransfers = new Map(); // Map to store pending transfer requests
const pendingResponseQueue = new Map();

let ownDevice = null;

// Enable CORS (for testing with browser frontend)
app.use(cors());
// Parse JSON requests
app.use(express.json());

// Create 'uploads' folder if it doesn't exist
const uploadDir = path.join(path.resolve(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer setup for file upload with conditional acceptance
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Use the original filename to avoid issues
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// Socket.io setup for real-time communication
io.on("connection", (socket) => {
  console.log("🔌 Socket client connected:", socket.id);

  // Handle transfer requests
  socket.on("requestTransfer", (data) => {
    console.log("🔄 Transfer request received:", data);

    // Make sure we have a transfer ID
    const transferId =
      data.transferId ||
      `transfer-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    // Store the request details
    pendingTransfers.set(transferId, {
      from: data.from,
      fileCount: data.fileCount,
      totalSize: data.totalSize,
      status: "pending",
      requestTime: Date.now(),
      socketId: socket.id, // Track requesting socket
      attempts: 0,
      maxAttempts: 5,
      lastAttempt: Date.now(),
    });

    // Send the transfer request and set up retry mechanism
    sendTransferRequest(transferId, data);

    // Set up a retry interval if needed
    if (!global.requestRetryInterval) {
      global.requestRetryInterval = setInterval(processPendingRequests, 2000);
    }
  });

  // Handle transfer request acknowledgments
  socket.on("transferRequestAck", (data) => {
    const { transferId } = data;
    console.log(`💬 Transfer request acknowledgment for ${transferId}`);

    if (pendingTransfers.has(transferId)) {
      // Mark as acknowledged to stop retry attempts
      const transfer = pendingTransfers.get(transferId);
      transfer.acknowledged = true;
      pendingTransfers.set(transferId, transfer);
    }
  });

  // Handle transfer responses (accept/decline) with reliable delivery
  socket.on("transferResponse", (data) => {
    console.log("🔄 Transfer response received:", data);

    const { transferId, accepted } = data;
    console.log("Transfer ID:", transferId, accepted);

    // Update transfer status in pending transfers
    if (pendingTransfers.has(transferId)) {
      const transfer = pendingTransfers.get(transferId);
      transfer.status = accepted ? "accepted" : "declined";
      pendingTransfers.set(transferId, transfer);
    }

    // Send status update to all clients
    sendTransferStatusUpdate(transferId, accepted);
  });

  socket.on("disconnect", () => {
    console.log("🔌 Socket client disconnected:", socket.id);
  });
});

// Function to send transfer request with retry logic
function sendTransferRequest(transferId, data) {
  if (!pendingTransfers.has(transferId)) return;

  const transferData = {
    transferId,
    from: data.from,
    fileCount: data.fileCount,
    totalSize: data.totalSize,
    sender: data.sender,
  };

  console.log(
    `📤 Sending transfer request ${transferId} (attempt ${
      pendingTransfers.get(transferId).attempts + 1
    })`
  );

  // Broadcast to all connected clients
  io.emit("transferRequest", transferData);

  // Update attempt counter
  const transfer = pendingTransfers.get(transferId);
  transfer.attempts++;
  transfer.lastAttempt = Date.now();
  pendingTransfers.set(transferId, transfer);
}

// Function to process pending requests and retry if needed
function processPendingRequests() {
  const now = Date.now();

  for (const [transferId, data] of pendingTransfers.entries()) {
    // Skip if acknowledged, completed, or recently attempted
    if (
      data.acknowledged ||
      data.status !== "pending" ||
      now - data.lastAttempt < 2000
    )
      continue;

    // Skip if we've tried too many times
    if (data.attempts >= data.maxAttempts) {
      console.log(
        `⚠️ Giving up on request ${transferId} after ${data.attempts} attempts`
      );
      continue;
    }

    // Retry sending the request
    sendTransferRequest(transferId, data);
  }

  // Clean up completed or expired transfers
  cleanupTransfers();

  // Clean up the interval if there's nothing to process
  const hasPendingRequests = Array.from(pendingTransfers.values()).some(
    (transfer) =>
      transfer.status === "pending" &&
      !transfer.acknowledged &&
      transfer.attempts < transfer.maxAttempts
  );

  if (!hasPendingRequests && global.requestRetryInterval) {
    clearInterval(global.requestRetryInterval);
    global.requestRetryInterval = null;
  }
}

// Clean up old transfers
function cleanupTransfers() {
  const now = Date.now();
  const EXPIRY_TIME = 10 * 60 * 1000; // 10 minutes

  for (const [transferId, data] of pendingTransfers.entries()) {
    // Remove completed or very old transfers
    if (data.status !== "pending" || now - data.requestTime > EXPIRY_TIME) {
      pendingTransfers.delete(transferId);
    }
  }
}

// Function to process the response queue and retry any pending responses
function processResponseQueue() {
  const now = Date.now();

  for (const [transferId, data] of pendingResponseQueue.entries()) {
    // Skip if we've sent it recently (within 2 seconds)
    if (now - data.lastAttempt < 2000) continue;

    // Skip if we've tried too many times
    if (data.attempts >= data.maxAttempts) {
      console.log(
        `Giving up on response for ${transferId} after ${data.attempts} attempts`
      );
      pendingResponseQueue.delete(transferId);
      continue;
    }

    // Try to send again
    sendTransferStatusUpdate(transferId);

    // Update the attempt counter
    data.attempts++;
    data.lastAttempt = now;
    pendingResponseQueue.set(transferId, data);
  }

  // Clean up the interval if there's nothing to process
  if (pendingResponseQueue.size === 0 && global.responseRetryInterval) {
    clearInterval(global.responseRetryInterval);
    global.responseRetryInterval = null;
  }
}

// Function to send the transfer status update to clients
function sendTransferStatusUpdate(transferId, accepted) {
  const statusData = {
    transferId,
    status: accepted ? "accepted" : "declined",
  };

  // Log the status update being sent
  console.log(
    `📤 Sending transfer status update: ${JSON.stringify(statusData)}`
  );

  // Send to all connected clients for reliability
  io.emit("transferStatus", statusData);
}

app.get("/ip", (req, res) => {
  const ip = getOwnDeviceIp();
  if (ip) {
    res.json({ ip });
  } else {
    res.status(500).json({ error: "Unable to retrieve IP address" });
  }
});

app.post("/upload", (req, res) => {
  const transferId = req.query.transferId;

  // If approved, process the upload
  upload.array("files")(req, res, (err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error processing upload",
        error: err.message,
      });
    }

    console.log("📁 Received files:", req.files);
    res.json({
      success: true,
      message: "Files received successfully!",
      files: req.files.map((file) => ({
        originalName: file.originalname,
        savedAs: file.filename,
        size: file.size,
      })),
    });

    // Clean up the transfer request
    pendingTransfers.delete(transferId);
  });
});

// Health check or status route
app.get("/devices", (req, res) => {
  const devices = [];

  // Iterate over peers map and push device info to the array
  for (const [name, peer] of peers) {
    devices.push({
      name: peer.name,
      host: peer.host,
      addresses: peer.addresses,
      port: peer.port,
      type: "laptop", // Default to laptop, could be determined dynamically
    });
  }

  if (devices.length === 0) {
    res.send({
      success: false,
      message: "No devices found",
      data: null,
    });
    return;
  }

  res.send({
    success: true,
    message: "Devices found",
    data: devices,
  });
});

// Start Express server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);

  // Advertise this service using Bonjour/mDNS
  bonjour.publish({
    name: SERVICE_NAME,
    type: "filedrop",
    port: PORT,
  });

  const browser = bonjour.find({ type: "filedrop" });

  browser.on("up", (service) => {
    // Skip our own service
    if (service.name === SERVICE_NAME) {
      console.log(
        "Skipping own service:",
        service.name,
        service.addresses,
        service.port,
        service.host
      );
      return;
    }

    // Check if the service follows our naming pattern (to avoid duplicates)
    if (!SERVICE_PATTERN.test(service.name)) {
      console.log("Skipping non-FileShare service:", service.name);
      return;
    }

    // Check if we already have a service with same host and different name
    let isDuplicate = false;
    for (const [existingName, existingPeer] of peers) {
      if (existingPeer.host === service.host && existingName !== service.name) {
        console.log(
          "Skipping duplicate service with different name:",
          service.name,
          "already have",
          existingName
        );
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      peers.set(service.name, {
        host: service.host,
        name: service.name,
        addresses: service.addresses,
        port: service.port,
      });
      console.log("🔍 Found service:", service);
    }
  });

  browser.on("down", (service) => {
    console.log("🔴 Service down:", service.name);

    if (peers.has(service.name)) {
      peers.delete(service.name);
      console.log(`🧹 Removed service from peers: ${service.name}`);
    } else {
      console.log(`⚠️ Tried to remove unknown service: ${service.name}`);
    }
  });

  console.log("📡 Bonjour service published for discovery.");
});

function getOwnDeviceIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}
