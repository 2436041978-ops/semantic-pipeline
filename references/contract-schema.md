# YAML 契约 Schema 规范

> 版本：v1.0.0  
> 适用范围：Schema-As-Code 语义约束契约库  
> 目标读者：设计师、DesignOps、前端工程师

---

## 一、契约是什么

契约是设计师把"这个场景下不能做什么"写成机器能懂的规则文件。  
（Schema-As-Code 中的 **Contract**）

一份契约 = 一个场景 + 一组绝对不能碰的红线 + 颜色/文案/交互的映射规矩。

---

## 二、契约文件 6 字段标准

每份契约 YAML 必须包含以下 6 个字段，缺一不可。

| 字段 | 必填 | 人话解释 | 填写规范 |
|------|------|---------|---------|
| `intent_id` | ✅ | 契约的唯一编号 | 大写，格式 `{类型}-{3位数字}`，如 `ERR-001`、`ACT-001` |
| `semantic_domain` | ✅ | 这个契约管什么场景 | 从预定义列表中选，如 `transactional`、`observational`、`destructive` |
| `description` | ✅ | 一句话说清这个契约是干嘛的 | 必须是人话，不超过 30 个字，让不会代码的人也能看懂 |
| `immutable_boundaries` | ✅ | 绝对不能碰的红线 | 至少 3 条，每条包含 `rule`（规则描述）+ `violation_action`（违反后怎么办） |
| `semantic_tokens` | ✅ | 颜色/文案/交互背后的意思 | 按组件类型定义 `visual_mapping` + `user_action` + `llm_constraints` |
| `applicable_products` | ❌ | 这份契约适用于哪些产品 | 数组，如 `["ChatGPT", "文心一言", "通义千问"]`，通用场景可省略 |

---

## 三、字段详细规范

### 3.1 intent_id

**格式**：`{类型前缀}-{3位数字}`

| 类型前缀 | 含义 | 示例 |
|---------|------|------|
| `ERR` | 错误状态（Error） | `ERR-001` |
| `PRO` | 过程状态（Progress） | `PRO-001` |
| `BND` | 边界动作（Boundary） | `BND-001` |
| `ACT` | 操作按钮（Action） | `ACT-001` |
| `ALR` | 告警/提示（Alert） | `ALR-001` |

**填写检查**：
- [ ] 是否大写
- [ ] 是否包含连字符
- [ ] 数字是否为 3 位

---

### 3.2 semantic_domain

**预定义取值**：

| 取值 | 适用场景 | 说明 |
|------|---------|------|
| `transactional` | 交易/操作类 | 涉及用户数据变更，如删除、支付、提交 |
| `observational` | 观察/状态类 | 系统向用户展示状态，如错误、进度、告警 |
| `destructive` | 破坏性操作 | 不可逆操作，如删除账户、清空数据 |
| `navigational` | 导航类 | 页面跳转、流程引导 |
| `informational` | 信息展示类 | 纯展示，无交互风险 |

**填写检查**：
- [ ] 是否从预定义列表中选取
- [ ] 是否与契约内容匹配（删除账户不能用 `informational`）

---

### 3.3 description

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

---

### 3.4 immutable_boundaries

**结构**：
```yaml
immutable_boundaries:
  - boundary_type: "safety"      # 边界类型：safety / semantic / compliance
    rule: "禁止直接执行删除操作而不显示二次确认"  # 规则描述，人话
    violation_action: "block"    # 违反后怎么办：block / warn / escalate
    reason: "用户可能误触导致数据丢失"  # 为什么这条不能碰（可选但建议写）
```

**要求**：
- 至少 3 条
- `rule` 必须是"禁止/必须"开头的祈使句
- `violation_action` 只能是 `block`（阻断）、`warn`（警告）、`escalate`（升级人工）

**填写检查**：
- [ ] 是否 ≥ 3 条
- [ ] 是否都是"禁止/必须"开头
- [ ] `violation_action` 是否在允许列表中

---

### 3.5 semantic_tokens

