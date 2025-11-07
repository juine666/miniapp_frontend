/**
 * 敏感词过滤工具
 * 用于前端预检查，减少不必要的请求
 */

// 敏感词列表（与后端保持一致）
const SENSITIVE_WORDS = [
  // 色情相关
  '色情', '黄色', '成人', '性爱', '做爱', '性交', '性服务', '约炮', '一夜情',
  // 赌博相关
  '赌博', '赌场', '博彩', '彩票', '投注', '下注', '赌钱', '赌球', '赌马',
  // 毒品相关
  '毒品', '吸毒', '大麻', '冰毒', '海洛因', '摇头丸', 'K粉', '可卡因',
  // 政治敏感
  '涉政', '政治', '政府', '领导人', '国家机密',
  // 暴力相关
  '杀人', '暴力', '恐怖', '爆炸', '武器', '枪支', '炸弹',
  // 诈骗相关
  '诈骗', '骗钱', '假货', '假冒', '刷单', '刷信誉',
  // 其他违规
  '代孕', '代考', '作弊', '黑客', '病毒', '木马'
];

/**
 * 标准化文本（移除特殊字符，转换为小写）
 * @param {string} text 原始文本
 * @returns {string} 标准化后的文本
 */
function normalizeText(text) {
  if (!text) return '';
  let normalized = text.toLowerCase();
  // 移除常见变体字符
  normalized = normalized.replace(/[*\-_.\s]/g, '');
  return normalized;
}

/**
 * 检查文本是否包含敏感词
 * @param {string} text 待检查的文本
 * @returns {string|null} 如果包含敏感词，返回第一个匹配的敏感词；否则返回null
 */
function checkSensitiveWord(text) {
  if (!text || !text.trim()) {
    return null;
  }

  const normalizedText = normalizeText(text);
  
  for (const word of SENSITIVE_WORDS) {
    if (normalizedText.includes(word.toLowerCase())) {
      return word;
    }
  }

  return null;
}

/**
 * 验证文本是否干净（不包含敏感词）
 * @param {string} text 待验证的文本
 * @returns {object} { valid: boolean, word: string|null, message: string }
 */
function validateText(text) {
  const sensitiveWord = checkSensitiveWord(text);
  if (sensitiveWord) {
    return {
      valid: false,
      word: sensitiveWord,
      message: `消息包含敏感词"${sensitiveWord}"，请修改后重试`
    };
  }
  return {
    valid: true,
    word: null,
    message: null
  };
}

module.exports = {
  checkSensitiveWord,
  validateText
};

