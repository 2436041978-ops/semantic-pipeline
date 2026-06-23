# 语义层设计技术方案：设计师作为翻译者

> 版本：v1.0
> 日期：2026-06-23
> 定位：Schema-As-Code 语义层中"设计师角色"的专项技术方案

---

## 1. 核心定位：设计师是"语义翻译者"

在 Schema-As-Code 语义层中，设计师的角色不是"画图的"，而是"**设计意图的翻译者**"——将人类语言的设计意图（Design Intent）翻译成机器可读的语义契约（Semantic Contract）。

**翻译方向**：

```
设计意图（人类语言）
    ↓ 设计师翻译
语义令牌（机器可读）
    ↓ 编译为
YAML 契约（工程消费）
    ↓ 被消费
AI 工具 / 前端组件 / 设计系统（工程实现）
```

**关键边界**：
- 设计师**不定义**组件怎么写（那是前端的工作）
- 设计师**不定义**代码怎么跑（那是工程的工作）
- 设计师**定义**"这个场景下必须表达什么语义、不能突破什么边界"

---

## 2. 输入件：设计师从上游接收什么

### 2.1 输入件清单

| 输入件类型 | 来源 | 内容 | 设计师的处理方式 |
|-----------|------|------|----------------|
| **PRD（产品需求文档）** | 产品经理 | 功能描述、用户场景、业务流程 | 提取"用户在这个场景下需要什么信息、可能犯什么错误" |
| **用户研究结论** | 用研团队 | 用户困惑点、误操作案例、认知负荷数据 | 提取"用户在什么情况下会误解界面的意思" |
| **品牌策略文档** | 品牌/市场 | 品牌调性、情绪关键词、禁用表达 | 提取"品牌不允许的语气/颜色/词汇" |
| **竞品走查报告** | 设计团队 | 竞品的错误状态、边界处理、告警方式 | 提取"竞品在这个场景下怎么表达语义，我们怎么差异化" |
| **设计系统现有规范** | DesignOps | 现有 Token、组件用法、走查标准 | 提取"现有规范中缺少语义层的部分" |
| **用户投诉/工单** | 客服/运营 | "看不懂报错""按钮点错了"等真实反馈 | 提取"语义漂移的具体症状" |

### 2.2 输入件结构化模板

设计师接收的输入件需要转化为**结构化语义需求**，使用以下模板：

```yaml
# 语义需求采集模板（设计师填写）
semantic_requirement:
  id: "REQ-001"
  source: "PRD / 用户研究 / 品牌策略 / 竞品走查 / 用户投诉"

  # 场景定义
  scenario:
    who: "用户是谁"
    what: "用户在做什么"
    where: "在什么页面/流程中"
    when: "在什么时机触发"
    why: "用户的目标是什么"

  # 语义需求
  semantic_need:
    must_express: "用户必须理解什么"
    must_not_do: "绝对不能出现什么"
    expected_action: "用户应该采取什么行动"

  # 参考证据
  evidence:
    - type: "screenshot"
      description: "竞品截图 / 用户投诉截图"
    - type: "user_quote"
      description: "用户原话：'我看不懂这个报错'"
    - type: "data"
      description: "误操作率 15%"
```

---

## 3. 输出件：设计师向下游交付什么

### 3.1 输出件清单

| 输出件 | 格式 | 消费者 | 用途 |
|--------|------|--------|------|
| **模式卡片** | JSON（结构化） | 模式库（Pattern Library） | 描述"这是什么类型的语义漂移" |
| **YAML 语义契约** | YAML（机器可读） | 契约库（Contract Library） | 定义"这个场景下不能做什么" |
| **语义令牌映射表** | Markdown / JSON | 设计系统团队 | 定义"颜色/文案/图标背后的语义" |
| **Prompt 前缀模板** | Markdown | 前端 / AI 工具 | 放在 AI 指令前面的约束文本 |
| **走查 Checklist** | Markdown | DesignOps / QA | 人工复核时的检查清单 |
| **A/B 对比图** | PNG / Figma | 团队评审 / 对外传播 | 证明"有规矩 vs 没规矩"的差异 |

### 3.2 输出件详细规范

#### 3.2.1 模式卡片（Pattern Card）

设计师负责填写模式卡片中的**语义相关字段**，技术字段由系统自动生成。

