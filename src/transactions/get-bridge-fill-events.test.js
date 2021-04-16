const TRANSACTION_RECEIPT_0XA707981A012761007DF2C9099ED1580221D2BDBC4B37F689CB8D35EEDD0D505E = require('../fixtures/transaction-receipts/0xa707981a012761007df2c9099ed1580221d2bdbc4b37f689cb8d35eedd0d505e');
const TRANSACTION_RECEIPT_0XFA2497CA6BC68C5C8D7813C5E3464372A0CD5C3BA7CD56B7BC85E55434994B28 = require('../fixtures/transaction-receipts/0xfa2497ca6bc68c5c8d7813c5e3464372a0cd5c3ba7cd56b7bc85e55434994b28');
const TRANSACTION_RECEIPT_0X657A5BB17E85FB7A796645CF092E1A36D8A66EB1B0B92597B0D49E0082C34805 = require('../fixtures/transaction-receipts/0x657a5bb17e85fb7a796645cf092e1a36d8a66eb1b0b92597b0d49e0082c34805');
const getERC20BridgeTransferEvents = require('./get-bridge-fill-events');

describe('transactions/get-bridge-fill-events', () => {
  it('should return empty array when transaction does not have any BridgeFill events', () => {
    const events = getERC20BridgeTransferEvents(
      TRANSACTION_RECEIPT_0XA707981A012761007DF2C9099ED1580221D2BDBC4B37F689CB8D35EEDD0D505E,
    );

    expect(events).toEqual([]);
  });

  it('should extract BridgeFill v1 events from transaction which has them', () => {
    const events = getERC20BridgeTransferEvents(
      TRANSACTION_RECEIPT_0X657A5BB17E85FB7A796645CF092E1A36D8A66EB1B0B92597B0D49E0082C34805,
    );

    expect(events).toEqual([
      {
        blockNumber: 11822241,
        data: {
          inputToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          inputTokenAmount: '10000000',
          outputToken: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          outputTokenAmount: '9988900985545660054',
          source: '3',
        },
        logIndex: 199,
        protocolVersion: 4,
        transactionHash:
          '0x657a5bb17e85fb7a796645cf092e1a36d8a66eb1b0b92597b0d49e0082c34805',
        type: 'BridgeFill',
      },
    ]);
  });

  it('should extract BridgeFill v2 events from transaction which has them', () => {
    const events = getERC20BridgeTransferEvents(
      TRANSACTION_RECEIPT_0XFA2497CA6BC68C5C8D7813C5E3464372A0CD5C3BA7CD56B7BC85E55434994B28,
    );

    expect(events).toEqual([
      {
        blockNumber: 12236041,
        data: {
          inputToken: '0x6e36556B3ee5Aa28Def2a8EC3DAe30eC2B208739',
          inputTokenAmount: '114129999881182664283',
          outputToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          outputTokenAmount: '4430733405',
          source: 'UniswapV2',
        },
        logIndex: 70,
        protocolVersion: 4,
        transactionHash:
          '0xfa2497ca6bc68c5c8d7813c5e3464372a0cd5c3ba7cd56b7bc85e55434994b28',
        type: 'BridgeFill',
      },
    ]);
  });
});
