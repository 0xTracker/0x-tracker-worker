const fs = require('fs');
const path = require('path');

const definitionsPath = path.join(__dirname, 'definitions');

const files = fs.readdirSync(definitionsPath);
const definitions = [];

files.forEach(file => {
  if (file.endsWith('.json')) {
    const filePath = path.join(definitionsPath, file);
    const contents = fs.readFileSync(filePath);
    const asObject = JSON.parse(contents);

    definitions.push(asObject);
  }
});

const getFeedDefinitions = () => {
  return definitions;
};

module.exports = getFeedDefinitions;
