const Joi = require('@hapi/joi');

const schema = Joi.object({
  id: Joi.string()
    .uuid({ version: ['uuidv4'] })
    .id()
    .required(),
  attributionEntity: Joi.string()
    .uuid({ version: ['uuidv4'] })
    .id(),
  feedUrl: Joi.string().required(),
  imageUrl: Joi.when('attributionEntity', {
    is: Joi.exist(),
    then: Joi.string(),
    otherwise: Joi.string().required(),
  }),
  isActive: Joi.bool().required(),
  name: Joi.when('attributionEntity', {
    is: Joi.exist(),
    then: Joi.string(),
    otherwise: Joi.string().required(),
  }),
  urlSlug: Joi.when('attributionEntity', {
    is: Joi.exist(),
    then: Joi.string(),
    otherwise: Joi.string().required(),
  }),
  websiteUrl: Joi.string().uri({ scheme: 'https' }),
}).required();

const validateFeedDefinition = definition => {
  const { error } = schema.validate(definition, { abortEarly: false });

  if (error) {
    throw error.annotate();
  }
};

module.exports = validateFeedDefinition;
