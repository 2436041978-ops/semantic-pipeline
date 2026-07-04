#!/usr/bin/env node
/**
 * Semantic Pipeline — 契约编译器
 * 将 YAML 语义契约编译为下游可消费的格式
 *
 * 输入：contracts/*.yaml 、 examples/*.yaml
 * 输出：
 *   - contracts/prompt-prefixes/*.md      (Prompt 前缀)
 *   - contracts/json-schemas/*.json       (JSON Schema)
 *   - contracts/eslint-rules/*.js         (ESLint 规则)
 *   - contracts/checklists/*.md           (设计师走查 Checklist)
 *
 * 用法：
 *   npm install js-yaml
 *   node scripts/compile-contract.js
 *   node scripts/compile-contract.js --watch
 */

const fs = require('fs');
const path = require('path');

// ─── 动态加载 js-yaml，给出友好提示 ───
let yaml;
try {
  yaml = require('js-yaml');
} catch (e) {
  console.error('❌ 缺少依赖：js-yaml');
  console.error('   请运行：npm install js-yaml --save-dev');
  console.error('   或：   yarn add js-yaml --dev');
  process.exit(1);
}

// ─── 路径配置 ───
const ROOT_DIR = path.join(__dirname, '..');
const CONTRACTS_DIR = path.join(ROOT_DIR, 'contracts');
const EXAMPLES_DIR = path.join(ROOT_DIR, 'examples');

const OUTPUT_DIRS = {
  prompt:   path.join(CONTRACTS_DIR, 'prompt-prefixes'),
  schema:   path.join(CONTRACTS_DIR, 'json-schemas'),
  eslint:   path.join(CONTRACTS_DIR, 'eslint-rules'),
  checklist: path.join(CONTRACTS_DIR, 'checklists'),
};

// 确保输出目录存在
Object.values(OUTPUT_DIRS).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 创建目录：${path.relative(ROOT_DIR, dir)}`);
  }
});

// ─── 工具函数：递归遍历 semantic_tokens ───
/**
 * 递归遍历语义令牌树，将叶子节点（含 visual_mapping / llm_constraints 等）
 * 展平为 { path: 'error_severity.fatal', token: {...} } 数组
 */
function walkTokens(tokens, callback, pathParts = []) {
  if (!tokens || typeof tokens !== 'object') return;
  for (const [key, value] of Object.entries(tokens)) {
    const currentPath = [...pathParts, key];
    if (value && typeof value === 'object') {
      const isLeaf =
        value.visual_mapping ||
        value.llm_constraints ||
        value.user_action ||
        value.description ||
        value.trigger_keywords;
      if (isLeaf) {
        callback(currentPath.join('.'), value);
      } else {
        walkTokens(value, callback, currentPath);
      }
    }
  }
}

// ─── 1. 生成 Prompt 前缀 ───
function generatePromptPrefix(contract, basename) {
  const domain = contract.semantic_domain || contract.semanticDomain || 'general';
  const boundaries = contract.immutable_boundaries || contract.immutableBoundaries || [];
  const tokens = contract.semantic_tokens || contract.semanticTokens || {};
  const description = contract.description || basename;

  let prompt = `# 语义约束：${description}
# 来源：contracts/${basename}.yaml
# 生成时间：${new Date().toISOString()}
# 契约 ID：${contract.intent_id || basename}
# 语义域：${domain}

## 绝对不能碰的红线（Immutable Boundaries）

