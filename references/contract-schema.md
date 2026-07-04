# YAML 契约 Schema 规范

> 版本：v1.1.0
>
> 适用范围：Schema-As-Code 语义约束契约库
>
> 目标读者：设计师、DesignOps、前端工程师

* * *

## 一、契约是什么

Permalink: 一、契约是什么

契约是设计师把"这个场景下不能做什么"写成机器能懂的规则文件。

（Schema-As-Code 中的 **Contract**）

一份契约 = 一个场景 + 一组绝对不能碰的红线 + 颜色/文案/交互的映射规矩。

* * *

## 二、契约文件 8 字段标准

Permalink: 二、契约文件 8 字段标准

每份契约 YAML 必须包含以下 8 个字段，缺一不可。

| 字段| 必填| 人话解释| 填写规范|
| ---| ---| ---| ---|
| `schema_version`| ✅| 本契约遵循的 Schema 版本| 语义化版本，如 `"1.0.0"` |
| `intent_id`| ✅| 契约的唯一编号| 大写，格式 `{类型}-{3位数字}`，如 `ERR-001`、 `ACT-001`|
| `semantic_domain`| ✅| 这个契约管什么场景| 从预定义列表中选，如 `transactional`、 `observational`、 `destructive`|
| `description`| ✅| 一句话说清这个契约是干嘛的| 必须是人话，不超过 30 个字，让不会代码的人也能看懂|
| `immutable_boundaries`| ✅| 绝对不能碰的红线| 至少 3 条，每条包含 `rule`（规则描述）+ `violation_action`（违反后怎么办）|
| `semantic_tokens`| ✅| 颜色/文案/交互背后的意思| 按组件类型定义 `visual_mapping` + `user_action` + `llm_constraints`|
| `applicable_products`| ✅| 这份契约适用于哪些产品| 数组，至少 1 项。通用场景填写 `["通用"]` 或 `["所有含...的 AI 生成界面"]`，不可省略 |
| `component_spec`| ✅| 关联的 UI 组件规格| 组件类型、组件库、属性引用、必需组合 |
| `version_history`| ✅| 契约内容版本变更记录| 数组，至少 1 条，含 `version` + `date` + `change` |

> **变更说明（v1.0.0 → v1.1.0）**：
> - 新增 `schema_version`（原 `version` 字段已废弃，统一使用 `schema_version` 表示 Schema 版本）
> - 新增 `component_spec`（原未定义，但实际契约文件已在使用）
> - 新增 `version_history`（原未定义，但实际契约文件已在使用）
> - `applicable_products` 从 ❌ 改为 ✅（原标注"通用场景可省略"，但与 `validation-standard.md` 矛盾；实际所有契约均填写了此字段，统一为必填）

* * *

## 三、字段详细规范

Permalink: 三、字段详细规范

### 3.1 schema_version

Permalink: 3.1 schema_version

**含义**：本契约文件遵循的 `contract-schema.md` 版本号。

**格式**：语义化版本 `主版本.次版本.修订号`

```yaml
schema_version: "1.1.0"
```

**填写规则**：
- 必须与当前 `contract-schema.md` 的版本号一致
- 当 Schema 升级（如新增字段、修改必填规则）时，同步更新此值

**与 `version_history` 的区别**：
- `schema_version`：契约**文件结构**遵循的 Schema 版本（元数据）
- `version_history`：契约**内容规则**的迭代历史（业务数据）

* * *

### 3.2 intent_id

Permalink: 3.2 intent_id

**格式**： `{类型前缀}-{3位数字}`

| 类型前缀| 含义| 示例|
| ---| ---| ---|
| `ERR`| 错误状态（Error）| `ERR-001`|
| `PRO`| 过程状态（Progress）| `PRO-001`|
| `BND`| 边界动作（Boundary）| `BND-001`|
| `ACT`| 操作按钮（Action）| `ACT-001`|
| `ALR`| 告警/提示（Alert）| `ALR-001`|

**填写检查**：

- 是否大写
- 是否包含连字符
- 数字是否为 3 位

* * *

### 3.3 semantic_domain

Permalink: 3.3 semantic_domain

**预定义取值**：

| 取值| 适用场景| 说明|
| ---| ---| ---|
| `transactional`| 交易/操作类| 涉及用户数据变更，如删除、支付、提交|
| `observational`| 观察/状态类| 系统向用户展示状态，如错误、进度、告警|
| `destructive`| 破坏性操作| 不可逆操作，如删除账户、清空数据|
| `navigational`| 导航类| 页面跳转、流程引导|
| `informational`| 信息展示类| 纯展示，无交互风险|

