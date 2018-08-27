const { getRecipients, loadRecipients } = require('./recipient-cache');

beforeEach(() => {
  fetch.resetMocks();
});

describe('loadRecipients', () => {
  it('should fetch fee recipients from ERC dEX', async () => {
    fetch.mockResponseOnce(JSON.stringify([]));

    await loadRecipients();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.ercdex.com/api/fees/recipients/1',
    );
  });

  it('should throw an error when response is invalid JSON', () => {
    fetch.mockResponseOnce('foo bar');

    return expect(loadRecipients()).rejects.toEqual(expect.any(Error));
  });

  it('should throw an error when fetch fails', () => {
    const error = new Error('Network failure');

    fetch.mockReject(error);

    return expect(loadRecipients()).rejects.toBe(error);
  });
});

describe('getRecipients', () => {
  it('should return empty array before loading', () => {
    const recipients = getRecipients();

    expect(recipients).toEqual([]);
  });

  it('should return loaded recipients', async () => {
    fetch.mockResponseOnce(JSON.stringify(['a', 'b', 'c']));
    await loadRecipients();

    const recipients = getRecipients();

    expect(recipients).toEqual(['a', 'b', 'c']);
  });
});
