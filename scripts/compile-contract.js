#!/usr/bin/env node
/**
 * 契约编译脚本
 * 将 YAML 语义契约编译为下游可消费的格式
 * 
 * 输入：contracts/*.yaml
 * 输出：
 *   - contracts/prompt-prefixes/*.md    (Prompt 前缀)
 *   - contracts/json-schemas/*.json     (JSON Schema)
 *   - contracts/eslint-rules/*.js       (ESLint 规则)
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const CONTRACTS_DIR = path.join(__dirname, '..', 'contracts');
const OUTPUT_DIRS = {
  prompt: path.join(CONTRACTS_DIR, 'prompt-prefixes'),
  schema: path.join(CONTRACTS_DIR, 'json-schemas'),
  eslint: path.join(CONTRACTS_DIR, 'eslint-rules')
};

// 确保输出目录存在
Object.values(OUTPUT_DIRS).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * 编译单个 YAML 契约为三种格式
 */
function compileContract(yamlPath) {
  const basename = path.basename(yamlPath, '.yaml');
  const content = fs.readFileSync(yamlPath, 'utf8');
  const contract = yaml.load(content);

  console.log(`\n📄 编译: ${basename}.yaml`);

  // 1. 生成 Prompt 前缀
  const promptPrefix = generatePromptPrefix(contract, basename);
  fs.writeFileSync(
    path.join(OUTPUT_DIRS.prompt, `${basename}.md`),
    promptPrefix
  );
  console.log(`   ✅ Prompt 前缀: prompt-prefixes/${basename}.md`);

  // 2. 生成 JSON Schema
  const jsonSchema = generateJsonSchema(contract, basename);
  fs.writeFileSync(
    path.join(OUTPUT_DIRS.schema, `${basename}.json`),
    JSON.stringify(jsonSchema, null, 2)
  );
  console.log(`   ✅ JSON Schema: json-schemas/${basename}.json`);

  // 3. 生成 ESLint 规则
  const eslintRule = generateEslintRule(contract, basename);
  fs.writeFileSync(
    path.join(OUTPUT_DIRS.eslint, `${basename}.js`),
    eslintRule
  );
  console.log(`   ✅ ESLint 规则: eslint-rules/${basename}.js`);
}

/**
 * 生成 Prompt 前缀（给 Claude Code / Cursor 用）
 */
function generatePromptPrefix(contract, basename) {
  const domain = contract.semantic_domain || 'general';
  const boundaries = contract.immutable_boundaries || [];
  const tokens = contract.semantic_tokens || {};

  let prompt = `# 语义约束：${contract.description || basename}
# 来源：contracts/${basename}.yaml
# 生成时间：${new Date().toISOString()}

## 适用场景
${domain}

## 绝对不能碰的红线
`;

  boundaries.forEach((b, i) => {
    prompt += `${i + 1}. ${b.rule || b.constraint_rule_ref || '未定义规则'}\n`;
    if (b.violation_action) {
      prompt += `   违规处理：${b.violation_action}\n`;
    }
  });

  prompt += `\n## 颜色背后的意思（Semantic Token）\n`;

  Object.entries(tokens).forEach(([key, token]) => {
    if (token.visual_mapping) {
      prompt += `- ${key}: ${token.description || ''}\n`;
      prompt += `  颜色: ${token.visual_mapping.color_token || '未定义'}\n`;
      if (token.visual_mapping.button_style) {
        prompt += `  按钮样式: ${token.visual_mapping.button_style}\n`;
      }
    }
    if (token.llm_constraints) {
      prompt += `  约束:\n`;
      token.llm_constraints.forEach(c => {
        prompt += `    - ${c}\n`;
      });
    }
  });

  prompt += `\n## 用户行动指引\n`;

  Object.entries(tokens).forEach(([key, token]) => {
    if (token.user_action) {
      prompt += `- ${key}: ${token.user_action.map(a => 
        typeof a === 'string' ? a : a.label
      ).join(' / ')}\n`;
    }
  });

  prompt += `\n---\n`;
  prompt += `⚠️ 重要：在生成任何涉及上述场景的界面时，必须遵守以上约束。\n`;
  prompt += `如有冲突，优先执行 immutable_boundaries 中的红线规则。\n`;

  return prompt;
}

