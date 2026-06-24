# Semantic Pipeline · 语义审查流水线

> 当 AI 生成界面时，设计意图在偏离。
> 
> 不是替代任何工具，是所有 AI 工具的上游约束。

[![在线演示](https://img.shields.io/badge/🌐-在线演示-1677ff?style=for-the-badge)](https://2436041978-ops.github.io/semantic-pipeline/)
[![GitHub](https://img.shields.io/badge/🔗-GitHub-181717?style=for-the-badge&logo=github)](https://github.com/2436041978-ops/semantic-pipeline)
[![API 文档](https://img.shields.io/badge/📖-API文档-36cfc9?style=for-the-badge)](https://2436041978-ops.github.io/semantic-pipeline/#api)
[![术语表](https://img.shields.io/badge/📚-语义术语表-722ed1?style=for-the-badge)](https://2436041978-ops.github.io/semantic-pipeline/#glossary)

---

## 一句话版

**Schema-As-Code 是一条三阶段流水线**：发现问题（Guard）→ 写契约（Contract）→ 证明有效（Verify）。让 AI 生成的内容在到达视觉层和工程层之前，先过一遍语义审查。

---

## 在线入口

| 入口 | 链接 | 说明 |
|------|------|------|
| 🌐 **在线演示** | [semantic-pipeline](https://2436041978-ops.github.io/semantic-pipeline/) | 模式库 + 契约库 + 验证工具集 |
| 🎨 **语义分级器** | [Validation Toolkit](https://2436041978-ops.github.io/semantic-pipeline/#tool) | 输入错误文案，自动诊断语义分级 |
| 📋 **JSON 输入** | [Snapshot Input](https://2436041978-ops.github.io/semantic-pipeline/) | 粘贴组件语义快照，匹配已知模式 |
| 📄 **快照模板** | [Template](https://2436041978-ops.github.io/semantic-pipeline/) | 组件语义快照（Semantic Snapshot）格式说明 |

---

## 界面预览

### 模式库总览
6 种已验证的语义断层模式，覆盖错误状态、高危操作、过程状态、边界动作、告警文案等组件类型。

[点击体验 →](https://2436041978-ops.github.io/semantic-pipeline/)

### 模式详情页
每个模式包含：语义断层地图 → 模式诊断 → 契约库（YAML/Prompt/Checklist）→ 验证工具集。

[点击体验 →](https://2436041978-ops.github.io/semantic-pipeline/)

### 验证工具集
三层验证工具：语义分级器 · JSON 输入 · 快照模板。

[点击体验 →](https://2436041978-ops.github.io/semantic-pipeline/#tool)

---

## 三阶段流水线

```
┌─────────────────────────────────────────┐
│  🔍 阶段一：发现问题（Guard）              │
│  输入组件描述或语义快照，自动匹配已知模式    │
│  → 发现"意思跑偏"的真实证据               │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  📝 阶段二：写契约（Contract）             │
│  从模式库复制 YAML 契约                   │
│  定义"这个场景下不能做什么"                │
│  → 生成 YAML + Prompt 前缀 + Checklist   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  ✅ 阶段三：证明有效（Verify）              │
│  跑单元/集成/回归三级测试                 │
│  对比"有契约"和"无契约"的生成结果         │
│  → 返工率 30% → 5%                       │
└─────────────────────────────────────────┘
```

---

## 已验证模式（6 种）

| 模式 ID | 组件类型 | 断层名称 | 产品实例 |
|---------|---------|---------|---------|
| ERR-001 | 错误状态 | 后果差异未分级 | ChatGPT / 文心一言 / 通义千问 |
| ACT-001 | 高危操作 | 风险未约束 | 通用（所有 AI 生成高危操作） |
| ALR-001 | 告警文案 | 语义降级 | 通用（Critical → 严重） |
| PRO-001 | 过程状态 | 认知阶段未显化 | Perplexity |
| BND-001 | 边界动作 | 权利差异未区分 | Claude |

---

## 快速开始

### 1. 诊断一个组件

打开 [在线演示](https://2436041978-ops.github.io/semantic-pipeline/)，搜索你的组件类型，查看已验证的模式和证据。

### 2. 复制契约

进入模式详情页，复制 YAML 契约或 Prompt 前缀，粘贴到你的 AI 工具中。

### 3. 跑验证

使用 [验证工具集](https://2436041978-ops.github.io/semantic-pipeline/#tool) 输入 AI 生成的文案，检查是否符合语义约束。

---

## 核心概念

| 市场语言 | 技术术语 | 说明 |
|---------|---------|------|
| 颜色/文案背后的意思 | **Semantic Token** | 组件在特定场景下必须表达的语义含义 |
| 设计意图的约定书 | **Intent Contract** | 把设计师意图写成机器可读的 YAML 规则 |
| 绝对不能碰的红线 | **Immutable Boundary** | AI 绝对不能突破的语义边界 |
| 同义词拦截器 | **Synonym Firewall** | 禁止 AI 用同义词替换标准语义令牌 |
| 意思跑偏了 | **Semantic Drift** | AI 生成内容偏离设计意图的现象 |
| 按规矩设计 | **Constraint-Based Design** | 声明"不能做什么"，AI 在边界内自由发挥 |

[查看完整术语表 →](https://2436041978-ops.github.io/semantic-pipeline/#glossary)

---

## 组织经济学价值

| 指标 | 之前 | 之后 |
|------|------|------|
| 语义返工率 | 30% | **5%** |
| 规范同步时间 | 2 人周 | **0.5 天** |
| 走查覆盖率 | 20% | **100%** |
| 已验证模式 | — | **6 种** |

---

## 技术架构

```
语义层（Schema-As-Code）
  ├── 模式库（Pattern Library）
  │     └── 6 种语义断层模式
  ├── 契约库（Contract Library）
  │     └── YAML / Prompt 前缀 / Checklist
  └── 验证工具集（Validation Toolkit）
        └── 语义分级器 / JSON 输入 / 快照模板
```

---

## 资源

- 📖 [API 文档](https://2436041978-ops.github.io/semantic-pipeline/#api)
- 📚 [语义术语表](https://2436041978-ops.github.io/semantic-pipeline/#glossary)
- 🔍 [洞察与文章](https://2436041978-ops.github.io/semantic-pipeline/#insights)
- 📥 [YAML 契约模板包](https://2436041978-ops.github.io/semantic-pipeline/#resources)
- 💬 [提交反馈](https://github.com/2436041978-ops/semantic-pipeline/issues)

---

## License

MIT License · 不是替代任何工具，是所有 AI 工具的上游约束。
