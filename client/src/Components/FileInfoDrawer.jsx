import React from "react";
import {
  X,
  FileText,
  Upload,
  Download,
  Calendar,
  Clock,
  AlertCircle,
} from "lucide-react";

const FileInfoDrawer = ({ file, onClose, isOutgoing = true }) => {
  if (!file) return null;

  const formatDate = (timestamp) => {
    // Use the file's timestamp or current date if not available
    const date = timestamp ? new Date(timestamp) : new Date();
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const formatTime = (timestamp) => {
    // Use the file's timestamp or current time if not available
    const date = timestamp ? new Date(timestamp) : new Date();
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  // Format file size function
  const formatFileSize = (bytes) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
  };

  // Extract file extension
  const getFileExtension = (filename) => {
    return filename.split(".").pop().toLowerCase();
  };

  const extension = getFileExtension(file.name);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-lg animate-slide-up overflow-auto">
        <div className="sticky top-0 bg-white z-10 border-b border-gray-100">
          <div className="flex items-center justify-between p-4">
            <h2 className="text-lg font-semibold">File Information</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* File preview area */}
          <div className="mb-8 flex flex-col items-center">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-gray-200 flex items-center justify-center mb-3">
              {/* Icon based on file type */}
              <FileText size={36} className="text-indigo-600" />
            </div>
            <h3 className="text-xl font-medium text-center">{file.name}</h3>
            <div className="text-gray-500 text-sm mt-1">
              {formatFileSize(file.size)} • {extension.toUpperCase()}
            </div>
          </div>

          {/* Transfer details */}
          <div className="bg-indigo-50 rounded-xl p-4 mb-6">
            <div className="flex items-center mb-2">
              {isOutgoing ? (
                <Upload size={18} className="text-indigo-600 mr-2" />
              ) : (
                <Download size={18} className="text-indigo-600 mr-2" />
              )}
              <span className="text-indigo-800 font-medium">
                {isOutgoing ? "Outgoing File" : "Incoming File"}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {isOutgoing ? "Sent to" : "Received from"}: Device Name
            </div>
          </div>

          {/* File details */}
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center text-gray-600">
                <Calendar size={16} className="mr-2" />
                <span>Date</span>
              </div>
              <div className="font-medium">{formatDate(file.lastModified)}</div>
            </div>

            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center text-gray-600">
                <Clock size={16} className="mr-2" />
                <span>Time</span>
              </div>
              <div className="font-medium">{formatTime(file.lastModified)}</div>
            </div>

            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center text-gray-600">
                <AlertCircle size={16} className="mr-2" />
                <span>File type</span>
              </div>
              <div className="font-medium">
                {file.type || `${extension.toUpperCase()} File`}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <button className="py-3 px-4 bg-gray-100 hover:bg-gray-200 transition-colors rounded-xl text-gray-700 font-medium">
              View Details
            </button>
            <button className="py-3 px-4 bg-indigo-600 hover:bg-indigo-700 transition-colors rounded-xl text-white font-medium">
              {isOutgoing ? "Send Again" : "Save File"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileInfoDrawer;
