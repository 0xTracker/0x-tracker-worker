const fs = require('fs');
const Joi = require('@hapi/joi');
const path = require('path');

const files = fs.readdirSync(__dirname);
const definitions = [];

files.forEach(file => {
  if (file.endsWith('.json')) {
    const filePath = path.join(__dirname, file);
    const contents = fs.readFileSync(filePath);
    const asObject = JSON.parse(contents);

    definitions.push(asObject);
  }
});

const getAppDefinitions = () => {
  return definitions;
};

const Ethereum = {
  address: () => Joi.string().regex(/^0x[a-f0-9]{40}$/),
};

const schema = Joi.object({
  categories: Joi.array()
    .items(Joi.string().valid('dex-aggregator', 'exchange'))
    .unique()
    .required(),
  id: Joi.string()
    .uuid({ version: ['uuidv4'] })
    .id()
    .required(),
  logoUrl: Joi.string().uri({ scheme: 'https' }),
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

const validateAppDefinition = appDefinition => {
  const { error } = schema.validate(appDefinition, { abortEarly: false });

  if (error) {
    throw error.annotate();
  }
};

module.exports = { getAppDefinitions, validateAppDefinition };
