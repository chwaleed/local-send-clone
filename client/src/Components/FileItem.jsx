import React from "react";
import { X, File, FileText, FileImage, FileArchive } from "lucide-react";

const FileItem = ({ file, onRemove, onClick, showRemoveButton = true }) => {
  // Function to format file size in KB, MB or GB
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

  // Get appropriate file icon based on file type
  const getFileIcon = (fileType, extension) => {
    if (fileType && fileType.startsWith("image/")) {
      return <FileImage size={20} />;
    } else if (fileType === "application/pdf" || extension === "pdf") {
      return <FileText size={20} />;
    } else if (
      fileType === "application/zip" ||
      extension === "zip" ||
      extension === "rar" ||
      extension === "7z"
    ) {
      return <FileArchive size={20} />;
    } else if (
      (fileType && fileType.includes("document")) ||
      ["doc", "docx", "txt", "rtf"].includes(extension)
    ) {
      return <FileText size={20} />;
    } else {
      return <File size={20} />;
    }
  };

  // Map file extensions to colors
  const getFileColor = (extension) => {
    const colorMap = {
      pdf: "bg-red-100 text-red-600 border-red-200",
      doc: "bg-blue-100 text-blue-600 border-blue-200",
      docx: "bg-blue-100 text-blue-600 border-blue-200",
      xls: "bg-green-100 text-green-600 border-green-200",
      xlsx: "bg-green-100 text-green-600 border-green-200",
      ppt: "bg-orange-100 text-orange-600 border-orange-200",
      pptx: "bg-orange-100 text-orange-600 border-orange-200",
      jpg: "bg-purple-100 text-purple-600 border-purple-200",
      jpeg: "bg-purple-100 text-purple-600 border-purple-200",
      png: "bg-purple-100 text-purple-600 border-purple-200",
      gif: "bg-purple-100 text-purple-600 border-purple-200",
      txt: "bg-gray-100 text-gray-600 border-gray-200",
      zip: "bg-yellow-100 text-yellow-600 border-yellow-200",
      default: "bg-indigo-100 text-indigo-600 border-indigo-200",
    };

    return colorMap[extension] || colorMap.default;
  };

  const extension = getFileExtension(file.name);
  const fileColor = getFileColor(extension);
  const fileIcon = getFileIcon(file.type, extension);

  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between p-3 mb-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 group ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <div className="flex items-center overflow-hidden">
        <div className={`p-3 rounded-lg mr-3 border ${fileColor}`}>
          {fileIcon}
        </div>
        <div className="overflow-hidden">
          <div className="font-medium truncate max-w-[180px]">{file.name}</div>
          <div className="text-xs text-gray-500 flex items-center">
            <span className="bg-gray-100 rounded-full px-2 py-0.5">
              {formatFileSize(file.size)}
            </span>
            <span className="ml-2 text-gray-400 uppercase text-[10px]">
              {extension}
            </span>
          </div>
        </div>
      </div>
      {showRemoveButton && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering parent onClick
            onRemove(file.id);
          }}
          className="p-2 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          aria-label="Remove file"
        >
          <X size={16} className="text-red-500" />
        </button>
      )}
    </div>
  );
};

export default FileItem;
