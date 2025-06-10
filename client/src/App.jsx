import FileShareApp from "./FileShareApp";
import { useEffect } from "react";

function App() {
  // Set up theme and document properties
  useEffect(() => {
    // Set title and theme color
    document.title = "LocalShare";

    // Add meta theme color for mobile browser
    let metaTheme = document.querySelector('meta[name="theme-color"]');
    if (!metaTheme) {
      metaTheme = document.createElement("meta");
      metaTheme.name = "theme-color";
      document.head.appendChild(metaTheme);
    }
    metaTheme.content = "#4f46e5"; // Indigo-600

    // Cleanup on unmount
    return () => {
      document.title = "File Sharing";
      if (metaTheme) {
        metaTheme.content = "#ffffff";
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <FileShareApp />
    </div>
  );
}

export default App;
