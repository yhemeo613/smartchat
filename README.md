<div align="center">

# SmartChat

**Turn your knowledge base into an intelligent AI customer support agent.**

**将你的知识库变成智能 AI 客服。**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[English](#english) · [中文](#中文)

</div>

---

<a id="english"></a>

## What is SmartChat?

SmartChat is a free, open-source AI chatbot platform. Upload your documents, train a chatbot in minutes, and embed it on any website with one line of code. It supports multiple LLM providers — OpenAI, Anthropic, DeepSeek, Qwen, Zhipu GLM, Moonshot, or any OpenAI-compatible API.

### Features

- **RAG-Powered Answers** — Upload PDF, TXT, DOCX, MD files. The retrieval-augmented generation engine finds the most relevant answers from your knowledge base.
- **Multi-Provider LLM** — Switch between OpenAI, Anthropic, DeepSeek, Qwen, Zhipu, Moonshot, or bring your own OpenAI-compatible endpoint.
- **One-Click Embed** — Add a chat widget to any website with a single `<script>` tag.
- **Fully Customizable** — Custom colors, avatars, welcome messages, system prompts, temperature, and model selection per bot.
- **Real-Time Streaming** — SSE-based streaming responses for a natural chat experience.
- **Multilingual** — UI supports English and Chinese. The AI responds in the visitor's language.
- **Local Embeddings** — Built-in support for local embedding models (BGE-small-zh, all-MiniLM-L6-v2) — no API key needed for vectorization.
- **Conversation Analytics** — Track conversations, visitor sessions, and message history.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Database | Supabase (PostgreSQL + pgvector) |
| Auth | Supabase Auth |
| AI SDKs | OpenAI SDK, Anthropic SDK |
| Embeddings | @huggingface/transformers (local) |
| UI | Tailwind CSS 4, Radix UI, shadcn/ui |
| Animation | Framer Motion |

### Project Structure

```
src/
├── app/
│   ├── (dashboard)/     # Dashboard pages (bots, settings)
│   ├── (marketing)/     # Landing page, docs, donate
│   ├── api/             # API routes (chat, upload, bots, user settings)
│   ├── chat/[botId]/    # Public chat page
│   └── demo/            # Demo page
├── components/
│   ├── dashboard/       # Bot management, document upload, embed code
│   ├── marketing/       # Hero, features, navbar, footer
│   └── ui/              # shadcn/ui components
└── lib/
    ├── ai/              # LLM provider routing, RAG, embeddings, provider presets
    ├── i18n/            # Internationalization (en/zh)
    └── supabase/        # Client, server, service client, schema
```

### Getting Started

#### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com/) project (free tier works)

#### 1. Clone & Install

```bash
git clone https://github.com/your-username/smartchat.git
cd smartchat
npm install
```

#### 2. Configure Environment

Copy `.env.local.example` or create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### 3. Set Up Database

Open the Supabase SQL Editor and run the contents of `src/lib/supabase/schema.sql`. This creates all tables, indexes, RLS policies, and the vector similarity search function.

#### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### AI Provider Configuration

Go to **Dashboard → Settings** to configure your AI provider. Supported providers:

| Provider | Base URL | Models |
|----------|----------|--------|
| OpenAI | `https://api.openai.com/v1` | GPT-4o, GPT-4o Mini, GPT-3.5 Turbo |
| Anthropic | `https://api.anthropic.com` | Claude Sonnet 4, Claude 3.5 Haiku |
| DeepSeek | `https://api.deepseek.com/v1` | DeepSeek Chat (V3), DeepSeek Reasoner (R1) |
| Qwen (通义千问) | `https://dashscope.aliyuncs.com/compatible-mode/v1` | Qwen Max, Qwen Plus, Qwen Turbo |
| Zhipu GLM (智谱) | `https://open.bigmodel.cn/api/paas/v4` | GLM-4 Plus, GLM-4 Flash |
| Moonshot (月之暗面) | `https://api.moonshot.cn/v1` | Moonshot v1 8K/32K/128K |
| Custom | Any OpenAI-compatible URL | Any model name |

### Embed on Your Website

After creating a bot, copy the embed code from the **Embed** tab:

```html
<script src="https://your-domain.com/widget.js" data-bot-id="your-bot-id"></script>
```

### Deploy

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/smartchat)

