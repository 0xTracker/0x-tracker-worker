const TRANSACTION_RECEIPT_0XA707981A012761007DF2C9099ED1580221D2BDBC4B37F689CB8D35EEDD0D505E = require('../fixtures/transaction-receipts/0xa707981a012761007df2c9099ed1580221d2bdbc4b37f689cb8d35eedd0d505e');
const TRANSACTION_RECEIPT_0X29579558FECFEF00A960A27F314C3E36003B0BBC7B95C462100E83B8836F718A = require('../fixtures/transaction-receipts/0x29579558fecfef00a960a27f314c3e36003b0bbc7b95c462100e83b8836f718a');
const getERC20BridgeTransferEvents = require('./get-erc20-bridge-transfer-events');

describe('transactions/get-erc20-bridge-transfer-events', () => {
  it('should return empty array when transaction does not have bridge transfer events', () => {
    const events = getERC20BridgeTransferEvents(
      TRANSACTION_RECEIPT_0XA707981A012761007DF2C9099ED1580221D2BDBC4B37F689CB8D35EEDD0D505E,
    );

    expect(events).toEqual([]);
  });

  it('should extract bridge transfer events from transaction which has them', () => {
    const events = getERC20BridgeTransferEvents(
      TRANSACTION_RECEIPT_0X29579558FECFEF00A960A27F314C3E36003B0BBC7B95C462100E83B8836F718A,
    );

    expect(events).toEqual([
      {
        blockNumber: 10141741,
        data: {
          from: '0x36691C4F426Eb8F42f150ebdE43069A31cB080AD',
          fromToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          fromTokenAmount: '25204118430346391',
          to: '0x6958F5e95332D93D21af0D7B9Ca85B8212fEE0A5',
          toToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          toTokenAmount: '5049999',
        },
        logIndex: 81,
        protocolVersion: 3,
        transactionHash:
          '0x29579558fecfef00a960a27f314c3e36003b0bbc7b95c462100e83b8836f718a',
        type: 'ERC20BridgeTransfer',
      },
    ]);
  });
});
