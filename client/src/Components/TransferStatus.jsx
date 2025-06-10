import React from "react";
import {
  AlertTriangle,
  Check,
  Loader2,
  X,
  Info,
  ArrowRight,
} from "lucide-react";

const TransferStatus = ({ status, progress, onCancel }) => {
  return (
    <div className="relative">
      {status === "preparing" && (
        <div className="flex flex-col">
          <div className="flex items-center justify-between">
            <span className="flex items-center text-indigo-600 font-medium">
              <Info size={18} className="mr-2" />
              Ready to send
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Click "Send Files" to initiate transfer
          </p>
        </div>
      )}

      {status === "awaiting-approval" && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-amber-600 font-medium flex items-center">
              <AlertTriangle size={18} className="mr-2" />
              Waiting for approval
            </span>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-red-500 transition-colors duration-200 bg-gray-50 hover:bg-red-50 rounded-full p-1"
            >
              <X size={16} />
            </button>
          </div>
          <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="absolute top-0 left-0 h-full w-1/3 bg-amber-500/70 animate-pulse"></div>
          </div>
          <p className="text-sm text-gray-500 mt-3 italic">
            Recipient needs to accept the transfer request
          </p>
        </div>
      )}

      {status === "in-progress" && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-indigo-600 font-medium flex items-center">
              <Loader2 size={18} className="mr-2 animate-spin" />
              Sending files...
            </span>
            <div className="bg-indigo-100 text-indigo-700 py-1 px-2 rounded-full text-xs font-bold">
              {progress}%
            </div>
          </div>
          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Transferring</span>
            <span>ETA: ~{Math.ceil((100 - progress) / 20)} seconds</span>
          </div>
        </div>
      )}

      {status === "completed" && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-green-600 font-medium flex items-center">
              <Check size={18} className="mr-2" />
              Transfer complete!
            </span>
            <div className="bg-green-100 text-green-700 py-1 px-2 rounded-full text-xs font-bold">
              100%
            </div>
          </div>
          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"></div>
          </div>
          <p className="flex items-center justify-center mt-4 text-sm text-gray-600">
            Files have been successfully transferred
            <ArrowRight size={14} className="ml-1" />
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-red-600 font-medium flex items-center">
              <X size={18} className="mr-2" />
              Transfer failed
            </span>
            <button
              onClick={onCancel}
              className="text-white bg-red-500 hover:bg-red-600 transition-colors py-1 px-3 rounded-full text-xs font-medium"
            >
              Try again
            </button>
          </div>
          <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="absolute top-0 left-0 h-full w-full bg-red-500"></div>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            Check your connection and device availability
          </p>
        </div>
      )}

      {status === "declined" && (
        <div className="mt-2 bg-red-50 p-4 rounded-lg border border-red-100">
          <div className="flex items-center text-red-600 mb-2">
            <X size={18} className="mr-2" />
            <span className="font-medium">Transfer declined</span>
          </div>
          <p className="text-sm text-gray-600">
            The recipient declined your transfer request.
          </p>
          <button
            onClick={onCancel}
            className="mt-3 w-full bg-white border border-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-50 transition-colors"
          >
            Start over
          </button>
        </div>
      )}
    </div>
  );
};

export default TransferStatus;