**结构**：
```yaml
semantic_tokens:
  {语义令牌名}:                    # 如 error_severity / destructive_action
    description: "人话描述"
    visual_mapping:                # 视觉映射
      color_token: "status.critical"   # 颜色令牌
      motion_token: "pulse.red.urgent" # 动画令牌（可选）
      icon_token: "alert.octagon"      # 图标令牌（可选）
    user_action:                   # 用户该做什么
      - label: "按钮文案"
        action: "操作ID"
        priority: 1                # 优先级，1 为最高
    llm_constraints:               # AI 绝对不能做什么
      - "禁止..."
      - "必须..."
```

**visual_mapping 预定义颜色令牌**：

| 颜色令牌 | 含义 | 适用场景 |
|---------|------|---------|
| `status.critical` | 致命/危险 | 系统级故障、不可逆操作 |
| `status.warning` | 警告/注意 | 可恢复错误、限流 |
| `status.info` | 信息/提示 | 部分可用、一般提示 |
| `status.neutral` | 中性/等待 | 网络抖动、自动恢复中 |
| `status.success` | 成功 | 操作完成 |

**填写检查**：
- [ ] `color_token` 是否在预定义列表中
- [ ] `user_action` 是否至少 1 条
- [ ] `llm_constraints` 是否至少 2 条

---

### 3.6 applicable_products

**结构**：
```yaml
applicable_products:
  - "ChatGPT"
  - "文心一言"
  - "通义千问"
  - "Kimi"
  - "豆包"
```

**说明**：
- 通用场景可省略此字段
- 如果是针对特定产品的诊断，必须列出
- 产品名使用用户熟知的名称，不用内部代号

---

## 四、完整示例

### 示例 1：高危操作按钮（ACT-001）

```yaml
intent_id: "ACT-001"
semantic_domain: "destructive"
description: "删除账户时，必须让用户确认且说明不可恢复"

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

semantic_tokens:
  destructive_action:
    description: "不可逆的数据销毁操作"
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
    llm_constraints:
      - "禁止蓝色实心按钮"
      - "必须包含二次确认弹窗"
      - "文案必须说明'此操作不可恢复'"
      - "取消按钮视觉权重不低于确认按钮"
```

### 示例 2：错误状态分级（ERR-001）

```yaml
intent_id: "ERR-001"
semantic_domain: "observational"
description: "错误状态按后果严重程度分四级，不能全是红色"

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

semantic_tokens:
  error_severity:
    fatal:
      description: "系统级故障，对话上下文可能丢失"
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

applicable_products:
  - "ChatGPT"
  - "文心一言"
  - "通义千问"
  - "Kimi"
  - "豆包"
  - "DeepSeek"
  - "讯飞星火"
```

---

## 五、校验规则（供脚本使用）

### 5.1 结构校验

```javascript
// validate-yaml.js 核心逻辑
function validateContract(yaml) {
  const requiredFields = ['intent_id', 'semantic_domain', 'description', 'immutable_boundaries', 'semantic_tokens'];

  // 检查必填字段
  for (const field of requiredFields) {
    if (!yaml[field]) return { valid: false, error: `缺少必填字段: ${field}` };
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

| 检查项 | 通过标准 |
|--------|---------|
| 人话测试 | 把 YAML 给不会代码的设计师看，能看懂 80% |
| 红线测试 | 每条 immutable_boundaries 都能对应一个真实用户投诉 |
| 视觉测试 | 每个 color_token 都能在 Design System 中找到对应 Token |
| 行动测试 | 每个 user_action 都有明确的按钮文案和下一步 |

---

## 六、版本管理

契约文件采用语义化版本：

```yaml
version: "1.0.0"  # 主版本.次版本.修订号
```

| 版本变化 | 说明 | 示例 |
|---------|------|------|
| 主版本 | 破坏性变更，如删除字段、改 intent_id | `1.0.0` → `2.0.0` |
| 次版本 | 新增功能，如新增 semantic_tokens | `1.0.0` → `1.1.0` |
| 修订号 | 修复错误，如改错别字、补漏掉的约束 | `1.0.0` → `1.0.1` |

---

## 七、相关文档

- [模式卡片 Schema 规范](./pattern-schema.md)
- [设计师使用指南](../docs/DESIGNER-GUIDE.md)
- [验证通过标准](./validation-standard.md)
- [语义术语表](../docs/GLOSSARY.md)
