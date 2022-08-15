const _ = require('lodash');
const { FILL_ATTRIBUTION_TYPE } = require('../constants');

const ORDER_MATCHER_RELAYERS = [
  '1d45a35f-11fe-47be-84d9-03db561c14ee',
  '9d72a8f4-d944-41c9-96e4-2636ea26eba1',
  'a5808078-d297-4fbd-a818-dccd8a5438ed',
  'f6a543cc-539e-4040-8885-4fb961be29e4',
  'e34fc87a-4bba-48dd-a2a4-57672eb8068c',
  '44bde452-9bca-4175-96c7-d206f55531bc',
];

const getTradeCountContribution = fill => {
  const orderMatcherRelayer = _.some(
    fill.attributions,
    attribution =>
      attribution.type === FILL_ATTRIBUTION_TYPE.RELAYER &&
      ORDER_MATCHER_RELAYERS.includes(attribution.entityId),
  );

  return orderMatcherRelayer ? 0.5 : 1;
};

module.exports = getTradeCountContribution;
