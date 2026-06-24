# DesignOps 规范同步指南

> **写给谁看**：负责设计规范同步、设计系统运营、设计团队流程管理的 DesignOps 同学。
> 
> **解决什么问题**：以前规范更新靠发文档、@全员、开同步会，2 周才能覆盖所有产品。现在把规范写成代码格式的规则文件（YAML），改一次，所有 AI 工具自动跟着改。

---

## 一、DesignOps 的痛点：规范更新了，前端和 AI 不知道

### 以前怎么做的

1. 设计师在 Figma 里改了规范
2. 截图 + 写文档，发到语雀/Confluence
3. @全员通知，或者开同步会
4. 前端负责人手动同步到各自项目
5. 2 周后走查，发现 3 个产品没改对

**问题**：
- 文档是给人看的，AI 编程助手（Claude Code / Cursor）看不到
- 人工同步有遗漏，覆盖率永远到不了 100%
- 规范版本多了，团队不知道哪个是最新的

### 现在怎么做

1. 设计师把规范变更写成 YAML 文件（代码格式的规则）
2. 提交到 Git 仓库
3. Git Diff 自动触发影响面分析
4. 下游工具（AI 编程助手、原型工具、组件库）自动重编译
5. 机器走查 100% 覆盖，人只处理机器拦不住的

**结果**：
- 规范同步从 **2 周 → 0.5 天**
- 走查覆盖率从 **20% → 100%**
- 规范版本可追溯，Diff 可见

---

## 二、核心概念：规范即代码（Executable Design Spec）

**不是新造概念，只是把设计规范从"文档"变成"代码"**。

| 维度 | 以前（文档） | 现在（代码） |
|------|------------|------------|
| 格式 | 语雀/Confluence/PDF | YAML 文本文件 |
| 版本管理 | 手动标注 V1/V2/V3 | Git 自动版本控制 |
| 变更通知 | @全员/开会 | Git Diff 自动触发 |
| 消费方式 | 人眼阅读 | 机器直接读取 |
| 同步范围 | 前端人工同步 | AI 工具自动编译 |

**YAML 是什么**：一种人类可读、机器可解析的文本格式。比 Word 更适合机器，比 JSON 更适合写规则。

---

## 三、三步工作流：从规范变更到全域生效

### Step 1：诊断症状（发现问题）

**谁来做**：设计师 + DesignOps

**做什么**：
1. 收集用户抱怨（社区截图、客服工单）
2. 收集产品截图（错误状态、按钮样式、文案用词）
3. 判断：这是"后果差异未分级"还是"同义词降级"？

**产出物**：
- 症状描述（一句话人话）
- 截图证据（3-5 个产品）
- 用户抱怨（≥10 条）

**示例**：
```
症状：ChatGPT/文心一言/通义千问的 4 种错误状态全部用红色
用户抱怨："看到红色就慌，不知道要不要刷新"
根因：缺少 error_severity 语义令牌（Semantic Token）
```

---

### Step 2：定义契约（写 YAML）

**谁来做**：设计师（不会写代码也能写）

**做什么**：把"这个场景下不能做什么"写成 YAML 文件

**文件位置**：`contracts/ERR-001.yaml`

**必须包含 6 个字段**：

```yaml
intent_id: "ERR-001"                    # 模式编号
semantic_domain: "observational"        # 语义领域
description: "错误状态后果差异未分级"    # 一句话人话
immutable_boundaries:                   # 绝对不能碰的红线（Immutable Boundary）
  - boundary_type: "safety"
    constraint_rule_ref: "rules/error-severity.yaml"
    violation_action: "block"
semantic_tokens:                        # 语义令牌（Semantic Token）
  error_severity:
    fatal:
      description: "系统级故障，对话上下文可能丢失"
      visual_mapping:
        color_token: "status.critical"
        motion_token: "pulse.red.urgent"
      user_action: ["refresh_page", "export_history"]
applicable_products:                    # 适用范围
  - "ChatGPT"
  - "文心一言"
  - "通义千问"
  - "Kimi"
```

