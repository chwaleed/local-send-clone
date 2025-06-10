import React from "react";
import { Laptop, Smartphone, Tablet, Monitor, Tv } from "lucide-react";

const DeviceCard = ({ device, selected, onClick }) => {
  // Determine which icon to use based on device type
  const getDeviceIcon = () => {
    switch (device.type?.toLowerCase()) {
      case "smartphone":
        return <Smartphone size={28} />;
      case "tablet":
        return <Tablet size={28} />;
      case "tv":
        return <Tv size={28} />;
      case "monitor":
        return <Monitor size={28} />;
      case "laptop":
      default:
        return <Laptop size={28} />;
    }
  };

  return (
    <div
      className={`p-4 rounded-xl transition-all duration-300 cursor-pointer transform hover:scale-105 ${
        selected
          ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200"
          : "bg-white border border-gray-100 hover:shadow-md hover:border-indigo-100"
      }`}
      onClick={() => onClick(device.name)}
    >
      <div className="flex flex-col items-center relative">
        {selected && (
          <div className="absolute top-0 right-0 w-5 h-5 bg-white rounded-full -mt-2 -mr-2 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
        )}

        <div
          className={`p-4 rounded-full mb-3 transition-all duration-300 ${
            selected
              ? "bg-white/20 text-white"
              : "bg-indigo-50 text-indigo-500 group-hover:bg-indigo-100"
          }`}
        >
          {getDeviceIcon()}
        </div>

        <div className="font-medium text-center truncate w-full">
          {device.name}
        </div>

        <div
          className={`text-xs mt-1 ${
            selected ? "text-indigo-100" : "text-gray-500"
          }`}
        >
          {device.addresses?.[0] || "No IP"}
        </div>

        {selected && (
          <div className="mt-3 w-full">
            <div className="bg-white/20 h-1 w-full rounded-full overflow-hidden">
              <div
                className="bg-white h-full rounded-full animate-pulse"
                style={{ width: "30%" }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceCard;
