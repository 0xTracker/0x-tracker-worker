const _ = require('lodash');
const getFeedDefinitions = require('./get-feed-definitions');
const validateFeedDefinition = require('./validate-feed-definition');

describe('feeds/getFeedDefinitions', () => {
  it('should get all definitions', () => {
    const definitions = getFeedDefinitions();

    expect(definitions.length).not.toBe(0);
  });

  it('should not contain definitions which violate the definition schema', () => {
    const definitions = getFeedDefinitions();

    definitions.forEach(definition => {
      validateFeedDefinition(definition);
    });
  });

  it('should not contain multiple definitions with the same id', () => {
    const definitions = getFeedDefinitions();
    const uniqueIds = _(definitions)
      .map(d => d.id)
      .uniq()
      .size();

    expect(uniqueIds).toBe(definitions.length);
  });

  it('should not contain multiple definitions with the same attribution entity', () => {
    const definitions = getFeedDefinitions();

    const uniqAttributionEntities = _(definitions)
      .map(d => d.attributionEntity)
      .uniq()
      .compact()
      .value().length;

    const definitionsWithAttributions = definitions.filter(
      d => d.attributionEntity !== undefined,
    ).length;

    expect(definitionsWithAttributions).toBe(uniqAttributionEntities);
  });
});
