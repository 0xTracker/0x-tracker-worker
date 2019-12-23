const createDocument = require('./create-document');
const V2_FILL = require('../../fixtures/fills/v2');

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