**填写检查**：

- 是否从预定义列表中选取
- 是否与契约内容匹配（删除账户不能用 `informational`）

* * *

### 3.4 description

Permalink: 3.4 description

**要求**：

- 一句话，不超过 30 个字
- 必须是人话，不需要技术术语
- 让不会代码的设计师也能一眼看懂

**好例子**：

```yaml
description: "删除账户时，必须让用户确认且说明不可恢复"
```

**坏例子**：

```yaml
description: "destructive action modal with confirmation step"  # 英文 + 术语，不合格
description: "定义了高危操作的语义约束和视觉映射规范"  # 太抽象，不合格
```

* * *

### 3.5 immutable_boundaries

Permalink: 3.5 immutable_boundaries

**结构**：

```yaml
immutable_boundaries:
  - boundary_type: "safety"      # 边界类型：safety / semantic / compliance / accessibility / user_rights
    rule: "禁止直接执行删除操作而不显示二次确认"  # 规则描述，人话
    violation_action: "block"    # 违反后怎么办：block / warn / escalate
    reason: "用户可能误触导致数据丢失"  # 为什么这条不能碰（可选但建议写）
```

**要求**：

- 至少 3 条
- `rule` 必须是"禁止/必须"开头的祈使句
- `violation_action` 只能是 `block`（阻断）、 `warn`（警告）、 `escalate`（升级人工）

**填写检查**：

- 是否 ≥ 3 条
- 是否都是"禁止/必须"开头
- `violation_action` 是否在允许列表中

* * *

### 3.6 semantic_tokens

Permalink: 3.6 semantic_tokens

**结构**：

```yaml
semantic_tokens:
  {语义令牌名}:                    # 如 error_severity / destructive_action / process_phase
    description: "人话描述"
    trigger_keywords: ["keyword1", "keyword2"]  # 触发关键词（可选）
    visual_mapping:                # 视觉映射
      color_token: "status.critical"   # 颜色令牌
      motion_token: "pulse.red.urgent" # 动画令牌（可选）
      icon_token: "alert.octagon"      # 图标令牌（可选）
      background: "red.500/10"         # 背景色（可选）
      button_style: "outline_danger"   # 按钮样式（可选）
    user_action:                   # 用户该做什么
      - label: "按钮文案"
        action: "操作ID"
        priority: 1                # 优先级，1 为最高
    user_impact:                   # 用户影响（可选，高危操作/边界动作建议填写）
      reversibility: "irreversible"
      data_loss_scope: "user_account"
    llm_constraints:               # AI 绝对不能做什么
      - "禁止..."
      - "必须..."
```

**visual_mapping 预定义颜色令牌**：

| 颜色令牌| 含义| 适用场景|
| ---| ---| ---|
| `status.critical`| 致命/危险| 系统级故障、不可逆操作|
| `status.warning`| 警告/注意| 可恢复错误、限流|
| `status.info`| 信息/提示| 部分可用、一般提示|
| `status.neutral`| 中性/等待| 网络抖动、自动恢复中|
| `status.success`| 成功| 操作完成|
| `phase.research`| 研究阶段| 检索、搜索中|
| `phase.analysis`| 分析阶段| 综合、对比中|
| `phase.check`| 校验阶段| 核对、验证中|
| `phase.generate`| 生成阶段| 内容生成中|
| `boundary.soft`| 软性边界| 拒绝、策略拦截|
| `boundary.hard`| 硬性边界| 终止、封禁|
| `boundary.escalation`| 升级边界| 人工审核、待审|

**填写检查**：

- `color_token` 是否在预定义列表中
- `user_action` 是否至少 1 条
- `llm_constraints` 是否至少 2 条

* * *

### 3.7 applicable_products

Permalink: 3.7 applicable_products

**结构**：

```yaml
applicable_products:
  - "ChatGPT"
  - "文心一言"
  - "通义千问"
  - "Kimi"
  - "豆包"
```

**要求**：

- **必填**，数组长度 ≥ 1
- 通用场景填写 `["通用"]` 或 `["所有含不可逆操作的 AI 生成界面"]` 等描述性值，不可省略
- 产品名使用用户熟知的名称，不用内部代号

> **变更说明**：v1.0.0 中标注为"通用场景可省略"，但与 `validation-standard.md` §2.1 矛盾（其要求至少 1 个产品名）。v1.1.0 统一为必填，通用场景使用占位描述即可。

* * *

### 3.8 component_spec

Permalink: 3.8 component_spec

**含义**：定义本契约关联的 UI 组件规格，供前端消费方直接引用。

**结构**：

