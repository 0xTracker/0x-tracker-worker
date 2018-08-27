const moment = require('moment');

const getRoundedDates = require('./get-rounded-dates');

it('rounds to the start of day', () => {
  const expected = moment('2017-12-13T00:00:00Z').toDate();
  const date = moment('2017-12-13T08:45:37Z');
  const roundedDates = getRoundedDates(date);

  expect(roundedDates.day).toEqual(expected);
});

it('rounds to the start of hour', () => {
  const expected = moment('2017-12-13T08:00:00Z').toDate();
  const date = moment('2017-12-13T08:45:37Z');
  const roundedDates = getRoundedDates(date);

  expect(roundedDates.hour).toEqual(expected);
});

it('rounds to the start of minute', () => {
  const expected = moment('2017-12-13T08:45:00Z').toDate();
  const date = moment('2017-12-13T08:45:37Z');
  const roundedDates = getRoundedDates(date);

  expect(roundedDates.minute).toEqual(expected);
});

it('rounds to the hour when less than thirty minutes', () => {
  const expected = moment('2017-12-13T08:00:00Z').toDate();
  const date = moment('2017-12-13T08:15:37Z');
  const roundedDates = getRoundedDates(date);

  expect(roundedDates.halfHour).toEqual(expected);
});

it('rounds to the half hour when more than thirty minutes', () => {
  const expected = moment('2017-12-13T08:30:00Z').toDate();
  const date = moment('2017-12-13T08:45:37Z');
  const roundedDates = getRoundedDates(date);

  expect(roundedDates.halfHour).toEqual(expected);
});

it('rounds to the half hour when on the half hour', () => {
  const expected = moment('2017-12-13T08:30:00Z').toDate();
  const date = moment('2017-12-13T08:30:00Z');
  const roundedDates = getRoundedDates(date);

  expect(roundedDates.halfHour).toEqual(expected);
});

it('rounds to the hour when on the hour', () => {
  const expected = moment('2017-12-13T08:00:00Z').toDate();
  const date = moment('2017-12-13T08:00:00Z');
  const roundedDates = getRoundedDates(date);

  expect(roundedDates.halfHour).toEqual(expected);
});
