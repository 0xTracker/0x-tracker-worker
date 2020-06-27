module.exports = {
  extends: ['airbnb-base', 'plugin:prettier/recommended'],
  env: {
    node: true,
    jest: true,
  },
  overrides: [
    {
      files: ['jest/setup.js', 'src/test-utils/*.*'],
      rules: { 'import/no-extraneous-dependencies': 'off' },
    },
  ],
  rules: {
    'no-underscore-dangle': 'off',
    'import/prefer-default-export': 'warn',
  },
};
