const getUniqTokens = require('./get-uniq-tokens');

describe('getUniqTokens', () => {
  it('should return empty array when fill has no assets or fees', () => {
    const fill = {};
    const tokens = getUniqTokens(fill);

    expect(tokens).toEqual(expect.arrayContaining([]));
  });
});
