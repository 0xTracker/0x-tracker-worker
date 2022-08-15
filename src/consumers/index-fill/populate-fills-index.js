const elasticsearch = require('../../util/elasticsearch');
const getIndexName = require('../../index/get-index-name');
const getDocumentForFillsIndex = require('../../index/get-document-for-fills-index');

const populateFillsIndex = async fill => {
  await elasticsearch.getClient().index({
    id: fill._id,
    index: getIndexName('fills'),
    body: getDocumentForFillsIndex(fill),
  });
};

module.exports = populateFillsIndex;
