const ethers = require('ethers');

const logsInterface = new ethers.utils.Interface([
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'fromToken',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'toToken',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'fromTokenAmount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'toTokenAmount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'from',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
    ],
    name: 'ERC20BridgeTransfer',
    type: 'event',
  },
  { payable: true, stateMutability: 'payable', type: 'fallback' },
  {
    constant: false,
    inputs: [
      { internalType: 'address', name: 'toTokenAddress', type: 'address' },
      { internalType: 'address', name: 'from', type: 'address' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'bytes', name: 'bridgeData', type: 'bytes' },
    ],
    name: 'bridgeTransferFrom',
    outputs: [{ internalType: 'bytes4', name: 'success', type: 'bytes4' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      { internalType: 'bytes32', name: '', type: 'bytes32' },
      { internalType: 'bytes', name: '', type: 'bytes' },
    ],
    name: 'isValidSignature',
    outputs: [{ internalType: 'bytes4', name: 'magicValue', type: 'bytes4' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
]);

const extractERC20BridgeTransferEvents = transactionReceipt => {
  const bridgeTransferLogs = transactionReceipt.logs.filter(log =>
    log.topics.includes(
      '0x349fc08071558d8e3aa92dec9396e4e9f2dfecd6bb9065759d1932e7da43b8a9',
    ),
  );

  const events = bridgeTransferLogs.map(log => {
    const { blockNumber, logIndex, transactionHash } = log;
    const parsedLog = logsInterface.parseLog(log);

    const {
      from,
      fromToken,
      fromTokenAmount,
      to,
      toToken,
      toTokenAmount,
    } = parsedLog.args;

    return {
      blockNumber,
      data: {
        from,
        fromToken,
        fromTokenAmount: fromTokenAmount.toString(),
        to,
        toToken,
        toTokenAmount: toTokenAmount.toString(),
      },
      logIndex,
      transactionHash,
      type: 'ERC20BridgeTransfer',
      protocolVersion: 3,
    };
  });

  return events;
};

module.exports = extractERC20BridgeTransferEvents;
