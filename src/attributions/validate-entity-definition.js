const Joi = require('@hapi/joi');

const Ethereum = {
  address: () => Joi.string().regex(/^0x[a-f0-9]{40}$/),
};

const schema = Joi.object({
  categories: Joi.array()
    .items(
      Joi.string().valid(
        'api',
        'dex-aggregator',
        'exchange',
        'portfolio-manager',
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
        feeRecipientAddress: Ethereum.address(),
        takerAddress: Ethereum.address(),
        type: Joi.string()
          .valid('consumer', 'relayer')
          .required(),
      })
        .or('affiliateAddress', 'feeRecipientAddress', 'takerAddress')
        .required(),
    )
    .unique()
    .required(),
  name: Joi.string().required(),
  urlSlug: Joi.string().required(),
  websiteUrl: Joi.string().uri({ scheme: 'https' }),
}).required();

const validateEntityDefinition = definition => {
  const { error } = schema.validate(definition, { abortEarly: false });

  if (error) {
    throw error.annotate();
  }
};

module.exports = validateEntityDefinition;
