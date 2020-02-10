const timekeeper = require('timekeeper');

const createDocument = require('./create-document');
const V2_FILL = require('../../fixtures/fills/v2');
const V3_FILL = require('../../fixtures/fills/v3');

beforeAll(() => {
  timekeeper.freeze('2019-10-21T03:00:00.000Z');
});

afterAll(() => {
  timekeeper.reset();
});

it('should create Elasticsearch document for fill', () => {
  const doc = createDocument(V2_FILL);
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
  const doc = createDocument(fill);

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
  const doc = createDocument(fill);

  expect(doc.assets).toMatchSnapshot();
});

it('should halve trade volume for orderMatcher fill and set tradeCountContribution to 0.5', () => {
  const fill = {
    ...V2_FILL,
    relayerId: 2,
  };
  const doc = createDocument(fill);

  expect(doc.tradeVolume).toBe(329.44788459646225);
  expect(doc.tradeCountContribution).toBe(0.5);
});

it('should index protocol fee for V3 fills', () => {
  const doc = createDocument(V3_FILL);

  expect(doc.protocolFeeETH).toBe(1500000000150000);
  expect(doc.protocolFeeUSD).toBe(0.338445000033844);
});

it('should set tradeVolume and tradeCountContribution to zero when relayerId is null', () => {
  const fill = {
    ...V2_FILL,
    relayerId: null,
  };
  const doc = createDocument(fill);

  expect(doc.tradeVolume).toBe(0);
  expect(doc.tradeCountContribution).toBe(0);
});

it('should set tradeVolume and tradeCountContribution to zero when relayerId is undefined', () => {
  const fill = {
    ...V2_FILL,
    relayerId: undefined,
  };
  const doc = createDocument(fill);

  expect(doc.tradeVolume).toBe(0);
  expect(doc.tradeCountContribution).toBe(0);
});
