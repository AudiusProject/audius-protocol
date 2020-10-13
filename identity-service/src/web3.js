const Web3 = require('web3')
const config = require('./config')

const primaryWeb3 = new Web3(new Web3.providers.HttpProvider(config.get('web3Provider')))
const secondaryWeb3 = new Web3(new Web3.providers.HttpProvider(config.get('secondaryWeb3Provider')))

module.exports = {
  primaryWeb3,
  secondaryWeb3
}
