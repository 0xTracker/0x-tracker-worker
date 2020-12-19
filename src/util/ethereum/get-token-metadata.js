const ethers = require('ethers');
const web3 = require('./web3');

const getTokenMetadata = async address => {
  const abi = [
    'function name() view returns (string name)',
    'function symbol() view returns (string symbol)',
    'function decimals() view returns (uint8 decimals)',
  ];
  const contract = new ethers.Contract(address, abi, web3.getWrapper());
  const handleError = () => {
    return undefined;
  };

  const [name, symbol, decimals] = await Promise.all([
    contract.name().catch(handleError),
    contract.symbol().catch(handleError),
    contract.decimals().catch(handleError),
  ]);

  return { address, decimals, name, symbol };
};

module.exports = getTokenMetadata;
