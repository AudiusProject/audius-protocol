const config = require('../src/config')

const sinon = require('sinon')
const assert = require('assert')

describe('test TransactionRelay', () => {
  let TransactionRelay, relayerWallets
  before(() => {
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
    process.env.relayerWallets = JSON.stringify(relayerWallets)
    // Instantiated here to reset wallets
    TransactionRelay = require('../src/TransactionRelay')
  })

  afterEach(() => {
    // Reset TransactionRelay
    TransactionRelay.setAvailableWallets(relayerWallets)
    TransactionRelay.setUsedWallets([])
    TransactionRelay.setRecentlyUsedWallet(null)

    sinon.restore()
  })

  it('should select a random wallet', async () => {
    // Chose a wallet, and confirm that the chosen wallet is in the list of used wallets
    const chosenWallet = TransactionRelay.setAndSelectAvailableWallet()
    const recentlyUsedWallet = TransactionRelay.getRecentlyUsedWallet()
    const usedWallets = TransactionRelay.getUsedWallets()

    assert(usedWallets.includes(chosenWallet))
    assert(recentlyUsedWallet === chosenWallet)
  })

  it('should not choose the same wallet twice in a row', async () => {
    const firstWallet = TransactionRelay.setAndSelectAvailableWallet()
    const secondWallet = TransactionRelay.setAndSelectAvailableWallet()

    assert(firstWallet.publicKey !== secondWallet.publicKey)
    assert(firstWallet.privateKey !== secondWallet.privateKey)
  })

  it('should reset the available wallets to all wallets in config when all wallets have been used', async () => {
    const configStub = sinon.stub(config, 'get')
    configStub.withArgs('relayerWallets').returns(relayerWallets)

    // Call setAndSelectAvailableWallets twice (the number of wallets available)
    // as to reset the available wallets like that in the config
    let i = 0
    while (i++ < relayerWallets.length) {
      TransactionRelay.setAndSelectAvailableWallet()
    }

    // Check contents of availableWallets
    const availableWallets = TransactionRelay.getAvailableWallets()

    assert(availableWallets.length === 2)
    assert(availableWallets[0].publicKey === 'publicKey1')
    assert(availableWallets[0].privateKey === 'privateKey1')
    assert(availableWallets[1].publicKey === 'publicKey2')
    assert(availableWallets[1].privateKey === 'privateKey2')
  })
})
