const axios = require('axios');

const { getRecipients, loadRecipients } = require('./recipient-cache');

jest.mock('axios');

describe('getRecipients', () => {
  it('should return empty array before loading', () => {
    const recipients = getRecipients();

    expect(recipients).toEqual([]);
  });

  it('should return loaded recipients', async () => {
    axios.get.mockResolvedValueOnce({ data: { records: ['a', 'b', 'c'] } });

    await loadRecipients();

    const recipients = getRecipients();

    expect(recipients).toEqual(['a', 'b', 'c']);
  });
});
