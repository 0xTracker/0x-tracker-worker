# 0x Tracker Worker

[![Travis (.org)](https://img.shields.io/travis/0xTracker/0x-tracker-worker.svg?style=flat-square)](https://travis-ci.org/0xTracker/0x-tracker-worker)
[![David](https://img.shields.io/david/0xtracker/0x-tracker-worker.svg?style=flat-square)](https://github.com/0xTracker/0x-tracker-worker)
[![Codecov](https://img.shields.io/codecov/c/github/0xTracker/0x-tracker-worker.svg?style=flat-square)](https://codecov.io/gh/0xTracker/0x-tracker-worker)
[![Chat on Spectrum](https://img.shields.io/badge/chat%20on-spectrum-752bf2.svg?style=flat-square)](https://spectrum.chat/0x-tracker)

> NodeJS worker built for [0x Tracker](https://0xtracker.com) which performs various ETL tasks related to the 0x protocol trading data and other information used on 0x Tracker.

## 🧐 How It Works

The worker process has a number of jobs (found in `src/jobs`) which run on configurable intervals performing various data extraction and transformation tasks.

The jobs are as follows:

- **create-fills** – Takes events that were extracted using [0x Event Extractor](https://github.com/0xTracker/0x-event-extractor) and converts them into Fill models.
- **update-fill-statuses** – Updates the status of any fills which are currently pending once their status switches to successful/failed.
- **get-missing-tokens** – Retrieves token information from the [Ethplorer](https://ethplorer.io) API for fills which have unrecognised maker/token tokens.
- **get-missing-token-images** – Retrieves images from the [Trust Wallet tokens repository](https://github.com/TrustWallet/tokens) for any tokens which don't already have an image associated with them.
- **set-relayer-for-fills** – Associates fills with known 0x relayers. Since relayers are already associated in the `create-fills` job this primarily exists to associate past fills with newly identified relayers.
- **update-fill-rates** – Retrieves USD rates from the [CryptoCompare](https://www.cryptocompare.com/) API for any fills which don't already have them saved.
- **update-fill-prices** – Sets the USD prices of any fills which don't already have them saved.
- **update-token-prices** – Updates price information for all known tokens based on the most recent trade.
- **get-new-articles** – Retrieves new articles from the RSS feeds of various 0x ecosystem blogs.

These jobs deploy a variety of methods for gathering the data they need before transforming it and persisting to MongoDB using the models found in `src/model`.

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

Configuration is handled by a combination of [dotenv](https://github.com/motdotla/dotenv) files and [node-config](https://github.com/lorenwest/node-config). If you need to tweak anything you can either edit your .env file or create a config/local.js file with overrides for the configuration found in config/default.js.

## 👨‍💻 Maintainers

- Craig Bovis ([@cbovis](https://github.com/cbovis))

## 👩‍⚖️ License

[Apache 2.0](https://github.com/0xTracker/0x-tracker-worker/blob/master/LICENSE)