`;

  if (boundaries.length === 0) {
    prompt += '> 暂无红线定义\n';
  } else {
    boundaries.forEach((b, i) => {
      const rule = b.rule || b.constraint_rule_ref || '未定义规则';
      const type = b.boundary_type || 'safety';
      const action = b.violation_action || 'block';
      prompt += `${i + 1}. 【${type.toUpperCase()}】${rule}\n`;
      prompt += `   违规处理：${action}\n`;
      if (b.reason) prompt += `   原因：${b.reason}\n`;
      prompt += '\n';
    });
  }

  prompt += `\n## 语义令牌映射（Semantic Tokens）\n\n`;

  const tokenList = [];
  walkTokens(tokens, (tokenPath, token) => {
    tokenList.push({ path: tokenPath, token });
  });

  if (tokenList.length === 0) {
    prompt += '> 暂无语义令牌定义\n';
  } else {
    tokenList.forEach(({ path: tokenPath, token }) => {
      prompt += `### ${tokenPath}\n`;
      if (token.description) prompt += `- 含义：${token.description}\n`;
      if (token.trigger_keywords) {
        prompt += `- 触发关键词：${token.trigger_keywords.join(' / ')}\n`;
      }
      if (token.visual_mapping) {
        const vm = token.visual_mapping;
        prompt += `- 视觉映射：\n`;
        if (vm.color_token)   prompt += `  • 颜色令牌：${vm.color_token}\n`;
        if (vm.motion_token)  prompt += `  • 动画令牌：${vm.motion_token}\n`;
        if (vm.icon_token)    prompt += `  • 图标令牌：${vm.icon_token}\n`;
        if (vm.button_style)  prompt += `  • 按钮样式：${vm.button_style}\n`;
        if (vm.background)    prompt += `  • 背景色：${vm.background}\n`;
      }
      if (token.user_action && token.user_action.length > 0) {
        prompt += `- 用户行动：\n`;
        token.user_action.forEach((a, idx) => {
          const label = typeof a === 'string' ? a : (a.label || '未命名');
          const action = typeof a === 'string' ? '' : (a.action ? ` (${a.action})` : '');
          const priority = typeof a === 'object' && a.priority ? ` [优先级${a.priority}]` : '';
          prompt += `  ${idx + 1}. ${label}${action}${priority}\n`;
        });
      }
      if (token.llm_constraints && token.llm_constraints.length > 0) {
        prompt += `- LLM 约束：\n`;
        token.llm_constraints.forEach(c => {
          prompt += `  • ${c}\n`;
        });
      }
      prompt += '\n';
    });
  }

  prompt += `---\n`;
  prompt += `⚠️ 重要：在生成任何涉及上述场景的界面时，必须遵守以上约束。\n`;
  prompt += `如有冲突，优先执行 immutable_boundaries 中的红线规则。\n`;
  prompt += `本 Prompt 前缀由 Schema-As-Code 契约编译器自动生成，请勿手动修改。\n`;

  return prompt;
}

// ─── 2. 生成 JSON Schema ───
function generateJsonSchema(contract, basename) {
  const tokens = contract.semantic_tokens || contract.semanticTokens || {};
  const properties = {};
  const required = [];

  walkTokens(tokens, (tokenPath, token) => {
    const safeKey = tokenPath.replace(/\./g, '_');
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
          button_style: { type: 'string' },
          background: { type: 'string' }
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
            priority: { type: 'number' },
            visual_weight: { type: 'string' }
          }
        }
      };
    }

    if (token.trigger_keywords) {
      prop.properties.trigger_keywords = {
        type: 'array',
        items: { type: 'string' }
      };
    }

    properties[safeKey] = prop;
    required.push(safeKey);
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
        required: required.length > 0 ? required : undefined
      }
    },
    required: ['intent_id', 'semantic_domain', 'semantic_tokens']
  };
}

