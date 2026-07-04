#!/usr/bin/env node
/**
 * validate-yaml.js
 * YAML 结构校验脚本 —— 检查契约文件的 6 字段完整性
 *
 * 用法:
 *   node scripts/validate-yaml.js
 *
 * 校验规则:
 *   - intent_id: 必填，大写 ID，如 ERR-001
 *   - semantic_domain: 必填，枚举值 transactional / observational / informational
 *   - description: 必填，一句话人话，≤ 80 字
 *   - immutable_boundaries: 必填，数组，≥ 3 条红线
 *   - semantic_tokens: 必填，对象，包含 visual_mapping + llm_constraints
 *   - applicable_products: 必填，数组，≥ 1 个产品名
 */

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

const SEMANTIC_DOMAIN_ENUM = ['transactional', 'observational', 'informational', 'destructive', 'navigational'];

/**
 * 校验单个契约文件
 */
function validateContract(filePath) {
  const errors = [];
  let doc;

  // 1. 读取并解析 YAML
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    doc = yaml.load(content);
  } catch (e) {
    errors.push(`YAML 解析失败: ${e.message}`);
    return { file: path.basename(filePath), valid: false, errors };
  }

  // 2. 检查必填字段
  for (const field of REQUIRED_FIELDS) {
    if (doc[field] === undefined || doc[field] === null) {
      errors.push(`缺少必填字段: ${field}`);
    }
  }

  // 3. 检查 intent_id 格式
  if (doc.intent_id) {
    const idPattern = /^(ERR|PRO|BND|ACT|ALR|STP|INF)-\d{3}$/;
    if (!idPattern.test(doc.intent_id)) {
      errors.push(`intent_id 格式错误: "${doc.intent_id}"，应为如 ERR-001 的格式`);
    }
  }

  // 4. 检查 semantic_domain 枚举
  if (doc.semantic_domain && !SEMANTIC_DOMAIN_ENUM.includes(doc.semantic_domain)) {
    errors.push(`semantic_domain 非法值: "${doc.semantic_domain}"，可选: ${SEMANTIC_DOMAIN_ENUM.join(', ')}`);
  }

  // 5. 检查 description 长度
  if (doc.description) {
    if (typeof doc.description !== 'string') {
      errors.push(`description 必须是字符串`);
    } else if (doc.description.length > 80) {
      errors.push(`description 过长: ${doc.description.length} 字，需 ≤ 80 字`);
    } else if (doc.description.length === 0) {
      errors.push(`description 不能为空`);
    }
  }

  // 6. 检查 immutable_boundaries
  if (doc.immutable_boundaries !== undefined) {
    if (!Array.isArray(doc.immutable_boundaries)) {
      errors.push(`immutable_boundaries 必须是数组`);
    } else if (doc.immutable_boundaries.length < 3) {
      errors.push(`immutable_boundaries 仅 ${doc.immutable_boundaries.length} 条，需 ≥ 3 条`);
    } else {
      // 检查每条边界是否有 rule 和 violation_action
      doc.immutable_boundaries.forEach((b, i) => {
        if (!b.rule) {
          errors.push(`immutable_boundaries[${i}] 缺少 rule 字段`);
        }
        if (!b.violation_action) {
          errors.push(`immutable_boundaries[${i}] 缺少 violation_action 字段`);
        } else if (!['block', 'warn', 'escalate'].includes(b.violation_action)) {
          errors.push(`immutable_boundaries[${i}] violation_action 非法: "${b.violation_action}"，可选: block, warn, escalate`);
        }
      });
    }
  }

  // 7. 检查 semantic_tokens
  if (doc.semantic_tokens !== undefined) {
    if (typeof doc.semantic_tokens !== 'object' || Array.isArray(doc.semantic_tokens)) {
      errors.push(`semantic_tokens 必须是对象`);
    } else {
      const tokens = Object.entries(doc.semantic_tokens);
      if (tokens.length === 0) {
        errors.push(`semantic_tokens 不能为空对象`);
      }
      tokens.forEach(([tokenName, tokenConfig]) => {
        if (typeof tokenConfig !== 'object') {
          errors.push(`semantic_tokens.${tokenName} 必须是对象`);
          return;
        }
        // 检查 visual_mapping
        if (!tokenConfig.visual_mapping) {
          errors.push(`semantic_tokens.${tokenName} 缺少 visual_mapping`);
        } else if (typeof tokenConfig.visual_mapping !== 'object') {
          errors.push(`semantic_tokens.${tokenName}.visual_mapping 必须是对象`);
        } else if (!tokenConfig.visual_mapping.color_token) {
          errors.push(`semantic_tokens.${tokenName}.visual_mapping 缺少 color_token`);
        }
        // 检查 llm_constraints
        if (!tokenConfig.llm_constraints) {
          errors.push(`semantic_tokens.${tokenName} 缺少 llm_constraints`);
        } else if (!Array.isArray(tokenConfig.llm_constraints)) {
          errors.push(`semantic_tokens.${tokenName}.llm_constraints 必须是数组`);
        } else if (tokenConfig.llm_constraints.length < 2) {
          errors.push(`semantic_tokens.${tokenName}.llm_constraints 仅 ${tokenConfig.llm_constraints.length} 条，建议 ≥ 2 条`);
        }
        // 检查 user_action
        if (!tokenConfig.user_action) {
          errors.push(`semantic_tokens.${tokenName} 缺少 user_action`);
        } else if (!Array.isArray(tokenConfig.user_action)) {
          errors.push(`semantic_tokens.${tokenName}.user_action 必须是数组`);
        } else if (tokenConfig.user_action.length === 0) {
          errors.push(`semantic_tokens.${tokenName}.user_action 不能为空数组`);
        }
      });
    }
  }

  // 8. 检查 applicable_products
  if (doc.applicable_products !== undefined) {
    if (!Array.isArray(doc.applicable_products)) {
      errors.push(`applicable_products 必须是数组`);
    } else if (doc.applicable_products.length === 0) {
      errors.push(`applicable_products 不能为空数组`);
    } else {
      const emptyItems = doc.applicable_products.filter(p => typeof p !== 'string' || p.trim() === '');
      if (emptyItems.length > 0) {
        errors.push(`applicable_products 包含空值或非法类型`);
      }
    }
  }

  return { file: path.basename(filePath), valid: errors.length === 0, errors };
}

/**
 * 主入口
 */
function main() {
  console.log('🔧 Semantic Pipeline — YAML 契约校验器');
  console.log('=====================================\n');

  const files = glob.sync('contracts/**/*.yaml');

  if (files.length === 0) {
    console.log('⚠️  未找到 YAML 契约文件 (contracts/**/*.yaml)');
    process.exit(0);
  }

  let pass = 0;
  let fail = 0;

  for (const file of files) {
    const result = validateContract(file);
    if (result.valid) {
      console.log(`✅ ${result.file} — 通过（6/6 字段完整）`);
      pass++;
    } else {
      console.log(`❌ ${result.file} — 失败`);
      result.errors.forEach(e => console.log(`   └─ ${e}`));
      fail++;
    }
  }

  console.log(`\n${'━'.repeat(40)}`);
  console.log(`校验结果: ${files.length} 个文件，${pass} 通过，${fail} 失败`);

  if (fail > 0) {
    console.log('\n💡 提示: 请参考 references/contract-schema.md 修复上述问题');
  }

  process.exit(fail > 0 ? 1 : 0);
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { validateContract, REQUIRED_FIELDS, SEMANTIC_DOMAIN_ENUM };
