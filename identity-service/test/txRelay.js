const assert = require('assert')
const sinon = require('sinon')

const config = require('../src/config')

describe('test TransactionRelay', () => {
  let relayerWallets, selectWallet
  beforeEach(() => {
    relayerWallets = [
      {
        publicKey: 'publicKey1',
        privateKey: 'privateKey1',
        locked: false
      },
      {
        publicKey: 'publicKey2',
        privateKey: 'privateKey2',
        locked: false
      }
    ]
    sinon.stub(config, 'get').withArgs('relayerWallets').returns(relayerWallets)
    selectWallet = require('../src/txRelay').selectWallet
  })

  afterEach(() => {
    // reload the module each time for fresh state
    delete require.cache[require.resolve('../src/txRelay')]
    sinon.restore()
  })

  it('should select a random wallet', async () => {
    const firstWallet = selectWallet()
    const secondWallet = selectWallet()

    assert(firstWallet.publicKey !== secondWallet.publicKey)
    assert(firstWallet.privateKey !== secondWallet.privateKey)
  })

  it('should return null when attempting to select a wallet when all are in use', async () => {
    let i = 0
    let nullWallet
    while (i++ < 3) {
      nullWallet = selectWallet()
    }

    assert(nullWallet === undefined)
  })

  it('should return an unlocked wallet when all wallets are reset to unlocked', async () => {
    const firstWallet = selectWallet()
    const secondWallet = selectWallet()
    const nullWallet = selectWallet()

    assert(nullWallet === undefined)

    firstWallet.locked = false
    secondWallet.locked = false

    const thirdWallet = selectWallet()
    assert(thirdWallet !== undefined)
  })
})
