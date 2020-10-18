const mongoose = require('mongoose');

const V2_FILL = {
  __v: 0,
  _id: new mongoose.Types.ObjectId('5e01056923573c61d846f51d'),
  conversions: { USD: { amount: 658.8957691929245 } },
  hasValue: true,
  immeasurable: false,
  status: 1,
  attributions: [],
  assets: [
    {
      tokenResolved: true,
      _id: new mongoose.Types.ObjectId('5e01056923573c61d846f51f'),
      amount: 660879036587289100000,
      tokenAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
      actor: 0,
      price: { USD: 0.9969990462935456 },
      value: { USD: 658.8957691929245 },
    },
    {
      tokenResolved: true,
      _id: new mongoose.Types.ObjectId('5e01056923573c61d846f51e'),
      amount: 5063754758629915000,
      tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      actor: 1,
      price: { USD: 130.12 },
      value: { USD: 658.8957691929245 },
    },
  ],
  blockHash:
    '0x7c19236809f502da3d481761009377877171ccd8757df293f7537c974674c81b',
  blockNumber: 9151911,
  date: new Date('2019-12-23T18:15:16.000Z'),
  eventId: new mongoose.Types.ObjectId('5e01053a3e349627a0408d51'),
  fees: [
    {
      _id: new mongoose.Types.ObjectId('5f0b34ed4524dc43d883a92b'),
      amount: { token: 5000000000000000000 },
      tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
      traderType: 0,
    },
    {
      _id: new mongoose.Types.ObjectId('5f0b34ed4524dc43d883a92a'),
      amount: { token: 3000000000000000000 },
      tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
      traderType: 1,
    },
  ],
  feeRecipient: '0xa258b39954cef5cb142fd567a46cddb31a670124',
  logIndex: 38,
  maker: '0x6924a03bb710eaf199ab6ac9f2bb148215ae9b5d',
  orderHash:
    '0xf186241e774ed0ecb6b6c101482f9a52d77caaf2db3165c9052f814e4c844f5e',
  protocolVersion: 2,
  relayerId: 7,
  senderAddress: '0x8018280076d7fa2caa1147e441352e8a89e1ddbe',
  taker: '0x8018280076d7fa2caa1147e441352e8a89e1ddbe',
  transactionHash:
    '0x36a35ae64def8beab677435be4762bf63977000172d47096230a94922383c856',
  pricingStatus: 0,
};

module.exports = V2_FILL;
