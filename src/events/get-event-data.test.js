const { UnsupportedAssetError } = require('../errors');
const getEventData = require('./get-event-data');
const V2_EVENT = require('../fixtures/events/v2');
const V3_EVENT = require('../fixtures/events/v3');

const eventWithArgs = (event, args) => ({
  ...event,
  data: {
    ...event.data,
    args: {
      ...event.data.args,
      ...args,
    },
  },
});

describe('getEventData', () => {
  it('should get data for V2 event', () => {
    const normalized = getEventData(V2_EVENT);
    expect(normalized).toMatchSnapshot();
  });

  it('should get data for V3 event', () => {
    const normalized = getEventData(V3_EVENT);
    expect(normalized).toMatchSnapshot();
  });

  it('should throw UnsupportedAssetError when maker asset data is invalid', () => {
    const event = eventWithArgs(V2_EVENT, { makerAssetData: 'invalid' });

    expect(() => {
      getEventData(event);
    }).toThrow(UnsupportedAssetError);
  });

  it('should throw UnsupportedAssetError when taker asset data is invalid', () => {
    const event = eventWithArgs(V2_EVENT, { takerAssetData: 'invalid' });

    expect(() => {
      getEventData(event);
    }).toThrow(UnsupportedAssetError);
  });
});
