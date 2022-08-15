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

  if (periodInDays === 1) {
    const dateTo = moment.utc().toDate();
    const dateFrom = moment(dateTo)
      .subtract(24, 'hours')
      .toDate();

    return { dateFrom, dateTo };
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
