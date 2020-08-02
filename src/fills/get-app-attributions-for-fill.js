const _ = require('lodash');

const getIsConsumedByRelayer = apps => {
  if (apps.length < 2) {
    return false;
  }

  const relayer = apps.find(app => app.type === 0).appId;
  const consumer = apps.find(app => app.type === 1).appId;

  return relayer === consumer;
};

const createAttribution = (fill, app) => {
  const tradeCount = fill.orderMatcher ? 0.5 : 1;
  const fillValue = _.get(fill, 'conversions.USD.amount', null);
  const tradeValue = fillValue === null ? undefined : tradeCount * fillValue;

  const { relayedTrades, relayedVolume } =
    app.type === 0
      ? { relayedTrades: tradeCount, relayedVolume: tradeValue }
      : {};

  const { sourcedTrades, sourcedVolume } =
    app.type === 1
      ? { sourcedTrades: tradeCount, sourcedVolume: tradeValue }
      : { undefined };

  return {
    appId: app.appId,
    relayedTrades,
    relayedVolume,
    sourcedTrades,
    sourcedVolume,
    totalTrades: tradeCount,
    totalVolume: tradeValue,
  };
};

const getAppAttributionsForFill = fill => {
  const apps = _.get(fill, 'apps', []);
  const consumedByRelayer = getIsConsumedByRelayer(apps);

  if (consumedByRelayer) {
    const relayer = fill.apps.find(app => app.type === 0);
    return createAttribution(fill, relayer);
  }

  return fill.apps.map(app => createAttribution(fill, app));
};

module.exports = getAppAttributionsForFill;
