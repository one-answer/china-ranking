# 中国区 GitHub 开发者数据平台

本项目基于 GitHub API 收集中国区开发者公开数据，旨在客观呈现开发者生态全景。
通过数据分析，我们对开发者贡献类型进行多维度分类，为社区提供参考数据。

## 🔍 项目说明

- **数据收集**: 基于 GitHub API 实现用户数据采集与分析
- **多维分析**: 根据公开数据对贡献类型进行多维度分类
- **自动更新**: 通过 GitHub Actions 实现定时数据更新
- **高性能架构**: 采用 Astro 静态生成与动态组件结合的架构
- **全平台适配**: 采用响应式设计，支持各类设备访问

## 💻 技术实现

### 前端架构

- **[Astro](https://astro.build/)**: 高性能静态站点生成框架
- **[Tailwind CSS](https://tailwindcss.com/)**: 原子化 CSS 框架
- **TypeScript**: 类型安全的开发体验

### 数据处理

- **[GitHub REST API v3](https://docs.github.com/en/rest)**: 公开数据获取
- **Node.js**: 数据处理服务
- **[GitHub Actions](https://github.com/features/actions)**: 自动化工作流

### 构建工具

- **pnpm**: 高性能包管理器
- **Vite**: 现代前端构建工具

## 🛠️ 本地开发

### 前置条件

- Node.js >= 18.x
- pnpm >= 8.x
- GitHub API Token (用于数据获取)

### 安装步骤

1. 克隆仓库:

```bash
git clone https://github.com/hellokaton/china-ranking.git
cd china-ranking
```

2. 安装依赖:

```bash
pnpm install
```

3. 配置环境变量:

```bash
cp .env.example .env.local
# 编辑 .env.local 添加你的 GitHub Token
```

4. 启动开发服务器:

```bash
pnpm dev
```

5. 构建生产版本:

```bash
pnpm build
```

6. 预览生产构建:

```bash
pnpm preview
```

## 📊 数据处理方法

项目数据处理遵循以下流程:

1. **数据采集**: 通过 GitHub API 获取公开用户信息
2. **地区识别**: 根据公开资料识别中国区用户
3. **账号过滤**: 过滤组织账号，仅保留个人开发者账号
4. **开发者分类**: 基于贡献类型将开发者分为不同类别，包括区分 Markdown 工程师和代码开发者
5. **贡献分析**: 基于仓库类型、提交类型等多维度分析
6. **数据存储**: 生成结构化数据文件
7. **定期更新**: 通过自动化工作流定期更新数据

### 手动触发数据更新

```bash
# 设置 GitHub Token 环境变量
export GITHUB_TOKEN=your_github_token

# 执行数据获取脚本
pnpm fetch-data
```

## 🧩 项目结构

```
├── public/                # 静态资源
├── src/
│   ├── components/        # 通用组件
│   ├── layouts/           # 页面布局模板
│   ├── pages/             # 页面路由
│   ├── utils/             # 工具函数
│   └── types/             # TypeScript 类型定义
├── scripts/               # 数据处理脚本
│   └── fetch-github-users.js  # GitHub 用户数据获取
├── astro.config.mjs       # Astro 配置
└── tailwind.config.cjs    # Tailwind 配置
```

## 🤝 参与贡献

我们欢迎各种形式的贡献，包括但不限于:

- 功能改进与 Bug 修复
- 性能优化
- 文档完善
- 数据处理方法优化
- UI/UX 改进

### 贡献流程

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交变更 (`git commit -m 'feat: add amazing feature'`)
4. 推送到远程分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

请确保遵循我们的代码规范和提交规范。

## 📝 贡献类型分析方法

本项目通过分析公开仓库内容，区分不同贡献类型:

- 代码仓库的文件类型分布
- 提交内容的性质分析
- 项目的主要用途和目的
- **Markdown 工程师与代码开发者分离**: 通过分析仓库文件构成、提交类型等维度，区分主要贡献 Markdown 内容的开发者和主要贡献代码的开发者

分类仅基于公开数据分析，旨在客观呈现不同类型的技术贡献，不代表对任何贡献方式的价值判断。

如对分类方法有建议，欢迎通过 Issue 或 PR 提出改进意见。

## 📈 性能优化

- 静态生成与部分水合相结合
- 图片优化与延迟加载
- 资源最小化与代码分割
- 资源预加载策略

## 📜 许可证

本项目采用 [MIT 许可证](LICENSE)。

---

**声明**: 本项目仅用于技术社区学习交流，所有数据均来自公开 API，不代表任何官方排名。数据仅供参考，禁止用于商业目的。
