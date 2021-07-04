const elasticsearch = require('../../util/elasticsearch');
const getIndexName = require('../../index/get-index-name');
const getTradeCountContribution = require('../../fills/get-trade-count-contribution');
const getDocumentForFillsIndex = require('../../index/get-document-for-fills-index');

const updateFillsIndex = async (fill, value) => {
  const tradeCountContribution = getTradeCountContribution(fill);
  const tradeVolume = value * tradeCountContribution;

  await elasticsearch.getClient().update({
    id: fill._id,
    index: getIndexName('fills'),
    body: {
      doc: {
        tradeVolume,
        value,
      },
      upsert: {
        ...getDocumentForFillsIndex(fill),
        tradeVolume,
        value,
      },
    },
  });
};

module.exports = updateFillsIndex;
