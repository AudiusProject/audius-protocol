import assert from 'assert'
import { isPremiumContentMatch } from './helpers'
import { PremiumContentType } from './types'

describe('Test premium content helpers', function () {
  const defaultId = 1
  const defaultType: PremiumContentType = 'track'
  const defaultUserWallet = '0x7c95A677106218A296EcEF1F577c3aE27f0340cd'
  const defaultSignedDataObjFromDiscoveryNode = {
    premium_content_id: defaultId,
    premium_content_type: defaultType,
    user_wallet: defaultUserWallet,
    timestamp: Date.now()
  }
  const defaultMatchArgs = {
    signedDataFromDiscoveryNode: defaultSignedDataObjFromDiscoveryNode,
    userWallet: defaultUserWallet,
    premiumContentId: defaultId,
    premiumContentType: defaultType
  }

  it('isPremiumContentMatch fails when signature is too old', async () => {
    const oneDayMs = 24 * 60 * 60 * 1000
    const isMatch = await isPremiumContentMatch({
      ...defaultMatchArgs,
      signedDataFromDiscoveryNode: {
        ...defaultSignedDataObjFromDiscoveryNode,
        timestamp: defaultSignedDataObjFromDiscoveryNode.timestamp - oneDayMs
      }
    })
    assert.deepStrictEqual(isMatch, false)
  })

  it('isPremiumContentMatch fails when ids do not match', async () => {
    const isMatch = await isPremiumContentMatch({
      ...defaultMatchArgs,
      signedDataFromDiscoveryNode: {
        ...defaultSignedDataObjFromDiscoveryNode,
        premium_content_id: 2
      }
    })
    assert.deepStrictEqual(isMatch, false)
  })

  it('isPremiumContentMatch fails when types do not match', async () => {
    const isMatch = await isPremiumContentMatch({
      ...defaultMatchArgs,
      signedDataFromDiscoveryNode: {
        ...defaultSignedDataObjFromDiscoveryNode,
        premium_content_type: 'bad-type' as PremiumContentType
      }
    })
    assert.deepStrictEqual(isMatch, false)
  })

  it('isPremiumContentMatch fails when user wallets do not match', async () => {
    const isMatch = await isPremiumContentMatch({
      ...defaultMatchArgs,
      signedDataFromDiscoveryNode: {
        ...defaultSignedDataObjFromDiscoveryNode,
        user_wallet: 'bad-wallet'
      }
    })
    assert.deepStrictEqual(isMatch, false)
  })

  it('isPremiumContentMatch passes', async () => {
    const isMatch = await isPremiumContentMatch(defaultMatchArgs)
    assert.deepStrictEqual(isMatch, true)
  })
})
