const getPercentageChange = (valueA, valueB) => {
  if (valueA === 0) {
    return null;
  }

  return ((valueB - valueA) / valueA) * 100;
};

module.exports = getPercentageChange;