```yaml
component_spec:
  component: "Alert"              # 组件名称
  component_library: "Ant Design"  # 组件库来源
  props_reference:                # 属性引用列表
    - type: "success / info / warning / error"
    - message: "string"
    - description: "string"
    - icon: "ReactNode"
  required_composition:           # 必需组合（可选，如高危操作需要 Modal + Button 组合）
    - component: "Modal"
      props:
        - type: "confirm"
        - okType: "danger"
```

**填写检查**：

- `component` 和 `component_library` 必须为非空字符串
- `props_reference` 为数组，至少 1 项
- `required_composition` 为可选字段，若存在则 `component` 和 `props` 必填

* * *

### 3.9 version_history

Permalink: 3.9 version_history

**含义**：记录契约内容规则的迭代历史，与 `schema_version`（Schema 版本）区分。

**结构**：

```yaml
version_history:
  - version: "1.0.0"              # 契约内容版本（语义化版本）
    date: "2026-06-23"            # 变更日期（ISO 8601 格式）
    change: "初始发布，覆盖四种错误状态语义分级"  # 变更摘要
  - version: "1.1.0"
    date: "2026-07-04"
    change: "新增限流场景触发关键词"
```

**要求**：

- **必填**，数组长度 ≥ 1
- 第一条记录通常为初始发布
- `version` 采用语义化版本（主版本.次版本.修订号）
- `date` 格式为 `YYYY-MM-DD`
- `change` 不超过 50 字

**与 `schema_version` 的区别**：

| 维度 | `schema_version` | `version_history[].version` |
|------|------------------|------------------------------|
| 含义 | 文件结构遵循的 Schema 版本 | 业务规则内容的迭代版本 |
| 变更触发 | Schema 新增/删除字段、修改必填规则 | 业务规则新增/修改/删除 |
| 示例 | `"1.1.0"`（因新增 `component_spec` 字段） | `"1.0.0"` → `"1.1.0"`（因新增限流关键词） |

* * *

## 四、完整示例

Permalink: 四、完整示例

### 示例 1：高危操作按钮（ACT-001）

Permalink: 示例 1：高危操作按钮（ACT-001）

```yaml
schema_version: "1.1.0"
intent_id: "ACT-001"
semantic_domain: "destructive"
description: "删除账户时，必须让用户确认且说明不可恢复"

component_spec:
  component: "Button"
  component_library: "Ant Design"
  props_reference:
    - type: "primary / default / dashed / link / text"
    - danger: "true / false"
    - ghost: "true / false"
    - disabled: "true / false"
  required_composition:
    - component: "Modal"
      props:
        - type: "confirm"
        - okType: "danger"

semantic_tokens:
  destructive_action:
    description: "不可逆的数据销毁操作"
    trigger_keywords: ["删除", "销毁", "清空", "注销", "remove", "delete"]
    visual_mapping:
      color_token: "status.critical"
      button_style: "outline_danger"
    user_action:
      - label: "确认删除账户"
        action: "confirm_delete"
        priority: 1
      - label: "取消"
        action: "cancel"
        priority: 2
    user_impact:
      reversibility: "irreversible"
      data_loss_scope: "user_account"
      recovery_path: "none_or_contact_admin"
    llm_constraints:
      - "禁止蓝色实心按钮"
      - "必须包含二次确认弹窗"
      - "文案必须说明'此操作不可恢复'"
      - "取消按钮视觉权重不低于确认按钮"

immutable_boundaries:
  - boundary_type: "safety"
    rule: "禁止直接执行删除操作而不显示二次确认"
    violation_action: "block"
    reason: "用户可能误触导致数据丢失"
  - boundary_type: "safety"
    rule: "禁止将删除按钮设计为普通主按钮样式"
    violation_action: "block"
    reason: "蓝色实心按钮视觉权重低，用户容易误触"
  - boundary_type: "semantic"
    rule: "文案必须明确说明'此操作不可恢复'"
    violation_action: "block"
    reason: "用户不知道删除后数据无法找回"
  - boundary_type: "accessibility"
    rule: "禁止仅依赖颜色区分高危操作，必须有文案或图标辅助"
    violation_action: "warn"

applicable_products:
  - "通用"
  - "所有含不可逆操作的 AI 生成界面"

version_history:
  - version: "1.0.0"
    date: "2026-06-23"
    change: "初始发布，定义不可逆高危操作语义约束"
```

### 示例 2：错误状态分级（ERR-001）

Permalink: 示例 2：错误状态分级（ERR-001）

