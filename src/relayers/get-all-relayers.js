const _ = require('lodash');

const ercDEXRecipientCache = require('./erc-dex/recipient-cache');

const RELAYERS = {
  bambooRelay: {
    feeRecipients: ['0x5dd835a893734b8d556eccf87800b76dda5aedc5'],
    lookupId: 1,
  },
  ddex: {
    lookupId: 2,
    takerAddresses: ['0xe269e891a2ec8585a378882ffa531141205e92e9'],
  },
  ercDex: {
    lookupId: 3,
  },
  idtExchange: {
    lookupId: 4,
    feeRecipients: ['0xeb71bad396acaa128aeadbc7dbd59ca32263de01'],
  },
  ledgerDex: {
    feeRecipients: ['0x4524baa98f9a3b9dec57caae7633936ef96bd708'],
    lookupId: 12,
  },
  openRelay: {
    lookupId: 5,
    feeRecipients: ['0xc22d5b2951db72b44cfb8089bb8cd374a3c354ea'],
  },
  paradex: {
    lookupId: 6,
    takerAddresses: [
      '0x4969358e80cdc3d74477d7447bffa3b2e2acbe92',
      '0xd2045edc40199019e221d71c0913343f7908d0d5',
    ],
  },
  radarRelay: {
    lookupId: 7,
    feeRecipients: ['0xa258b39954cef5cb142fd567a46cddb31a670124'],
  },
  sharkRelay: {
    lookupId: 8,
    feeRecipients: ['0x55890b06f0877a01bb5349d93b202961f8e27a9b'],
  },
  starBit: {
    lookupId: 9,
    feeRecipients: ['0x8124071f810d533ff63de61d0c98db99eeb99d64'],
  },
  theOcean: {
    lookupId: 13,
    feeRecipients: ['0x7219612be7036d1bfa933e16ca1246008f38c5fe'],
  },
  tokenJar: {
    lookupId: 10,
    feeRecipients: ['0x5e150a33ffa97a8d22f59c77ae5487b089ef62e9'],
  },
  tokenlon: {
    lookupId: 11,
    feeRecipients: ['0x6f7ae872e995f98fcd2a7d3ba17b7ddfb884305f'],
  },
};

const getAllRelayers = () => {
  const relayers = _.mapValues(RELAYERS, (relayer, id) => ({
    ...relayer,
    id,
  }));

  return {
    ...relayers,
    ercDex: {
      ...relayers.ercDex,
      feeRecipients: ercDEXRecipientCache.getRecipients(),
    },
  };
};

module.exports = getAllRelayers;
