const _ = require('lodash');

const { JOB, QUEUE, FILL_ATTRIBUTION_TYPE } = require('../../constants');
const { publishJob } = require('../../queues');
const elasticsearch = require('../../util/elasticsearch');
const getAddressMetadata = require('../../addresses/get-address-metadata');
const getIndexName = require('../../index/get-index-name');
const getTransactionByHash = require('../../transactions/get-transaction-by-hash');

const indexAppFills = async (job, { logger }) => {
  const delayJobProcessing = async () => {
    await publishJob(QUEUE.INDEXING, JOB.INDEX_APP_FILLS, job.data, {
      delay: 30000,
    });
  };

  const {
    attributions,
    fillDate,
    fillId,
    maker,
    taker,
    tradeCount,
    tradeValue,
    transactionHash,
  } = job.data;

  const takerMetadata = await getAddressMetadata(taker);

  if (takerMetadata === null || takerMetadata.isContract === undefined) {
    logger.warn(`taker address type is unknown: ${taker}`);
    await delayJobProcessing();

    return;
  }

  let transaction;

  if (takerMetadata.isContract) {
    transaction = await getTransactionByHash(transactionHash);

    if (transaction === null) {
      logger.warn(`transaction has not been fetched: ${transactionHash}`);
      await delayJobProcessing();

      return;
    }
  }

  const traders = [maker, takerMetadata.isContract ? transaction.from : taker];

  const appFills = attributions
    .filter(
      attribution =>
        attribution.type === FILL_ATTRIBUTION_TYPE.CONSUMER ||
        attribution.type === FILL_ATTRIBUTION_TYPE.RELAYER,
    )
    .reduce((accumulator, current) => {
      const existing = accumulator.find(x => x.entityId === current.entityId);

      if (existing) {
        const replacement = {
          ...existing,
          relayedTradeCount:
            current.type === FILL_ATTRIBUTION_TYPE.RELAYER ? tradeCount : 0,
          relayedTradeValue:
            current.type === FILL_ATTRIBUTION_TYPE.RELAYER ? tradeValue : 0,
          totalTradeCount: existing.totalTradeCount + tradeCount,
          totalTradeValue: existing.totalTradeValue + tradeValue,
        };

        return _.without(accumulator, existing).concat(replacement);
      }

      return accumulator.concat({
        appId: current.entityId,
        date: fillDate,
        fillId,
        relayedTradeCount:
          current.type === FILL_ATTRIBUTION_TYPE.RELAYER ? tradeCount : 0,
        relayedTradeValue:
          current.type === FILL_ATTRIBUTION_TYPE.RELAYER ? tradeValue : 0,
        totalTradeCount: tradeCount,
        totalTradeValue: tradeValue,
        traders,
      });
    }, []);

  if (appFills.length > 0) {
    const requestBody = appFills
      .map(appFill =>
        [
          JSON.stringify({
            index: {
              _id: `${appFill.fillId}_${appFill.appId}`,
            },
          }),
          JSON.stringify(appFill),
        ].join('\n'),
      )
      .join('\n');

    const result = await elasticsearch
      .getClient()
      .bulk({ body: `${requestBody}\n`, index: getIndexName('app_fills') });

    if (result.body.errors === true) {
      const errorMessage = _.get(
        result,
        'body.items[0].index.error.reason',
        `Indexing failed`,
      );
      throw new Error(errorMessage);
    }
  }

  logger.info(`populated app_fills index for fill: ${fillId}`);
};

module.exports = {
  fn: indexAppFills,
  jobName: JOB.INDEX_APP_FILLS,
  queueName: QUEUE.INDEXING,
};
