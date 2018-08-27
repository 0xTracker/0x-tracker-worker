const moment = require('moment');

require('moment-round');

const getRoundedDates = date => ({
  day: moment(date)
    .utc()
    .startOf('day')
    .toDate(),
  halfHour: moment(date)
    .utc()
    .floor(30, 'minutes')
    .toDate(),
  hour: moment(date)
    .utc()
    .startOf('hour')
    .toDate(),
  minute: moment(date)
    .utc()
    .startOf('minute')
    .toDate(),
});

module.exports = getRoundedDates;
