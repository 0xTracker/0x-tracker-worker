const { resolveAttributions } = require('.');
const getEntityDefinitions = require('./get-entity-definitions');

jest.mock('./get-entity-definitions');

describe('attributions/resolveAttributions', () => {
  beforeAll(() => {
    getEntityDefinitions.mockReturnValue([
      {
        id: '8fc6beb5-3019-45f7-a55a-9a4c6b4b6513',
        name: '1inch.exchange',
        mappings: [
          {
            type: 'relayer',
            feeRecipientAddress: '0x4d37f28d2db99e8d35a6c725a5f1749a085850a3',
          },
          {
            type: 'relayer',
            feeRecipientAddress: '0x68a17b587caf4f9329f0e372e3a78d23a46de6b5',
          },
          {
            type: 'consumer',
            takerAddress: '0x11111254369792b2ca5d084ab5eea397ca8fa48b',
          },
        ],
      },
      {
        id: 'f3db0044-858a-4a0a-bcea-0b6ac8610c70',
        name: 'Odee',
        mappings: [
          {
            type: 'relayer',
            feeRecipientAddress: '0x382310cbb159b64c2e7c5675d110202701a436dd',
          },
        ],
      },
      {
        id: '5067df8b-f9cd-4a34-aee1-38d607100145',
        name: 'Matcha',
        mappings: [
          {
            type: 'relayer',
            feeRecipientAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
          },
          {
            type: 'consumer',
            affiliateAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
          },
        ],
      },
      {
        id: '4cdcde07-8ca7-4ad0-9d80-3f6d16400f14',
        name: 'Paradex',
        mappings: [
          {
            type: 'relayer',
            takerAddress: '0x4969358e80cdc3d74477d7447bffa3b2e2acbe92',
          },
        ],
      },
      {
        id: 'daea0778-bec0-42fc-abe1-775519818af0',
        name: 'Dodgy Relayer',
        mappings: [
          {
            type: 'relayer',
            takerAddress: '0xd2045edc40199019e221d71c0913343f7908d0d5',
          },
        ],
      },
      {
        id: '5c8d3862-fe9b-43d3-bc73-1ee8f305b7a2',
        name: 'Gods Unchained',
        mappings: [
          {
            type: 'relayer',
            senderAddress: '0xb04239b53806ab31141e6cd47c63fb3480cac908',
          },
        ],
      },
      {
        id: 'a5808078-d297-4fbd-a818-dccd8a5438ed',
        name: 'STAR BIT',
        mappings: [
          {
            type: 'relayer',
            feeRecipientAddress: '0x8124071f810d533ff63de61d0c98db99eeb99d64',
          },
          {
            type: 'relayer',
            feeRecipientAddress: '0xc370d2a5920344aa6b7d8d11250e3e861434cbdd',
          },
          {
            type: 'relayer',
            takerAddress: '0x0681e844593a051e2882ec897ecd5444efe19ff2',
          },
        ],
      },
    ]);
  });

  it('should resolve consumer which matches on taker address', () => {
    const attributions = resolveAttributions({
      feeRecipientAddress: '0x55662e225a3376759c24331a9aed764f8f0c9fbb',
      takerAddress: '0x11111254369792b2ca5d084ab5eea397ca8fa48b',
    });

    expect(attributions).toEqual([
      { id: '8fc6beb5-3019-45f7-a55a-9a4c6b4b6513', type: 'consumer' },
    ]);
  });

  it('should resolve relayer which matches on fee recipient address', () => {
    const attributions = resolveAttributions({
      feeRecipientAddress: '0x382310cbb159b64c2e7c5675d110202701a436dd',
      takerAddress: '0x693c188e40f760ecf00d2946ef45260b84fbc43e',
    });

    expect(attributions).toEqual([
      { id: 'f3db0044-858a-4a0a-bcea-0b6ac8610c70', type: 'relayer' },
    ]);
  });

  it('should resolve relayer which matches on taker address', () => {
    const attributions = resolveAttributions({
      feeRecipientAddress: '0x55662e225a3376759c24331a9aed764f8f0c9fbb',
      takerAddress: '0x4969358e80cdc3d74477d7447bffa3b2e2acbe92',
    });

    expect(attributions).toEqual([
      { id: '4cdcde07-8ca7-4ad0-9d80-3f6d16400f14', type: 'relayer' },
    ]);
  });

  it('should resolve consumer which matches on affiliate address', () => {
    const attributions = resolveAttributions({
      affiliateAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
      feeRecipientAddress: '0x55662e225a3376759c24331a9aed764f8f0c9fbb',
    });

    expect(attributions).toEqual([
      { id: '5067df8b-f9cd-4a34-aee1-38d607100145', type: 'consumer' },
    ]);
  });

  it('should resolve mixed relayer-consumer combination', () => {
    const attributions = resolveAttributions({
      affiliateAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
      feeRecipientAddress: '0x382310cbb159b64c2e7c5675d110202701a436dd',
    });

    expect(attributions).toEqual([
      { id: 'f3db0044-858a-4a0a-bcea-0b6ac8610c70', type: 'relayer' },
      { id: '5067df8b-f9cd-4a34-aee1-38d607100145', type: 'consumer' },
    ]);
  });

  it('should resolve matching relayer-consumer combination', () => {
    const attributions = resolveAttributions({
      affiliateAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
      feeRecipientAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
    });

    expect(attributions).toEqual([
      { id: '5067df8b-f9cd-4a34-aee1-38d607100145', type: 'relayer' },
      { id: '5067df8b-f9cd-4a34-aee1-38d607100145', type: 'consumer' },
    ]);
  });

  it('should resolve relayer which matches on sender address', () => {
    const attributions = resolveAttributions({
      feeRecipientAddress: '0x0000000000000000000000000000000000000000',
      senderAddress: '0xb04239b53806ab31141e6cd47c63fb3480cac908',
      takerAddress: '0xf7eb7637ded2696b152c7d5edee502902b0f1c91',
    });

    expect(attributions).toEqual([
      { id: '5c8d3862-fe9b-43d3-bc73-1ee8f305b7a2', type: 'relayer' },
    ]);
  });

  it('should resolve relayer when multiple matches exist', () => {
    const attributions = resolveAttributions({
      feeRecipientAddress: '0x8124071f810d533ff63de61d0c98db99eeb99d64',
      takerAddress: '0x0681e844593a051e2882ec897ecd5444efe19ff2',
    });

    expect(attributions).toEqual([
      { id: 'a5808078-d297-4fbd-a818-dccd8a5438ed', type: 'relayer' },
    ]);
  });

  it('should throw an error when multiple matching relayers found', () => {
    expect(() =>
      resolveAttributions({
        feeRecipientAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
        takerAddress: '0xd2045edc40199019e221d71c0913343f7908d0d5',
        transactionToAddress: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
      }),
    ).toThrow(
      new Error(
        'Multiple relayer attribution entities match metadata:' +
          '\r\n\r\n' +
          'affiliateAddress: (none)\r\n' +
          'feeRecipientAddress: 0x86003b044f70dac0abc80ac8957305b6370893ed\r\n' +
          'senderAddress: (none)\r\n' +
          'takerAddress: 0xd2045edc40199019e221d71c0913343f7908d0d5\r\n' +
          'transactionToAddress: 0xdef1c0ded9bec7f1a1670819833240f027b25eff',
      ),
    );
  });

  it('should throw an error when multiple matching consumers found', () => {
    expect(() =>
      resolveAttributions({
        affiliateAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
        takerAddress: '0x11111254369792b2ca5d084ab5eea397ca8fa48b',
        transactionToAddress: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
      }),
    ).toThrow(
      new Error(
        'Multiple consumer attribution entities match metadata:' +
          '\r\n\r\n' +
          'affiliateAddress: 0x86003b044f70dac0abc80ac8957305b6370893ed\r\n' +
          'feeRecipientAddress: (none)\r\n' +
          'senderAddress: (none)\r\n' +
          'takerAddress: 0x11111254369792b2ca5d084ab5eea397ca8fa48b\r\n' +
          'transactionToAddress: 0xdef1c0ded9bec7f1a1670819833240f027b25eff',
      ),
    );
  });
});
