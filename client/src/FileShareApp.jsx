import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Laptop,
  Smartphone,
  Tablet,
  FileText,
} from "lucide-react";
import axios from "axios";
import io from "socket.io-client";

// Import components
import FileUploadArea from "./Components/FileUploadArea";
import FileItem from "./Components/FileItem";
import DeviceCard from "./Components/DeviceCard";
import TransferStatus from "./Components/TransferStatus";
import DeviceNetwork from "./Components/DeviceNetwork";
import Header from "./Components/Header";
import { getDevices } from "./method";
// Mock function for socket and IP - replace with actual implementation
const socket = io("http://localhost:5000");

const FileShareApp = () => {
  const [availableDevices, setAvailableDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [currentStep, setCurrentStep] = useState("select-files");
  const [transferStatus, setTransferStatus] = useState("preparing");
  const [transferProgress, setTransferProgress] = useState(0);
  const [transferId, setTransferId] = useState(null);
  const [showRequestPopup, setShowRequestPopup] = useState(false);
  const [incomingRequest, setIncomingRequest] = useState(null);
  const [myDeviceIp, setMyDeviceIp] = useState(null);

  // Keep track of notifications we've already seen
  const processedRequests = useRef(new Set());
  const notificationTimeout = useRef(null);

  useEffect(() => {
    // Get local device IP address and log it (for debugging or display)
    const getLocalIp = async () => {
      try {
        const res = await axios.get("http://localhost:5000/ip");
        setMyDeviceIp(res.data.ip);
        console.log("Local device IP:", res.data.ip);
      } catch (err) {
        console.error("Failed to get local IP:", err);
      }
    };
    getLocalIp();
  }, []);

  // Keep a reference to the selected device
  const selectedDevice = availableDevices.find(
    (device) => device.name === selectedDeviceId
  );

  // Create dynamic socket connection to selected device when needed
  const [targetSocket, setTargetSocket] = useState(null);

  useEffect(() => {
    // When selected device changes, establish a new socket connection if needed
    if (selectedDevice && currentStep === "select-device") {
      const deviceUrl = `http://${selectedDevice.addresses[0]}:${selectedDevice.port}`;
      console.log(`Connecting to device at: ${deviceUrl}`);
      const newSocket = io(deviceUrl);
      setTargetSocket(newSocket);

      // Clean up socket on component unmount or device change
      return () => {
        if (newSocket) {
          console.log(`Disconnecting from: ${deviceUrl}`);
          newSocket.disconnect();
          setTargetSocket(null);
        }
      };
    }
  }, [selectedDeviceId, selectedDevice, currentStep]);

  // Handle incoming transfer requests
  const handleTransferRequest = useCallback((data) => {
    console.log("Received transfer request:", data);

    // Check if we've already processed this request
    if (processedRequests.current.has(data.transferId)) {
      console.log(
        `Already processed request ${data.transferId}, ignoring duplicate`
      );
      return;
    }

    // Store the request ID to avoid processing duplicates
    processedRequests.current.add(data.transferId);

    // Send acknowledgment
    socket.emit("transferRequestAck", { transferId: data.transferId });

    // Show the notification popup
    setIncomingRequest(data);
    setShowRequestPopup(true);

    // Clear any existing timeout and set a new one
    if (notificationTimeout.current) {
      clearTimeout(notificationTimeout.current);
    }

    // Auto-hide after 5 minutes if no action taken
    notificationTimeout.current = setTimeout(() => {
      setShowRequestPopup(false);
    }, 5 * 60 * 1000);

    // Also make notification noticeable using browser notification if possible
    try {
      // Play notification sound if browser supports it
      const audio = new Audio("./notification.mp3");
      audio.volume = 0.7; // Set volume to 70%
      audio.play().catch((e) => console.log("No sound available:", e));

      // Request browser notification permission if needed
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("LocalShare: Incoming Transfer", {
          body: `${data.from} wants to send you ${data.fileCount} ${
            data.fileCount === 1 ? "file" : "files"
          }`,
          icon: "./notification-icon.png",
          tag: `fileshare-${data.transferId}`, // Prevent duplicate notifications
          requireInteraction: true, // Keep notification visible until user interacts with it
        });
      } else if (
        "Notification" in window &&
        Notification.permission !== "denied"
      ) {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification("LocalShare: Incoming Transfer", {
              body: `${data.from} wants to send you ${data.fileCount} ${
                data.fileCount === 1 ? "file" : "files"
              }`,
              icon: "./notification-icon.png",
              tag: `fileshare-${data.transferId}`,
              requireInteraction: true,
            });
          }
        });
      }

      // Flash the window title as a fallback notification method
      let originalTitle = document.title;
      let flashInterval = setInterval(() => {
        document.title =
          document.title === originalTitle
            ? "📩 New Transfer Request!"
            : originalTitle;
      }, 1000);

      // Stop flashing when popup is dismissed
      setTimeout(() => {
        clearInterval(flashInterval);
        document.title = originalTitle;
      }, 30000); // Stop after 30 seconds max
    } catch (err) {
      console.log("Browser notification error:", err);
    }
  }, []);

  useEffect(() => {
    // Load devices when the component mounts
    loadDevices();

    // Set up polling to refresh devices every 10 seconds
    const intervalId = setInterval(loadDevices, 10000);

    // Socket listeners for incoming transfer requests
    socket.on("transferRequest", handleTransferRequest);

    // Clear interval and socket listeners when component unmounts
    return () => {
      clearInterval(intervalId);
      socket.off("transferRequest");
      if (notificationTimeout.current) {
        clearTimeout(notificationTimeout.current);
      }
    };
  }, [handleTransferRequest]);

  // Set up listener for transfer status on the socket
  useEffect(() => {
    if (!socket) return;

    // Listen for transfer status updates
    const handleTransferStatus = (data) => {
      console.log("Transfer status update received:", data);

      if (data.transferId === transferId) {
        if (data.status === "accepted") {
          console.log("Transfer accepted, proceeding with upload");
          uploadFiles(data.transferId);
        } else if (data.status === "declined") {
          setTransferStatus("declined");
          setCurrentStep("select-files");
          alert(`Transfer request was declined.`);
        }
      }
    };

    socket.on("transferStatus", handleTransferStatus);

    return () => {
      socket.off("transferStatus", handleTransferStatus);
    };
  }, [transferId]);

  const loadDevices = async () => {
    try {
      const devices = await getDevices();
      setAvailableDevices(devices);
    } catch (error) {
      console.error("Error loading devices:", error);
    }
  };

  const calculateTotalSize = (files) => {
    return files.reduce((total, file) => total + file.file.size, 0);
  };

  const requestTransfer = async () => {
    if (!selectedDeviceId || selectedFiles.length === 0 || !targetSocket)
      return;

    setCurrentStep("transfer");
    setTransferStatus("awaiting-approval");
    setTransferProgress(0);

    try {
      // Generate a transfer request ID
      const newTransferId = `transfer-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 5)}`;
      setTransferId(newTransferId);

      // Send transfer request to the selected device via its socket
      targetSocket.emit("requestTransfer", {
        transferId: newTransferId,
        from: "This Device", // Could be replaced with your device name
        fileCount: selectedFiles.length,
        totalSize: calculateTotalSize(selectedFiles),
        sender: {
          senderIp: myDeviceIp,
          senderPort: 5000,
        },
      });

      console.log(
        `Transfer request sent to ${selectedDevice.name} with ID: ${newTransferId}`
      );
      // Now we wait for the recipient's response via the transferStatus event
    } catch (error) {
      console.error("Error requesting transfer:", error);
      setTransferStatus("error");
    }
  };

  const uploadFiles = async (approvedTransferId) => {
    if (!selectedDeviceId || selectedFiles.length === 0 || !selectedDevice) {
      console.error("Missing required data for upload");
      return;
    }

    console.log(
      "Starting file upload to:",
      selectedDevice.addresses[0],
      selectedDevice.port
    );
    setTransferStatus("in-progress");
    setTransferProgress(0);

    try {
      // Create form data to handle file uploads properly
      console.log("Transfering files");
      const formData = new FormData();

      // Append each file to the form data
      selectedFiles.forEach((file) => {
        formData.append("files", file.file);
      });

      // Configure axios to handle progress events
      const config = {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setTransferProgress(percentCompleted);
        },
        headers: {
          "Content-Type": "multipart/form-data",
        },
        params: {
          transferId: approvedTransferId,
        },
      };

      // Make the request to the selected device
      const response = await axios.post(
        `http://${selectedDevice.addresses[0]}:${selectedDevice.port}/upload`,
        formData,
        config
      );

      // Handle successful response
      if (response.data.success) {
        setTransferStatus("completed");
        setTransferProgress(100);
      } else {
        setTransferStatus("error");
      }
    } catch (error) {
      console.error("Error sending files:", error);
      setTransferStatus("error");
    }
  };

  // Handle response to incoming transfer request
  const handleTransferResponse = (accepted) => {
    if (!incomingRequest || !incomingRequest.sender) {
      console.error("No valid incoming request to respond to");
      return;
    }

    console.log(
      `Responding ${accepted ? "ACCEPT" : "DECLINE"} to transfer: ${
        incomingRequest.transferId
      }`
    );

    // Clear notification timeout
    if (notificationTimeout.current) {
      clearTimeout(notificationTimeout.current);
      notificationTimeout.current = null;
    }

    try {
      // Create a direct socket connection to the sender
      const senderUrl = `http://${incomingRequest.sender.senderIp}:${incomingRequest.sender.senderPort}`;
      console.log(`Connecting to sender at ${senderUrl} to send response`);

      // Create a temporary socket for this response
      const senderSocket = io(senderUrl);

      let responseAttempts = 0;
      const maxAttempts = 5;
      let responseTimer = null;

      // Function to send response with retry capability
      const sendResponse = () => {
        if (responseAttempts >= maxAttempts) {
          console.error("Failed to send response after maximum attempts");
          if (responseTimer) clearInterval(responseTimer);
          senderSocket.disconnect();
          return;
        }

        responseAttempts++;
        console.log(`Sending response attempt ${responseAttempts}`);

        senderSocket.emit("transferResponse", {
          transferId: incomingRequest.transferId,
          accepted,
        });
      };

      // Wait for connection before sending response
      senderSocket.on("connect", () => {
        console.log(
          `Connected to sender, sending response for ${incomingRequest.transferId}`
        );

        // Send initial response
        sendResponse();

        // Set up retry interval (send every 2 seconds until max attempts)
        responseTimer = setInterval(() => {
          if (responseAttempts < maxAttempts) {
            sendResponse();
          } else {
            clearInterval(responseTimer);
            senderSocket.disconnect();
          }
        }, 2000);

        // Disconnect after a reasonable timeout (10 seconds)
        setTimeout(() => {
          if (responseTimer) clearInterval(responseTimer);
          senderSocket.disconnect();
          console.log("Response sending completed, disconnected from sender");
        }, 10000);
      });

      // Handle connection errors
      senderSocket.on("connect_error", (err) => {
        console.error(`Failed to connect to sender: ${err}`);

        // Try an alternative approach - send through our own socket
        console.log("Trying alternative response method through main socket");
        socket.emit("transferResponse", {
          transferId: incomingRequest.transferId,
          accepted,
        });
      });
    } catch (error) {
      console.error("Error sending transfer response:", error);
      // Fallback method
      socket.emit("transferResponse", {
        transferId: incomingRequest.transferId,
        accepted,
      });
    }

    setShowRequestPopup(false);
    setIncomingRequest(null);
  };

  // Convert bytes to readable format
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Handlers
  const handleDeviceSelect = (deviceId) => {
    setSelectedDeviceId(deviceId);
  };

  const handleFilesSelected = (files) => {
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveFile = (fileId) => {
    setSelectedFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  const handleProceedToDevices = () => {
    if (selectedFiles.length > 0) {
      setCurrentStep("select-device");
    }
  };

  const handleStartTransfer = () => {
    requestTransfer();
  };

  const handleCancelTransfer = () => {
    setTransferStatus("preparing");
    setTransferProgress(0);
    setCurrentStep("select-files");
    setTransferId(null);
  };

  const handleNewTransfer = () => {
    setSelectedFiles([]);
    setSelectedDeviceId(null);
    setCurrentStep("select-files");
    setTransferStatus("preparing");
    setTransferProgress(0);
    setTransferId(null);
  };

  // Calculate total size of selected files
  const totalFileSize = selectedFiles.reduce(
    (total, file) => total + file.size,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <Header />

      {/* File Transfer Request Popup */}
      {showRequestPopup && incomingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl shadow-indigo-900/10 animate-scale-in">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-3">
                <Laptop size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Transfer Request</h3>
                <p className="text-gray-500 text-sm">
                  Files are waiting for you
                </p>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl mb-4">
              <p className="font-medium text-gray-800">
                <span className="text-indigo-600">{incomingRequest.from}</span>{" "}
                wants to send:
              </p>
              <div className="mt-2 flex items-center text-gray-700">
                <div className="bg-white p-2 rounded-lg shadow-sm mr-3">
                  <FileText size={24} className="text-indigo-500" />
                </div>
                <div>
                  <p className="font-medium">
                    {incomingRequest.fileCount}{" "}
                    {incomingRequest.fileCount === 1 ? "file" : "files"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatBytes(incomingRequest.totalSize)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => handleTransferResponse(false)}
                className="flex-1 border border-gray-200 bg-white text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center font-medium"
              >
                <X size={18} className="mr-2 text-red-500" />
                Decline
              </button>
              <button
                onClick={() => handleTransferResponse(true)}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-colors flex items-center justify-center shadow-md shadow-indigo-200 font-medium"
              >
                <Check size={18} className="mr-2" />
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="relative flex justify-between items-center max-w-xl mx-auto">
            {/* Progress Bar */}
            <div className="absolute top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0"></div>
            <div
              className="absolute top-1/2 transform -translate-y-1/2 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full z-0 transition-all duration-500 ease-in-out"
              style={{
                width:
                  currentStep === "select-files"
                    ? "0%"
                    : currentStep === "select-device"
                    ? "50%"
                    : "100%",
              }}
            ></div>

            {/* Step Circles */}
            <button
              onClick={() =>
                currentStep !== "select-files" && setCurrentStep("select-files")
              }
              className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-300 font-medium ${
                currentStep === "select-files"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-indigo-600 border-2 border-indigo-600"
              }`}
            >
              1
            </button>

            <button
              onClick={() =>
                selectedFiles.length > 0 &&
                currentStep === "transfer" &&
                setCurrentStep("select-device")
              }
              className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-300 font-medium ${
                currentStep === "select-device"
                  ? "bg-indigo-600 text-white"
                  : currentStep === "transfer"
                  ? "bg-white text-indigo-600 border-2 border-indigo-600"
                  : "bg-white text-gray-400 border-2 border-gray-300"
              }`}
            >
              2
            </button>

            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-300 font-medium ${
                currentStep === "transfer"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-400 border-2 border-gray-300"
              }`}
            >
              3
            </div>
          </div>

          {/* Step Labels */}
          <div className="relative flex justify-between text-sm mt-2 text-center max-w-xl mx-auto px-6">
            <span
              className={`w-20 ${
                currentStep === "select-files"
                  ? "text-indigo-600 font-medium"
                  : "text-gray-600"
              }`}
            >
              Select Files
            </span>
            <span
              className={`w-20 ${
                currentStep === "select-device"
                  ? "text-indigo-600 font-medium"
                  : "text-gray-600"
              }`}
            >
              Choose Device
            </span>
            <span
              className={`w-20 ${
                currentStep === "transfer"
                  ? "text-indigo-600 font-medium"
                  : "text-gray-600"
              }`}
            >
              Transfer
            </span>
          </div>
        </div>

        {/* Content based on current step */}
        <div className="bg-white rounded-2xl shadow-lg shadow-indigo-100 overflow-hidden">
          {/* Step 1: Select Files */}
          {currentStep === "select-files" && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Select Files to Share
              </h2>
              <p className="text-gray-600 mb-6">
                Choose the files you want to send to another device
              </p>

              <FileUploadArea onFilesSelected={handleFilesSelected} />

              {selectedFiles.length > 0 && (
                <div className="mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Selected Files</h3>
                    <span className="text-sm text-gray-500">
                      {formatBytes(totalFileSize)}
                    </span>
                  </div>

                  <div className="max-h-64 overflow-y-auto pr-2 space-y-2">
                    {selectedFiles.map((file) => (
                      <FileItem
                        key={file.id}
                        file={file}
                        onRemove={handleRemoveFile}
                      />
                    ))}
                  </div>

                  <div className="mt-8 flex justify-between">
                    <div className="text-sm text-gray-500 flex items-center">
                      <span className="font-semibold">
                        {selectedFiles.length}
                      </span>
                      <span className="ml-1">files selected</span>
                    </div>
                    <button
                      onClick={handleProceedToDevices}
                      disabled={selectedFiles.length === 0}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 flex items-center shadow-md shadow-indigo-200 font-medium disabled:opacity-50"
                    >
                      Continue
                      <ArrowRight size={18} className="ml-2" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Device */}
          {currentStep === "select-device" && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Select Destination
              </h2>
              <p className="text-gray-600 mb-6">
                Choose a device to receive your files
              </p>

              {/* Device Network Visualization */}
              <DeviceNetwork
                devices={availableDevices}
                selectedDevice={selectedDeviceId}
                onSelectDevice={handleDeviceSelect}
              />

              <div className="mt-8">
                <div className="bg-indigo-50 rounded-xl p-4 mb-6 border border-indigo-100">
                  <div className="flex items-center">
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <FileText size={24} className="text-indigo-500" />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-medium">Ready to send</h3>
                      <p className="text-sm text-gray-600">
                        {selectedFiles.length}{" "}
                        {selectedFiles.length === 1 ? "file" : "files"} (
                        {formatBytes(totalFileSize)})
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setCurrentStep("select-files")}
                    className="py-3 px-6 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors flex items-center"
                  >
                    <ArrowLeft size={18} className="mr-2" />
                    Back
                  </button>
                  <button
                    onClick={handleStartTransfer}
                    disabled={!selectedDeviceId}
                    className={`py-3 px-6 rounded-xl flex items-center font-medium shadow-md shadow-indigo-100 transition-all duration-300 ${
                      selectedDeviceId
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Send Files
                    <ArrowRight size={18} className="ml-2" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Transfer */}
          {currentStep === "transfer" && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                File Transfer
              </h2>
              <p className="text-gray-600 mb-6">
                Sending files to selected device
              </p>
              <div>
                <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
                  <div className="flex items-center mb-6">
                    <div className="p-3 rounded-xl bg-indigo-100 text-indigo-600 mr-3">
                      {selectedDevice?.type === "laptop" && (
                        <Laptop size={28} />
                      )}
                      {selectedDevice?.type === "smartphone" && (
                        <Smartphone size={28} />
                      )}
                      {selectedDevice?.type === "tablet" && (
                        <Tablet size={28} />
                      )}
                      {(!selectedDevice?.type ||
                        selectedDevice?.type === undefined) && (
                        <Laptop size={28} />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {selectedDevice?.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {selectedDevice?.addresses?.[0]}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4 pb-4 border-b border-gray-100">
                    <div className="flex items-center text-sm text-gray-600">
                      <span>
                        Sending {selectedFiles.length}{" "}
                        {selectedFiles.length === 1 ? "file" : "files"}
                      </span>
                      <span className="mx-2">•</span>
                      <span>{formatBytes(totalFileSize)}</span>
                    </div>
                  </div>

                  <TransferStatus
                    status={transferStatus}
                    progress={transferProgress}
                    onCancel={handleCancelTransfer}
                  />
                </div>

                <div className="flex justify-between">
                  {transferStatus !== "completed" && (
                    <button
                      onClick={handleCancelTransfer}
                      className="py-3 px-6 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors flex items-center"
                    >
                      <X size={18} className="mr-2" />
                      Cancel
                    </button>
                  )}

                  {transferStatus === "completed" && (
                    <button
                      onClick={handleNewTransfer}
                      className="py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-colors shadow-md shadow-indigo-100 font-medium w-full"
                    >
                      Start New Transfer
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer with device info */}
      <footer className="py-4 px-6 text-center text-sm text-gray-500">
        <p>Your device: {myDeviceIp || "Loading IP..."}</p>
      </footer>
    </div>
  );
};

export default FileShareApp;
