const { UnsupportedAssetError } = require('../../errors');
const normalizeEventArgs = require('./normalize-event-args');

const simpleV2Args = {
  makerAddress: '0x5b50fb8281cb679a3102d3de22dd05a1ad895e8f',
  feeRecipientAddress: '0x0000000000000000000000000000000000000000',
  takerAddress: '0xf3f694cbe3a1042a886ce923fab00ca649e6a89b',
  senderAddress: '0xf3f694cbe3a1042a886ce923fab00ca649e6a89b',
  makerAssetFilledAmount: 1,
  takerAssetFilledAmount: 100000000000000,
  makerFeePaid: 0,
  takerFeePaid: 0,
  orderHash:
    '0xb0d28d8c36f40322408b3ff4ac41d2bf6ac6c834633763d3b42831d50e30b455',
  makerAssetData:
    '0x0257179200000000000000000000000006012c8cf97bead5deae237070f9587f8e7a266d00000000000000000000000000000000000000000000000000000000000d29fe',
  takerAssetData:
    '0xf47261b0000000000000000000000000e41d2489571d322189246dafa5ebde1f4699f498',
};

describe('normalizeFillArgs', () => {
  it('should normalize args for V1 event', () => {
    const normalized = normalizeEventArgs(
      {
        maker: '0x0e7c68992fe035f4ed9607866483cf6ae7db6b71',
        taker: '0xe269e891a2ec8585a378882ffa531141205e92e9',
        feeRecipient: '0xe269e891a2ec8585a378882ffa531141205e92e9',
        makerToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        takerToken: '0x58a4884182d9e835597f405e5f258290e46ae7c2',
        filledMakerTokenAmount: 1292498732163907300,
        filledTakerTokenAmount: 4.2620995342647e23,
        paidMakerFee: 0,
        paidTakerFee: 0,
        tokens:
          '0x5cffc03e6c0c089fd8fbd02701b8f30ae193cf1d219a510c4d4f012807fab706',
        orderHash:
          '0x9af44f4536831684cacda6dbba6af9974f0b9e8b2fc271f4fa8ff18c6fd51e12',
      },
      1,
    );

    expect(normalized).toMatchSnapshot();
  });

  it('should normalize args for V2 event with recognized assets', () => {
    const normalized = normalizeEventArgs(simpleV2Args, 2);

    expect(normalized).toMatchSnapshot();
  });

  it('should throw UnsupportedAssetError when maker asset data is invalid', () => {
    expect(() => {
      normalizeEventArgs({ ...simpleV2Args, makerAssetData: 'invalid' }, 2);
    }).toThrow(UnsupportedAssetError);
  });

  it('should throw UnsupportedAssetError when taker asset data is invalid', () => {
    expect(() => {
      normalizeEventArgs({ ...simpleV2Args, takerAssetData: 'invalid' }, 2);
    }).toThrow(UnsupportedAssetError);
  });
});