```json
{
  "id": "ERR-001",
  "version": "1.0.0",
  "componentType": "Alert",
  "componentLibrary": "Ant Design",

  "// 设计师填写": "================================",
  "symptoms": {
    "description": "多种错误共用红色，用户不知道多严重",
    "evidence": ["截图URL1", "截图URL2"],
    "products": ["ChatGPT", "文心一言"]
  },

  "rootCause": {
    "missingToken": "error_severity",
    "description": "缺少错误级别语义令牌"
  },
  "// 设计师填写结束": "================================",

  "componentSpec": { "// 自动从组件手册提取": {} },
  "contractRef": "contract/ERR-001.yaml",
  "validationMethod": "错误状态语义分级器",
  "status": "published"
}
```

#### 3.2.2 YAML 语义契约（核心输出件）

设计师负责填写 YAML 中的**语义令牌（semantic_tokens）**和**不可变边界（immutable_boundaries）**部分。

```yaml
# 设计师填写区域：语义令牌定义
semantic_tokens:
  error_severity:
    # 设计师定义：每个级别的"语义含义"
    fatal:
      description: "系统级故障，对话上下文可能丢失"
      # 设计师定义：触发这个级别的关键词（用于模式匹配）
      trigger_keywords: ["stream interrupted", "连接断开"]
      # 设计师定义：视觉映射（颜色/动画/图标）
      visual_mapping:
        color_token: "status.critical"      # 红色
        motion_token: "pulse.red.urgent"      # 脉冲动画
        icon_token: "alert.octagon"           # 八边形警告
      # 设计师定义：用户应该采取什么行动
      user_action:
        - label: "刷新页面"
          action: "refresh"
          priority: 1
        - label: "导出历史"
          action: "export_history"
          priority: 2
      # 设计师定义：LLM 生成时的约束
      llm_constraints:
        - "必须明确告知用户对话上下文可能已丢失"
        - "禁止仅显示'出错了'等模糊文案"

    transient:
      description: "网络层故障，系统可自动恢复"
      trigger_keywords: ["network error", "网络错误"]
      visual_mapping:
        color_token: "status.neutral"         # 灰色
        motion_token: "spinner"
        icon_token: "loader"
      user_action:
        - label: "等待自动恢复"
          action: "wait"
          priority: 1
      llm_constraints:
        - "必须显示自动重试进度"
        - "禁止使用红色背景"

# 设计师填写区域：不可变边界
immutable_boundaries:
  - boundary_type: "safety"
    rule: "禁止把多种错误做成同一种颜色"
    violation_action: "block"
  - boundary_type: "safety"
    rule: "禁止仅显示'出错了'等模糊文案"
    violation_action: "block"
```

#### 3.2.3 语义令牌映射表（设计系统扩展）

设计师输出给设计系统团队的扩展规范：

```markdown
## 语义令牌映射表（Semantic Token Mapping）

### 错误状态语义令牌（error_severity）

| 语义级别 | 语义含义 | 颜色令牌 | 动画令牌 | 图标令牌 | 使用场景 |
|---------|---------|---------|---------|---------|---------|
| fatal | 系统级故障，对话可能丢失 | status.critical | pulse.red.urgent | alert.octagon | 流式输出中断、连接断开 |
| transient | 网络抖动，可自动恢复 | status.neutral | spinner | loader | 网络错误、加载失败 |
| retryable | 限流/流控，用户可自助 | status.warning | none | clock | 429、请求过于频繁 |
| degraded | 部分功能可用 | status.info | none | info.circle | 服务异常、创造失败 |

### 操作按钮语义令牌（action_semantic）

| 语义域 | 语义含义 | 颜色令牌 | 样式令牌 | 必须包含 |
|-------|---------|---------|---------|---------|
| destructive | 不可逆的数据销毁 | status.critical | outline_danger | 二次确认弹窗 + 不可恢复警告 |
| transactional | 核心业务流程 | status.primary | contained | 结果反馈 |
| navigational | 页面跳转/引导 | status.link | link | 无 |
```

#### 3.2.4 Prompt 前缀模板（供前端消费）

设计师输出的 Prompt 前缀，前端直接复制到 AI 编程工具中：

