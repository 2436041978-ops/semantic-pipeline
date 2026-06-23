# AGENT-GUIDE.md

> 给 Claude Code、Cursor、GitHub Copilot 等 AI 编程助手的驱动指南
> 
> 版本：v1.0
> 日期：2026-06-23

---

## 1. 这份指南是写给谁的

如果你在使用以下工具生成前端代码，这份指南就是写给你的：

- **Claude Code**（Anthropic 的终端 AI 编程助手）
- **Cursor**（内置 AI 的 IDE）
- **GitHub Copilot**（VS Code / JetBrains 插件）
- **v0**（Vercel 的 AI 原型工具）
- **任何通过自然语言生成 UI 代码的 AI 工具**

**核心问题**：直接对 AI 说"生成一个删除按钮"，AI 大概率给你一个蓝色实心按钮。这不是 Bug，是 AI 没有收到"这个按钮在这个场景下意味着什么"的语义约束。

**这份指南解决什么**：教你在让 AI 生成代码之前，先给它一份"这个场景下不能做什么"的规矩文件（YAML 契约），让 AI 生成的代码自带语义正确性。

---

## 2. 核心原理：Prompt 前缀注入

**不是"更好的 Prompt"，是"约束前置"。**

普通用法：
```
你：生成一个删除账户的确认弹窗
AI：好的，这是一个蓝色"确认"按钮的弹窗
你：不对，应该是红色的，还要有二次确认
AI：好的，我改一下
你：文案还要写"此操作不可恢复"
AI：好的，我再改一下
```

Schema-As-Code 用法：
```
你：【加载 contract/ACT-001.yaml】生成一个删除账户的确认弹窗
AI：收到约束。生成红色空心按钮 + 二次确认弹窗 + "此操作不可恢复"文案
```

**区别**：前者是"请求-修改-再修改"的循环，后者是"约束-生成-一次到位"。

---

## 3. 接入方式（三种）

### 方式一：手动复制 Prompt 前缀（适合单文件/快速验证）

1. 打开模式库：https://2436041978-ops.github.io/semantic-pipeline/semantic-guard/
2. 输入组件描述（如"删除账户按钮"）
3. 匹配到模式 ACT-001
4. 点击"复制 Prompt 前缀"
5. 粘贴到你的 AI 指令前面

**示例**：

```markdown
【以下约束来自 contract/ACT-001.yaml，模式：高危操作未约束】

在生成任何涉及用户数据销毁的界面时，必须遵守以下语义约束：
- 按钮样式：必须使用 outline_danger（红色空心），禁止使用 contained 主按钮
- 二次确认：必须包含确认弹窗，要求用户输入账户名或勾选确认
- 文案要求：必须包含"此操作不可恢复"的明确警告
- 取消选项：必须提供取消按钮，且视觉权重不低于确认按钮

【约束结束，开始生成】

生成一个删除账户的确认弹窗。
```

### 方式二：项目级 .cursorrules / CLAUDE.md（适合整个项目）

在仓库根目录创建约束文件，AI 自动读取。

**Cursor：`.cursorrules`**

```markdown
# Schema-As-Code 语义约束（项目级）
# 来源：semantic-pipeline/contracts/

## 高危操作（ACT-001）
当生成涉及删除、清空、注销等不可逆操作的组件时：
- 按钮必须使用 danger 样式（红色空心）
- 必须包含二次确认弹窗（Modal.confirm）
- 文案必须说明"此操作不可恢复"
- 禁止直接执行，必须阻断并等待用户确认

## 错误状态（ERR-001）
当生成错误提示组件时：
- 必须区分致命/网络抖/限流/部分可用四个级别
- 致命用红色脉冲，网络抖用灰色加载，限流用黄色，部分可用用蓝色
- 禁止所有错误都用同一种红色
- 必须提供明确的用户恢复行动

## 告警文案（ALR-001）
当生成系统告警文案时：
- 系统级故障必须用"Critical"，禁止用"严重""紧急"等降级词汇
- 同义词防火墙："严重"→"Critical"，"紧急"→"Critical"
```

**Claude Code：`CLAUDE.md`**

