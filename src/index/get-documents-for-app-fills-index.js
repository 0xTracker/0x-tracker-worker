const _ = require('lodash');
const { FILL_ATTRIBUTION_TYPE } = require('../constants');
const getTradeCountContribution = require('../fills/get-trade-count-contribution');
const getTraderAddresses = require('../fills/get-trader-addresses');

const getDocumentsForAppFillsIndex = fill => {
  const tradeCountContribution = getTradeCountContribution(fill);
  const traders = getTraderAddresses(fill);

  const tradeValue = fill.value
    ? fill.value * tradeCountContribution
    : undefined;

  const documents = [];

  _.forEach(fill.attributions, attribution => {
    const existing = documents.find(x => x.appId === attribution.entityId);
    const isRelayer = attribution.type === FILL_ATTRIBUTION_TYPE.RELAYER;

    if (existing) {
      if (isRelayer) {
        existing.relayedTradeCount = tradeCountContribution;
        existing.relayedTradeValue = tradeValue;
      }

      return;
    }

    documents.push({
      appId: attribution.entityId,
      date: fill.date,
      fillId: fill._id,
      relayedTradeCount: isRelayer ? tradeCountContribution : 0,
      relayedTradeValue: isRelayer ? tradeValue : undefined,
      totalTradeCount: tradeCountContribution,
      totalTradeValue: tradeValue,
      traders,
    });
  });

  return documents;
};

module.exports = getDocumentsForAppFillsIndex;