/**
 * 生成 JSON Schema（给校验工具用）
 */
function generateJsonSchema(contract, basename) {
  const tokens = contract.semantic_tokens || {};
  const properties = {};
  const required = [];

  Object.entries(tokens).forEach(([key, token]) => {
    const prop = {
      type: 'object',
      description: token.description || '',
      properties: {}
    };

    if (token.visual_mapping) {
      prop.properties.visual_mapping = {
        type: 'object',
        properties: {
          color_token: { type: 'string' },
          motion_token: { type: 'string' },
          icon_token: { type: 'string' },
          button_style: { type: 'string' }
        }
      };
    }

    if (token.llm_constraints) {
      prop.properties.llm_constraints = {
        type: 'array',
        items: { type: 'string' },
        enum: token.llm_constraints
      };
    }

    if (token.user_action) {
      prop.properties.user_action = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string' },
            action: { type: 'string' },
            priority: { type: 'number' }
          }
        }
      };
    }

    properties[key] = prop;
    required.push(key);
  });

  return {
    $id: `https://semantic-pipeline.dev/schemas/${basename}.json`,
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: contract.description || basename,
    type: 'object',
    properties: {
      intent_id: { type: 'string', const: contract.intent_id || basename },
      semantic_domain: { type: 'string' },
      semantic_tokens: {
        type: 'object',
        properties,
        required
      }
    },
    required: ['intent_id', 'semantic_domain', 'semantic_tokens']
  };
}

/**
 * 生成 ESLint 规则（给前端代码检查用）
 */
function generateEslintRule(contract, basename) {
  const tokens = contract.semantic_tokens || {};
  const checks = [];

  Object.entries(tokens).forEach(([key, token]) => {
    if (token.visual_mapping) {
      const vm = token.visual_mapping;
      if (vm.color_token) {
        checks.push(`
      // 检查 ${key} 的颜色令牌
      if (props.colorToken === '${vm.color_token}') {
        context.report({
          node,
          message: '\'${key}\' 必须使用颜色令牌 ${vm.color_token}'
        });
      }`);
      }
      if (vm.button_style) {
        checks.push(`
      // 检查 ${key} 的按钮样式
      if (props.variant !== '${vm.button_style}') {
        context.report({
          node,
          message: '\'${key}\' 必须使用按钮样式 ${vm.button_style}'
        });
      }`);
      }
    }
  });

  return `/**
 * ESLint 规则：${contract.description || basename}
 * 自动生成于 ${new Date().toISOString()}
 * 来源：contracts/${basename}.yaml
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: '${contract.description || basename} 的语义约束检查',
      category: 'Semantic Rules',
      recommended: true
    },
    schema: []
  },
  create(context) {
    return {
      JSXElement(node) {
        const name = node.openingElement.name.name;
        if (!['Button', 'Alert', 'Modal', 'Dialog'].includes(name)) {
          return;
        }

        const props = {};
        node.openingElement.attributes.forEach(attr => {
          if (attr.type === 'JSXAttribute' && attr.value) {
            props[attr.name.name] = attr.value.value || attr.value.expression?.value;
          }
        });

        ${checks.join('\n')}
      }
    };
  }
};
`;
}

/**
 * 主入口：编译所有契约
 */
function main() {
  console.log('🔧 Semantic Pipeline 契约编译器');
  console.log('================================');

  const yamlFiles = fs.readdirSync(CONTRACTS_DIR)
    .filter(f => f.endsWith('.yaml') && !f.startsWith('_'));

  if (yamlFiles.length === 0) {
    console.log('⚠️ 未找到 YAML 契约文件');
    process.exit(0);
  }

  yamlFiles.forEach(file => {
    compileContract(path.join(CONTRACTS_DIR, file));
  });

  console.log('\n✅ 全部编译完成');
  console.log(`\n输出目录：`);
  console.log(`  - ${OUTPUT_DIRS.prompt}`);
  console.log(`  - ${OUTPUT_DIRS.schema}`);
  console.log(`  - ${OUTPUT_DIRS.eslint}`);
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { compileContract, generatePromptPrefix, generateJsonSchema, generateEslintRule };
