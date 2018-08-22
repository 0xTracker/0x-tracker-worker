const add = require('./add');

it('should return 2 when adding 1 & 1', () => {
  const result = add(1, 1);

  expect(result).toBe(2);
});
