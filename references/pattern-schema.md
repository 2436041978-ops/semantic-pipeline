# 模式卡片 Schema 规范

> **版本**：v1.0.0  
> **作用**：定义模式库（Pattern Library）中每张模式卡片的结构标准，确保诊断症状 → 定位根因 → 关联契约 → 验证方法的全链路可追溯。  
> **给谁看**：维护模式库的设计师、消费模式卡片的前端/AI 工具、以及验证工具集的开发者。

---

## 一、模式卡片是什么

模式卡片是"语义断层模式库"的最小单元。它记录了一个**可复用的语义断层模式**：

- **不是**某个产品的 Bug 报告
- **不是**某个组件的设计稿
- **是**一类组件在概率性界面时代共同面临的语义断层规律

一张模式卡片 = 症状证据 + 根因分析 + 契约链接 + 验证方法。

---

## 二、模式卡片 JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://semantic-pipeline.io/schemas/pattern-card-v1.json",
  "title": "Semantic Fault Pattern Card",
  "description": "Schema-As-Code 模式库卡片标准格式",
  "type": "object",
  "required": [
    "pattern_id",
    "version",
    "component_type",
    "fault_name",
    "symptom",
    "root_cause",
    "semantic_token_missing",
    "product_evidence",
    "linked_contract",
    "validation_method"
  ],
  "properties": {
    "pattern_id": {
      "type": "string",
      "description": "模式唯一标识符，格式：{类型缩写}-{3位数字}",
      "pattern": "^(ERR|PRO|BND|ACT|ALR|FRM)-\d{3}$",
      "examples": ["ERR-001", "ACT-001", "PRO-001"]
    },
    "version": {
      "type": "string",
      "description": "模式卡片版本号，遵循 SemVer",
      "pattern": "^\d+\.\d+\.\d+$",
      "default": "1.0.0"
    },
    "status": {
      "type": "string",
      "enum": ["draft", "reviewing", "published", "deprecated"],
      "description": "卡片状态",
      "default": "draft"
    },
    "component_type": {
      "type": "string",
      "enum": [
        "Error",
        "Process",
        "Boundary",
        "Action",
        "Alert",
        "Form"
      ],
      "description": "组件类型，决定模式归类"
    },
    "fault_name": {
      "type": "string",
      "description": "断层名称，一句话概括，不超过 20 个汉字",
      "maxLength": 40,
      "examples": [
        "错误状态后果差异未分级",
        "高危操作风险未约束",
        "过程状态认知阶段未显化"
      ]
    },
    "symptom": {
      "type": "object",
      "description": "症状描述：用户看到了什么、感受到了什么",
      "required": ["description", "user_confusion", "visual_manifestation"],
      "properties": {
        "description": {
          "type": "string",
          "description": "症状一句话描述，人话"
        },
        "user_confusion": {
          "type": "string",
          "description": "用户的核心困惑，用第一人称表述"
        },
        "visual_manifestation": {
          "type": "array",
          "items": { "type": "string" },
          "description": "视觉表现清单，如 ['全部红色', '文案模糊', '缺少行动按钮']"
        }
      }
    },
    "root_cause": {
      "type": "object",
      "description": "根因分析：系统层面缺少了什么",
      "required": ["description", "semantic_token_missing", "why_happens"],
      "properties": {
        "description": {
          "type": "string",
          "description": "根因一句话，说明缺少什么语义令牌"
        },
        "semantic_token_missing": {
          "type": "string",
          "description": "缺失的语义令牌名称，如 error_severity / destructive_action / process_phase"
        },
        "why_happens": {
          "type": "string",
          "description": "为什么会发生：概率性生成的内禀属性 + 系统未定义约束"
        }
      }
    },
    "product_evidence": {
      "type": "array",
      "description": "产品实例证据：至少 3 个产品的截图或行为记录",
      "minItems": 3,
      "items": {
        "type": "object",
        "required": ["product_name", "evidence_type", "description"],
        "properties": {
          "product_name": {
            "type": "string",
            "description": "产品名称，如 ChatGPT / 文心一言 / Perplexity"
          },
          "evidence_type": {
            "type": "string",
            "enum": ["screenshot", "video", "user_complaint", "behavior_log"],
            "description": "证据类型"
          },
          "description": {
            "type": "string",
            "description": "证据描述，如 '4 种错误状态共用红色背景'"
          },
          "file_path": {
            "type": "string",
            "description": "证据文件在仓库中的路径，如 samples/dogfood/before/chatgpt-error.png"
          },
          "source_url": {
            "type": "string",
            "format": "uri",
            "description": "来源链接（社区帖子、官方文档等）"
          }
        }
      }
    },
    "linked_contract": {
      "type": "object",
      "description": "关联契约：指向契约库中的 YAML 文件",
      "required": ["contract_id", "file_path"],
      "properties": {
        "contract_id": {
          "type": "string",
          "description": "契约 ID，通常与 pattern_id 一致"
        },
        "file_path": {
          "type": "string",
          "description": "YAML 文件路径，如 contracts/ERR-001.yaml"
        },
        "applicable_products": {
          "type": "array",
          "items": { "type": "string" },
          "description": "适用产品列表"
        }
      }
    },
    "validation_method": {
      "type": "object",
      "description": "验证方法：怎么证明这个模式被契约修复了",
      "required": ["unit_tests", "integration_tests", "regression_tests", "pass_criteria"],
      "properties": {
        "unit_tests": {
          "type": "integer",
          "description": "单元测试用例数量",
          "minimum": 1
        },
        "integration_tests": {
          "type": "integer",
          "description": "集成测试用例数量",
          "minimum": 1
        },
        "regression_tests": {
          "type": "integer",
          "description": "回归测试用例数量",
          "minimum": 1
        },
        "pass_criteria": {
          "type": "string",
          "description": "通过标准，如 '语义返工率从 30% 降到 5%'"
        },
        "ab_comparison_required": {
          "type": "boolean",
          "description": "是否需要 A/B 对比图",
          "default": true
        }
      }
    },
    "metadata": {
      "type": "object",
      "description": "元信息",
      "properties": {
        "author": { "type": "string" },
        "created_at": { "type": "string", "format": "date" },
        "updated_at": { "type": "string", "format": "date" },
        "reviewers": {
          "type": "array",
          "items": { "type": "string" }
        },
        "tags": {
          "type": "array",
          "items": { "type": "string" },
          "description": "标签，如 ['高危操作', '语义降级', '国内产品']"
        }
      }
    }
  }
}
```

---

## 三、字段填写规范

### 3.1 pattern_id：模式唯一标识

| 前缀 | 含义 | 示例 |
|------|------|------|
| `ERR-` | Error 错误状态组件 | ERR-001 |
| `PRO-` | Process 过程状态组件 | PRO-001 |
| `BND-` | Boundary 边界动作组件 | BND-001 |
| `ACT-` | Action 操作按钮组件 | ACT-001 |
| `ALR-` | Alert 告警/消息组件 | ALR-001 |
| `FRM-` | Form 表单输入组件 | FRM-001 |

**规则**：
- 前缀必须大写
- 数字必须 3 位，不足补零
- 同一组件类型内顺序递增

### 3.2 fault_name：断层名称

**要求**：
- 不超过 20 个汉字（40 个字符）
- 格式：`{组件} {断层类型} {未/被/已} {动词}`
- 示例：错误状态后果差异**未分级**、高危操作风险**未约束**、过程状态认知阶段**未显化**

**禁止**：
- ❌ "ChatGPT 的 Bug"
- ❌ "按钮颜色不对"
- ❌ "用户体验不好"

### 3.3 symptom.user_confusion：用户困惑

**要求**：用第一人称写，模拟用户看到界面时的内心独白。

**示例**：
- ✅ "这个红色是刷新一下就好，还是我的对话已经丢了？"
- ✅ "AI 现在是在查资料还是开始编答案？"
- ❌ "用户无法理解错误状态"（太抽象）

### 3.4 root_cause.semantic_token_missing：缺失的语义令牌

**要求**：必须是契约库中 `semantic_tokens` 下的顶级字段名。

**示例**：
- `error_severity`
- `destructive_action`
- `process_phase`
- `boundary_action`
- `synonym_firewall`

### 3.5 product_evidence：产品证据

**要求**：
- 至少 3 个产品实例
- 必须包含国内外产品（不能全是国外，也不能全是国内）
- 证据类型优先顺序：screenshot > user_complaint > behavior_log > video
- 每个证据必须说明"这个产品在这一点上具体怎么错的"

### 3.6 linked_contract：关联契约

**要求**：
- `contract_id` 必须与 `pattern_id` 一致（一对一关系）
- `file_path` 必须指向 `contracts/` 目录下的真实文件
- `applicable_products` 必须与 `product_evidence` 中的产品一致

### 3.7 validation_method：验证方法

**要求**：
- 单元测试用例 ≥ 3
- 集成测试用例 ≥ 1
- 回归测试用例 ≥ 2
- `pass_criteria` 必须包含可量化的指标（百分比、时间、数量）

---

## 四、与上下游的关系

```
上游输入（设计师采集）
    ├── PRD（产品需求文档）
    ├── 用户研究结论
    ├── 品牌策略文档
    ├── 竞品走查报告
    ├── 设计系统现有规范
    └── 用户投诉/工单
            ↓
    模式卡片（Pattern Card）
    ├── symptom（症状）
    ├── root_cause（根因）
    └── linked_contract（关联契约）
            ↓
