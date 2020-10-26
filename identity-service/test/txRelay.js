const assert = require('assert')
const sinon = require('sinon')

const config = require('../src/config')

describe.only('test txRelay: selectWallet(walletAddress)', () => {
  let relayerWallets, selectWallet
  beforeEach(() => {
    relayerWallets = [
      {
        publicKey: '0x9d5f71e3F6B454DE13A293A7280B4252D4C1C66E',
        privateKey: 'privateKey1'
      },
      {
        publicKey: '0x999e70F3e1B1D9cba35554d0b048136d3855ce18',
        privateKey: 'privateKey2'
      },
      {
        publicKey: '0xBE02c92D20E068930A3EB641862A3Eb68F2d1210',
        privateKey: 'privateKey3'
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

  it('should select a random wallet', async () => {
    const firstWallet = await selectWallet('0xc22AA517bd6c0897428Cc4E93Ed5069c548f4Dc7') // index 0 when calling mod
    const secondWallet = await selectWallet('0x724000024990A67a648D4229fCD5Dd618c62D7D9') // index 1 when calling mod

    assert(firstWallet.publicKey !== secondWallet.publicKey)
    assert(firstWallet.privateKey !== secondWallet.privateKey)
  })

  it('should return an unlocked wallet when all wallets are reset to unlocked', async () => {
    const firstWallet = await selectWallet('0xc22AA517bd6c0897428Cc4E93Ed5069c548f4Dc7') // index 0 when calling mod
    const secondWallet = await selectWallet('0x724000024990A67a648D4229fCD5Dd618c62D7D9') // index 1 when calling mod

    assert(firstWallet.publicKey !== secondWallet.publicKey)
    assert(firstWallet.privateKey !== secondWallet.privateKey)

    firstWallet.locked = false
    secondWallet.locked = false

    const thirdWallet = await selectWallet('0x8CbFFddd5c9f625b4e18992a641cC88Ea4cD7032') // index 0 when calling mod
    assert(thirdWallet !== undefined)
  })
})