```yaml
schema_version: "1.1.0"
intent_id: "ERR-001"
semantic_domain: "observational"
description: "错误状态按后果严重程度分四级，不能全是红色"

component_spec:
  component: "Alert"
  component_library: "Ant Design"
  props_reference:
    - type: "success / info / warning / error"
    - message: "string"
    - description: "string"
    - icon: "ReactNode"

semantic_tokens:
  error_severity:
    fatal:
      description: "系统级故障，对话上下文可能丢失"
      trigger_keywords: ["stream interrupted", "连接断开", "输出中断", "context lost"]
      visual_mapping:
        color_token: "status.critical"
        motion_token: "pulse.red.urgent"
        icon_token: "alert.octagon"
      user_action:
        - label: "刷新页面"
          action: "refresh"
          priority: 1
        - label: "导出历史"
          action: "export_history"
          priority: 2
      llm_constraints:
        - "必须明确告知用户对话上下文可能已丢失"
        - "禁止仅显示'出错了'等模糊文案"
    transient:
      description: "网络抖动，系统可自动恢复"
      trigger_keywords: ["network", "网络错误", "加载失败", "connection lost"]
      visual_mapping:
        color_token: "status.neutral"
        motion_token: "spinner"
        icon_token: "loader"
      user_action:
        - label: "等待自动恢复"
          action: "wait"
          priority: 1
      llm_constraints:
        - "必须显示自动重试进度"
        - "禁止使用红色背景"
    retryable:
      description: "限流/流控，用户可自助恢复"
      trigger_keywords: ["too many", "429", "throttling", "请求过于频繁", "rate limit"]
      visual_mapping:
        color_token: "status.warning"
        icon_token: "clock"
      user_action:
        - label: "等待倒计时"
          action: "wait_countdown"
          priority: 1
        - label: "升级套餐"
          action: "upgrade"
          priority: 2
      llm_constraints:
        - "必须显示剩余等待时间"
        - "必须提供升级路径"
    degraded:
      description: "部分功能可用，可继续生成"
      trigger_keywords: ["something went wrong", "服务异常", "部分失败", "degraded"]
      visual_mapping:
        color_token: "status.info"
        icon_token: "info.circle"
      user_action:
        - label: "继续生成"
          action: "continue"
          priority: 1
      llm_constraints:
        - "必须说明哪些功能仍然可用"
        - "必须提供替代方案"

immutable_boundaries:
  - boundary_type: "semantic"
    rule: "禁止多种错误状态共用同一种红色视觉表达"
    violation_action: "block"
  - boundary_type: "semantic"
    rule: "禁止错误文案仅显示'出错了'等模糊描述"
    violation_action: "block"
  - boundary_type: "semantic"
    rule: "必须提供明确的用户恢复路径"
    violation_action: "block"

applicable_products:
  - "ChatGPT"
  - "文心一言"
  - "通义千问"
  - "Kimi"
  - "豆包"
  - "DeepSeek"
  - "讯飞星火"

version_history:
  - version: "1.0.0"
    date: "2026-06-23"
    change: "初始发布，覆盖四种错误状态语义分级"
```

* * *

## 五、校验规则（供脚本使用）

Permalink: 五、校验规则（供脚本使用）

### 5.1 结构校验

Permalink: 5.1 结构校验

```javascript
// validate-yaml.js 核心逻辑（v1.1.0）
function validateContract(yaml) {
  // v1.1.0：8 个必填字段
  const requiredFields = [
    'schema_version',      // 新增：Schema 版本
    'intent_id',
    'semantic_domain',
    'description',
    'immutable_boundaries',
    'semantic_tokens',
    'applicable_products', // 变更：从可选改为必填
    'component_spec',      // 新增：组件规格
    'version_history'      // 新增：版本历史
  ];

  // 检查必填字段
  for (const field of requiredFields) {
    if (!yaml[field]) return { valid: false, error: `缺少必填字段: ${field}` };
  }

  // 检查 schema_version 格式（语义化版本）
  const semverPattern = /^\d+\.\d+\.\d+$/;
  if (!semverPattern.test(yaml.schema_version)) {
    return { valid: false, error: `schema_version 格式错误: ${yaml.schema_version}` };
  }

  // 检查 intent_id 格式
  const idPattern = /^(ERR|PRO|BND|ACT|ALR)-\d{3}$/;
  if (!idPattern.test(yaml.intent_id)) {
    return { valid: false, error: `intent_id 格式错误: ${yaml.intent_id}` };
  }

  // 检查 description 长度
  if (yaml.description.length > 30) {
    return { valid: false, error: `description 超过 30 字: ${yaml.description.length}` };
  }

  // 检查 immutable_boundaries 数量
  if (yaml.immutable_boundaries.length < 3) {
    return { valid: false, error: `immutable_boundaries 少于 3 条: ${yaml.immutable_boundaries.length}` };
  }

  // 检查 applicable_products 非空
  if (!Array.isArray(yaml.applicable_products) || yaml.applicable_products.length < 1) {
    return { valid: false, error: `applicable_products 必须至少包含 1 个产品` };
  }

  // 检查 component_spec 结构
  if (!yaml.component_spec.component || !yaml.component_spec.component_library) {
    return { valid: false, error: `component_spec 缺少 component 或 component_library` };
  }
  if (!Array.isArray(yaml.component_spec.props_reference) || yaml.component_spec.props_reference.length < 1) {
    return { valid: false, error: `component_spec.props_reference 必须至少包含 1 项` };
  }

  // 检查 version_history 结构
  if (!Array.isArray(yaml.version_history) || yaml.version_history.length < 1) {
    return { valid: false, error: `version_history 必须至少包含 1 条记录` };
  }
  for (const record of yaml.version_history) {
    if (!record.version || !record.date || !record.change) {
      return { valid: false, error: `version_history 记录缺少 version/date/change 字段` };
    }
  }

  // 检查 semantic_tokens 是否有 llm_constraints
  for (const [token, config] of Object.entries(yaml.semantic_tokens)) {
    if (!config.llm_constraints || config.llm_constraints.length < 2) {
      return { valid: false, error: `semantic_tokens.${token} 缺少 llm_constraints` };
    }
  }

  return { valid: true };
}
```

