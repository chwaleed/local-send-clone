import React from "react";
import { Share, FileUp, Signal, Settings } from "lucide-react";

const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10 shadow-sm">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Signal className="text-indigo-600" />
          <h1 className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-500 text-transparent bg-clip-text">
            LocalShare
          </h1>
        </div>
        <div>
          <button
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Settings"
          >
            <Settings size={18} className="text-gray-600" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
