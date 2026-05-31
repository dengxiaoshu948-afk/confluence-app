import { useParams, Link } from "react-router-dom";
import { Download, Star, Share2, ArrowLeft, FileText } from "lucide-react";
import { useState } from "react";

const resources: Record<string, any> = {
  "1": { title: "PyTorch 深度学习最佳实践手册", category: "文档", downloads: 3890, stars: 892, size: "15.2 MB", desc: "涵盖模型设计、训练流程、调试技巧和性能优化的完整手册。包含50+代码示例和常见陷阱规避指南。" },
  "2": { title: "Stable Diffusion v3 部署指南", category: "教程", downloads: 2150, stars: 679, size: "8.5 MB", desc: "从环境配置到生产部署的完整指南。涵盖GPU选型、Docker容器化、API服务搭建。" },
  "3": { title: "ImageNet-1K 图像分类数据集", category: "数据集", downloads: 3420, stars: 513, size: "150 GB", desc: "包含1000个类别、超过120万张训练图像的标准图像分类数据集。" },
  "4": { title: "Whisper 语音识别模型", category: "模型", downloads: 1280, stars: 356, size: "2.8 GB", desc: "OpenAI Whisper的优化版本，支持中文语音识别和翻译。" },
  "5": { title: "GPT-4 中文微调模型", category: "模型", downloads: 890, stars: 234, size: "13.2 GB", desc: "基于GPT-4架构的中文微调模型，在中文问答和文本生成任务上表现优异。" },
  "6": { title: "LangChain 快速开发工具包", category: "工具", downloads: 1560, stars: 445, size: "45 MB", desc: "一套完整的LangChain开发工具集，包含常用Chain模板、Agent配置。" },
};

export default function ResourceDetail() {
  const { id } = useParams();
  const resource = resources[id || ""];
  const [starred, setStarred] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!resource) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-2">404</h2>
        <p className="text-gray-400 mb-4">资源不存在</p>
        <Link to="/" className="text-blue-500 hover:text-blue-400">返回首页</Link>
      </div>
    );
  }

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => setDownloading(false), 2000);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: resource.title, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      alert("链接已复制到剪贴板");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Link to="/explore" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
        <ArrowLeft size={14} /> 返回
      </Link>

      <div className="p-6 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500">{resource.category}</span>
        </div>

        <h1 className="text-xl font-bold mb-2">{resource.title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{resource.desc}</p>

        <div className="flex items-center gap-4 text-xs text-gray-400 mb-6">
          <span>{resource.size}</span>
          <span>{resource.downloads} 次下载</span>
          <span>{resource.stars} 收藏</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            <Download size={16} />
            {downloading ? "下载中..." : "下载资源"}
          </button>
          <button
            onClick={() => setStarred(!starred)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border transition-colors ${
              starred
                ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                : "border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
            }`}
          >
            <Star size={16} />
            {starred ? "已收藏" : "收藏"}
          </button>
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