// ─── 3. 生成 ESLint 规则 ───
function generateEslintRule(contract, basename) {
  const tokens = contract.semantic_tokens || contract.semanticTokens || {};
  const checks = [];
  let colorChecks = [];
  let styleChecks = [];
  let textChecks = [];

  walkTokens(tokens, (tokenPath, token) => {
    if (token.visual_mapping) {
      const vm = token.visual_mapping;
      if (vm.color_token) {
        colorChecks.push(`
    // 检查 ${tokenPath} 的颜色令牌
    if (props.colorToken === '${vm.color_token}' || props.color === '${vm.color_token}') {
      // 允许：这是语义正确的颜色令牌
    }`);
      }
      if (vm.button_style) {
        styleChecks.push(`
    // 检查 ${tokenPath} 的按钮样式
    if (name === 'Button' && props.variant !== '${vm.button_style}' && props.type !== '${vm.button_style}') {
      context.report({
        node,
        message: '${tokenPath} 必须使用按钮样式 ${vm.button_style}，当前为：' + (props.variant || props.type || 'undefined')
      });
    }`);
      }
    }
    if (token.llm_constraints) {
      token.llm_constraints.forEach(c => {
        if (c.includes('禁止') && c.includes('文案')) {
          const forbiddenText = c.replace(/禁止.*['"'](.+?)['"'].*/, '$1');
          if (forbiddenText && forbiddenText !== c) {
            textChecks.push(`
    // 检查禁止文案：${forbiddenText}
    if (props.children && typeof props.children === 'string' && props.children.includes('${forbiddenText}')) {
      context.report({
        node,
        message: '触发 LLM 约束：禁止文案 "${forbiddenText}"'
      });
    }`);
          }
        }
      });
    }
  });

  const allChecks = [...colorChecks, ...styleChecks, ...textChecks].join('\n');

  return `/**
 * ESLint 规则：${contract.description || basename}
 * 自动生成于 ${new Date().toISOString()}
 * 来源：contracts/${basename}.yaml
 * 契约 ID：${contract.intent_id || basename}
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: '${contract.description || basename} 的语义约束检查',
      category: 'Semantic Rules',
      recommended: true
    },
    schema: [],
    messages: {
      semanticViolation: '语义约束违规：{{message}}'
    }
  },
  create(context) {
    return {
      JSXElement(node) {
        const name = node.openingElement.name.name;
        if (!['Button', 'Alert', 'Modal', 'Dialog', 'Message', 'Notification'].includes(name)) {
          return;
        }

        const props = {};
        (node.openingElement.attributes || []).forEach(attr => {
          if (attr.type === 'JSXAttribute' && attr.value) {
            const val = attr.value.value || (attr.value.expression && attr.value.expression.value);
            props[attr.name.name] = val;
          }
        });

        ${allChecks || '// 暂无自动检查规则，请根据契约手动补充'}
      }
    };
  }
};
`;
}

// ─── 4. 生成 Checklist ───
function generateChecklist(contract, basename) {
  const boundaries = contract.immutable_boundaries || contract.immutableBoundaries || [];
  const tokens = contract.semantic_tokens || contract.semanticTokens || {};
  const description = contract.description || basename;

  let md = `# 走查 Checklist：${description}\n\n`;
  md += `> 契约 ID：${contract.intent_id || basename}\n`;
  md += `> 语义域：${contract.semantic_domain || 'general'}\n`;
  md += `> 适用产品：${(contract.applicable_products || []).join('、') || '通用'}\n\n`;

  md += `## 一、不可变边界检查（必须全部通过）\n\n`;
  if (boundaries.length === 0) {
    md += '- [ ] 暂无红线定义\n';
  } else {
    boundaries.forEach((b, i) => {
      const rule = b.rule || b.constraint_rule_ref || '未定义规则';
      md += `- [ ] ${rule}\n`;
    });
  }

  md += `\n## 二、语义令牌检查\n\n`;
  const tokenList = [];
  walkTokens(tokens, (tokenPath, token) => {
    tokenList.push({ path: tokenPath, token });
  });

  if (tokenList.length === 0) {
    md += '- [ ] 暂无语义令牌定义\n';
  } else {
    tokenList.forEach(({ path: tokenPath, token }) => {
      md += `### ${tokenPath}\n`;
      if (token.visual_mapping) {
        const vm = token.visual_mapping;
        if (vm.color_token) md += `- [ ] 颜色令牌使用正确：${vm.color_token}\n`;
        if (vm.icon_token) md += `- [ ] 图标令牌使用正确：${vm.icon_token}\n`;
        if (vm.motion_token) md += `- [ ] 动画令牌使用正确：${vm.motion_token}\n`;
        if (vm.button_style) md += `- [ ] 按钮样式使用正确：${vm.button_style}\n`;
      }
      if (token.user_action && token.user_action.length > 0) {
        token.user_action.forEach(a => {
          const label = typeof a === 'string' ? a : a.label;
          md += `- [ ] 用户行动可用：${label}\n`;
        });
      }
      if (token.llm_constraints) {
        token.llm_constraints.forEach(c => {
          md += `- [ ] LLM 约束满足：${c}\n`;
        });
      }
      md += '\n';
    });
  }

  md += `---\n\n**走查人**：____________  **日期**：____________  **结果**：通过 / 不通过\n`;
  return md;
}

