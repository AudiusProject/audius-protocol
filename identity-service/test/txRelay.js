const assert = require('assert')
const sinon = require('sinon')

const config = require('../src/config')

describe('test txRelay: selectWallet()', () => {
  let relayerWallets, selectWallet
  beforeEach(() => {
    relayerWallets = [
      {
        publicKey: 'publicKey1',
        privateKey: 'privateKey1'
      },
      {
        publicKey: 'publicKey2',
        privateKey: 'privateKey2'
      }
    ]
    sinon.stub(config, 'get').withArgs('relayerWallets').returns(relayerWallets)
    selectWallet = require('../src/relay/txRelay').selectWallet
  })

  afterEach(() => {
    // reload the module each time for fresh state
    delete require.cache[require.resolve('../src/relay/txRelay')]
    delete require.cache[require.resolve('../src/web3')]
    sinon.restore()
  })

  it('should select a random wallet', () => {
    const firstWallet = selectWallet()
    const secondWallet = selectWallet()

    assert(firstWallet.publicKey !== secondWallet.publicKey)
    assert(firstWallet.privateKey !== secondWallet.privateKey)
  })

  it('should return null when attempting to select a wallet when all are in use', () => {
    let i = 0
    let nullWallet
    while (i++ < 3) {
      nullWallet = selectWallet()
    }

    assert(nullWallet === undefined)
  })

  it('should return an unlocked wallet when all wallets are reset to unlocked', () => {
    const firstWallet = selectWallet()
    const secondWallet = selectWallet()

    firstWallet.locked = false
    secondWallet.locked = false

    const thirdWallet = selectWallet()
    assert(thirdWallet !== undefined)
  })
})
