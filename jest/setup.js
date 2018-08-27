const jestFetchMock = require('jest-fetch-mock');

global.fetch = jestFetchMock;
