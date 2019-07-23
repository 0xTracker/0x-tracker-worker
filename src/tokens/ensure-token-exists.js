const _ = require('lodash');

const Token = require('../model/token');

// Ensures the specified token exists by creating a new document
// if one does not already exist.
const ensureTokenExists = async (address, type) => {
  const result = await Token.updateOne(
    { address },
    { $setOnInsert: { address, resolved: false, type } },
    { upsert: true },
  );

  return _.get(result, 'upserted.length', 0) > 0;
};

module.exports = ensureTokenExists;