// ─── 编译单个契约 ───
function compileContract(yamlPath) {
  const basename = path.basename(yamlPath, '.yaml');
  let content;
  try {
    content = fs.readFileSync(yamlPath, 'utf8');
  } catch (e) {
    console.error(`❌ 读取失败：${yamlPath} — ${e.message}`);
    return false;
  }

  let contract;
  try {
    contract = yaml.load(content);
  } catch (e) {
    console.error(`❌ YAML 解析失败：${basename}.yaml — ${e.message}`);
    return false;
  }

  if (!contract || typeof contract !== 'object') {
    console.error(`❌ 无效契约：${basename}.yaml — 内容为空或格式错误`);
    return false;
  }

  console.log(`\n📄 编译：${basename}.yaml`);

  // 1. Prompt 前缀
  try {
    const promptPrefix = generatePromptPrefix(contract, basename);
    fs.writeFileSync(path.join(OUTPUT_DIRS.prompt, `${basename}.md`), promptPrefix);
    console.log(`   ✅ Prompt 前缀  → prompt-prefixes/${basename}.md`);
  } catch (e) {
    console.error(`   ❌ Prompt 前缀生成失败：${e.message}`);
  }

  // 2. JSON Schema
  try {
    const jsonSchema = generateJsonSchema(contract, basename);
    fs.writeFileSync(
      path.join(OUTPUT_DIRS.schema, `${basename}.json`),
      JSON.stringify(jsonSchema, null, 2)
    );
    console.log(`   ✅ JSON Schema  → json-schemas/${basename}.json`);
  } catch (e) {
    console.error(`   ❌ JSON Schema 生成失败：${e.message}`);
  }

  // 3. ESLint 规则
  try {
    const eslintRule = generateEslintRule(contract, basename);
    fs.writeFileSync(path.join(OUTPUT_DIRS.eslint, `${basename}.js`), eslintRule);
    console.log(`   ✅ ESLint 规则  → eslint-rules/${basename}.js`);
  } catch (e) {
    console.error(`   ❌ ESLint 规则生成失败：${e.message}`);
  }

  // 4. Checklist
  try {
    const checklist = generateChecklist(contract, basename);
    fs.writeFileSync(path.join(OUTPUT_DIRS.checklist, `${basename}.md`), checklist);
    console.log(`   ✅ Checklist    → checklists/${basename}.md`);
  } catch (e) {
    console.error(`   ❌ Checklist 生成失败：${e.message}`);
  }

  return true;
}

// ─── 主入口 ───
function main() {
  console.log('🔧 Semantic Pipeline 契约编译器');
  console.log('================================');

  // 收集所有 YAML 文件（contracts + examples）
  const sources = [CONTRACTS_DIR, EXAMPLES_DIR];
  const yamlFiles = [];

  sources.forEach(dir => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir)
      .filter(f => f.endsWith('.yaml') && !f.startsWith('_'))
      .map(f => path.join(dir, f));
    yamlFiles.push(...files);
  });

  // 去重（如果 contracts 和 examples 中有同名文件，优先 contracts）
  const seen = new Map();
  yamlFiles.forEach(fp => {
    const name = path.basename(fp);
    if (!seen.has(name) || fp.includes('/contracts/')) {
      seen.set(name, fp);
    }
  });
  const uniqueFiles = Array.from(seen.values());

  if (uniqueFiles.length === 0) {
    console.log('⚠️ 未找到 YAML 契约文件');
    console.log(`   搜索路径：${CONTRACTS_DIR} 、 ${EXAMPLES_DIR}`);
    process.exit(0);
  }

  console.log(`\n发现 ${uniqueFiles.length} 个契约文件：\n`);

  let success = 0;
  let fail = 0;

  for (const file of uniqueFiles) {
    const ok = compileContract(file);
    if (ok) success++;
    else fail++;
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`编译完成：${success} 成功，${fail} 失败，共 ${uniqueFiles.length} 个`);
  console.log('\n输出目录：');
  Object.entries(OUTPUT_DIRS).forEach(([key, dir]) => {
    const count = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => !f.startsWith('.')).length : 0;
    console.log(`  ${key.padEnd(10)} ${path.relative(ROOT_DIR, dir)}  (${count} 个文件)`);
  });

  if (fail > 0) {
    console.log('\n⚠️ 存在编译失败，请检查上述错误信息');
    process.exit(1);
  } else {
    console.log('\n✅ 全部编译通过');
    process.exit(0);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

// 导出供测试使用
module.exports = {
  compileContract,
  generatePromptPrefix,
  generateJsonSchema,
  generateEslintRule,
  generateChecklist,
  walkTokens
};
