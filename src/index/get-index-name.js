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

  if (index === 'network_metrics_daily') {
    return (
      process.env.INDEX_NAME_NETWORK_METRICS_DAILY || 'network_metrics_daily'
    );
  }

  if (index === 'protocol_metrics_daily') {
    return (
      process.env.INDEX_NAME_PROTOCOL_METRICS_DAILY || 'protocol_metrics_daily'
    );
  }

  if (index === 'trader_metrics_daily') {
    return (
      process.env.INDEX_NAME_TRADER_METRICS_DAILY || 'trader_metrics_daily'
    );
  }

  if (index === 'token_metrics_daily') {
    return process.env.INDEX_NAME_TOKEN_METRICS_DAILY || 'token_metrics_daily';
  }

  throw new Error(`Unsupported index: ${index}`);
};

module.exports = getIndexName;
