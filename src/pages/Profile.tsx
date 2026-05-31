import { Link } from "react-router-dom";
import { User, Upload, Star, Settings as SettingsIcon, LogOut } from "lucide-react";

export default function Profile() {
  const token = localStorage.getItem("local_auth_token");
  const user = token ? { name: "用户" + token.slice(0, 4), uploads: 3, stars: 12 } : null;

  if (!user) {
    return (
      <div className="text-center py-16 space-y-4">
        <User size={48} className="mx-auto text-gray-400" />
        <p className="text-gray-500">请先登录</p>
        <Link to="/login" className="inline-block px-6 py-2.5 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600">
          去登录
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="p-6 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mx-auto mb-3">
          <span className="text-white text-xl font-bold">{user.name[0]}</span>
        </div>
        <h2 className="font-semibold text-lg">{user.name}</h2>
        <div className="flex items-center justify-center gap-6 mt-4 text-sm text-gray-400">
          <span>{user.uploads} 上传</span>
          <span>{user.stars} 收藏</span>
        </div>
      </div>

      <div className="space-y-2">
        <Link to="/settings" className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 hover:border-blue-500/30 transition-colors">
          <SettingsIcon size={18} className="text-gray-400" />
          <span>设置</span>
        </Link>
        <button
          onClick={() => {
            localStorage.removeItem("local_auth_token");
            window.location.reload();
          }}
          className="w-full flex items-center gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={18} />
          <span>退出登录</span>
        </button>
      </div>
    </div>
  );
}
