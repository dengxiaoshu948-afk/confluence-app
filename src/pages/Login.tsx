import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, UserPlus, Sparkles } from "lucide-react";

export default function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("请填写所有必填项");
      return;
    }
    // Mock login - store token and redirect
    localStorage.setItem("local_auth_token", "mock_" + Date.now());
    navigate("/");
    window.location.reload();
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-200 mb-6">
          返回首页
        </Link>

        <div className="p-6 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mx-auto mb-3">
              <Sparkles size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold">{mode === "login" ? "欢迎回来" : "创建账号"}</h1>
          </div>

          <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-white/5 mb-6">
            <button
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === "login" ? "bg-white dark:bg-white/10 shadow-sm" : "text-gray-400"
              }`}
            >
              登录
            </button>
            <button
              onClick={() => { setMode("register"); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === "register" ? "bg-white dark:bg-white/10 shadow-sm" : "text-gray-400"
              }`}
            >
              注册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="字母、数字、下划线"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少6位"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
              />
            </div>
            {error && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
            >
              {mode === "login" ? "登录" : "注册"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
