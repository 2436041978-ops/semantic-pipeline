# scripts/validate-yaml.js

> YAML 结构校验脚本 —— 检查契约文件的 6 字段完整性

## 功能

遍历 `contracts/` 目录下所有 `.yaml` 文件，校验每个契约是否包含完整的 6 个标准字段，并输出校验报告。

## 用法

```bash
node scripts/validate-yaml.js
```

## 校验规则

| 字段 | 必填 | 格式要求 | 错误提示 |
|------|------|---------|---------|
| `intent_id` | ✅ | 大写 ID，如 `ERR-001` | 缺少唯一标识 |
| `semantic_domain` | ✅ | 枚举值：`transactional` / `observational` / `informational` | 语义域未定义 |
| `description` | ✅ | 一句话人话，≤ 80 字 | 描述缺失或过长 |
| `immutable_boundaries` | ✅ | 数组，≥ 3 条红线 | 红线不足 3 条 |
| `semantic_tokens` | ✅ | 对象，包含 `visual_mapping` + `llm_constraints` | 语义令牌缺失 |
| `applicable_products` | ✅ | 数组，≥ 1 个产品名 | 未指定适用产品 |

## 输出示例

```
✅ contracts/ERR-001.yaml    — 通过（6/6 字段完整）
✅ contracts/ACT-001.yaml    — 通过（6/6 字段完整）
❌ contracts/PRO-001.yaml    — 失败
   └─ immutable_boundaries: 仅 2 条红线，需 ≥ 3 条
✅ contracts/BND-001.yaml    — 通过（6/6 字段完整）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
校验结果：4 个文件，3 通过，1 失败
```

## 集成到 CI

在 `.github/workflows/ci.yml` 中添加：

```yaml
- name: Validate YAML Contracts
  run: node scripts/validate-yaml.js
```

## 依赖

- `js-yaml`：解析 YAML
- `glob`：遍历文件

```bash
npm install js-yaml glob --save-dev
```

## 脚本源码（骨架）

```javascript
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const glob = require('glob');

const REQUIRED_FIELDS = [
  'intent_id',
  'semantic_domain',
  'description',
  'immutable_boundaries',
  'semantic_tokens',
  'applicable_products'
];

function validateContract(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const doc = yaml.load(content);
  const errors = [];

  for (const field of REQUIRED_FIELDS) {
    if (!doc[field]) {
      errors.push(`缺少必填字段: ${field}`);
    }
  }

  if (doc.immutable_boundaries && doc.immutable_boundaries.length < 3) {
    errors.push(`immutable_boundaries 仅 ${doc.immutable_boundaries.length} 条，需 ≥ 3 条`);
  }

  if (doc.description && doc.description.length > 80) {
    errors.push(`description 过长: ${doc.description.length} 字，需 ≤ 80 字`);
  }

  return { file: path.basename(filePath), valid: errors.length === 0, errors };
}

function main() {
  const files = glob.sync('contracts/**/*.yaml');
  let pass = 0, fail = 0;

  for (const file of files) {
    const result = validateContract(file);
    if (result.valid) {
      console.log(`✅ ${result.file} — 通过`);
      pass++;
    } else {
      console.log(`❌ ${result.file} — 失败`);
      result.errors.forEach(e => console.log(`   └─ ${e}`));
      fail++;
    }
  }

  console.log(`\n${'━'.repeat(40)}`);
  console.log(`校验结果: ${files.length} 个文件，${pass} 通过，${fail} 失败`);
  process.exit(fail > 0 ? 1 : 0);
}

main();
```
