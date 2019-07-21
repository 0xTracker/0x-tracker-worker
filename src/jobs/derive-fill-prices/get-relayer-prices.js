const _ = require('lodash');
const { flow, mapValues, omitBy, reduce } = require('lodash/fp');
const Immutable = require('seamless-immutable').static;

const mapValuesWithKey = mapValues.convert({ cap: false });

const buildRelayerPrices = reduce(
  (acc, { fill, prices }) =>
    _.isNumber(fill.relayerId)
      ? Immutable.merge(
          acc,
          {
            [fill.relayerId || null]: {
              [fill.makerToken]: {
                lastTrade: { id: fill.id, date: fill.date },
                lastPrice: prices.maker.USD,
              },
              [fill.takerToken]: {
                lastTrade: { id: fill.id, date: fill.date },
                lastPrice: prices.taker.USD,
              },
            },
          },
          { deep: true },
        )
      : acc,
  {},
);

const excludeOutdatedPrices = relayers =>
  mapValuesWithKey((relayerTokenPrices, key) => {
    const relayerId = _.toNumber(key);
    const relayer = _.find(relayers, { lookupId: relayerId });

    return _.omitBy(relayerTokenPrices, ({ lastTrade }, tokenAddress) => {
      const lastSaved = _.get(
        relayer,
        `prices.${tokenAddress}.lastTrade.date`,
        null,
      );

      return lastSaved !== null && lastSaved > lastTrade.date;
    });
  });

const getRelayerPrices = (fillPrices, relayers) =>
  flow(
    buildRelayerPrices,
    excludeOutdatedPrices(relayers),
    omitBy(_.isEmpty),
  )(fillPrices);

module.exports = getRelayerPrices;
