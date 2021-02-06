const { JOB, QUEUE } = require('../constants');
const { publishJob } = require('../queues');
const Event = require('../model/event');

const batchScheduleTransactionFetch = async ({ batchSize }, { logger }) => {
  logger.info(`scheduling transaction fetch for batch of fills: ${batchSize}`);

  // Fetch a batch of unprocessed events
  const events = await Event.find({
    'scheduler.transactionFetchScheduled': { $in: [null, false] },
    type: {
      $in: [
        'Fill',
        'LimitOrderFilled',
        'LiquidityProviderSwap',
        'LogFill',
        'RfqOrderFilled',
        'SushiswapSwap',
        'TransformedERC20',
        'UniswapV2Swap',
      ],
    },
  })
    .select('_id blockNumber transactionHash')
    .limit(batchSize)
    .lean();

  // Determine the transactions to schedule fetch of
  const txs = events.reduce((acc, current) => {
    if (acc.some(tx => tx.transactionHash === current.transactionHash)) {
      return acc;
    }

    return [
      ...acc,
      {
        blockNumber: current.blockNumber,
        transactionHash: current.transactionHash,
      },
    ];
  }, []);

  // Schedule fetch of transaction data
  await Promise.all(
    txs.map(async tx => {
      await publishJob(
        QUEUE.TRANSACTION_PROCESSING,
        JOB.FETCH_TRANSACTION,
        {
          blockNumber: tx.blockNumber,
          transactionHash: tx.transactionHash,
        },
        { jobId: `fetch-transaction-${tx.transactionHash}` },
      );
    }),
  );

  logger.info(`scheduled fetch of transactions: ${txs.length}`);

  // Mark events as processed
  await Event.updateMany(
    {
      _id: { $in: events.map(event => event._id) },
    },
    { $set: { 'scheduler.transactionFetchScheduled': true } },
  );

  logger.info(`scheduled transaction fetch for batch of fills: ${batchSize}`);
};

module.exports = batchScheduleTransactionFetch;
