const getIndexName = index => {
  if (index === 'fills') {
    return process.env.INDEX_NAME_FILLS || 'fills';
  }

  if (index === 'traded_tokens') {
    return process.env.INDEX_NAME_TRADED_TOKENS || 'traded_tokens';
  }

  if (index === 'trader_fills') {
    return process.env.INDEX_NAME_TRADER_FILLS || 'trader_fills';
  }

  throw new Error(`Unsupported index: ${index}`);
};

module.exports = getIndexName;
