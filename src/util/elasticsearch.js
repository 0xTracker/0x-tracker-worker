const { Client } = require('@elastic/elasticsearch');

let client;

const configure = config => {
  client = new Client(config);
};

const getClient = () => client;

module.exports = { configure, getClient };
