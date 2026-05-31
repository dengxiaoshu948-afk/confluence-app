import { Link } from "react-router-dom";
import { Search, Database, Code2, FileText, Wrench, Zap } from "lucide-react";

const categories = [
  { icon: Database, label: "模型", desc: "AI模型文件", color: "from-blue-500 to-indigo-500" },
  { icon: FileText, label: "数据集", desc: "训练与测试数据", color: "from-green-500 to-emerald-500" },
  { icon: Wrench, label: "工具", desc: "开发工具框架", color: "from-orange-500 to-amber-500" },
  { icon: Code2, label: "代码", desc: "开源代码项目", color: "from-purple-500 to-pink-500" },
  { icon: FileText, label: "文档", desc: "教程参考资料", color: "from-cyan-500 to-teal-500" },
];

const hotResources = [
  { id: 1, title: "PyTorch 深度学习最佳实践手册", category: "文档", downloads: 3890, stars: 892 },
  { id: 2, title: "Stable Diffusion v3 部署指南", category: "教程", downloads: 2150, stars: 679 },
  { id: 3, title: "ImageNet-1K 图像分类数据集", category: "数据集", downloads: 3420, stars: 513 },
  { id: 4, title: "Whisper 语音识别模型", category: "模型", downloads: 1280, stars: 356 },
  { id: 5, title: "GPT-4 中文微调模型", category: "模型", downloads: 890, stars: 234 },
  { id: 6, title: "LangChain 快速开发工具包", category: "工具", downloads: 1560, stars: 445 },
];

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="text-center py-12 md:py-16">
        <h1 className="text-3xl md:text-5xl font-bold mb-4">
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
            Confluence
          </span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base mb-8">
          在这里，每一个想法都值得被分享
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
          >
            <Search size={16} />
            搜索资源
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {categories.map((c) => (
          <Link
            key={c.label}
            to={`/explore?type=${c.label}`}
            className="group p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 hover:border-blue-500/30 transition-all"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center mb-3`}>
              <c.icon size={18} className="text-white" />
            </div>
            <h3 className="font-medium text-sm">{c.label}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{c.desc}</p>
          </Link>
        ))}
      </section>

      {/* Hot Resources */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">热门资源</h2>
          <Link to="/explore" className="text-sm text-blue-500 hover:text-blue-400">全部</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {hotResources.map((r) => (
            <Link
              key={r.id}
              to={`/resource/${r.id}`}
              className="group p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 hover:border-blue-500/30 transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500">
                  {r.category}
                </span>
              </div>
              <h3 className="font-medium text-sm mb-3 group-hover:text-blue-400 transition-colors">
                {r.title}
              </h3>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>{r.downloads} 下载</span>
                <span>{r.stars} 收藏</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