```markdown
# Schema-As-Code Semantic Constraints

## Context
This project uses Schema-As-Code to enforce semantic constraints on AI-generated UI components.

## Rules

### Destructive Actions (ACT-001)
When generating components that delete, clear, or terminate user data:
- Button MUST use `danger` style (red outline, not primary filled)
- MUST include `Modal.confirm` with explicit warning
- Message MUST include "This action cannot be undone"
- MUST NOT execute directly; MUST block and wait for confirmation

### Error States (ERR-001)
When generating error alert components:
- MUST distinguish fatal / transient / retryable / degraded
- fatal = red pulse, transient = gray spinner, retryable = yellow, degraded = blue
- MUST NOT use the same red for all errors
- MUST provide clear recovery action for each level

### Alert Copy (ALR-001)
When generating system alert messages:
- System-level failures MUST use "Critical", NOT "严重" or "紧急"
- Synonym firewall: "严重" → "Critical", "紧急" → "Critical"
```

### 方式三：Git 子模块 / 脚本自动拉取（适合团队同步）

在仓库中引用 semantic-pipeline 作为子模块，CI 自动编译 Prompt 前缀。

```bash
# 添加子模块
git submodule add https://github.com/2436041978-ops/semantic-pipeline.git .semantic-pipeline

# 在 package.json 中添加脚本
"scripts": {
  "sync-constraints": "cp .semantic-pipeline/contracts/prompt-prefixes/*.md ./docs/constraints/"
}
```

每次规范更新后，运行 `npm run sync-constraints` 自动同步最新约束。

---

## 4. 具体场景示例

### 场景一：删除账户弹窗

**无约束时 AI 生成**：
```jsx
<Dialog>
  <DialogTitle>确认删除</DialogTitle>
  <DialogContent>您确定要删除账户吗？</DialogContent>
  <DialogActions>
    <Button>取消</Button>
    <Button variant="contained" color="primary">确认</Button>
  </DialogActions>
</Dialog>
```

**问题**：蓝色实心"确认"按钮 = 普通操作语义，用户误触即删除，没有挽回路径。

**有约束时 AI 生成**（注入 ACT-001 Prompt 前缀后）：
```jsx
<Dialog>
  <DialogTitle>删除账户</DialogTitle>
  <DialogContent>
    <Alert severity="error">
      此操作不可恢复。您的所有数据、历史记录和设置将被永久删除。
    </Alert>
    <TextField label="请输入您的账户名以确认删除" />
  </DialogContent>
  <DialogActions>
    <Button>取消</Button>
    <Button variant="outlined" color="error">确认删除账户</Button>
  </DialogActions>
</Dialog>
```

**改进点**：
- 按钮：蓝色实心 → 红色空心（`variant="outlined" color="error"`）
- 文案："确认删除" → "确认删除账户"（明确后果）
- 新增：错误提示 Alert + 输入框二次确认

---

### 场景二：系统告警卡片

**无约束时 AI 生成**：
```json
{
  "alert_level": "严重",
  "message": "CPU 使用率超过阈值"
}
```

**问题**："严重"的情绪权重低于 "Critical"，值班员可能延迟响应。

**有约束时 AI 生成**（注入 ALR-001 Prompt 前缀后）：
```json
{
  "alert_level": "Critical",
  "message": "CPU 使用率超过阈值，导致服务响应延迟"
}
```

**改进点**：
- 文案："严重" → "Critical"（情绪权重恢复）
- 同义词防火墙自动拦截降级词汇

---

### 场景三：错误状态提示

**无约束时 AI 生成**：
```jsx
<Alert severity="error">Error in message stream</Alert>
<Alert severity="error">network error</Alert>
<Alert severity="error">Too many requests</Alert>
```

**问题**：三种错误全部 `severity="error"`（红色），用户无法区分后果。

