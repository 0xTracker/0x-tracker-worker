const { FILL_ACTOR, TOKEN_TYPE } = require('../../constants');
const { checkTokenResolved } = require('../../tokens/token-cache');

const getV1Assets = eventArgs => {
  return [
    {
      actor: FILL_ACTOR.MAKER,
      amount: eventArgs.filledMakerTokenAmount,
      tokenAddress: eventArgs.makerToken,
      tokenResolved: checkTokenResolved(eventArgs.makerToken),
      tokenType: TOKEN_TYPE.ERC20,
    },
    {
      actor: FILL_ACTOR.TAKER,
      amount: eventArgs.filledTakerTokenAmount,
      tokenAddress: eventArgs.takerToken,
      tokenResolved: checkTokenResolved(eventArgs.takerToken),
      tokenType: TOKEN_TYPE.ERC20,
    },
  ];
};

module.exports = getV1Assets;
