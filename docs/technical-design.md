# Schema-As-Code 语义流水线 · 技术设计方案

> **定位**：不是替代任何设计或开发工具，是所有 AI 工具的上游约束层。
> 
> **核心工作流**：诊断症状（Guard）→ 写契约（Contract）→ 证明有效（Verify）。

---

## 1. 项目概述

### 1.1 要解决的问题

当 AI 生成界面时，设计意图在概率性输出中发生偏离。具体表现为：

- **错误状态**：多种错误共用同一种红色，用户无法判断后果严重程度
- **过程状态**："Searching...""Reading..." 模糊，用户不知道 AI 在查资料还是编答案
- **边界动作**："拒绝请求"和"终止会话"在界面上都是"拒绝"，用户不知道权利还在不在
- **高危操作**：删除按钮被做成普通蓝色按钮，没有二次确认
- **告警文案**："Critical" 被 LLM 降级为 "严重"，值班员误判优先级

### 1.2 解法

把设计意图从"人脑中的直觉"翻译成"机器可读的规则文件"（YAML），在 AI 生成内容之前注入约束，在生成之后校验语义。

### 1.3 目标用户

| 角色 | 用这套系统做什么 |
|------|-----------------|
| 体验设计师 | 诊断界面语义断层，写 YAML 契约，不需要会写代码 |
| 前端工程师 | 复制 Prompt 前缀到 IDE，让 AI 生成时自动遵守语义约束 |
| DesignOps | 把规范从文档迁移到 YAML，Git Diff 自动同步 |
| AI 产品经理 | 过语义风险清单，量化隐性成本 |
| 设计系统负责人 | 在 Token 之上叠加语义层（Semantic Token） |

---

## 2. 架构设计：三层资产库

```
┌─────────────────────────────────────────────┐
│  入口：用户带着困惑进来                        │
│  "我们产品的报错用户看不懂"                    │
│  "AI 生成的按钮样式不对"                      │
│  "规范更新了，前端没同步"                     │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  第一层：模式库（Pattern Library）             │
│  语义断层诊断 → 定位根因                       │
│  回答：这是什么类型的断层？                    │
│  文件位置：semantic-guard/patterns/*.json      │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  第二层：契约库（Contract Library）            │
│  根因分析 → 生成契约模板                       │
│  回答：怎么修复这个断层？                      │
│  文件位置：contracts/*.yaml                    │
│  编译输出：contracts/prompt-prefixes/*.md     │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  第三层：验证工具集（Validation Toolkit）       │
│  契约模板 → 验证方法                         │
│  回答：怎么证明这个契约有效？                  │
│  文件位置：validation/*.json                   │
│  在线工具：index.html（语义分级器）            │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  出口：用户带走可执行资产                      │
│  "我拿到了解决当前问题的 YAML + 截图证据"      │
└─────────────────────────────────────────────┘
```

---

## 3. 核心引擎：四层推演（Four-Layer Inference Engine）

验证工具集的底层算法。每条规则进入验证时，依次过四级检查：

| 层级 | 检查什么 | 拦截什么 | 输出 |
|------|---------|---------|------|
| **语法推演**（Syntax） | JSON/YAML 结构是否完整 | 字段缺失、类型错误 | 结构校验报告 |
| **语义推演**（Semantics） | 语义令牌引用是否正确 | 同义词替换、语义降级 | 语义匹配报告 |
| **安全推演**（Safety） | 是否触碰不可变边界 | 高危操作缺少二次确认、禁止模式被触发 | 安全拦截报告 |
| **美感推演**（Aesthetics） | 信息密度是否合理 | 文案过长/过短、视觉权重失衡 | 质量评分 |

**在仓库中的映射**：
- 前端实现：`scripts/validate-yaml.js`（语法层）+ `index.html` 中的分级器逻辑（语义/安全/美感层）
- 未来扩展：后端服务可接入，做 CI 流水线自动校验

---

## 4. 编译管线：五模块协作

