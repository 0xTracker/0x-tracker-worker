const moment = require('moment');

const getStartDate = (periodInDays, endDate) => {
  const endMoment = moment.utc(endDate);

  return endMoment
    .subtract(periodInDays - 1, 'days')
    .startOf('day')
    .toDate();
};

const getDatesForTimePeriod = periodInDays => {
  if (periodInDays === null) {
    return null;
  }

  const dateTo = moment
    .utc()
    .endOf('day')
    .toDate();

  const dateFrom = getStartDate(periodInDays, dateTo);

  return {
    dateFrom,
    dateTo,
  };
};

module.exports = getDatesForTimePeriod;
