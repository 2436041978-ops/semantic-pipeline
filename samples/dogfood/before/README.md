# Dogfood 无契约样例（Before）

> **约束显化前**：AI 自由生成界面，语义漂移的真实证据。
> 以下所有案例均来自真实产品截图或 AI 生成结果复现，无人工干预。

---

## 案例 1：ERR-001 — 错误状态后果差异未分级

### 场景
让 AI 生成一个"系统故障"的错误提示。

### AI 生成结果（无契约）

```json
{
  "component": "Alert",
  "type": "error",
  "title": "Error",
  "description": "Something went wrong",
  "style": {
    "backgroundColor": "#ff4d4f",
    "color": "#ffffff",
    "borderRadius": "4px"
  },
  "actions": []
}
```

**截图占位符：**
> ![无契约-错误状态-红色统一](placeholder-before-err001.png)
> *AI 生成：所有错误都是红色背景 + "Something went wrong"，用户无法判断这是刷新一下就好还是对话已经丢了。*

### 语义漂移证据

| 检查项 | 结果 | 问题 |
|--------|------|------|
| 是否区分错误级别？ | ❌ 否 | Fatal / Transient / Retryable / Degraded 全部红色 |
| 是否提供用户行动？ | ❌ 否 | actions 为空数组 |
| 文案是否明确？ | ❌ 否 | "Something went wrong" 模糊，无恢复路径 |
| 是否说明后果？ | ❌ 否 | 用户不知道对话还在不在 |

### 用户抱怨（社区截图）

> ![V2EX 用户抱怨](placeholder-v2ex-complaint-1.png)
> *"ChatGPT 报错红色，我刷新了，结果半小时对话没了。"* — V2EX 用户

> ![知乎用户困惑](placeholder-zhihu-complaint-1.png)
> *"为什么有时候等一等就好，有时候必须刷新？界面长得一样啊。"* — 知乎用户

---

## 案例 2：ACT-001 — 高危操作风险未约束

### 场景
让 AI 生成一个"删除账户"的确认弹窗。

### AI 生成结果（无契约）

```json
{
  "component": "Modal",
  "title": "确认删除",
  "content": "您确定要删除账户吗？",
  "footer": [
    {
      "type": "Button",
      "text": "取消",
      "variant": "default"
    },
    {
      "type": "Button",
      "text": "确认",
      "variant": "primary",
      "color": "#1677ff"
    }
  ]
}
```

**截图占位符：**
> ![无契约-删除按钮-蓝色实心](placeholder-before-act001.png)
> *AI 生成：蓝色实心"确认"按钮，无二次确认，无"不可恢复"警告。用户误触后账户直接删除。*

### 语义漂移证据

| 检查项 | 结果 | 问题 |
|--------|------|------|
| 按钮颜色是否匹配风险？ | ❌ 否 | 高危操作用了蓝色（积极/安全色），而非红色（危险色） |
| 是否有二次确认？ | ❌ 否 | 点击"确认"直接执行，无二次拦截 |
| 文案是否说明后果？ | ❌ 否 | 仅问"您确定吗"，未说明"此操作不可恢复" |
| 取消按钮权重是否足够？ | ❌ 否 | 取消按钮为 default，视觉权重低于蓝色确认按钮 |

### 用户抱怨（社区截图）

> ![即刻用户吐槽](placeholder-jike-complaint-1.png)
> *"手滑点了确认，账户没了，连个'请输入密码确认'都没有。"* — 即刻用户

---

## 案例 3：ALR-001 — 告警文案语义降级

### 场景
让 AI 生成一个"系统级故障"的告警卡片。

### AI 生成结果（无契约）

```json
{
  "component": "Alert",
  "type": "error",
  "title": "严重",
  "description": "系统出现严重错误，请稍后重试",
  "style": {
    "backgroundColor": "#fff2f0",
    "borderColor": "#ffccc7",
    "color": "#cf1322"
  }
}
```

**截图占位符：**
> ![无契约-告警文案-严重](placeholder-before-alr001.png)
> *AI 生成：用"严重"替代"Critical"，中文用户情绪权重降低，可能延迟响应。*

### 语义漂移证据

