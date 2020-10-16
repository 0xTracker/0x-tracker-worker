const _ = require('lodash');
const getEntityDefinitions = require('./get-entity-definitions');
const validateEntityDefinition = require('./validate-entity-definition');

describe('attributions/getEntityDefinitions', () => {
  it('should get all entity definitions', () => {
    const definitions = getEntityDefinitions();

    expect(definitions.length).not.toBe(0);
  });

  it('should not contain definitions which violate the entity definition schema', () => {
    const definitions = getEntityDefinitions();

    definitions.forEach(definition => {
      validateEntityDefinition(definition);
    });
  });

  it('should not contain multiple definitions with the same id', () => {
    const definitions = getEntityDefinitions();
    const uniqueIds = _(definitions)
      .map(d => d.id)
      .uniq()
      .size();

    expect(uniqueIds).toBe(definitions.length);
  });

  it('should not contain multiple definitions with the same taker address', () => {
    const definitions = getEntityDefinitions();
    const takerAddresses = _(definitions)
      .map(d => d.mappings.map(m => m.takerAddress))
      .flatten()
      .uniq()
      .value();

    const definitionsWithMatchingTakerAddresses = definitions.filter(d =>
      d.mappings.some(m => takerAddresses.includes(m.takerAddress)),
    ).length;

    expect(definitionsWithMatchingTakerAddresses).toBe(definitions.length);
  });

  it('should not contain multiple definitions with the same fee recipient address', () => {
    const definitions = getEntityDefinitions();
    const feeRecipientAddresses = _(definitions)
      .map(d => d.mappings.map(m => m.feeRecipientAddress))
      .flatten()
      .uniq()
      .value();

    const matchingDefinitions = definitions.filter(d =>
      d.mappings.some(m =>
        feeRecipientAddresses.includes(m.feeRecipientAddress),
      ),
    ).length;

    expect(matchingDefinitions).toBe(definitions.length);
  });

  it('should not contain multiple definitions with the same affiliate address', () => {
    const definitions = getEntityDefinitions();
    const affiliateAddresses = _(definitions)
      .map(d => d.mappings.map(m => m.affiliateAddress))
      .flatten()
      .uniq()
      .value();

    const matchingDefinitions = definitions.filter(d =>
      d.mappings.some(m => affiliateAddresses.includes(m.affiliateAddress)),
    ).length;

    expect(matchingDefinitions).toBe(definitions.length);
  });
});
