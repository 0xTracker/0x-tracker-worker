const getTradedTokens = require('./get-traded-tokens');

const baseFill = {
  _id: '5e3e9abbb2227b1f0e73be5f',
  conversions: {
    USD: {
      makerFee: 0,
      takerFee: 0,
      protocolFee: 0.338445000033844,
      amount: 1674.924411,
    },
  },
  hasValue: true,
  immeasurable: false,
  status: 1,
  blockHash:
    '0x2d28446636839915b273eb93243dd6295f03d8117a55f0e6fb4f3cdc582d88e8',
  blockNumber: 9441755,
  date: '2020-02-08T11:21:14.000Z',
  eventId: '5e3e9a370834b939aa28452c',
  fees: [],
  feeRecipient: '0x1000000000000000000000000000000000000011',
  logIndex: 30,
  maker: '0x533344cfdf2a3e911e2cf4c6f5ed08e791f5355f',
  orderHash:
    '0x0ccbf1bc14e19be3a4c422b18bb1c9870b5e0a75cfb75b694688b07380c13732',
  protocolFee: 1500000000150000.0,
  protocolVersion: 3,
  relayerId: 31,
  senderAddress: '0x4ef40d1bf0983899892946830abf99eca2dbc5ce',
  taker: '0x4ef40d1bf0983899892946830abf99eca2dbc5ce',
  transactionHash:
    '0x846d405f1ab48414c9a32f537c7b247e87e5770cc41dfe4255bc480710ec46f6',
  __v: 0,
  relayer: {
    name: '0x API',
  },
};