**填写规范**：
- `description`：必须是一句话人话，设计师能看懂，前端也能看懂
- `immutable_boundaries`：不少于 3 条红线
- `semantic_tokens`：必须包含视觉映射（Visual Mapping）+ 用户行动（User Action）
- `applicable_products`：列出适用的产品，避免过度泛化

---

### Step 3：验证闭环（证明有效）

**谁来做**：DesignOps + 前端

**做什么**：
1. 把 YAML 编译成 Prompt 前缀（Prompt Prefix）
2. 让前端在 AI 指令前面贴上 Prompt 前缀
3. 对比"有契约"和"无契约"的生成结果
4. 算返工率、算用户投诉量

**产出物**：
- A/B 对比图（左侧无契约 / 右侧有契约）
- 返工率数据（从 30% 降到 5%）
- 测试用例清单（≥10 组）

---

## 四、Git 工作流：规范变更怎么管理

### 分支策略

```
main
  ├── feature/ERR-001-add-retryable    # 新增模式
  ├── fix/ERR-001-update-color         # 修改现有模式
  └── release/v1.2.0                   # 版本发布
```

### Commit Message 规范

```
docs: 新增 ERR-001 错误状态语义规范
fix: 修正 ERR-001 中 retryable 的颜色为黄色
feat: 新增 synonym_firewall 同义词拦截器
chore: 更新 applicable_products 列表
```

### 变更通知自动化

**不需要@全员，用 Git 的钩子自动通知**：

1. 设计师提交 YAML 变更到 Git
2. GitHub Actions 自动跑 YAML 结构校验（`scripts/validate-yaml.js`）
3. 校验通过后，自动触发影响面分析：
   - 哪些产品的 Prompt 前缀需要更新？
   - 哪些组件库需要重编译？
4. 自动生成 PR 摘要，@相关前端负责人

---

## 五、影响面分析：改了 YAML，哪些下游要跟着改

### 影响面清单（每次 YAML 变更自动生成）

| 下游 | 消费方式 | 是否需要更新 | 更新内容 |
|------|---------|------------|---------|
| **AI 编程助手**（Claude Code / Cursor） | Prompt 前缀 | ✅ 是 | 重新编译 Prompt 前缀模板 |
| **AI 原型工具**（v0 / Framer AI） | 生成前语义校验 | ✅ 是 | 更新生成约束规则 |
| **设计系统**（Design System Token） | Semantic Token 扩展 | ⚠️ 可能 | 如果新增了语义令牌 |
| **组件库**（DevUI / Ant Design） | 组件 Props 映射 | ⚠️ 可能 | 如果视觉映射变了 |
| **Figma 插件** | 画稿实时校验 | ✅ 是 | 更新校验规则 |
| **CI 流水线** | 自动走查 | ✅ 是 | 更新测试用例 |

### 自动化脚本

```bash
# 运行影响面分析
npm run analyze-impact --contract=ERR-001

# 输出示例
# [IMPACT] ERR-001.yaml changed
# [AFFECTED] contracts/prompt-prefixes/ERR-001.md
# [AFFECTED] validation/test-cases/ERR-001.json
# [AFFECTED] docs/FRONTEND-GUIDE.md (section: 错误状态)
```

---

## 六、检查清单：每个阶段怎么算"通过"

### 阶段 1：诊断症状（Guard）

- [ ] 收集到 ≥ 3 个产品的截图证据
- [ ] 收集到 ≥ 10 条用户真实抱怨
- [ ] 症状描述是一句话人话（不是技术术语）
- [ ] 根因分析明确：缺少哪个语义令牌？

### 阶段 2：定义契约（Contract）

- [ ] YAML 6 字段完整（intent_id / semantic_domain / description / immutable_boundaries / semantic_tokens / applicable_products）
- [ ] immutable_boundaries ≥ 3 条
- [ ] semantic_tokens 包含 visual_mapping + user_action
- [ ] YAML 语法通过校验（`scripts/validate-yaml.js`）
- [ ] Git Commit Message 符合规范

