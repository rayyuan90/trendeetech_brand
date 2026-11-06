# AsterVision AI 产品知识中心

## 技术架构

项目使用 **Next.js App Router、React 19 和 TypeScript**。主页目录与 `/products/[slug]` 详情使用服务端 React 组件渲染，产品的标题、描述、canonical、Open Graph、可见正文、FAQ 与 JSON-LD 会包含在服务器返回的 HTML 中。目录搜索、系列筛选、Ask AI 和编辑器由 React 客户端组件提供交互。

```text
app/
├── api/                         JSON 数据 API
├── products/[slug]/page.tsx     服务端动态产品详情与 SEO
├── layout.tsx                   品牌布局、Organization JSON-LD
├── page.tsx                     服务端渲染产品目录
├── robots.ts                    robots.txt
└── sitemap.ts                   动态 sitemap
components/KnowledgeTools.tsx    React 客户端交互
lib/knowledge.ts                 五份 JSON 的实体映射
lib/types.ts                     TypeScript 实体与源数据类型
data/                            提供的五份原始 JSON 数据
```

## 启动

需要 Node.js 20.9 或更高版本。

```bash
npm install
npm run dev
```

开发时访问 `http://localhost:3000`。生产构建使用 `npm run build`，启动命令为 `npm start`。可运行 `npm run typecheck` 检查 TypeScript 类型。

## 五份数据及实体关系

```text
Brand
├── Product Series
│   └── Product
│       ├── FAQ[]
│       └── Best For → Scenario
└── Core Capabilities[]
```

- `data/brand.json`：品牌名称、介绍、网址、成立年份、总部与核心能力。
- `data/product_series.json`：产品系列；产品通过 `series_slug` 关联系列 `slug`。
- `data/products.json`：产品概述、关键特性、规格、适用场景、状态及 `faq_ids`。
- `data/faqs.json`：产品 FAQ；由产品 `faq_ids` 关联，并以 `product_slug` 标识所属产品。
- `data/scenarios.json`：场景词典；详情页展示产品 `best_for` 能匹配到的场景名称和说明。
- `lib/knowledge.ts`：读取并映射五个 JSON，供服务器页面、API 和 React 组件使用。
- `app/api/products`：内容管理接口，新增/编辑/删除会持久化到 `products.json` 与 `faqs.json`。

## 六项要求对应实现

1. **产品列表与系列筛选**：主页展示 Product、Product Series、Description 和 Key Features；支持关键字搜索和系列过滤，代码位于 `components/KnowledgeTools.tsx`。
2. **动态产品详情**：`app/products/[slug]/page.tsx` 按 slug 获取产品，并在首屏服务器 HTML 展示 Overview、Features、Best For、Scenarios、Specifications 与 FAQ。
3. **数据层**：五个 JSON 分别表示 Brand、Series、Product、FAQ 和 Scenario；服务端将源字段映射为 TypeScript 实体。
4. **SEO / GEO**：Next Metadata 为主页和产品详情生成 title、meta description、canonical、Open Graph 与 Twitter 元信息。服务器 HTML 带有 Organization JSON-LD；产品详情额外输出 Product 与 FAQPage JSON-LD。`app/robots.ts` 和 `app/sitemap.ts` 提供爬虫入口。
5. **Ask AI**：React 问答组件用当前产品描述、功能、最佳用途、场景、规格及 FAQ 进行规则匹配，并给出产品详情来源链接；不调用外部模型。
6. **内容管理**：主页后台支持新增、编辑、删除与 JSON 导出。API 会更新 JSON 文件，服务端页面读取最新产品资料。管理接口没有身份验证，公开部署前应加权限控制。

## 部署前配置

所提供 `brand.json` 中的网站地址是 `https://example.com/astervision`。上线前请将它换成真实公开域名；canonical、Open Graph、sitemap 与 JSON-LD 会使用此网址。内容管理会直接写入应用的数据文件，部署时应使用持久化磁盘，并为后台 API 增加访问控制。
