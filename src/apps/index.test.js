const { getAppDefinitions } = require('../definitions/apps');
const { resolveApps } = require('.');

jest.mock('../definitions/apps');

describe('apps', () => {
  describe('resolveAppAttributions', () => {
    beforeAll(() => {
      getAppDefinitions.mockReturnValue([
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
            {
              type: 'relayer',
              takerAddress: '0xd2045edc40199019e221d71c0913343f7908d0d5',
            },
          ],
        },
      ]);
    });

    it('should resolve consumer which matches on taker address', () => {
      const apps = resolveApps({
        feeRecipientAddress: '0x55662e225a3376759c24331a9aed764f8f0c9fbb',
        takerAddress: '0x11111254369792b2ca5d084ab5eea397ca8fa48b',
      });

      expect(apps).toEqual([
        { id: '8fc6beb5-3019-45f7-a55a-9a4c6b4b6513', type: 'consumer' },
      ]);
    });

    it('should resolve relayer which matches on fee recipient address', () => {
      const apps = resolveApps({
        feeRecipientAddress: '0x382310cbb159b64c2e7c5675d110202701a436dd',
        takerAddress: '0x693c188e40f760ecf00d2946ef45260b84fbc43e',
      });

      expect(apps).toEqual([
        { id: 'f3db0044-858a-4a0a-bcea-0b6ac8610c70', type: 'relayer' },
      ]);
    });

    it('should resolve relayer which matches on taker address', () => {
      const apps = resolveApps({
        feeRecipientAddress: '0x55662e225a3376759c24331a9aed764f8f0c9fbb',
        takerAddress: '0x4969358e80cdc3d74477d7447bffa3b2e2acbe92',
      });

      expect(apps).toEqual([
        { id: '4cdcde07-8ca7-4ad0-9d80-3f6d16400f14', type: 'relayer' },
      ]);
    });

    it('should resolve consumer which matches on affiliate address', () => {
      const apps = resolveApps({
        affiliateAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
        feeRecipientAddress: '0x55662e225a3376759c24331a9aed764f8f0c9fbb',
      });

      expect(apps).toEqual([
        { id: '5067df8b-f9cd-4a34-aee1-38d607100145', type: 'consumer' },
      ]);
    });

    it('should resolve mixed relayer-consumer combination', () => {
      const apps = resolveApps({
        affiliateAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
        feeRecipientAddress: '0x382310cbb159b64c2e7c5675d110202701a436dd',
      });

      expect(apps).toEqual([
        { id: 'f3db0044-858a-4a0a-bcea-0b6ac8610c70', type: 'relayer' },
        { id: '5067df8b-f9cd-4a34-aee1-38d607100145', type: 'consumer' },
      ]);
    });

    it('should resolve matching relayer-consumer combination', () => {
      const apps = resolveApps({
        affiliateAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
        feeRecipientAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
      });

      expect(apps).toEqual([
        { id: '5067df8b-f9cd-4a34-aee1-38d607100145', type: 'relayer' },
        { id: '5067df8b-f9cd-4a34-aee1-38d607100145', type: 'consumer' },
      ]);
    });
  });
});