### 5.2 语义校验（人工）

Permalink: 5.2 语义校验（人工）

| 检查项| 通过标准|
| ---| ---|
| 人话测试| 把 YAML 给不会代码的设计师看，能看懂 80%|
| 红线测试| 每条 immutable_boundaries 都能对应一个真实用户投诉|
| 视觉测试| 每个 color_token 都能在 Design System 中找到对应 Token|
| 行动测试| 每个 user_action 都有明确的按钮文案和下一步|
| 组件测试| component_spec 中的组件和属性能在组件库文档中找到对应|
| 版本测试| version_history 第一条为初始发布，日期与 schema_version 升级日期不冲突|

* * *

## 六、版本管理

Permalink: 六、版本管理

### 6.1 Schema 版本（schema_version）

`contract-schema.md` 本身的版本号，当 Schema 规范发生变更时更新：

```yaml
schema_version: "1.1.0"
```

| 版本变化| 说明| 示例|
| ---| ---| ---|
| 主版本| 破坏性变更，如删除字段、改 intent_id 格式、改必填规则| `1.x.x` → `2.0.0`|
| 次版本| 新增字段、扩展示例、新增校验规则| `1.0.x` → `1.1.0`|
| 修订号| 修复错误，如改错别字、补漏掉的约束、澄清描述| `1.1.0` → `1.1.1`|

### 6.2 契约内容版本（version_history）

业务规则本身的迭代历史，记录在 `version_history` 数组中：

```yaml
version_history:
  - version: "1.0.0"
    date: "2026-06-23"
    change: "初始发布"
  - version: "1.1.0"
    date: "2026-07-04"
    change: "新增限流场景触发关键词"
```

**版本变化规则**：

| 版本变化| 说明| 示例|
| ---| ---| ---|
| 主版本| 破坏性变更，如删除语义令牌、改颜色映射、改边界规则| `1.0.0` → `2.0.0`|
| 次版本| 新增功能，如新增 semantic_tokens、新增触发关键词| `1.0.0` → `1.1.0`|
| 修订号| 修复错误，如改错别字、补漏掉的约束| `1.0.0` → `1.0.1`|

* * *

## 七、变更记录

Permalink: 七、变更记录

| Schema 版本| 日期| 变更内容| 影响范围|
| ---| ---| ---| ---|
| v1.1.0| 2026-07-04| 新增 `schema_version`、`component_spec`、`version_history` 3 个必填字段；将 `applicable_products` 从可选改为必填；废弃 `version` 字段（统一为 `schema_version`）；扩展 `semantic_tokens` 支持 `trigger_keywords`、`user_impact`、`background`、`button_style` 等子字段；新增 `boundary_type` 取值 `accessibility`、`user_rights` | 所有契约文件需同步升级至 `schema_version: "1.1.0"` |
| v1.0.0| 2026-06-20| 初始版本，定义 6 字段标准（intent_id, semantic_domain, description, immutable_boundaries, semantic_tokens, applicable_products）| — |

* * *

## 八、相关文档

Permalink: 八、相关文档

- 模式卡片 Schema 规范
- 设计师使用指南
- 验证通过标准
- 语义术语表