```markdown
# 设计意图约束（来源：设计师 @xxx，模式：ERR-001）
# 语义域：observational

在生成错误状态组件时，必须遵守以下语义约束：

## 错误级别语义
- 致命（fatal）：系统级故障，对话上下文可能丢失
  - 视觉：红色脉冲 + 八边形警告图标
  - 行动：必须提供"刷新页面"和"导出历史"按钮
  - 文案：必须明确告知用户对话上下文可能已丢失

- 网络抖（transient）：网络层故障，系统可自动恢复
  - 视觉：灰色加载动画
  - 行动：显示自动重试进度，无需用户操作
  - 文案：禁止使用红色背景（避免情绪过载）

- 限流（retryable）：请求频率达到上限
  - 视觉：黄色提示 + 时钟图标
  - 行动：显示剩余等待时间，提供升级入口
  - 文案：禁止使用红色（避免用户恐慌）

- 部分可用（degraded）：服务端兜底，部分功能可用
  - 视觉：蓝色提示 + 信息图标
  - 行动：提供"继续生成"和"简化问题重试"选项
  - 文案：必须说明哪些功能仍然可用

## 不可变边界
- [BLOCK] 禁止把多种错误做成同一种颜色
- [BLOCK] 禁止仅显示"出错了"等模糊文案
- [WARN] 禁止显示纯技术错误码（如 500 Internal Error）给用户
```

---

## 4. 规范：设计师怎么写语义契约

### 4.1 语义令牌定义规范

**规范 1：语义令牌必须可验证**
- 每个语义令牌必须有明确的"触发条件"（trigger_keywords 或 props 条件）
- 每个语义令牌必须有明确的"视觉映射"（不能只有文字描述，必须有 color_token / motion_token / icon_token）
- 每个语义令牌必须有明确的"用户行动"（用户看到这个界面后，应该做什么）

**规范 2：语义令牌必须可区分**
- 同一组件类型下的不同语义令牌，必须在"语义含义"上有明确区分
- 不允许两个语义令牌只有文案差异，但语义含义相同
- 示例："fatal"和"critical"不能同时存在，除非它们的"用户行动"不同

**规范 3：语义令牌必须可映射**
- 每个语义令牌必须能映射到至少一个组件手册中的 Props
- 示例：`error_severity.fatal` 必须映射到 `Alert.type="error"` + `Alert.icon` + `Alert.style`

### 4.2 不可变边界定义规范

**规范 1：边界必须绝对化**
- 不可变边界必须使用"禁止""必须""绝对不能"等绝对化词汇
- 不允许使用"建议""推荐""最好"等模糊词汇
- 示例：正确="禁止把删除按钮做成普通蓝色按钮"；错误="建议删除按钮用红色"

**规范 2：边界必须可检测**
- 每个不可变边界必须能被机器检测（通过 Props 比对、关键词匹配、正则表达式）
- 不允许定义"设计师凭感觉判断"的边界
- 示例：正确="禁止 type='primary' 且 danger=false 的删除按钮"；错误="删除按钮看起来不能太友好"

**规范 3：边界必须有动作**
- 每个不可变边界必须定义违规后的动作：block（阻断）/ warn（告警）/ escalate（升级人工）
- 不允许只定义规则不定义动作

### 4.3 视觉映射定义规范

**规范 1：颜色令牌必须引用设计系统 Token**
- 不允许使用硬编码颜色值（如 `#FF0000`）
- 必须引用设计系统中已定义的 Token（如 `status.critical`）
- 如果设计系统没有对应 Token，必须先申请新增 Token

**规范 2：动画令牌必须引用动画库**
- 不允许使用自定义 CSS 动画描述
- 必须引用动画库中已定义的动画（如 `pulse.red.urgent`）

**规范 3：图标令牌必须引用图标库**
- 不允许使用文字描述图标（如"一个警告图标"）
- 必须引用图标库中已定义的图标名称（如 `alert.octagon`）

---

## 5. 设计师工作流

### 5.1 日常 workflow

```
Step 1: 接收输入件
├── PRD / 用户研究 / 品牌策略 / 竞品走查 / 用户投诉
└── 填写《语义需求采集模板》

Step 2: 语义分析
├── 识别组件类型（Alert / Button / Modal / Progress）
├── 识别语义漂移症状（用户困惑点）
├── 查模式库：是否已有类似模式？
│   ├── 有 → 复用现有模式，补充产品实例
│   └── 无 → 创建新模式卡片

Step 3: 定义语义令牌
├── 填写模式卡片（症状、根因、产品实例）
├── 编写 YAML 语义契约（semantic_tokens + immutable_boundaries）
├── 输出语义令牌映射表

Step 4: 编译消费件
├── 生成 Prompt 前缀模板（供前端）
├── 生成走查 Checklist（供 DesignOps）
├── 生成 A/B 对比图（供评审）

Step 5: 提交评审
├── Git PR：模式卡片 JSON + YAML 契约 + 映射表
├── 评审人：DesignOps（规范一致性）+ 前端（工程可行性）+ PM（业务正确性）
└── 合并后自动触发：缓存刷新 + 下游同步

Step 6: 验证闭环
├── 前端使用 Prompt 前缀生成代码
├── 验证工具集跑测试用例
├── 收集返工率数据
└── 数据反哺：更新模式卡片（准确率、返工率）
```

