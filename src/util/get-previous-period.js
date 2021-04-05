const moment = require('moment');

const getPreviousPeriod = (dateFrom, dateTo) => {
  const diff = moment(dateTo).diff(dateFrom);
  const prevDateTo = moment(dateFrom)
    .subtract(1, 'millisecond')
    .toDate();
  const prevDateFrom = moment(prevDateTo)
    .subtract(diff, 'millisecond')
    .toDate();

  return { prevDateFrom, prevDateTo };
};

module.exports = getPreviousPeriod;
