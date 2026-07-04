# 前端工程师接入指南

> **写给谁看**：前端工程师、全栈开发者、AI 编程助手使用者。
> **你能得到什么**：一套"复制 1 段 Prompt 前缀 → 生成符合语义约束的代码 → 自动校验 Props"的工作流，让 AI 生成的组件不再出现"删除按钮做成蓝色实心"这类语义事故。

---

## 一、你的角色：契约的消费者

在 Schema-As-Code 体系里，**设计师写契约，前端消费契约**。你不需要写 YAML，但需要知道：

- 怎么把契约翻译成 AI 能懂的约束（Prompt 前缀）
- 怎么让生成的代码自动符合语义规则（JSON Schema + ESLint）
- 怎么在 CI 里拦住语义漂移（自动化校验）

**你不做：**
- 写 YAML 契约文件（设计师/DesignOps 负责）
- 诊断语义断层（设计师负责）
- 调整 AI 模型参数（算法工程师负责）

**你做：**
- 复制 Prompt 前缀，贴在 AI 指令前面
- 用 JSON Schema 校验组件 Props
- 在 CI 里接入契约校验脚本
- 把语义问题反馈给设计师

---

## 二、核心工作流：三阶段消费

```
阶段一：获取契约（Guard）
 ↓ 从契约库复制 Prompt 前缀 / JSON Schema / ESLint 规则
阶段二：注入约束（Contract）
 ↓ 贴在 AI 指令前，或配置到组件库
阶段三：自动校验（Verify）
 ↓ CI 跑校验，拦截语义漂移
```

---

## 三、阶段一：获取契约资产

### 3.1 契约资产在哪里

```
contracts/
├── ERR-001.yaml          # 错误状态语义契约（源文件）
├── ACT-001.yaml          # 高危操作语义契约（源文件）
├── PRO-001.yaml          # 过程状态语义契约（源文件）
├── BND-001.yaml          # 边界动作语义契约（源文件）
├── ALR-001.yaml          # 告警文案语义契约（源文件）
└── prompt-prefixes/      # 编译输出：Prompt 前缀
    ├── ERR-001.md
    ├── ACT-001.md
    └── ...
```

> **注意**：`prompt-prefixes/` 目录下的 `.md` 文件由 `scripts/compile-contract.js` 自动生成。如果目录为空，说明尚未运行编译脚本。你可以：
> 1. 直接运行 `node scripts/compile-contract.js` 生成
> 2. 或直接从 `contracts/*.yaml` 中手动提取关键约束

### 3.2 三种消费方式

| 消费方式 | 适用场景 | 文件位置 | 更新频率 |
|---------|---------|---------|---------|
| **Prompt 前缀** | 用 Claude Code / Cursor / v0 生成组件时 | `contracts/prompt-prefixes/*.md` | 每次契约变更后重编译 |
| **JSON Schema** | 校验组件 Props 是否符合语义约束 | `contracts/json-schemas/*.json`（编译生成） | 每次契约变更后重编译 |
| **ESLint 规则** | 代码静态检查，拦截语义违规 | `contracts/eslint-rules/*.js`（编译生成） | 每次契约变更后重编译 |

---

## 四、阶段二：注入约束

### 4.1 方式 A：Prompt 前缀（推荐，AI 生成场景）

**步骤 1：复制 Prompt 前缀**

打开 `contracts/prompt-prefixes/ERR-001.md`，复制全部内容。如果文件不存在，先从 `contracts/ERR-001.yaml` 中提取关键约束：

```yaml
# 从 ERR-001.yaml 提取的关键约束（示例）
## 绝对不能碰的红线
1. 禁止把多种错误做成同一种颜色
2. 禁止仅显示'出错了'等模糊文案
3. 禁止不提供用户下一步行动

## 颜色背后的意思
- fatal: status.critical（红色脉冲）→ 刷新页面 / 导出历史
- transient: status.neutral（灰色加载）→ 等待自动恢复
- retryable: status.warning（黄色提示）→ 等待倒计时 / 升级套餐
- degraded: status.info（蓝色提示）→ 继续生成 / 简化重试

## 用户行动指引
- fatal: 刷新页面 / 导出历史
- transient: 等待自动恢复 / 手动重试
- retryable: 等待倒计时 / 升级套餐
- degraded: 继续生成 / 简化问题重试
```

