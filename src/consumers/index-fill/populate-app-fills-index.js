const _ = require('lodash');
const elasticsearch = require('../../util/elasticsearch');
const getIndexName = require('../../index/get-index-name');
const getDocumentsForAppFillsIndex = require('../../index/get-documents-for-app-fills-index');

const populateAppFillsIndex = async fill => {
  const documents = getDocumentsForAppFillsIndex(fill);

  if (documents.length === 0) {
    return;
  }

  const requestBody = documents
    .map(doc => {
      return [
        JSON.stringify({
          index: {
            _id: `${doc.fillId}_${doc.appId}`,
          },
        }),
        JSON.stringify({
          doc,
        }),
      ].join('\n');
    })
    .join('\n');

  const result = await elasticsearch
    .getClient()
    .bulk({ body: `${requestBody}\n`, index: getIndexName('app_fills') });

  if (result.body.errors === true) {
    const errorMessage = _.get(
      result,
      'body.items[0].update.error.reason',
      `Failed to populate app_fills index for fill: ${fill._id}`,
    );
    throw new Error(errorMessage);
  }
};

module.exports = populateAppFillsIndex;
