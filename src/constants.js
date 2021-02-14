module.exports = {
  // ordered by priority e.g. in ETH/DAI pair DAI is the base token
  BASE_TOKENS: {
    '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359': 'DAI', // DAI Stablecoin
    '0xd9ebebfdab08c643c5f2837632de920c70a56247': 'DAI', // Ethfinex DAI
    '0x2da4f4ff3eb51bff53b66f00054d6cf8d028349f': 'DAI', // Ethfinex DAI V2
    '0x6b175474e89094c44da98b954eedeac495271d0f': 'DAI', // Multi-collateral DAI
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'USDC', // USD Coin
    '0xdac17f958d2ee523a2206206994597c13d831ec7': 'USDT', // Tether
    '0x1a9b2d827f26b7d7c18fec4c1b27c1e8deeba26e': 'USDT', // Ethfinex Tether
    '0x33d019eb137b853f0cdf555a5d5bd2749135ac31': 'USDT', // Ethfinex Tether V2
    '0x0000000000085d4780b73119b644ae5ecd22b376': 'TUSD', // True USD
    '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': 'ETH', // Ether
    '0x2956356cd2a2bf3202f771f50d3d14a367b48070': 'ETH', // Wrapped Ether
    '0xe495bcacaf29a0eb00fb67b86e9cd2a994dd55d8': 'ETH', // Wrapped Ether
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 'ETH', // Wrapped Ether
    '0x53b04999c1ff2d77fcdde98935bb936a67209e4c': 'ETH', // Veil Ether
    '0xaa7427d8f17d87a28f5e1ba3adbb270badbe1011': 'ETH', // Ethfinex Ether
    '0x50cb61afa3f023d17276dcfb35abf85c710d1cff': 'ETH', // Ethfinex Ether V2
    '0xe41d2489571d322189246dafa5ebde1f4699f498': 'ZRX', // 0x Protocol Token
    '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 'WBTC', // Wrapped Bitcoin
    '0x8e870d67f660d95d5be530380d0ec0bd388289e1': 'PAX', // Paxos Stablecoin
  },
  BASE_TOKEN_DECIMALS: {
    '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359': 18, // DAI Stablecoin
    '0xd9ebebfdab08c643c5f2837632de920c70a56247': 18, // Ethfinex DAI
    '0x2da4f4ff3eb51bff53b66f00054d6cf8d028349f': 18, // Ethfinex DAI V2
    '0x6b175474e89094c44da98b954eedeac495271d0f': 18, // Multi-collateral DAI
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 6, // USD Coin
    '0xdac17f958d2ee523a2206206994597c13d831ec7': 6, // Tether
    '0x1a9b2d827f26b7d7c18fec4c1b27c1e8deeba26e': 6, // Ethfinex Tether
    '0x33d019eb137b853f0cdf555a5d5bd2749135ac31': 6, // Ethfinex Tether V2
    '0x2956356cd2a2bf3202f771f50d3d14a367b48070': 18, // Wrapped Ether
    '0xe495bcacaf29a0eb00fb67b86e9cd2a994dd55d8': 18, // Wrapped Ether
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 18, // Wrapped Ether
    '0x53b04999c1ff2d77fcdde98935bb936a67209e4c': 18, // Veil Ether
    '0xaa7427d8f17d87a28f5e1ba3adbb270badbe1011': 18, // Ethfinex Ether
    '0x50cb61afa3f023d17276dcfb35abf85c710d1cff': 18, // Ethfinex Ether V2
    '0xe41d2489571d322189246dafa5ebde1f4699f498': 18, // 0x Protocol Token
    '0x0000000000085d4780b73119b644ae5ecd22b376': 18, // True USD
    '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 8, // Wrapped Bitcoin
    '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': 18, // Ether
    '0x8e870d67f660d95d5be530380d0ec0bd388289e1': 18, // Paxos Stablecoin
  },
  ETH_TOKEN_DECIMALS: 18,
  FILL_ACTOR: {
    MAKER: 0,
    TAKER: 1,
  },
  FILL_ATTRIBUTION_TYPE: {
    RELAYER: 0,
    CONSUMER: 1,
  },
  FILL_PRICING_STATUS: {
    PRICED: 0,
    UNPRICEABLE: 1,
  },
  FILL_STATUS: {
    FAILED: 2,
    PENDING: 0,
    SUCCESSFUL: 1,
  },
  FILL_TYPE: {
    REGULAR: 0,
    TRANSFORMED_ERC20: 1,
    UNISWAP_V2_SWAP: 2,
    SUSHISWAP_SWAP: 3,
    LIQUIDITY_PROVIDER_SWAP: 4,
    LIMIT_ORDER_FILLED: 5,
    RFQ_ORDER_FILLED: 6,
    BRIDGE_FILL: 7,
  },
  JOB: {
    BULK_UPDATE_TOKEN_METADATA: 'bulk-update-token-metadata',
    CONVERT_PROTOCOL_FEE: 'convert-protocol-fee',
    CONVERT_RELAYER_FEES: 'convert-relayer-fees',
    CREATE_FILLS_FOR_EVENT: 'create-fills-for-event',
    CREATE_SUSHISWAP_SWAP_EVENT_FILL: 'create-sushiswap-swap-event-fill',
    CREATE_TOKEN: 'create-token',
    CREATE_LIQUIDITY_PROVIDER_SWAP_EVENT_FILL:
      'create-liquidity-provider-swap-event-fill',
    CREATE_TRANSFORMED_ERC20_EVENT_FILLS:
      'create-transformed-erc20-event-fills',
    CREATE_UNISWAP_V2_SWAP_EVENT_FILL: 'create-uniswap-v2-swap-event-fill',
    FETCH_ADDRESS_TYPE: 'fetch-address-type',
    FETCH_TOKEN_METADATA: 'fetch-token-metadata',
    FETCH_TRANSACTION: 'fetch-transaction',
    INDEX_FILL: 'index-fill',
    INDEX_FILL_PROTOCOL_FEE: 'index-fill-protocol-fee',
    INDEX_FILL_TRADERS: 'index-fill-traders',
    INDEX_FILL_VALUE: 'index-fill-value',
    INDEX_TRADED_TOKENS: 'index-traded-tokens',
  },
  QUEUE: {
    ADDRESS_PROCESSING: 'address-processing',
    EVENT_PROCESSING: 'event-processing',
    FILL_INDEXING: 'fill-indexing',
    FILL_PROCESSING: 'fill-processing',
    INDEXING: 'indexing',
    TOKEN_PROCESSING: 'token-processing',
    TRANSACTION_PROCESSING: 'transaction-processing',
    TRADED_TOKEN_INDEXING: 'traded-token-indexing',
  },
  SYMBOL_MAPPINGS: {
    DAIW: 'DAI',
    ETHW: 'ETH',
    USDTW: 'USDT',
    'VEIL ETH': 'ETH',
    WETH: 'ETH',
  },
  TOKEN_TYPE: {
    ERC20: 0,
    ERC721: 1,
    ERC1155: 2,
  },
  TRADER_TYPE: {
    MAKER: 0,
    TAKER: 1,
  },
};