### 5.2 工具使用规范

| 工具 | 用途 | 设计师的操作 |
|------|------|-------------|
| **模式库查询界面** | 查已有模式 | 输入组件类型 + 关键词，看是否已有匹配 |
| **契约编辑器** | 编写 YAML | 表单化填写，自动生成 YAML，实时校验结构 |
| **Figma 插件** | 设计时检测 | 选中组件 → 自动检测语义风险 → 弹出模式匹配建议 |
| **验证仪表盘** | 看数据反馈 | 查看"自己定义的契约被用了多少次、拦截了多少次漂移" |

---

## 6. 设计师交付物检查清单

设计师提交 PR 前，必须逐项检查：

```markdown
## 语义契约交付检查清单

### 模式卡片
- [ ] 模式 ID 符合命名规范（组件类型缩写 + 序号，如 ERR-001）
- [ ] 症状描述包含至少 1 个用户原话或截图证据
- [ ] 根因分析指向具体的"缺少的语义令牌"
- [ ] 产品实例包含至少 2 个真实产品截图

### YAML 语义契约
- [ ] schema_version 已填写
- [ ] intent_id 与模式卡片一致
- [ ] semantic_domain 已填写（observational / transactional / navigational）
- [ ] semantic_tokens 下至少定义了 2 个语义级别
- [ ] 每个语义级别包含：description / trigger_keywords / visual_mapping / user_action / llm_constraints
- [ ] visual_mapping 中的 color_token / motion_token / icon_token 均引用设计系统已有 Token
- [ ] immutable_boundaries 至少定义了 1 条
- [ ] 每条边界包含：boundary_type / rule / violation_action
- [ ] YAML 结构通过自动校验（无语法错误、无缺失必填字段）

### 消费件
- [ ] Prompt 前缀模板已生成（供前端）
- [ ] 走查 Checklist 已生成（供 DesignOps）
- [ ] A/B 对比图已生成（当前界面 vs 语义分级后）

### 评审
- [ ] DesignOps 已评审（规范一致性）
- [ ] 前端代表已评审（工程可行性）
- [ ] PM 已评审（业务正确性）
```

---

## 7. 设计师能力要求

| 能力 | 要求 | 培训路径 |
|------|------|---------|
| **语义分析能力** | 能从用户投诉/截图中识别"语义漂移症状" | 模式库案例学习（ERR-001 / ACT-001 等） |
| **YAML 编写能力** | 能按规范填写语义令牌和不可变边界 | 契约编辑器表单化填写（无需手写 YAML） |
| **组件手册阅读能力** | 能查 Ant Design / DevUI 等组件手册，找到对应 Props | 组件手册导航培训 |
| **设计系统 Token 知识** | 知道现有颜色/动画/图标 Token 的命名和含义 | 设计系统 Token 文档 |
| **Git 基础操作** | 能提交 PR、解决简单冲突 | Git 基础培训 |

---

## 8. 与其他角色的协作边界

| 角色 | 设计师给 TA 什么 | TA 给设计师什么 | 协作节点 |
|------|----------------|---------------|---------|
| **产品经理** | 语义需求采集模板（需要 PM 填写场景定义） | PRD、用户投诉数据、业务目标 | Step 1（输入） |
| **DesignOps** | 模式卡片 + YAML 契约（需要 DesignOps 审核规范一致性） | 设计系统规范、Token 定义、走查标准 | Step 5（评审） |
| **前端工程师** | Prompt 前缀模板（前端贴在 AI 指令前面） | 组件实现反馈、Props 映射建议、返工率数据 | Step 4（编译）+ Step 6（验证） |
| **AI PM** | 风险清单（PM 在原型评审时使用） | 用户投诉归因数据、竞品分析 | Step 6（验证） |
| **设计系统负责人** | 语义令牌映射表（扩展设计系统 Token 语义层） | 组件手册更新、Token 新增审批 | Step 3（定义） |

