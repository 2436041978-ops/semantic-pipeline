#!/usr/bin/env node
/**
 * compile-contract.js
 * 契约编译器：将 YAML 语义契约编译为下游可消费格式
 * 
 * 输入：contracts/*.yaml
 * 输出：
 *   - contracts/prompt-prefixes/*.md    (Prompt 前缀，供 Claude Code / Cursor)
 *   - contracts/json-schema/*.json      (JSON Schema，供校验)
 *   - contracts/eslint-rules/*.js       (ESLint 规则，供前端)
 *   - contracts/checklists/*.md         (走查清单，供 DesignOps)
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT = process.cwd();
const CONTRACTS_DIR = path.join(ROOT, 'contracts');
const OUTPUT_DIR = {
  prompt: path.join(CONTRACTS_DIR, 'prompt-prefixes'),
  schema: path.join(CONTRACTS_DIR, 'json-schema'),
  eslint: path.join(CONTRACTS_DIR, 'eslint-rules'),
  checklist: path.join(CONTRACTS_DIR, 'checklists'),
};

// 确保输出目录存在
Object.values(OUTPUT_DIR).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * 读取所有 YAML 契约文件
 */
function loadContracts() {
  const files = fs.readdirSync(CONTRACTS_DIR)
    .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
    .filter(f => !f.startsWith('_')); // 忽略内部文件

  return files.map(file => {
    const content = fs.readFileSync(path.join(CONTRACTS_DIR, file), 'utf8');
    const data = yaml.load(content);
    return {
      id: data.intent_id || path.basename(file, path.extname(file)),
      file: file,
      data: data,
    };
  });
}

/**
 * 编译为 Prompt 前缀（供 AI 编程助手使用）
 */
function compilePromptPrefix(contract) {
  const { data, id } = contract;
  const domain = data.semantic_domain || 'general';
  const desc = data.description || '';
  const boundaries = data.immutable_boundaries || [];
  const tokens = data.semantic_tokens || {};

  let prompt = `# 语义约束：${id}
# 场景：${desc}
# 来源：contracts/${contract.file}
# 生成时间：${new Date().toISOString()}

## 绝对不能碰的红线
`;

  boundaries.forEach((b, i) => {
    prompt += `${i + 1}. ${b.rule || b.description || '未定义规则'}
`;
    if (b.violation_action) {
      prompt += `   违规处理：${b.violation_action}
`;
    }
  });

  prompt += `
## 语义令牌映射
`;
  Object.entries(tokens).forEach(([key, value]) => {
    prompt += `- ${key}：`;
    if (value.visual_mapping) {
      const vm = value.visual_mapping;
      const parts = [];
      if (vm.color_token) parts.push(`颜色=${vm.color_token}`);
      if (vm.button_style) parts.push(`按钮样式=${vm.button_style}`);
      if (vm.icon_token) parts.push(`图标=${vm.icon_token}`);
      prompt += parts.join('，');
    }
    if (value.llm_constraints) {
      prompt += `
  约束：${value.llm_constraints.join('；')}`;
    }
    prompt += `
`;
  });

  prompt += `
## 用户行动指引
`;
  Object.entries(tokens).forEach(([key, value]) => {
    if (value.user_action) {
      prompt += `- ${key}：${value.user_action.map(a => 
        typeof a === 'string' ? a : a.label
      ).join(' / ')}
`;
    }
  });

  prompt += `
---
`;
  prompt += `⚠️ 重要：以上约束必须严格遵守。如有冲突，以本文件为准。
`;

  return prompt;
}

/**
 * 编译为 JSON Schema（供校验使用）
 */
function compileJsonSchema(contract) {
  const { data, id } = contract;
  const tokens = data.semantic_tokens || {};

  const schema = {
    $id: `https://semantic-pipeline.io/schema/${id}.json`,
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: `${id} 语义约束 Schema`,
    description: data.description || '',
    type: 'object',
    properties: {},
    required: [],
  };

  Object.entries(tokens).forEach(([key, value]) => {
    schema.properties[key] = {
      type: 'object',
      properties: {
        visual_mapping: {
          type: 'object',
          properties: {
            color_token: { type: 'string' },
            button_style: { type: 'string' },
            icon_token: { type: 'string' },
            motion_token: { type: 'string' },
          },
        },
        user_action: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              action: { type: 'string' },
              priority: { type: 'number' },
            },
            required: ['label', 'action'],
          },
        },
        llm_constraints: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['visual_mapping'],
    };
    schema.required.push(key);
  });

  return JSON.stringify(schema, null, 2);
}

/**
 * 编译为 ESLint 规则（供前端消费）
 */
