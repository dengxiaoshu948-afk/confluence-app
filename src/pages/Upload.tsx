import { useState, useRef } from "react";
import { UploadCloud, File, X } from "lucide-react";

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("模型");
  const [desc, setDesc] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) return;
    setUploading(true);
    // Simulate upload
    await new Promise((r) => setTimeout(r, 2000));
    setUploading(false);
    alert("上传成功！");
    setFile(null);
    setTitle("");
    setDesc("");
  };

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <h1 className="text-xl font-semibold">上传资源</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* File drop */}
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-500/50 transition-colors"
        >
          {file ? (
            <div className="flex items-center gap-3 justify-center">
              <File size={20} className="text-blue-500" />
              <span className="text-sm">{file.name}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="text-gray-400 hover:text-red-400"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <>
              <UploadCloud size={32} className="mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">点击选择文件或拖拽到此处</p>
              <p className="text-xs text-gray-400 mt-1">支持模型、数据集、代码、文档等</p>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
          />
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm mb-1">标题</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="资源名称"
            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm mb-1">分类</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
          >
            <option>模型</option>
            <option>数据集</option>
            <option>工具</option>
            <option>代码</option>
            <option>文档</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm mb-1">描述</label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="资源描述..."
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:border-blue-500/50 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={!file || !title.trim() || uploading}
          className="w-full py-2.5 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {uploading ? "上传中..." : "确认上传"}
        </button>
      </form>
    </div>
  );
}
