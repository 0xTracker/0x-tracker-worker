# 0x Tracker Worker

[![Travis (.org)](https://img.shields.io/travis/0xTracker/0x-tracker-worker.svg?style=flat-square)](https://travis-ci.org/0xTracker/0x-tracker-worker)
[![David](https://img.shields.io/david/0xtracker/0x-tracker-worker.svg?style=flat-square)](https://github.com/0xTracker/0x-tracker-worker)
[![Codecov](https://img.shields.io/codecov/c/github/0xTracker/0x-tracker-worker.svg?style=flat-square)](https://codecov.io/gh/0xTracker/0x-tracker-worker)

> NodeJS worker built for [0x Tracker](https://0xtracker.com) which performs various ETL tasks related to the 0x protocol trading data and other information used on 0x Tracker.

## 👮‍♂️ Requirements

To run the project locally you'll need the following installed:

- NodeJS v8.11.4
- MongoDB

The project also has support for the following development tools which you may wish to take advantage of:

- [NVM](https://github.com/creationix/nvm)
- [Nodemon](https://nodemon.io/)
- [Prettier](https://prettier.io/docs/en/editors.html)
- [ESLint](https://eslint.org/docs/user-guide/integrations#editors)

## 🐣 Getting Started

Run `cp .env.example .env` to create a local environment file, then update the local database connection string if necessary.

Run `npm i` to install dependencies and then run `npm start`/`nodemon` to start the worker process. If the database already contains events extracted with [0x Event Extractor](https://github.com/0xTracker/0x-event-extractor) then you should start to see fills, tokens etc. being populated in the MongoDB database.

## 🛠 Configuration

Configuration is handled by a combination of [dotenv](https://github.com/motdotla/dotenv) files and [node-config](https://github.com/lorenwest/node-config). If you need to tweak anything you can either edit your .env file or create a config/local.js file with overrides for the configuration found in config/default.js

## 👨‍💻 Maintainers

- Craig Bovis ([@cbovis](https://github.com/cbovis))

## Supporters

Infrastructure for 0x Tracker is generously supported by these companies.

<table>
  <tr>
    <td align="center"><a href="https://bugsnag.com"><img src="https://0xtracker.com/assets/supporters/bugsnag.png" width="120px;" alt="Bugsnag"/><br /><sub><b>Bugsnag</b></sub></a></td>
    <td align="center"><a href="https://cryptocompare.com"><img src="https://0xtracker.com/assets/supporters/crypto-compare.png" width="120px;" alt="CryptoCompare"/><br /><sub><b>CryptoCompare</b></sub></a></td>
    <td align="center"><a href="https://netlify.com"><img src="https://0xtracker.com/assets/supporters/netlify.png" width="120px;" alt="Netlify"/><br /><sub><b>Netlify</b></sub></a></td>
  </tr>
</table>

## 👩‍⚖️ License

[Apache 2.0](https://github.com/0xTracker/0x-tracker-worker/blob/master/LICENSE)