**步骤 2：贴在 AI 指令前面**

在使用 Claude Code / Cursor / v0 生成错误状态组件时，把 Prompt 前缀贴在指令最前面：

```markdown
【粘贴 Prompt 前缀】

请帮我生成一个 React 错误状态组件，用于展示流式输出中断的场景。
```

**效果**：AI 生成代码时，会自动遵守"fatal 用红色脉冲、必须提供刷新按钮、禁止只说'出错了'"等约束。

### 4.2 方式 B：JSON Schema（组件 Props 校验）

**步骤 1：获取 JSON Schema**

运行编译脚本生成，或从契约中手动构建：

```bash
node scripts/compile-contract.js
```

生成后的 `contracts/json-schemas/ERR-001.json` 示例结构：

```json
{
  "$id": "https://semantic-pipeline.dev/schemas/ERR-001.json",
  "title": "错误状态语义约束",
  "type": "object",
  "properties": {
    "intent_id": { "const": "ERR-001" },
    "semantic_domain": { "enum": ["observational"] },
    "semantic_tokens": {
      "type": "object",
      "properties": {
        "fatal": {
          "properties": {
            "visual_mapping": {
              "properties": {
                "color_token": { "enum": ["status.critical"] },
                "motion_token": { "enum": ["pulse.red.urgent"] }
              }
            }
          }
        }
      }
    }
  }
}
```

**步骤 2：接入组件库**

在 React/Vue 组件库中，用 JSON Schema 校验传入的 Props：

```javascript
// utils/semantic-validator.js
import Ajv from "ajv";
import err001Schema from "semantic-pipeline/contracts/json-schemas/ERR-001.json";

const ajv = new Ajv();

export function validateErrorProps(props) {
  const validate = ajv.compile(err001Schema);
  const valid = validate(props);
  if (!valid) {
    console.error("语义约束违规:", validate.errors);
    // 开发环境报错，生产环境可降级为警告
  }
  return valid;
}
```

```jsx
// components/ErrorAlert.jsx
import { validateErrorProps } from "../utils/semantic-validator";

export function ErrorAlert({ severity, colorToken, actions }) {
  // 运行时校验
  validateErrorProps({
    intent_id: "ERR-001",
    semantic_tokens: {
      [severity]: {
        visual_mapping: { color_token: colorToken },
        user_action: actions,
      },
    },
  });

  return <Alert type={severity} actions={actions} />;
}
```

### 4.3 方式 C：ESLint 规则（代码静态检查）

**步骤 1：获取 ESLint 规则**

编译生成后的 `contracts/eslint-rules/ERR-001.js` 示例：

```javascript
/**
 * ESLint 规则：错误状态语义约束
 * 自动生成于 2026-07-04
 */

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "错误状态语义约束检查",
      category: "Semantic Rules",
      recommended: true,
    },
  },
  create(context) {
    return {
      JSXElement(node) {
        const name = node.openingElement.name.name;
        if (name !== "Alert") return;

        const props = {};
        node.openingElement.attributes.forEach((attr) => {
          if (attr.type === "JSXAttribute") {
            props[attr.name.name] = attr.value?.value;
          }
        });

        // 检查：fatal 错误必须使用 status.critical
        if (props.severity === "fatal" && props.colorToken !== "status.critical") {
          context.report({
            node,
            message: "'fatal' 必须使用颜色令牌 status.critical",
          });
        }
      },
    };
  },
};
```

**步骤 2：配置 ESLint**

```javascript
// .eslintrc.js
module.exports = {
  plugins: ["semantic-pipeline"],
  rules: {
    "semantic-pipeline/error-severity": "error",
    "semantic-pipeline/destructive-action": "error",
  },
};
```

**步骤 3：IDE 实时拦截**

配置完成后，前端在写代码时就会看到：

```jsx
// ❌ ESLint 报错：'fatal' 必须使用颜色令牌 status.critical
<Alert severity="fatal" colorToken="status.info" />

// ✅ 通过
<Alert severity="fatal" colorToken="status.critical" />
```

---

## 五、阶段三：CI 自动校验

### 5.1 接入 YAML 结构校验

在 `.github/workflows/ci.yml` 中添加：

```yaml
name: Semantic Validation

on:
  push:
    paths:
      - "contracts/**"
      - "src/components/**"

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm ci
      - run: node scripts/validate-yaml.js
      - run: node scripts/compile-contract.js
      - run: npm run lint -- --rulesdir contracts/eslint-rules
```

