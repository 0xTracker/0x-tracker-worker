const timekeeper = require('timekeeper');

const getDocumentForFillsIndex = require('./get-document-for-fills-index');
const V2_FILL = require('../fixtures/fills/v2');
const V3_FILL = require('../fixtures/fills/v3');

beforeAll(() => {
  timekeeper.freeze('2019-10-21T03:00:00.000Z');
});

afterAll(() => {
  timekeeper.reset();
});

it('should create Elasticsearch document for fill', () => {
  const doc = getDocumentForFillsIndex(V2_FILL);
  expect(doc).toMatchSnapshot();
});

it('should exclude value property when fill is unmeasured', () => {
  const fill = {
    ...V2_FILL,
    conversions: {
      ...V2_FILL.conversions,
      USD: { ...V2_FILL.conversions.USD, amount: null },
    },
  };
  const doc = getDocumentForFillsIndex(fill);

  expect(doc.value).toBeUndefined();
});

it('assets should include bridgeAddress property when asset is bridged', () => {
  const fill = {
    ...V2_FILL,
    assets: V2_FILL.assets.map(asset => ({
      ...asset,
      bridgeAddress: '0x58b7b96e170e46c07d02fac903cd1b3356b7549f',
    })),
  };
  const doc = getDocumentForFillsIndex(fill);

  expect(doc.assets).toMatchSnapshot();
});

it('should include any attributions associated with the fill', () => {
  const fill = {
    ...V2_FILL,
    attributions: [
      {
        entityId: '8fc6beb5-3019-45f7-a55a-9a4c6b4b6513',
        type: 0,
      },
      {
        entityId: '5067df8b-f9cd-4a34-aee1-38d607100145',
        type: 1,
      },
    ],
  };
  const doc = getDocumentForFillsIndex(fill);

  expect(doc.attributions).toEqual([
    {
      id: '8fc6beb5-3019-45f7-a55a-9a4c6b4b6513',
      type: 0,
    },
    {
      id: '5067df8b-f9cd-4a34-aee1-38d607100145',
      type: 1,
    },
  ]);
});

it('should index protocol fee for V3 fills', () => {
  const doc = getDocumentForFillsIndex(V3_FILL);

  expect(doc.protocolFeeETH).toBe(1500000000150000);
  expect(doc.protocolFeeUSD).toBe(0.338445000033844);
});

it('should index transaction sender as taker in traders field when take is contract', () => {
  const doc = getDocumentForFillsIndex(V2_FILL);

  expect(V2_FILL.takerMetadata.isContract).toBe(true);
  expect(V2_FILL.transaction.from).toBe(
    '0xffa5bfe92b6791dad23c7837abb790b48c2f8995',
  );

  expect(doc.traders).toEqual([
    expect.anything(),
    '0xffa5bfe92b6791dad23c7837abb790b48c2f8995',
  ]);
});