下游输出（契约库 + 验证工具集）
    ├── contracts/{pattern_id}.yaml（YAML 契约）
    ├── contracts/prompt-prefixes/{pattern_id}.md（Prompt 前缀）
    └── validation/{pattern_id}/（测试用例）
```

---

## 五、完整示例：ERR-001

```json
{
  "pattern_id": "ERR-001",
  "version": "1.0.0",
  "status": "published",
  "component_type": "Error",
  "fault_name": "错误状态后果差异未分级",
  "symptom": {
    "description": "多种错误状态共用同一种红色视觉语言，用户无法判断后果严重程度",
    "user_confusion": "这个红色是刷新一下就好，还是我的对话已经丢了？",
    "visual_manifestation": [
      "全部红色",
      "文案只描述现象不指引行动",
      "没有语义分级标签"
    ]
  },
  "root_cause": {
    "description": "系统缺少 error_severity 语义令牌，前端只接收 isError=true，不接收错误性质",
    "semantic_token_missing": "error_severity",
    "why_happens": "LLM 概率性生成时，没有语义约束来区分错误级别，默认全部使用红色"
  },
  "product_evidence": [
    {
      "product_name": "ChatGPT",
      "evidence_type": "screenshot",
      "description": "4 种错误状态（Error in message stream / network error / Something went wrong / Too many requests）共用红色",
      "file_path": "samples/dogfood/before/chatgpt-error-states.png"
    },
    {
      "product_name": "文心一言",
      "evidence_type": "screenshot",
      "description": "连接断开和网络错误共用红色提示",
      "file_path": "samples/dogfood/before/wenxin-error-states.png"
    },
    {
      "product_name": "通义千问",
      "evidence_type": "screenshot",
      "description": "429 限流和流式输出中断视觉表达一致",
      "file_path": "samples/dogfood/before/tongyi-error-states.png"
    }
  ],
  "linked_contract": {
    "contract_id": "ERR-001",
    "file_path": "contracts/ERR-001.yaml",
    "applicable_products": [
      "ChatGPT",
      "文心一言",
      "通义千问",
      "Kimi",
      "豆包",
      "DeepSeek",
      "讯飞星火"
    ]
  },
  "validation_method": {
    "unit_tests": 10,
    "integration_tests": 3,
    "regression_tests": 5,
    "pass_criteria": "语义返工率从 30% 降到 5%，走查覆盖率从 20% 提升到 100%",
    "ab_comparison_required": true
  },
  "metadata": {
    "author": "体验架构设计师",
    "created_at": "2026-06-24",
    "updated_at": "2026-06-24",
    "reviewers": ["前端 TL", "DesignOps"],
    "tags": ["错误状态", "语义分级", "国内产品", "通用模式"]
  }
}
```

---

## 六、状态流转

```
draft（草稿）
    ↓ 填写完整，提交 review
reviewing（审核中）
    ↓ 审核通过
published（已发布）
    ↓ 被新模式替代
deprecated（已废弃）
```

- **draft**：可以修改任何字段
- **reviewing**：冻结 symptom 和 root_cause，只能修改 evidence 和 metadata
- **published**：只读，修改需发新版本（v1.0.1 → v1.1.0）
- **deprecated**：保留但不再推荐，指向替代模式

---

## 七、校验脚本

使用 `scripts/validate-pattern.js` 自动校验模式卡片：

```bash
node scripts/validate-pattern.js semantic-guard/patterns/ERR-001.json
```

校验项：
- [ ] pattern_id 格式正确
- [ ] 必填字段完整
- [ ] product_evidence ≥ 3 条
- [ ] linked_contract 文件存在
- [ ] validation_method 数值 ≥ 最小要求
- [ ] fault_name 不超过 20 个汉字

---

**版本历史**

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0.0 | 2026-06-24 | 初始版本，覆盖 6 种组件类型、10 个必填字段 |
