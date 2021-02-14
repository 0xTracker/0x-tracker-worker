const _ = require('lodash');

const { JOB, QUEUE } = require('../../constants');
const { publishJob } = require('../../queues');
const elasticsearch = require('../../util/elasticsearch');
const getAddressMetadata = require('../../addresses/get-address-metadata');
const getIndexName = require('../../index/get-index-name');
const getTransactionByHash = require('../../transactions/get-transaction-by-hash');

const indexFillTraders = async (job, { logger }) => {
  const delayJobProcessing = async () => {
    await publishJob(QUEUE.INDEXING, JOB.INDEX_FILL_TRADERS, job.data, {
      delay: 30000,
    });
  };

  const {
    appIds,
    fillDate,
    fillId,
    fillValue,
    maker,
    relayerId,
    taker,
    tradeCount,
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

  const tradeValue =
    fillValue === undefined ? undefined : fillValue * tradeCount;

  const requestBody = _.compact([
    maker
      ? JSON.stringify({
          index: {
            _id: `${fillId}_maker`,
          },
        })
      : null,
    maker
      ? JSON.stringify({
          address: maker,
          appIds,
          fillId,
          date: fillDate,
          relayerId,
          makerFillCount: 1,
          makerFillValue: fillValue,
          makerTradeCount: tradeCount,
          makerTradeValue: tradeValue,
          totalFillCount: 1,
          totalFillValue: fillValue,
          totalTradeCount: tradeCount,
          totalTradeValue: tradeValue,
          updatedAt: new Date().toISOString(),
        })
      : null,
    JSON.stringify({
      index: {
        _id: `${fillId}_taker`,
      },
    }),
    JSON.stringify({
      address: takerMetadata.isContract ? transaction.from : taker,
      appIds,
      fillId,
      date: fillDate,
      relayerId,
      takerFillCount: 1,
      takerFillValue: fillValue,
      takerTradeCount: tradeCount,
      takerTradeValue: tradeValue,
      totalFillCount: 1,
      totalFillValue: fillValue,
      totalTradeCount: tradeCount,
      totalTradeValue: tradeValue,
      updatedAt: new Date().toISOString(),
    }),
  ]).join('\n');

  const result = await elasticsearch
    .getClient()
    .bulk({ body: `${requestBody}\n`, index: getIndexName('trader_fills') });

  if (result.body.errors === true) {
    const errorMessage = _.get(
      result,
      'body.items[0].index.error.reason',
      `Failed to index trader_fills`,
    );

    throw new Error(errorMessage);
  }

  logger.info(`indexed fill traders: ${fillId}`);
};

module.exports = {
  fn: indexFillTraders,
  jobName: JOB.INDEX_FILL_TRADERS,
  queueName: QUEUE.INDEXING,
};