### 5.2 契约变更自动通知

当设计师修改 `contracts/ERR-001.yaml` 时，GitHub Actions 自动：
1. 校验 YAML 结构是否完整
2. 重新编译 Prompt 前缀 / JSON Schema / ESLint 规则
3. 运行测试用例
4. 如果通过，自动更新下游资产

---

## 六、与设计师的协作边界

| 场景 | 你的回应 |
|------|---------|
| 设计师说"这个按钮颜色不对" | "请更新 `contracts/ACT-001.yaml` 中的 color_token，我这边会自动同步" |
| 设计师说"帮我写个 CSS 样式" | "我不写视觉样式，但我可以帮你确认这个按钮的语义约束是否生效" |
| 设计师说"规范更新了" | "把 YAML 提 PR，合并后 CI 会自动重编译，我拉取最新 Prompt 前缀即可" |
| 你发现 AI 生成的文案不对 | "截图 + 记录触发场景，提交 Issue 给设计师，由设计师更新契约" |

**关键原则**：前端不改 YAML，只消费 YAML；语义问题反馈给设计师，由设计师更新契约。

---

## 七、常见问题

### Q：Prompt 前缀会影响 AI 的创造力吗？

**A**：不会。Prompt 前缀只约束"语义边界"（什么不能说、什么不能做），不约束"视觉形态"（长什么样、用什么组件）。AI 仍然可以自由发挥组件的具体实现方式。

### Q：JSON Schema 校验会影响运行时性能吗？

**A**：建议只在**开发环境**和**CI 阶段**启用完整校验，生产环境可移除或使用简化版校验。Schema 校验本身开销很小（毫秒级），但如果组件渲染频繁，建议用构建时静态检查替代运行时检查。

### Q：设计师还没写契约，我怎么提前接入？

**A**：先让设计师按照《设计师使用指南》走完阶段一（诊断）和阶段二（写契约）。如果业务紧急，你可以：
1. 从 `examples/*.yaml` 复制模板
2. 让设计师填空
3. 提交到 `contracts/`，跑 `validate-yaml.js` 通过后即可使用

### Q：契约库里的规则和我的设计系统冲突怎么办？

**A**：契约库定义的是"语义规则"（什么场景下用什么语义），设计系统定义的是"视觉规则"（这个语义用什么颜色）。两者是上下层关系：

```
契约库：fatal → status.critical（语义层）
设计系统：status.critical → #EF4444（视觉层）
```

如果冲突，优先以设计系统的视觉映射为准，但**语义约束不能改**（fatal 必须是 critical 级别，不能降级为 warning）。

### Q：多久同步一次契约？

**A**：
- **自动**：每次 `git pull` 后，如果 `contracts/` 有变更，CI 会自动重编译
- **手动**：如果你需要立即使用最新契约，运行 `node scripts/compile-contract.js`

---

## 八、快速开始（今天就能做）

1. **Clone 仓库**：`git clone https://github.com/2436041978-ops/semantic-pipeline.git`
2. **安装依赖**：`npm install`（如果已有 `package.json`，否则先让 DesignOps 添加）
3. **运行编译**：`node scripts/compile-contract.js`
4. **复制 Prompt 前缀**：打开 `contracts/prompt-prefixes/ERR-001.md`，复制到 Claude Code / Cursor
5. **生成组件**：在 AI 指令前粘贴 Prompt 前缀，观察生成结果是否符合语义约束
6. **接入校验**：把 `contracts/json-schemas/ERR-001.json` 导入你的组件库，跑一遍 Props 校验

---

## 九、相关链接

- [模式库（在线浏览）](https://2436041978-ops.github.io/semantic-pipeline/)
- [契约库（Git 仓库）](https://github.com/2436041978-ops/semantic-pipeline/tree/main/contracts)
- [设计师使用指南](./DESIGNER-GUIDE.md)
- [DesignOps 规范同步指南](./DESIGNOPS-GUIDE.md)
- [技术设计方案](./technical-design.md)

---

> **最后一句**：你不是在写语义规则，你是在消费语义规则。规则写好了，AI 生成代码时自动遵守；规则没写好，你修语义 bug 的时间占 30%——而有了这套体系，可以降到 5%。
