const { promisify, callbackify } = require('util')
const Web3 = require('../web3')
const { shuffle } = require('lodash')

class MultiProvider extends Web3.providers.HttpProvider {
  constructor (providers) {
    super()

    if (typeof providers === 'string') {
      providers = providers.split(',')
    } else if (!Array.isArray(providers)) {
      providers = [providers]
    }

    providers = providers.map(provider => (new Web3(provider)).eth.currentProvider)

    if (!providers.every(provider => provider.sendAsync || provider.send)) {
      throw new Error('Some providers do not have a send method to use.')
    }

    this.providers = providers
    this.send = callbackify(this._send.bind(this)) // web3 only supports callback functions and not async
  }

  _send (payload) {
    for (const provider of shuffle(this.providers)) {
      try {
        const send = promisify((provider.sendAsync || provider.send).bind(provider))
        return send(payload)
      } catch (e) {
        console.log(e)
      }
    }

    throw new Error('All requests failed')
  }
}

module.exports = MultiProvider
