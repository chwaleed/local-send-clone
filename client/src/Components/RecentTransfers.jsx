import React from "react";
import { Clock, ChevronRight } from "lucide-react";
import FileItem from "./FileItem";

const RecentTransfers = ({ recentFiles = [], onSelectFiles, onViewAll }) => {
  // If no recent files, show empty state
  if (recentFiles.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
        <div className="flex items-center mb-4">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 mr-3">
            <Clock size={20} />
          </div>
          <h3 className="text-lg font-medium">Recent Transfers</h3>
        </div>

        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <Clock size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-500 mb-2">No recent transfers</p>
          <p className="text-sm text-gray-400">
            Files you send will appear here for quick access
          </p>
        </div>
      </div>
    );
  }

  // Group files by transfer session
  const mostRecentGroups = [
    // Example structure - in real app, you'd group by transfer ID or timestamp
    {
      id: "transfer-1",
      date: "Today, 2:30 PM",
      device: "Kitchen Tablet",
      files: recentFiles.slice(0, Math.min(2, recentFiles.length)),
    },
    // Add more groups if needed
  ];

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 mr-3">
            <Clock size={20} />
          </div>
          <h3 className="text-lg font-medium">Recent Transfers</h3>
        </div>

        {recentFiles.length > 2 && (
          <button
            onClick={onViewAll}
            className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
          >
            View all
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      <div className="space-y-5">
        {mostRecentGroups.map((group) => (
          <div key={group.id} className="border border-gray-100 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm text-gray-500">{group.date}</div>
              <div className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                To: {group.device}
              </div>
            </div>

            <div className="space-y-2">
              {group.files.map((file) => (
                <FileItem
                  key={file.id}
                  file={file}
                  onRemove={() => {}}
                  showRemoveButton={false}
                />
              ))}
            </div>

            <button
              onClick={() => onSelectFiles(group.files)}
              className="mt-3 w-full py-2 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-indigo-600 text-sm font-medium transition-colors"
            >
              Send Again
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentTransfers;
