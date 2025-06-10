import React from "react";
import { Wifi, WifiOff, User } from "lucide-react";

const ConnectionStatus = ({ isConnected, deviceCount, ip }) => {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {isConnected ? (
            <div className="p-2 rounded-full bg-green-100 text-green-600 mr-3">
              <Wifi size={18} />
            </div>
          ) : (
            <div className="p-2 rounded-full bg-red-100 text-red-600 mr-3">
              <WifiOff size={18} />
            </div>
          )}

          <div>
            <h3 className="font-medium text-sm">
              {isConnected ? "Connected" : "Disconnected"}
            </h3>
            <p className="text-xs text-gray-500">{ip || "Fetching IP..."}</p>
          </div>
        </div>

        <div className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
          <User size={14} className="text-gray-500 mr-1" />
          <span className="text-xs font-medium">
            {deviceCount} {deviceCount === 1 ? "device" : "devices"} nearby
          </span>
        </div>
      </div>

      {!isConnected && (
        <div className="mt-3 p-2 bg-red-50 text-red-700 text-xs rounded border border-red-100">
          Make sure you're connected to the same network as other devices
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;