Or build and run manually:

```bash
npm run build
npm start
```

### Contributing

Contributions are welcome! Feel free to open issues and pull requests.

### License

[MIT](LICENSE)

---

<a id="中文"></a>

## SmartChat 是什么？

SmartChat 是一个免费开源的 AI 聊天机器人平台。上传文档，几分钟内训练聊天机器人，一行代码嵌入任何网站。支持多家 LLM 服务商 —— OpenAI、Anthropic、DeepSeek、通义千问、智谱 GLM、月之暗面，或任何兼容 OpenAI API 的服务。

### 功能特性

- **RAG 智能问答** — 上传 PDF、TXT、DOCX、MD 文件，检索增强生成引擎从知识库中找到最相关的答案。
- **多厂商 LLM** — 一键切换 OpenAI、Anthropic、DeepSeek、通义千问、智谱、月之暗面，或自定义 OpenAI 兼容接口。
- **一键嵌入** — 一个 `<script>` 标签即可在任何网站添加聊天组件。
- **完全可定制** — 自定义颜色、头像、欢迎语、系统提示词、创造性参数，每个机器人独立配置模型。
- **实时流式响应** — 基于 SSE 的流式输出，带来自然的聊天体验。
- **中英双语** — 界面支持中文和英文，AI 自动使用访客的语言回复。
- **本地向量化** — 内置本地 Embedding 模型（BGE-small-zh、all-MiniLM-L6-v2），向量化无需 API Key。
- **对话分析** — 追踪对话记录、访客会话和消息历史。

### 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router, Turbopack) |
| 语言 | TypeScript 5 |
| 数据库 | Supabase (PostgreSQL + pgvector) |
| 认证 | Supabase Auth |
| AI SDK | OpenAI SDK, Anthropic SDK |
| 向量化 | @huggingface/transformers（本地） |
| UI | Tailwind CSS 4, Radix UI, shadcn/ui |
| 动画 | Framer Motion |

### 快速开始

#### 前置要求

- Node.js 18+
- 一个 [Supabase](https://supabase.com/) 项目（免费版即可）

#### 1. 克隆 & 安装

```bash
git clone https://github.com/your-username/smartchat.git
cd smartchat
npm install
```

#### 2. 配置环境变量

创建 `.env.local`：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### 3. 初始化数据库

打开 Supabase SQL Editor，运行 `src/lib/supabase/schema.sql` 的内容。这会创建所有表、索引、RLS 策略和向量相似度搜索函数。

#### 4. 启动

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

### AI 服务商配置

进入 **控制台 → 设置** 配置 AI 服务商。支持的服务商：

| 服务商 | Base URL | 模型 |
|--------|----------|------|
| OpenAI | `https://api.openai.com/v1` | GPT-4o, GPT-4o Mini, GPT-3.5 Turbo |
| Anthropic | `https://api.anthropic.com` | Claude Sonnet 4, Claude 3.5 Haiku |
| DeepSeek | `https://api.deepseek.com/v1` | DeepSeek Chat (V3), DeepSeek Reasoner (R1) |
| 通义千问 | `https://dashscope.aliyuncs.com/compatible-mode/v1` | Qwen Max, Qwen Plus, Qwen Turbo |
| 智谱 GLM | `https://open.bigmodel.cn/api/paas/v4` | GLM-4 Plus, GLM-4 Flash |
| 月之暗面 | `https://api.moonshot.cn/v1` | Moonshot v1 8K/32K/128K |
| 自定义 | 任何 OpenAI 兼容 URL | 任意模型名 |

### 嵌入到你的网站

创建机器人后，从 **嵌入** 标签页复制代码：

```html
<script src="https://your-domain.com/widget.js" data-bot-id="your-bot-id"></script>
```

### 部署

一键部署到 Vercel：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/smartchat)

或手动构建运行：

```bash
npm run build
npm start
```

### 贡献

欢迎贡献！请随时提交 Issue 和 Pull Request。

### 开源协议

[MIT](LICENSE)
