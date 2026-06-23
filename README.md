# Schema-As-Code

> 当 AI 生成界面时，设计意图在偏离。Schema-As-Code 在语义层建立机器可读的约束契约，让 AI 生成的内容在到达视觉层和工程层之前，先过一遍语义审查。

[![](https://img.shields.io/badge/技术方案-语雀文档-1aad19?style=flat-square&logo=bookstack&logoColor=white)](https://www.yuque.com/u222739/lxcrw1)
[![](https://img.shields.io/badge/在线交互式总览-验证仪表盘-f4a261?style=flat-square&logo=vercel&logoColor=white)](https://2436041978-ops.github.io/semantic-pipeline/validation/dashboard.html)
[![](https://img.shields.io/badge/真实样例-DOGFOOD-2a9d8f?style=flat-square&logo=pytest&logoColor=white)](samples/dogfood/)
[![](https://img.shields.io/github/stars/2436041978-ops/semantic-pipeline?style=flat-square&logo=github&label=GITHUB)](https://github.com/2436041978-ops/semantic-pipeline)
[![](https://img.shields.io/github/v/release/2436041978-ops/semantic-pipeline?style=flat-square&logo=gitbook&label=RELEASES)](https://github.com/2436041978-ops/semantic-pipeline/releases)
[![](https://img.shields.io/badge/LICENSE-MIT-264653?style=flat-square&logo=open-source-initiative&logoColor=white)](LICENSE)

---

## 一句话版

直接问 AI「生成一个删除按钮」，常见结果要么太危险（蓝色实心，无二次确认），要么太客气（文案弱化，用户不感知风险）。

Schema-As-Code 换一种方式：先扫描组件语义快照，再判断是否存在语义偏差（Semantic Drift）；能安全约束的生成 YAML 契约（Intent Contract），缺语义定义的交回设计师，不成立的偏差直接驳回。

---

## News

- 🎉 **2026-06-23：模式库（Pattern Library）v1.0 发布。** 5 个已验证模式：ERR-001（错误状态）、PRO-001（过程状态）、BND-001（边界动作）、ACT-001（高危操作）、ALR-001（告警文案）。
- 📄 **2026-06-20：在线模式库上线。** 支持按组件类型搜索、按症状匹配、一键复制 YAML 契约。
- 🧪 **Dogfood sample 已加入。** `samples/dogfood/` 里有修改前后对比和人工核对过的运行报告。

---

## 三阶段流水线

```
发现问题 → 写契约 → 证明有效
   ↓          ↓          ↓
Semantic   Contract   Validation
 Guard      Library    Toolkit
```

| 阶段 | 做什么 | 入口 |
|------|--------|------|
| **阶段一：发现问题** | 输入组件描述，自动匹配语义漂移模式 | [在线模式库搜索 →](https://2436041978-ops.github.io/semantic-pipeline/semantic-guard/) |
| **阶段二：写契约** | 从模式库复制 YAML 契约，贴在 AI 指令前面 | [契约库](contracts/) |
| **阶段三：证明有效** | 跑测试用例，对比"有契约"和"无契约"的结果 | [验证仪表盘](https://2436041978-ops.github.io/semantic-pipeline/validation/dashboard.html) |

---

## 适合谁

| 你现在的情况 | 可以直接这样用 |
|-------------|---------------|
| **🎨 设计师** | 发现 AI 生成的概念图"不对劲"，查模式库找到"这是什么类型的问题"，复制契约贴在 AI 指令前面。 |
| **💻 前端** | 让 AI 生成组件前，从契约库复制 Prompt 前缀贴在指令前面，减少 30% 的语义返工。 |
| **⚙️ DesignOps** | 把规范从语雀文档变成 YAML 规则文件，放 Git 里，改一次所有 AI 工具自动跟着改。 |
| **📋 AI 产品 PM** | 生成原型前过风险清单，用户投诉后可归因到具体的语义断层类型。 |

---

## 你会得到什么

| 输出 | 内容 |
|------|------|
| **📋 模式卡片** | 每个语义漂移类型一份档案：症状、根因、产品实例、关联契约。 |
| **📄 YAML 契约** | 机器可读的规则文件：语义令牌（Semantic Token）、不可变边界（Immutable Boundary）、视觉映射、用户行动。 |
| **🧩 Prompt 前缀** | 从契约自动编译，贴在 Claude Code / Cursor 指令前面。 |
| **🛠️ 验证报告** | 产品开发级别的三级测试：单元测试、集成测试、回归测试。 |
| **🧪 真实样例** | `samples/dogfood/` 里有修改前后对比和人工核对过的运行报告。 |

---

## 快速上手

### 阶段一：发现问题（Semantic Guard）

打开在线模式库，输入组件描述：

🔗 [在线模式库搜索 →](https://2436041978-ops.github.io/semantic-pipeline/semantic-guard/)

```
输入："删除账户按钮"
→ 匹配 ACT-001：高危操作未约束
→ 症状：AI 把不可逆操作做成普通蓝色按钮，缺少二次确认
→ 根因：缺少 destructive_action 语义约束
```

### 阶段二：写契约（Contract Library）

复制 YAML 契约，贴在 AI 指令前面：

```yaml
# contract/ACT-001.yaml
intent_id: "ACT-001"
semantic_domain: "transactional"

immutable_boundaries:
  - boundary_type: "safety"
    rule: "禁止直接执行删除操作而不显示二次确认"
    violation_action: "block"

semantic_tokens:
  destructive_action:
    visual_mapping:
      color_token: "status.critical"
      button_style: "outline_danger"
    llm_constraints:
      - "必须包含二次确认弹窗"
      - "文案必须明确说明'此操作不可恢复'"
```

### 阶段三：证明有效（Validation Toolkit）

对比"有契约"和"无契约"的生成结果：

| 维度 | 无契约 | 有契约 |
|------|--------|--------|
| 按钮颜色 | 蓝色实心 | 红色空心 |
| 二次确认 | 无 | 有 |
| 文案 | "确认" | "此操作不可恢复" |
| 用户误触率 | 高 | 趋近于 0 |

---

## 三种模式

| 模式 | 什么时候用 | 行为 | 人工确认 |
|------|-----------|------|---------|
| **🔎 SCAN · 扫描** | 日常走查、快速诊断 | 输入组件描述，自动匹配已知模式 | 自动匹配，人工复核 |
| **✍️ GENERATE · 生成** | 需要写契约、同步规范 | 读取模式卡片，生成 YAML 契约 + Prompt 前缀 | 设计师确认语义后发布 |
| **🛡️ VERIFY · 验证** | 上线前检查、回归测试 | 加载 YAML 契约，跑测试用例，输出验证报告 | 自动跑，人工看报告 |

---

## 真实跑一遍

想看它真实产出，仓库里有一个 dogfood sample：

`samples/dogfood/`（`before/` · `after/` · `RUN_REPORT.md`）

- **before/**：无契约时，让 Claude Code 生成"删除账户"弹窗的结果（蓝色实心按钮，无二次确认）
- **after/**：有契约时，同样的 Prompt 前缀生成结果（红色空心按钮，有二次确认）
- **RUN_REPORT.md**：人工核对的运行报告，包含 A/B 对比图和返工率数据

---

## 消费方接入

| 角色 | 接入方式 | 文档 |
|------|---------|------|
| **设计师** | Figma 插件（规范文档） | [docs/DESIGNER-GUIDE.md](docs/DESIGNER-GUIDE.md) |
| **前端** | Cursor / Claude Code Prompt 前缀 | [docs/FRONTEND-GUIDE.md](docs/FRONTEND-GUIDE.md) |
| **DesignOps** | Git 工作流 + YAML 同步 | [docs/DESIGNOPS-GUIDE.md](docs/DESIGNOPS-GUIDE.md) |
| **AI PM** | 风险清单 + 归因 API | [docs/PM-GUIDE.md](docs/PM-GUIDE.md) |

---

## 项目结构

```
semantic-pipeline/
├── semantic-guard/patterns/     // 模式卡片（JSON），按组件类型分类
├── contracts/                     // YAML 契约文件，机器可读
├── contracts/prompt-prefixes/     // 编译后的 Prompt 前缀，供前端复制
├── validation/                    // 测试用例 + 验证报告 + 仪表盘
├── docs/                          // 使用指南 + 技术设计方案
├── references/                    // 协议规范：模式 Schema、契约 Schema、验证标准
├── samples/dogfood/               // 真实样例：修改前后对比 + 运行报告
└── scripts/                       // 确定性脚本：YAML 结构校验
```

---

## 深入了解

| 你想了解 | 入口 |
|---------|------|
| 真实运行效果 | `samples/dogfood/RUN_REPORT.md` |
| 怎么驱动 Claude / Cursor | `docs/AGENT-GUIDE.md` |
| 引擎设计细节 | `docs/technical-design.md` |
| 完整协议和状态机 | `references/pattern-schema.md` · `references/contract-schema.md` |
| 在线可视化说明 | [交互式总览](https://2436041978-ops.github.io/semantic-pipeline/validation/dashboard.html) |

---

## 技术背书

- [阿里云：构建可审计、可进化的 AI Agent 底座](https://xie.infoq.cn/article/df0fc569a2ef4d2a0a6a88fc3)
- [paperjury：确定性编排 vs 语义智能体](https://github.com/u7079256/paperjury)
- [OpenTelemetry GenAI Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/)
- [Cognitive Alignment Science：语义漂移](https://cognitivealignmentscience.com/semantic-drift/)

---

## 组织价值

| 维度 | 以前 | 以后 |
|------|------|------|
| 前端返工率 | 30% | 5% |
| 规范同步成本 | 2 人周 | 0.5 天 |
| 走查覆盖率 | 20% | 100% |

---

## 许可证

MIT
