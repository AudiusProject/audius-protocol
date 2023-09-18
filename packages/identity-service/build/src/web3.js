"use strict";
const Web3 = require('web3');
const config = require('./config');
const primaryWeb3 = new Web3(new Web3.providers.HttpProvider(config.get('web3Provider')));
const nethermindWeb3 = new Web3(new Web3.providers.HttpProvider(config.get('nethermindWeb3Provider')));
const secondaryWeb3 = new Web3(new Web3.providers.HttpProvider(config.get('secondaryWeb3Provider')));
const ethWeb3 = new Web3(new Web3.providers.HttpProvider(config.get('ethProviderUrl')));
module.exports = {
    primaryWeb3,
    nethermindWeb3,
    secondaryWeb3,
    ethWeb3
};
