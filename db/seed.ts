import { getDb } from "../api/queries/connection";
import { resources, discussions } from "./schema";

async function seed() {
  const db = getDb();

  // Seed sample resources
  const sampleResources = [
    {
      title: "GPT-4 中文微调模型",
      description: "基于 GPT-4 架构的中文微调模型，在中文问答和文本生成任务上表现优异。支持多种下游任务适配，包括情感分析、摘要生成和对话系统。",
      type: "model" as const,
      category: "自然语言处理",
      tags: "GPT, 大模型, 中文, 微调",
      downloadCount: 1280,
      starCount: 356,
      authorId: 1,
      authorName: "Confluence 官方",
      isPublic: "public" as const,
    },
    {
      title: "ImageNet-1K 图像分类数据集",
      description: "包含 1000 个类别、超过 120 万张训练图像的标准图像分类数据集。预处理版本，已划分训练集和验证集，附带类别标签映射文件。",
      type: "dataset" as const,
      category: "计算机视觉",
      tags: "图像分类, ImageNet, 数据集",
      downloadCount: 3420,
      starCount: 512,
      authorId: 1,
      authorName: "Confluence 官方",
      isPublic: "public" as const,
    },
    {
      title: "LangChain 快速开发工具包",
      description: "一套完整的 LangChain 开发工具集，包含常用 Chain 模板、Agent 配置、Memory 管理模块。内置 20+ 预设模板，支持自定义扩展。",
      type: "tool" as const,
      category: "自然语言处理",
      tags: "LangChain, 开发工具, LLM",
      downloadCount: 890,
      starCount: 234,
      authorId: 1,
      authorName: "Confluence 官方",
      isPublic: "public" as const,
    },
    {
      title: "Stable Diffusion v3 部署指南",
      description: "从环境配置到生产部署的完整指南。涵盖 GPU 选型、Docker 容器化、API 服务搭建、性能优化和负载均衡策略。附带一键部署脚本。",
      type: "tutorial" as const,
      category: "计算机视觉",
      tags: "Stable Diffusion, 部署, 生产环境",
      downloadCount: 2150,
      starCount: 678,
      authorId: 1,
      authorName: "Confluence 官方",
      isPublic: "public" as const,
    },
    {
      title: "Whisper 语音识别模型",
      description: "OpenAI Whisper 的优化版本，支持中文语音识别和翻译。在长音频处理和噪声环境下的识别准确率有显著提升。",
      type: "model" as const,
      category: "语音识别",
      tags: "Whisper, 语音识别, 中文",
      downloadCount: 1560,
      starCount: 445,
      authorId: 1,
      authorName: "Confluence 官方",
      isPublic: "public" as const,
    },
    {
      title: "PyTorch 深度学习最佳实践手册",
      description: "涵盖模型设计、训练流程、调试技巧和性能优化的完整手册。包含 50+ 代码示例和常见陷阱规避指南。",
      type: "doc" as const,
      category: "其他",
      tags: "PyTorch, 最佳实践, 深度学习",
      downloadCount: 3890,
      starCount: 892,
      authorId: 1,
      authorName: "Confluence 官方",
      isPublic: "public" as const,
    },
    {
      title: "多模态理解预训练模型",
      description: "支持图像-文本联合理解的预训练模型，在视觉问答、图文检索和图像描述任务上达到 SOTA 性能。",
      type: "model" as const,
      category: "多模态",
      tags: "多模态, 视觉理解, 预训练",
      downloadCount: 670,
      starCount: 198,
      authorId: 1,
      authorName: "Confluence 官方",
      isPublic: "public" as const,
    },
    {
      title: "强化学习游戏 AI 训练框架",
      description: "基于 PPO 和 DQN 的游戏 AI 训练框架，支持 Atari 和自定义环境。内置奖励塑形、课程学习和多智能体协作模块。",
      type: "tool" as const,
      category: "强化学习",
      tags: "强化学习, PPO, DQN, 游戏AI",
      downloadCount: 430,
      starCount: 156,
      authorId: 1,
      authorName: "Confluence 官方",
      isPublic: "public" as const,
    },
  ];

  // Seed sample discussions
  const sampleDiscussions = [
    {
      title: "大家用什么方法做 LLM 的推理加速？",
      content: "最近在生产环境部署了一个 7B 参数的模型，推理速度是个瓶颈。试过 vLLM 和 TensorRT-LLM，但效果都不太理想。大家有什么实践经验可以分享吗？特别是批处理和 KV Cache 优化方面。",
      userId: 1,
      userName: "Confluence 官方",
      replyCount: 12,
      viewCount: 345,
      tags: "LLM, 推理优化, 生产部署",
    },
    {
      title: "微调 LLaMA3 的中文数据集推荐",
      content: "准备微调 LLaMA3-8B 做中文对话，想找高质量的中文指令数据集。目前考虑了 Belle、ShareGPT 的中文部分，还有更好的选择吗？另外数据清洗有什么好的实践？",
      userId: 1,
      userName: "Confluence 官方",
      replyCount: 8,
      viewCount: 278,
      tags: "LLaMA, 微调, 中文数据集",
    },
    {
      title: "Vision Transformer 在小样本场景下的表现",
      content: "在做医疗影像分类，每个类别只有 50-100 张样本。ViT 在这种小样本场景下表现如何？有没有好的迁移学习策略？目前在用 DeiT-Small 做 baseline。",
      userId: 1,
      userName: "Confluence 官方",
      replyCount: 5,
      viewCount: 189,
      tags: "ViT, 小样本, 医疗AI",
    },
    {
      title: "多模态大模型的训练成本分析",
      content: "想训练一个支持图文理解的多模态模型，预计需要多少 GPU 小时？有没有开源的低成本方案？目前在看 LLaVA 和 Qwen-VL 的架构。",
      userId: 1,
      userName: "Confluence 官方",
      replyCount: 15,
      viewCount: 456,
      tags: "多模态, 训练成本, LLaVA",
    },
    {
      title: "RAG 系统的向量数据库选型对比",
      content: "在搭建企业知识库 RAG 系统，对比了 Milvus、Pinecone 和 pgvector。各有优劣，想听听大家在生产环境中的实际使用体验。数据量在百万级文档左右。",
      userId: 1,
      userName: "Confluence 官方",
      replyCount: 20,
      viewCount: 567,
      tags: "RAG, 向量数据库, Milvus",
    },
  ];

  try {
    // Check if already seeded
    const existingResources = await db.select().from(resources).limit(1);
    if (existingResources.length > 0) {
      console.log("Database already seeded, skipping...");
      return;
    }

    console.log("Seeding resources...");
    for (const resource of sampleResources) {
      await db.insert(resources).values(resource);
    }

    console.log("Seeding discussions...");
    for (const discussion of sampleDiscussions) {
      await db.insert(discussions).values(discussion);
    }

    console.log("Seed completed successfully!");
  } catch (error) {
    console.error("Seed failed:", error);
  }
}

seed();