function compileEslintRule(contract) {
  const { data, id } = contract;
  const tokens = data.semantic_tokens || {};
  const boundaries = data.immutable_boundaries || [];

  const rules = [];

  // 从 immutable_boundaries 生成规则
  boundaries.forEach(b => {
    if (b.rule && b.rule.includes('禁止')) {
      const match = b.rule.match(/禁止(.+)/);
      if (match) {
        rules.push({
          type: 'forbidden',
          message: b.rule,
          action: b.violation_action || 'warn',
        });
      }
    }
  });

  // 从 semantic_tokens 生成规则
  Object.entries(tokens).forEach(([key, value]) => {
    if (value.visual_mapping) {
      const vm = value.visual_mapping;
      if (vm.color_token) {
        rules.push({
          type: 'required-color',
          token: key,
          color: vm.color_token,
          message: `${key} 必须使用 ${vm.color_token} 颜色`,
        });
      }
      if (vm.button_style) {
        rules.push({
          type: 'required-style',
          token: key,
          style: vm.button_style,
          message: `${key} 必须使用 ${vm.button_style} 样式`,
        });
      }
    }
    if (value.llm_constraints) {
      value.llm_constraints.forEach(c => {
        rules.push({
          type: 'semantic-constraint',
          token: key,
          constraint: c,
          message: c,
        });
      });
    }
  });

  const ruleContent = `// ${id} ESLint 规则
// 来源：contracts/${contract.file}
// 生成时间：${new Date().toISOString()}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: '${data.description || id} 语义约束',
      category: 'Semantic',
      recommended: true,
    },
    schema: [],
    messages: {
${rules.map((r, i) => `      ${id.replace(/-/g, '_')}_${i}: '${r.message}',`).join('
')}
    },
  },
  create(context) {
    return {
      // 语义约束检测逻辑
      JSXOpeningElement(node) {
        const name = node.name.name;
        ${rules.filter(r => r.type === 'forbidden').map((r, i) => `
        // ${r.message}
        if (name === 'Button' && /* 检测 ${r.message} */) {
          context.report({
            node,
            messageId: '${id.replace(/-/g, '_')}_${i}',
          });
        }`).join('
')}
      },
    };
  },
};
`;

  return ruleContent;
}

/**
 * 编译为走查清单（供 DesignOps 使用）
 */
function compileChecklist(contract) {
  const { data, id } = contract;
  const tokens = data.semantic_tokens || {};
  const boundaries = data.immutable_boundaries || [];

  let checklist = `# ${id} 走查清单

`;
  checklist += `> 场景：${data.description || '未定义'}
`;
  checklist += `> 来源：contracts/${contract.file}

`;

  checklist += `## 一、红线检查（不可突破）

`;
  boundaries.forEach((b, i) => {
    checklist += `- [ ] ${i + 1}. ${b.rule || b.description || '未定义'}
`;
    if (b.violation_action) {
      checklist += `  - 违规处理：${b.violation_action}
`;
    }
  });

  checklist += `
## 二、语义令牌检查

`;
  Object.entries(tokens).forEach(([key, value]) => {
    checklist += `### ${key}

`;
    if (value.visual_mapping) {
      const vm = value.visual_mapping;
      checklist += `- [ ] 颜色：${vm.color_token || '未定义'}
`;
      if (vm.button_style) checklist += `- [ ] 按钮样式：${vm.button_style}
`;
      if (vm.icon_token) checklist += `- [ ] 图标：${vm.icon_token}
`;
    }
    if (value.llm_constraints) {
      checklist += `- [ ] 约束检查：
`;
      value.llm_constraints.forEach(c => {
        checklist += `  - [ ] ${c}
`;
      });
    }
    if (value.user_action) {
      checklist += `- [ ] 用户行动：
`;
      value.user_action.forEach(a => {
        const label = typeof a === 'string' ? a : a.label;
        checklist += `  - [ ] ${label}
`;
      });
    }
    checklist += `
`;
  });

  checklist += `## 三、验证结果

`;
  checklist += `- [ ] 单元测试通过
`;
  checklist += `- [ ] 集成测试通过
`;
  checklist += `- [ ] 回归测试通过
`;
  checklist += `- [ ] 走查人签名：________
`;
  checklist += `- [ ] 走查日期：________
`;

  return checklist;
}

/**
 * 主函数：编译所有契约
 */
function compileAll() {
  console.log('🔧 开始编译语义契约...\n');

  const contracts = loadContracts();
  console.log(`📄 发现 ${contracts.length} 个契约文件\n`);

  let totalPrompts = 0;
  let totalSchemas = 0;
  let totalEslint = 0;
  let totalChecklists = 0;

  contracts.forEach(contract => {
    const { id } = contract;
    console.log(`  编译 ${id}...`);

    // 1. Prompt 前缀
    const prompt = compilePromptPrefix(contract);
    fs.writeFileSync(
      path.join(OUTPUT_DIR.prompt, `${id}.md`),
      prompt
    );
    totalPrompts++;

    // 2. JSON Schema
    const schema = compileJsonSchema(contract);
    fs.writeFileSync(
      path.join(OUTPUT_DIR.schema, `${id}.json`),
      schema
    );
    totalSchemas++;

    // 3. ESLint 规则
    const eslint = compileEslintRule(contract);
    fs.writeFileSync(
      path.join(OUTPUT_DIR.eslint, `${id}.js`),
      eslint
    );
    totalEslint++;

    // 4. 走查清单
    const checklist = compileChecklist(contract);
    fs.writeFileSync(
      path.join(OUTPUT_DIR.checklist, `${id}.md`),
      checklist
    );
    totalChecklists++;
  });

  console.log('\n✅ 编译完成！');
  console.log(`   Prompt 前缀：${totalPrompts} 个`);
  console.log(`   JSON Schema：${totalSchemas} 个`);
  console.log(`   ESLint 规则：${totalEslint} 个`);
  console.log(`   走查清单：${totalChecklists} 个`);
  console.log(`\n📁 输出目录：contracts/prompt-prefixes/`);
  console.log(`              contracts/json-schema/`);
  console.log(`              contracts/eslint-rules/`);
  console.log(`              contracts/checklists/`);
}

// 运行
compileAll();