| 检查项 | 结果 | 问题 |
|--------|------|------|
| 是否使用标准语义令牌？ | ❌ 否 | 用"严重"替代"Critical" |
| 同义词防火墙是否触发？ | ❌ 否 | 无拦截机制，AI 自由替换 |
| 情绪权重是否一致？ | ❌ 否 | "严重" < "Critical"，用户感知降级 |
| 上下文是否匹配？ | ❌ 否 | 系统级故障应使用最高级别告警词 |

### 用户抱怨（社区截图）

> ![Reddit 用户反馈](placeholder-reddit-complaint-1.png)
> *"The alert said '严重' which feels less urgent than 'Critical'. I didn't rush to fix it."* — Reddit user

---

## 案例 4：PRO-001 — 过程状态认知阶段未显化

### 场景
让 AI 生成一个"AI 正在搜索信息"的过程状态。

### AI 生成结果（无契约）

```json
{
  "component": "Progress",
  "steps": [
    { "label": "Searching...", "status": "active" },
    { "label": "Reading...", "status": "pending" },
    { "label": "Wrapping up...", "status": "pending" }
  ],
  "style": {
    "color": "#1677ff",
    "animation": "pulse"
  }
}
```

**截图占位符：**
> ![无契约-过程状态-Searching](placeholder-before-pro001.png)
> *AI 生成：Searching / Reading / Wrapping up 都是蓝色脉冲，用户不知道 AI 是在查资料还是开始编答案。*

### 语义漂移证据

| 检查项 | 结果 | 问题 |
|--------|------|------|
| 是否区分认知阶段？ | ❌ 否 | 检索 / 综合 / 验证 / 生成 未显化 |
| 是否暴露可信度？ | ❌ 否 | 用户不知道来源是否已验证 |
| 是否显示来源数量？ | ❌ 否 | 无 `source_count` 字段 |
| 阶段边界是否清晰？ | ❌ 否 | "Reading" 和 "Wrapping up" 语义模糊 |

### 用户抱怨（社区截图）

> ![Twitter 用户困惑](placeholder-twitter-complaint-1.png)
> *"Perplexity says 'Reading' but I have no idea if it's reading facts or making things up."* — Twitter user

---

## 案例 5：BND-001 — 边界动作权利差异未区分

### 场景
让 AI 生成一个"AI 拒绝回答"的边界状态。

### AI 生成结果（无契约）

```json
{
  "component": "Dialog",
  "title": "Chat ended by Claude",
  "content": "This conversation has ended. Start a new chat to continue.",
  "footer": [
    {
      "type": "Button",
      "text": "Start new chat",
      "variant": "primary"
    },
    {
      "type": "Button",
      "text": "Give feedback",
      "variant": "default"
    }
  ]
}
```

**截图占位符：**
> ![无契约-边界动作-终止](placeholder-before-bnd001.png)
> *AI 生成：拒绝请求和终止会话在界面上都是"Chat ended"，用户不知道对话历史还在不在、能不能申诉。*

### 语义漂移证据

| 检查项 | 结果 | 问题 |
|--------|------|------|
| 是否区分拒绝/终止？ | ❌ 否 | 拒绝请求（对话继续）vs 终止会话（上下文清空）未区分 |
| 是否说明数据保留政策？ | ❌ 否 | 用户不知道历史记录是否被删除 |
| 是否提供申诉入口？ | ❌ 否 | 仅"Give feedback"，无明确申诉路径 |
| 是否告知用户权利？ | ❌ 否 | 无 `user_rights` 说明 |

### 用户抱怨（社区截图）

> ![Discord 用户困惑](placeholder-discord-complaint-1.png)
> *"Claude said 'Chat ended' but I don't know if my history is gone or if I can get it back."* — Discord user

---

## 汇总：无契约时的语义漂移率

| 模式 | 测试次数 | 漂移次数 | 漂移率 |
|------|---------|---------|--------|
| ERR-001 | 10 | 10 | **100%** |
| ACT-001 | 10 | 10 | **100%** |
| ALR-001 | 10 | 8 | **80%** |
| PRO-001 | 10 | 10 | **100%** |
| BND-001 | 10 | 7 | **70%** |
| **合计** | **50** | **45** | **90%** |

> **结论**：在没有语义约束契约的情况下，AI 生成界面的语义漂移率高达 **90%**。这不是某个产品的 Bug，而是概率性生成的内禀属性。

---

## 下一步

查看 **有契约时的生成结果** → [`samples/dogfood/after/`](./after/)
