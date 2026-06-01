import { useState } from "react";
import { Trash2, RefreshCw } from "lucide-react";

const APP_VERSION = "1.0.1";

export default function Settings() {
  const [clearing, setClearing] = useState(false);

  const clearCache = async () => {
    setClearing(true);
    localStorage.clear();
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    setTimeout(() => {
      setClearing(false);
      window.location.reload();
    }, 500);
  };

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <h1 className="text-xl font-semibold">设置</h1>

      <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">当前版本</span>
          <span className="text-sm font-mono">v{APP_VERSION}</span>
        </div>

        <button
          onClick={clearCache}
          disabled={clearing}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-sm hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-colors disabled:opacity-50"
        >
          <Trash2 size={14} />
          {clearing ? "清理中..." : "清除缓存"}
        </button>
      </div>
    </div>
  );
}