契约库中的 YAML 文件不是静态文档，而是通过编译管线生成多种下游格式：

```
Registry（语义注册）
  ↓ 读取语义令牌定义
Compiler（编译约束）
  ↓ 编译为多种格式
  ├── Prompt 前缀（给 Claude Code / Cursor）
  ├── JSON Schema（给组件 Props 校验）
  ├── ESLint 规则（给代码静态检查）
  └── Checklist（给人工走查）
Validator（四层推演）
  ↓ 校验生成结果
Runtime（运行时拦截）
  ↓ CI 流水线自动拦截语义漂移
Bridge（观测反哺）
  ↓ 线上数据反哺回模式库
```

**在仓库中的映射**：
- `contracts/*.yaml` → Registry + Compiler 的输入
- `contracts/prompt-prefixes/*.md` → Compiler 的输出
- `scripts/compile-contract.js` → Compiler 的确定性脚本
- `validation/*.json` → Validator 的测试用例
- `semantic-guard/patterns/*.json` → Bridge 反哺后的模式更新

---

## 5. 目录结构说明

```
semantic-pipeline/
├── .github/workflows/pages.yml    # GitHub Pages 部署配置
├── index.html                     # 语义分级器（在线验证工具）
├── README.md                      # 项目总览
│
├── semantic-guard/
│   └── patterns/                  # 模式库（Pattern Library）
│       ├── ERR-001.json           # 错误状态后果差异未分级
│       ├── ACT-001.json           # 高危操作风险未约束
│       ├── PRO-001.json           # 过程状态认知阶段未显化
│       ├── BND-001.json           # 边界动作权利差异未区分
│       └── ALR-001.json           # 告警文案语义降级
│
├── contracts/
│   ├── ERR-001.yaml               # 契约库（Contract Library）
│   ├── ACT-001.yaml
│   ├── PRO-001.yaml
│   ├── BND-001.yaml
│   ├── ALR-001.yaml
│   └── prompt-prefixes/           # 编译输出：Prompt 前缀
│       ├── ERR-001.md
│       ├── ACT-001.md
│       └── ...
│
├── validation/
│   ├── unit-tests.json            # 单元测试用例
│   ├── integration-tests.json     # 集成测试用例
│   └── regression-cases.json    # 回归测试案例
│
├── docs/                          # 使用指南（待补充）
│   ├── DESIGNER-GUIDE.md          # 设计师使用指南
│   ├── FRONTEND-GUIDE.md          # 前端接入指南
│   ├── DESIGNOPS-GUIDE.md         # DesignOps 规范同步指南
│   ├── PM-GUIDE.md                # 产品经理风险清单指南
│   ├── AGENT-GUIDE.md             # AI 编程助手接入指南
│   └── technical-design.md        # 本文件
│
├── references/                    # 协议规范（待补充）
│   ├── pattern-schema.md          # 模式卡片 JSON Schema
│   ├── contract-schema.md         # YAML 契约 Schema
│   └── validation-standard.md   # 验证通过标准
│
├── samples/
│   └── dogfood/                   # 真实样例（待补充）
│       ├── before/                # 无契约时的生成结果
│       ├── after/                 # 有契约时的生成结果
│       └── RUN_REPORT.md          # 人工核对报告
│
└── scripts/                       # 确定性脚本（待补充）
    ├── validate-yaml.js           # YAML 结构校验
    └── compile-contract.js        # 契约编译脚本
```

---

## 6. 消费方设计：四个领域怎么接入

### 6.1 DesignOps（设计运营）

**痛点**：规范变更靠人肉同步，2 周才能覆盖所有产品。

**接入方式**：
1. 把规范从语雀/Notion 文档迁移到 `contracts/*.yaml`
2. Git Diff 自动触发影响面分析（`scripts/compile-contract.js`）
3. 下游所有工具的 Prompt 模板自动重编译

**验证指标**：规范同步时间从 2 周 → 0.5 天。

### 6.2 Design System（设计系统）

