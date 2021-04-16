const _ = require('lodash');
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
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'source',
        type: 'bytes32',
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
  const bridgeFillLogs = transactionReceipt.logs.filter(
    log =>
      log.topics.includes(
        '0xff3bc5e46464411f331d1b093e1587d2d1aa667f5618f98a95afc4132709d3a9',
      ) ||
      log.topics.includes(
        '0xe59e71a14fe90157eedc866c4f8c767d3943d6b6b2e8cd64dddcc92ab4c55af8',
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
        source: _.isString(source)
          ? ethers.utils
              .toUtf8String(source)
              .replace(/\0/g, '')
              .replace(/\2/g, '')
          : source.toString(),
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