### 阶段 3：验证闭环（Verify）

- [ ] A/B 对比图完整（左侧无契约 / 右侧有契约）
- [ ] 测试用例 ≥ 10 组
- [ ] 返工率数据可量化（从 X% 降到 Y%）
- [ ] 下游工具已同步更新

---

## 七、常见问题

### Q1：设计师不会写 YAML，怎么办？

**A**：YAML 比 Markdown 还简单，就是缩进 + 冒号。我们提供了模板，设计师只需要填空：

```yaml
# 复制这个模板，改 4 处即可
intent_id: "【填编号】"
description: "【填一句话人话】"
immutable_boundaries:
  - "【填红线1】"
  - "【填红线2】"
  - "【填红线3】"
semantic_tokens:
  【填组件名】:
    visual_mapping:
      color_token: "【填颜色】"
    user_action: ["【填行动1】", "【填行动2】"]
```

### Q2：前端说"我没时间读 YAML"，怎么办？

**A**：DesignOps 负责把 YAML 编译成前端直接能复制的东西：

- **Prompt 前缀**：一段文字，前端贴在 AI 指令前面
- **组件 Props 校验规则**：JSON 格式，前端直接导入 ESLint
- **走查 Checklist**：打勾清单，前端自测用

前端不需要读 YAML，只需要复制编译后的产物。

### Q3：规范更新太频繁，Git 仓库会不会爆炸？

**A**：YAML 文件是纯文本，一个模式大约 50-100 行，占用空间极小。Git 的版本管理比语雀文档更轻量。

而且，**不是每次改颜色都要更新 YAML**。YAML 只记录"语义规则"（什么场景下不能做什么），不记录"视觉细节"（按钮圆角是 4px 还是 8px）。视觉细节交给 Design Token 管。

### Q4：怎么说服老板投入资源做这件事？

**A**：算一笔账：

| 成本项 | 以前（文档） | 现在（YAML） |
|--------|------------|------------|
| 规范同步时间 | 2 人周 | 0.5 天 |
| 走查覆盖率 | 20%（人工） | 100%（机器） |
| 语义返工率 | 30% | 5% |
| 用户投诉归因 | 无法归因 | 可定位到具体模式 |

**结论**：一次投入（写 YAML），长期节省（机器自动同步）。

---

## 八、附录

### 附录 A：YAML 模板库

| 场景 | 模板文件 | 说明 |
|------|---------|------|
| 错误状态 | `templates/ERR-template.yaml` | 后果差异未分级 |
| 高危操作 | `templates/ACT-template.yaml` | 按钮样式未约束 |
| 过程状态 | `templates/PRO-template.yaml` | 认知阶段未显化 |
| 边界动作 | `templates/BND-template.yaml` | 权利差异未区分 |
| 告警文案 | `templates/ALR-template.yaml` | 同义词降级 |

### 附录 B：相关文档

- [设计师使用指南](./DESIGNER-GUIDE.md)
- [前端接入指南](./FRONTEND-GUIDE.md)
- [产品经理风险清单](./PM-GUIDE.md)
- [AI 编程助手接入指南](./AGENT-GUIDE.md)
- [技术设计方案](./technical-design.md)

### 附录 C：术语对照表

| 市场语言 | 技术原词 | 说明 |
|---------|---------|------|
| 规范即代码 | Executable Design Spec | 把规范从文档变成代码格式 |
| 绝对不能碰的红线 | Immutable Boundary | 特定场景下 AI 不能突破的边界 |
| 颜色背后的意思 | Semantic Token | 组件在特定场景下的语义含义 |
| 放在 AI 指令前面的规则 | Prompt Prefix | 从契约编译出的约束文本 |
| 意思跑偏了 | Semantic Drift | AI 生成内容偏离设计意图 |

---

> **最后更新**：2026-06-24
> 
> **维护者**：DesignOps 团队
> 
> **反馈渠道**：GitHub Issue / 语雀评论区