describe('getTradedTokens', () => {
  it('should get traded tokens for fill', () => {
    const fill = {
      ...baseFill,
      assets: [
        {
          tokenResolved: true,
          _id: '5e3e9abbb2227b1f0e73be61',
          amount: 1674924411,
          tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          bridgeAddress: '0x533344cfdf2a3e911e2cf4c6f5ed08e791f5355f',
          bridgeData:
            '0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          actor: 0,
          price: {
            USD: 1,
          },
          value: {
            USD: 1674.924411,
          },
          token: {
            decimals: 6,
            type: 0,
          },
        },
        {
          tokenResolved: true,
          _id: '5e3e9abbb2227b1f0e73be60',
          amount: 7.45216100214005e18,
          tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          actor: 1,
          token: {
            decimals: 18,
            type: 0,
          },
        },
      ],
    };
    const tradedTokens = getTradedTokens(fill);

    expect(tradedTokens).toEqual([
      {
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        filledAmount: 1674.924411,
        filledAmountUSD: 1674.924411,
        priceUSD: 1,
        tradeCountContribution: 1,
        tradedAmount: 1674.924411,
        tradedAmountUSD: 1674.924411,
        type: 0,
      },
      {
        address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        filledAmount: 7.45216100214005,
        filledAmountUSD: undefined,
        priceUSD: undefined,
        tradeCountContribution: 1,
        tradedAmount: 7.45216100214005,
        tradedAmountUSD: undefined,
        type: 0,
      },
    ]);
  });

  it('should reduce traded tokens for fill with multiple assets belonging to same token address', () => {
    const fill = {
      ...baseFill,
      assets: [
        {
          tokenResolved: true,
          amount: 1674924411,
          tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          bridgeAddress: '0x533344cfdf2a3e911e2cf4c6f5ed08e791f5355f',
          bridgeData:
            '0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          actor: 0,
          price: {
            USD: 1,
          },
          value: {
            USD: 1674.924411,
          },
          token: {
            decimals: 6,
            type: 0,
          },
        },
        {
          tokenResolved: true,
          amount: 7.45216100214005e18,
          tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          actor: 1,
          token: {
            decimals: 18,
            type: 0,
          },
        },
        {
          tokenResolved: true,
          amount: 1274924411,
          tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          actor: 0,
          price: {
            USD: 1,
          },
          value: {
            USD: 1274.924411,
          },
          token: {
            decimals: 6,
            type: 0,
          },
        },
      ],
    };
    const tradedTokens = getTradedTokens(fill);

    expect(tradedTokens).toEqual([
      {
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        filledAmount: 2949.848822,
        filledAmountUSD: 2949.848822,
        priceUSD: 1,
        tradeCountContribution: 1,
        tradedAmount: 2949.848822,
        tradedAmountUSD: 2949.848822,
        type: 0,
      },
      {
        address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        filledAmount: 7.45216100214005,
        filledAmountUSD: undefined,
        priceUSD: undefined,
        tradeCountContribution: 1,
        tradedAmount: 7.45216100214005,
        tradedAmountUSD: undefined,
        type: 0,
      },
    ]);
  });

  it('should get traded tokens for fill with unknown tokens', () => {
    const fill = {
      ...baseFill,
      assets: [
        {
          tokenResolved: false,
          _id: '5e3e9abbb2227b1f0e73be61',
          amount: 1674924411,
          tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          bridgeAddress: '0x533344cfdf2a3e911e2cf4c6f5ed08e791f5355f',
          bridgeData:
            '0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          actor: 0,
        },
        {
          tokenResolved: false,
          _id: '5e3e9abbb2227b1f0e73be60',
          amount: 7.45216100214005e18,
          tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          actor: 1,
        },
      ],
    };
    const tradedTokens = getTradedTokens(fill);

    expect(tradedTokens).toEqual([
      {
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        filledAmount: undefined,
        filledAmountUSD: undefined,
        priceUSD: undefined,
        tradeCountContribution: 1,
        tradedAmount: undefined,
        tradedAmountUSD: undefined,
        type: undefined,
      },
      {
        address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        filledAmount: undefined,
        filledAmountUSD: undefined,
        priceUSD: undefined,
        tradeCountContribution: 1,
        tradedAmount: undefined,
        tradedAmountUSD: undefined,
        type: undefined,
      },
    ]);
  });

  it('should get traded tokens for fill associated with order matcher relayer', () => {
    const fill = {
      ...baseFill,
      assets: [
        {
          tokenResolved: true,
          amount: 1674924411,
          tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          bridgeAddress: '0x533344cfdf2a3e911e2cf4c6f5ed08e791f5355f',
          bridgeData:
            '0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          actor: 0,
          price: {
            USD: 1,
          },
          value: {
            USD: 1674.924411,
          },
          token: {
            decimals: 6,
            type: 0,
          },
        },
        {
          tokenResolved: true,
          amount: 7.45216100214005e18,
          tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          actor: 1,
          token: {
            decimals: 18,
            type: 0,
          },
          price: {
            USD: 2,
          },
          value: {
            USD: 14.9043220043,
          },
        },
        {
          tokenResolved: true,
          amount: 1274924411,
          tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          actor: 0,
          price: {
            USD: 1,
          },
          value: {
            USD: 1274.924411,
          },
          token: {
            decimals: 6,
            type: 0,
          },
        },
      ],
      relayerId: 15,
      relayer: {
        name: 'Tokenmon',
        orderMatcher: true,
      },
    };
    const tradedTokens = getTradedTokens(fill);

    expect(tradedTokens).toEqual([
      {
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        filledAmount: 2949.848822,
        filledAmountUSD: 2949.848822,
        priceUSD: 1,
        tradedAmount: 1474.924411,
        tradedAmountUSD: 1474.924411,
        tradeCountContribution: 0.5,
        type: 0,
      },
      {
        address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        filledAmount: 7.45216100214005,
        filledAmountUSD: 14.9043220043,
        priceUSD: 2,
        tradedAmount: 3.726080501070025,
        tradedAmountUSD: 7.45216100215,
        tradeCountContribution: 0.5,
        type: 0,
      },
    ]);
  });

  it('should get traded tokens for fill with unknown tokens associated with order matcher relayer', () => {
    const fill = {
      ...baseFill,
      assets: [
        {
          tokenResolved: false,
          amount: 1674924411,
          tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          bridgeAddress: '0x533344cfdf2a3e911e2cf4c6f5ed08e791f5355f',
          bridgeData:
            '0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          actor: 0,
        },
        {
          tokenResolved: false,
          amount: 7.45216100214005e18,
          tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          actor: 1,
        },
        {
          tokenResolved: false,
          amount: 1274924411,
          tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          actor: 0,
        },
      ],
      relayerId: 15,
      relayer: {
        name: 'Tokenmon',
        orderMatcher: true,
      },
    };
    const tradedTokens = getTradedTokens(fill);

    expect(tradedTokens).toEqual([
      {
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        filledAmount: undefined,
        filledAmountUSD: undefined,
        priceUSD: undefined,
        tradedAmount: undefined,
        tradedAmountUSD: undefined,
        tradeCountContribution: 0.5,
        type: undefined,
      },
      {
        address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        filledAmount: undefined,
        filledAmountUSD: undefined,
        priceUSD: undefined,
        tradedAmount: undefined,
        tradedAmountUSD: undefined,
        tradeCountContribution: 0.5,
        type: undefined,
      },
    ]);
  });

  it('should get traded tokens for fill with mix of known and unknown tokens', () => {
    const fill = {
      ...baseFill,
      assets: [
        {
          tokenResolved: false,
          amount: 1674924411,
          tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          bridgeAddress: '0x533344cfdf2a3e911e2cf4c6f5ed08e791f5355f',
          bridgeData:
            '0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          actor: 0,
        },
        {
          tokenResolved: true,
          amount: 7.45216100214005e18,
          tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          actor: 1,
          token: {
            decimals: 18,
            type: 0,
          },
          price: {
            USD: 2,
          },
          value: {
            USD: 14.9043220043,
          },
        },
        {
          tokenResolved: false,
          amount: 1274924411,
          tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          actor: 0,
        },
      ],
      relayerId: 15,
      relayer: {
        name: 'Tokenmon',
        orderMatcher: true,
      },
    };
    const tradedTokens = getTradedTokens(fill);

    expect(tradedTokens).toEqual([
      {
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        filledAmount: undefined,
        filledAmountUSD: undefined,
        priceUSD: undefined,
        tradedAmount: undefined,
        tradedAmountUSD: undefined,
        tradeCountContribution: 0.5,
        type: undefined,
      },
      {
        address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        filledAmount: 7.45216100214005,
        filledAmountUSD: 14.9043220043,
        priceUSD: 2,
        tradedAmount: 3.726080501070025,
        tradedAmountUSD: 7.45216100215,
        tradeCountContribution: 0.5,
        type: 0,
      },
    ]);
  });

  it('should have zero trade volume when fill not associated with a relayer', () => {
    const fill = {
      ...baseFill,
      assets: [
        {
          tokenResolved: true,
          amount: 1674924411,
          tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          bridgeAddress: '0x533344cfdf2a3e911e2cf4c6f5ed08e791f5355f',
          bridgeData:
            '0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          actor: 0,
          price: {
            USD: 1,
          },
          value: {
            USD: 1674.924411,
          },
          token: {
            decimals: 6,
            type: 0,
          },
        },
        {
          tokenResolved: true,
          amount: 7.45216100214005e18,
          tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          actor: 1,
          token: {
            decimals: 18,
            type: 0,
          },
          price: {
            USD: 2,
          },
          value: {
            USD: 14.9043220043,
          },
        },
        {
          tokenResolved: true,
          amount: 1274924411,
          tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          actor: 0,
          price: {
            USD: 1,
          },
          value: {
            USD: 1274.924411,
          },
          token: {
            decimals: 6,
            type: 0,
          },
        },
      ],
      relayerId: undefined,
      relayer: null,
    };
    const tradedTokens = getTradedTokens(fill);

    expect(tradedTokens).toEqual([
      {
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        filledAmount: 2949.848822,
        filledAmountUSD: 2949.848822,
        priceUSD: 1,
        tradedAmount: 2949.848822,
        tradedAmountUSD: 2949.848822,
        tradeCountContribution: 1,
        type: 0,
      },
      {
        address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        filledAmount: 7.45216100214005,
        filledAmountUSD: 14.9043220043,
        priceUSD: 2,
        tradedAmount: 7.45216100214005,
        tradedAmountUSD: 14.9043220043,
        tradeCountContribution: 1,
        type: 0,
      },
    ]);
  });
});
