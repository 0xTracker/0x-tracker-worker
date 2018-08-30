module.exports = {
  env: {
    jest: true,
  },
  extends: ['airbnb-base', 'plugin:prettier/recommended'],
  globals: {
    fetch: true,
  },
  overrides: [
    {
      files: ['jest/setup.js'],
      rules: { 'import/no-extraneous-dependencies': 'off' },
    },
  ],
  rules: {
    'no-underscore-dangle': 'off',
    'import/prefer-default-export': 'warn',
  },
};
