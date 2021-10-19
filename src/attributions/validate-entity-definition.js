const Joi = require('@hapi/joi');

const Ethereum = {
  address: () => Joi.string().regex(/^0x[a-f0-9A-F]{40}$/),
};

const schema = Joi.object({
  categories: Joi.array()
    .items(
      Joi.string().valid(
        'cross-chain',
        'dex-aggregator',
        'other',
        'portfolio-manager',
        'relayer',
        'wallet',
      ),
    )
    .unique()
    .required(),
  description: Joi.string().optional(),
  id: Joi.string()
    .uuid({ version: ['uuidv4'] })
    .id()
    .required(),
  logo: Joi.string().required(),
  mappings: Joi.array()
    .items(
      Joi.object({
        affiliateAddress: Ethereum.address(),
        bridgeAddress: Ethereum.address(),
        feeRecipientAddress: Ethereum.address().allow(null),
        senderAddress: Ethereum.address(),
        source: Joi.string(),
        takerAddress: Ethereum.address(),
        transactionToAddress: Ethereum.address(),
        tradeType: Joi.number(),
        type: Joi.string()
          .valid('consumer', 'relayer', 'liquidity-source')
          .required(),
      })
        .or(
          'affiliateAddress',
          'bridgeAddress',
          'feeRecipientAddress',
          'senderAddress',
          'source',
          'takerAddress',
          'tradeType',
          'transactionToAddress',
        )
        .required(),
    )
    .unique()
    .required(),
  name: Joi.string().required(),
  urlSlug: Joi.string().required(),
  websiteUrl: Joi.string()
    .uri({ scheme: 'https' })
    .optional(),
}).required();

const validateEntityDefinition = definition => {
  const { error } = schema.validate(definition, { abortEarly: false });

  if (error) {
    throw error.annotate();
  }
};

module.exports = validateEntityDefinition;
