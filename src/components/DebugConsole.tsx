import { useEffect, useState } from 'react';

export function DebugConsole() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Store original console methods
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    // Override console methods
    console.log = (...args) => {
      originalLog.apply(console, args);
      setLogs(prev => [...prev, `LOG: ${args.map(arg => JSON.stringify(arg)).join(' ')}`]);
    };

    console.error = (...args) => {
      originalError.apply(console, args);
      setLogs(prev => [...prev, `ERROR: ${args.map(arg => JSON.stringify(arg)).join(' ')}`]);
    };

    console.warn = (...args) => {
      originalWarn.apply(console, args);
      setLogs(prev => [...prev, `WARN: ${args.map(arg => JSON.stringify(arg)).join(' ')}`]);
    };

    // Cleanup
    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded-full shadow-lg z-50"
      >
        Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 w-full md:w-96 h-64 bg-black bg-opacity-90 text-white p-4 overflow-auto z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Debug Console</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-white hover:text-red-500"
        >
          Close
        </button>
      </div>
      <div className="space-y-1 font-mono text-sm">
        {logs.map((log, i) => (
          <div key={i} className="whitespace-pre-wrap break-all">
            {log}
          </div>
        ))}
      </div>
      <button
        onClick={() => setLogs([])}
        className="absolute bottom-4 right-4 bg-red-500 text-white px-2 py-1 rounded"
      >
        Clear
      </button>
    </div>
  );
} 