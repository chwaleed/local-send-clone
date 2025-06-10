import React, { useCallback } from "react";
import { Upload, FileUp } from "lucide-react";

const FileUploadArea = ({ onFilesSelected }) => {
  // Generate a unique ID for each file
  const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  // Handle drag over event
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.currentTarget) {
      e.currentTarget.classList.add("border-indigo-500", "bg-indigo-50");
    }
  }, []);

  // Handle drag leave event
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.currentTarget) {
      e.currentTarget.classList.remove("border-indigo-500", "bg-indigo-50");
    }
  }, []);

  // Handle file drop event
  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      const element = e.currentTarget;
      if (element) {
        element.classList.remove("border-indigo-500", "bg-indigo-50");
      }

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files).map((file) => ({
          id: generateUniqueId(),
          name: file.name,
          size: file.size,
          type: file.type,
          file: file, // Keep reference to the original file
        }));

        onFilesSelected(files);
      }
    },
    [onFilesSelected]
  );

  // Handle file input change
  const handleFileChange = useCallback(
    (e) => {
      if (e.target.files && e.target.files.length > 0) {
        const files = Array.from(e.target.files).map((file) => ({
          id: generateUniqueId(),
          name: file.name,
          size: file.size,
          type: file.type,
          file: file, // Keep reference to the original file
        }));

        onFilesSelected(files);

        // Reset the input to allow selecting the same file again
        e.target.value = "";
      }
    },
    [onFilesSelected]
  );

  return (
    <div
      className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-all duration-300 hover:border-indigo-400 group bg-gradient-to-br from-white to-indigo-50/30"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 opacity-30 rounded-lg"></div>
      </div>

      <div className="relative z-10">
        <div className="w-16 h-16 mx-auto mb-4 bg-indigo-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <FileUp size={28} className="text-indigo-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">
          Share Your Files
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Drag & drop files here or click to browse
        </p>

        <div>
          <label
            htmlFor="file-upload"
            className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-500 text-white font-medium shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
          >
            <Upload size={16} className="mr-2" />
            Select Files
          </label>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={handleFileChange}
            multiple
          />
        </div>
      </div>
    </div>
  );
};

export default FileUploadArea;
