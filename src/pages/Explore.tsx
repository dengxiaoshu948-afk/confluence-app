import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Download, Star } from "lucide-react";

const allResources = [
  { id: 1, title: "PyTorch 深度学习最佳实践手册", category: "文档", downloads: 3890, stars: 892, date: "2026/5/26" },
  { id: 2, title: "Stable Diffusion v3 部署指南", category: "教程", downloads: 2150, stars: 679, date: "2026/5/26" },
  { id: 3, title: "ImageNet-1K 图像分类数据集", category: "数据集", downloads: 3420, stars: 513, date: "2026/5/26" },
  { id: 4, title: "Whisper 语音识别模型", category: "模型", downloads: 1280, stars: 356, date: "2026/5/26" },
  { id: 5, title: "GPT-4 中文微调模型", category: "模型", downloads: 890, stars: 234, date: "2026/5/26" },
  { id: 6, title: "LangChain 快速开发工具包", category: "工具", downloads: 1560, stars: 445, date: "2026/5/26" },
];

const filters = ["全部", "模型", "数据集", "工具", "代码", "文档"];

export default function Explore() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("全部");

  const filtered = allResources.filter((r) => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === "全部" || r.category === activeFilter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">发现资源</h1>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索资源..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
              activeFilter === f
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map((r) => (
          <Link
            key={r.id}
            to={`/resource/${r.id}`}
            className="block p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 hover:border-blue-500/30 transition-all"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500">
                {r.category}
              </span>
            </div>
            <h3 className="font-medium text-sm mb-2">{r.title}</h3>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1"><Download size={12} /> {r.downloads}</span>
              <span className="flex items-center gap-1"><Star size={12} /> {r.stars}</span>
              <span>{r.date}</span>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 py-8">没有找到相关资源</p>
        )}
      </div>
    </div>
  );
}
