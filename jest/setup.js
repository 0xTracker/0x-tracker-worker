require('dotenv-safe').config({
  example: '.env.test.example',
});

const signale = require('signale');
const web3 = require('../src/util/ethereum/web3');

signale.disable();
web3.configure({ endpoint: 'https://cloudflare-eth.com' });
