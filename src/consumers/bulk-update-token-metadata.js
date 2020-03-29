const bluebird = require('bluebird');
const signale = require('signale');

const { JOB, QUEUE } = require('../constants');
const fetchTokenMetadata = require('../tokens/fetch-token-metadata');
const Token = require('../model/token');

const logger = signale.scope('bulk update token metadata');

const consumer = async () => {
  logger.info('scheduling update of all token metadata');

  const tokens = await Token.find({}, 'address type').lean();

  bluebird.each(tokens, async token => {
    await fetchTokenMetadata(token.address, token.type);
  });

  logger.info('scheduled update of all token metadata');
};

module.exports = {
  fn: consumer,
  jobName: JOB.BULK_UPDATE_TOKEN_METADATA,
  queueName: QUEUE.TOKEN_PROCESSING,
};