**有约束时 AI 生成**（注入 ERR-001 Prompt 前缀后）：
```jsx
<Alert severity="error" icon={<WarningIcon />}>
  消息流中断
  <AlertAction>刷新页面</AlertAction>
  <AlertAction>导出历史</AlertAction>
</Alert>

<Alert severity="info" icon={<SyncIcon />}>
  网络连接不稳定，正在自动重试...
</Alert>

<Alert severity="warning" icon={<ClockIcon />}>
  请求频率已达上限，42 分钟后恢复
  <AlertAction>升级 Plus</AlertAction>
</Alert>
```

**改进点**：
- 致命：红色 + 八边形警告 + 刷新/导出按钮
- 网络抖：灰色 + 旋转图标 + 自动恢复提示
- 限流：黄色 + 时钟图标 + 倒计时 + 升级入口

---

## 5. 常见问题

### Q1：Prompt 前缀会不会让 AI 生成变慢？

**不会**。Prompt 前缀只是增加了几百字的上下文约束，对生成速度的影响可以忽略不计。相比"生成后修改"的往返时间，约束前置反而更快。

### Q2：如果 AI 不遵守约束怎么办？

**三层保障**：
1. **Prompt 层**：Prompt 前缀明确声明约束
2. **CI 层**：提交代码时自动校验组件 Props（如 `dangerous action` 必须 `danger=true`）
3. **走查层**：DesignOps 按 YAML 规则人工复核

如果 AI 仍然不遵守，说明约束定义不够明确，需要反馈到模式库更新契约。

### Q3：约束文件更新了，我的项目怎么同步？

**三种方式**：
- 手动：重新打开模式库，复制最新 Prompt 前缀
- 自动：Git 子模块 + `npm run sync-constraints`
- 实时：CI 流水线自动拉取最新契约，编译到项目配置中

### Q4：我的项目不用 React / Vue，用其他框架怎么办？

**约束与框架无关**。YAML 契约中的语义约束（如"高危操作必须用红色空心"）可以映射到任何框架：
- React：`<Button variant="outlined" color="error">`
- Vue：`<el-button type="danger" plain>`
- Angular：`<button mat-stroked-button color="warn">`
- 原生 HTML：`<button class="btn-outline-danger">`

框架映射表由前端根据组件手册自行转换。

---

## 6. 检查清单（接入前确认）

```markdown
## AI 编程助手接入检查清单

### 项目配置
- [ ] 已创建 `.cursorrules` 或 `CLAUDE.md` 文件
- [ ] 已引用至少 1 个 YAML 契约的 Prompt 前缀
- [ ] 团队成员已了解约束注入方式

### 契约覆盖
- [ ] 高危操作场景已覆盖（ACT-001）
- [ ] 错误状态场景已覆盖（ERR-001）
- [ ] 告警文案场景已覆盖（ALR-001）
- [ ] 其他业务场景已补充

### 验证闭环
- [ ] 已运行验证工具，确认契约生效
- [ ] 已记录返工率变化数据
- [ ] 已建立反馈通道（契约不生效时上报模式库）
```

---

## 7. 快速参考卡

| 场景 | 模式 ID | 核心约束 | Prompt 前缀位置 |
|------|---------|---------|----------------|
| 删除/清空/注销 | ACT-001 | 红色空心 + 二次确认 | `contracts/prompt-prefixes/ACT-001.md` |
| 错误提示 | ERR-001 | 四级颜色区分 | `contracts/prompt-prefixes/ERR-001.md` |
| 告警文案 | ALR-001 | Critical 不能降级 | `contracts/prompt-prefixes/ALR-001.md` |
| 过程状态 | PRO-001 | 阶段标签显化 | `contracts/prompt-prefixes/PRO-001.md` |
| 边界动作 | BND-001 | 拒绝/终止区分 | `contracts/prompt-prefixes/BND-001.md` |

---

## 8. 反馈与更新

- **契约不生效？** 提交 Issue 到 `semantic-pipeline`，附上 AI 生成的代码和预期结果
- **需要新模式？** 按《DESIGNER-GUIDE.md》流程提交模式卡片
- **规范更新了？** 关注 Release 通知，自动同步最新契约

---

*文档版本：v1.0*
*更新日期：2026-06-23*
*配套文档：《FRONTEND-GUIDE.md》《DESIGNER-GUIDE.md》《DESIGNOPS-GUIDE.md》*
