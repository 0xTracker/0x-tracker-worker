const _ = require('lodash');
const { FILL_ATTRIBUTION_TYPE } = require('../constants');
const getTradeCountContribution = require('../fills/get-trade-count-contribution');
const getTraderAddresses = require('../fills/get-trader-addresses');

const getDocumentsForAppFillsIndex = fill => {
  const tradeCountContribution = getTradeCountContribution(fill);
  const traders = getTraderAddresses(fill);

  const value = _.get(fill, 'conversions.USD.amount') || undefined;

  const documents = [];

  const appAttributions = _.filter(
    fill.attributions,
    a =>
      a.type === FILL_ATTRIBUTION_TYPE.CONSUMER ||
      a.type === FILL_ATTRIBUTION_TYPE.RELAYER,
  );

  _.forEach(appAttributions, attribution => {
    const existing = documents.find(x => x.appId === attribution.entityId);
    const isRelayer = attribution.type === FILL_ATTRIBUTION_TYPE.RELAYER;

    if (existing) {
      if (isRelayer) {
        existing.relayedTradeCount = tradeCountContribution;
        existing.relayedTradeValue = value;
      }

      return;
    }

    documents.push({
      appId: attribution.entityId,
      date: fill.date,
      fillId: fill._id,
      relayedTradeCount: isRelayer ? tradeCountContribution : 0,
      relayedTradeValue: isRelayer ? value : undefined,
      totalTradeCount: tradeCountContribution,
      totalTradeValue: value,
      traders,
    });
  });

  return documents;
};

module.exports = getDocumentsForAppFillsIndex;
