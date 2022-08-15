const parseAssetData = require('./parse-asset-data');

describe('utils/parseAssetData', () => {
  it('should return empty array when asset data is 0x', () => {
    const assets = parseAssetData('0x', 0);

    expect(assets).toEqual([]);
  });

  it('should return empty array when asset data is 0x0', () => {
    const assets = parseAssetData('0x0', 0);

    expect(assets).toEqual([]);
  });

  it('should return empty array when asset data is 0x00000', () => {
    const assets = parseAssetData('0x00000', 0);

    expect(assets).toEqual([]);
  });

  it('should return empty array when asset data is 0x0000000000', () => {
    const assets = parseAssetData('0x0000000000', 0);

    expect(assets).toEqual([]);
  });
});
