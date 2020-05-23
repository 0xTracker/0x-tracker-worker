const getAllRelayers = require('./get-all-relayers');

beforeEach(() => {
  jest.resetAllMocks();
});

it('should return all relayers', () => {
  const relayers = getAllRelayers();

  expect(relayers).toMatchSnapshot();
});
