const config = require('config');

const { configure, getTokenInfo } = require('./ethplorer');

beforeAll(() => {
  configure(config.get('ethplorer'));
});

describe('ethplorer.getTokenInfo', () => {
  it('should fetch info for recognised token', async () => {
    const tokenInfo = await getTokenInfo(
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    );

    expect(tokenInfo).toMatchSnapshot();
  });

  it('should return null for unrecognised token', async () => {
    const tokenInfo = await getTokenInfo('0x9200983');

    expect(tokenInfo).toBeNull();
  });

  it('should return null for invalid address', async () => {
    const tokenInfo = await getTokenInfo('harbard');

    expect(tokenInfo).toBeNull();
  });
});
