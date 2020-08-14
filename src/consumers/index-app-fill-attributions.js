const _ = require('lodash');

const { JOB, QUEUE } = require('../constants');
const elasticsearch = require('../util/elasticsearch');

const consumer = async (job, { logger }) => {
  const { attributions, date, fillId } = job.data;

  logger.info(`indexing app attributions for fill: ${fillId}`);

  const body = attributions
    .map(attribution => {
      return [
        JSON.stringify({
          update: {
            _id: `${attribution.appId}_${fillId}`,
          },
        }),
        JSON.stringify({
          doc: {
            appId: attribution.appId,
            date,
            fillId,
            relayedTrades: attribution.relayedTrades,
            relayedVolume: attribution.relayedVolume,
            sourcedTrades: attribution.sourcedTrades,
            sourcedVolume: attribution.sourcedVolume,
            totalTrades: attribution.totalTrades,
            totalVolume: attribution.totalVolume,
            updatedAt: new Date().toISOString(),
          },
          doc_as_upsert: true,
        }),
      ].join('\n');
    })
    .join('\n');

  const result = await elasticsearch
    .getClient()
    .bulk({ body: `${body}\n`, index: 'app_fill_attributions' });

  if (result.body.errors === true) {
    const errorMessage = _.get(
      result,
      'body.items[0].update.error.reason',
      `Failed to index app attributions for fill: ${fillId}`,
    );
    throw new Error(errorMessage);
  }

  logger.info(`indexed app attributions for fill: ${fillId}`);
};

module.exports = {
  fn: consumer,
  jobName: JOB.INDEX_APP_FILL_ATTRIBUTONS,
  queueName: QUEUE.INDEXING,
};
