import React from "react";
import { Laptop, Smartphone, Monitor } from "lucide-react";

const DeviceNetwork = ({ devices, selectedDevice, onSelectDevice }) => {
  // No devices case
  if (!devices || devices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-10 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Laptop size={24} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-600 mb-2">
          No devices found
        </h3>
        <p className="text-sm text-gray-500 max-w-xs">
          Make sure other devices are on the same network and have the app open
        </p>
      </div>
    );
  }

  // Get device icon based on device type
  const getDeviceIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "smartphone":
        return <Smartphone size={20} />;
      case "monitor":
        return <Monitor size={20} />;
      case "laptop":
      default:
        return <Laptop size={20} />;
    }
  };

  return (
    <div className="p-8 bg-gray-50 rounded-xl border border-gray-200 relative overflow-hidden">
      {/* Network visualization background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute h-72 w-72 border-2 border-indigo-400 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute h-48 w-48 border-2 border-indigo-300 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute h-24 w-24 border-2 border-indigo-200 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      <h3 className="text-lg font-medium text-center mb-6 relative z-10">
        Nearby Devices
      </h3>

      <div className="relative z-10">
        <div className="flex flex-wrap justify-center gap-6">
          {devices.map((device) => {
            const isSelected = selectedDevice === device.name;

            return (
              <div
                key={device.name}
                onClick={() => onSelectDevice(device.name)}
                className={`
                  flex flex-col items-center p-4 rounded-xl cursor-pointer transition-all duration-300
                  ${
                    isSelected
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-200 transform scale-110"
                      : "bg-white hover:shadow-md border border-gray-100"
                  }
                `}
              >
                <div
                  className={`
                  w-12 h-12 rounded-full flex items-center justify-center mb-2
                  ${isSelected ? "bg-white/20" : "bg-gray-100"}
                `}
                >
                  {getDeviceIcon(device.type)}
                </div>
                <div className="text-sm font-medium">{device.name}</div>
                <div
                  className={`text-xs mt-1 ${
                    isSelected ? "text-indigo-100" : "text-gray-500"
                  }`}
                >
                  {device.addresses?.[0] || "Unknown"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DeviceNetwork;
