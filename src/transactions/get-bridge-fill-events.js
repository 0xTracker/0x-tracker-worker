const ethers = require('ethers');

const logsInterface = new ethers.utils.Interface([
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'source',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'inputToken',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'outputToken',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'inputTokenAmount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'outputTokenAmount',
        type: 'uint256',
      },
    ],
    name: 'BridgeFill',
    type: 'event',
  },
]);

const getBridgeFillEvents = transactionReceipt => {
  const bridgeFillLogs = transactionReceipt.logs.filter(log =>
    log.topics.includes(
      '0xff3bc5e46464411f331d1b093e1587d2d1aa667f5618f98a95afc4132709d3a9',
    ),
  );

  const events = bridgeFillLogs.map(log => {
    const { blockNumber, logIndex, transactionHash } = log;
    const parsedLog = logsInterface.parseLog(log);

    const {
      inputTokenAmount,
      inputToken,
      outputToken,
      outputTokenAmount,
      source,
    } = parsedLog.args;

    return {
      blockNumber,
      data: {
        inputToken,
        inputTokenAmount: inputTokenAmount.toString(),
        outputToken,
        outputTokenAmount: outputTokenAmount.toString(),
        source: source.toString(),
      },
      logIndex,
      transactionHash,
      type: 'BridgeFill',
      protocolVersion: 4,
    };
  });

  return events;
};

module.exports = getBridgeFillEvents;
