const ms = require('ms');

const buildFill = require('./build-fill');
const convertProtocolFee = require('../../fills/convert-protocol-fee');
const createNewTokens = require('../../tokens/create-new-tokens');
const fetchFillStatus = require('../../fills/fetch-fill-status');
const getEventData = require('../../events/get-event-data');
const getUniqTokens = require('./get-uniq-tokens');
const hasProtocolFee = require('../../fills/has-protocol-fee');
const indexFill = require('../../index/index-fill');
const indexTradedTokens = require('../../index/index-traded-tokens');
const persistFill = require('./persist-fill');
const withTransaction = require('../../util/with-transaction');

const createFill = async event => {
  const data = getEventData(event);
  const fill = await buildFill(data, event._id, event.protocolVersion);

  const tokens = getUniqTokens(data.assets, data.fees);
  await createNewTokens(tokens);

  await withTransaction(async session => {
    const newFill = await persistFill(session, fill);

    await fetchFillStatus(newFill, ms('30 seconds'));
    await indexFill(newFill._id, ms('30 seconds'));
    await indexTradedTokens(newFill);

    if (hasProtocolFee(newFill)) {
      await convertProtocolFee(newFill, ms('30 seconds'));
    }
  });
};

module.exports = createFill;