**痛点**：Design Token 只管颜色，不管场景语义（红色乱用）。

**接入方式**：
1. 在 Token 之上叠加语义层：`color_token` + `semantic_domain` + `error_severity`
2. 定义 `status.critical` 只能用于 `destructive_action` 场景

**验证指标**：语义一致性覆盖率从 20% → 100%。

### 6.3 前端（Front-end）

**痛点**：修 AI 生成的语义错误占 30% 返工时间。

**接入方式**：
1. 从 `contracts/prompt-prefixes/` 复制 Prompt 前缀
2. 贴在 Claude Code / Cursor 指令前面
3. AI 生成时自动遵守语义约束

**验证指标**：语义返工率从 30% → 5%。

### 6.4 研发效能（Dev Efficiency）

**痛点**：线上语义漂移事故占用户投诉 15%。

**接入方式**：
1. 在 CI 流水线中接入 `scripts/validate-yaml.js`
2. 提交代码时自动校验组件 Props 是否符合语义契约
3. 运行时数据通过 Bridge 反哺回模式库

**验证指标**：语义事故占比从 15% → 趋近于 0。

---

## 7. 部署与 CI

### 7.1 GitHub Pages 部署

文件：`.github/workflows/pages.yml`

```yaml
name: Deploy GitHub Pages

on:
  push:
    branches: [ main ]
    paths:
      - 'index.html'
      - 'semantic-guard/**'
      - 'contracts/**'
      - 'validation/**'
      - 'docs/**'
      - 'references/**'
      - 'samples/**'
      - 'scripts/**'

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Pages
        uses: actions/configure-pages@v5
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 7.2 触发策略

- `path: '.'`：把整个仓库作为静态站点部署，确保前端页面可以通过 fetch 直接读取 `contracts/` 和 `semantic-guard/` 下的文件。
- `paths` 过滤：只在修改了项目相关文件时触发部署，避免无关修改（如 `.gitignore`）触发。

---

## 8. 关键设计决策

### 8.1 为什么用 YAML 而不是 JSON？

YAML 更适合人类编写规则文件：
- 支持注释，设计师可以在契约里写"为什么这条红线不能碰"
- 层级可读性更强，嵌套结构比 JSON 更直观
- 与 Git Diff 友好，变更可追溯

### 8.2 为什么前端页面直接读取 YAML？

- 契约文件是"活的定义"（Living Definition），需要被多个消费方共享
- 前端通过 fetch 直接读取，确保展示的是最新版本
- 不需要后端服务，降低部署成本

### 8.3 为什么设计师不需要会写代码？

- 设计师只写 YAML 规则文件，YAML 是文本格式，不需要编程能力
- 编译和校验由脚本自动完成
- 前端只消费编译后的 Prompt 前缀，不需要理解 YAML 结构

---

## 9. 路线图

| 阶段 | 目标 | 关键产出 |
|------|------|---------|
| **v0.1（当前）** | 跑通单模式闭环 | 5 个模式卡片 + 5 份 YAML 契约 + 在线分级器 |
| **v0.2** | 补全消费方指南 | 5 份使用指南 + 编译脚本 + 校验脚本 |
| **v0.3** | 扩展模式覆盖 | 8-10 个模式（覆盖操作按钮、表单验证、导航状态等） |
| **v0.4** | 接入 CI 流水线 | GitHub Action 插件 + ESLint 规则包 |
| **v1.0** | 行业验证 | 3 个以上团队真实接入，产出 ROI 数据 |

---

## 10. 参考文档

- [《技术设计方案与工程落地规划》](https://www.yuque.com/u222739/lxcrw1/yoo76g0810n7rzg6)
- [《语义层设计技术方案：设计师作为翻译者》](https://www.yuque.com/u222739/lxcrw1/ntg9ta4mzg9b4b5t)
- [《工程技术设计方案》](https://www.yuque.com/u222739/lxcrw1/ra7pgo5fq5bfknhg)
