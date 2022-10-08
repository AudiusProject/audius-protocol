import { generateSignature } from '../src/apiSigning'
import { getLibsMock } from './lib/libsMock'
import { loggerFactory } from './lib/reqMock'
import assert from 'assert'
import { PremiumContentAccessError } from '../src/premiumContent/types'
import { getApp } from './lib/app'
import { PremiumContentAccessChecker } from '../src/premiumContent/premiumContentAccessChecker'
import { PREMIUM_CONTENT_CID_CACHE_KEY } from '../src/premiumContent/helpers'

describe('Test premium content access', function () {
  let premiumContentAccessChecker: PremiumContentAccessChecker

  let server: any
  let libsMock: any
  let redisMock: any
  let loggerMock: any

  const dummyDNPrivateKey =
    '0x3873ed01bfb13621f9301487cc61326580614a5b99f3c33cf39c6f9da3a19cad'
  const badDNPrivateKey =
    '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
  const dummyDNDelegateOwnerWallet =
    '0x1D9c77BcfBfa66D37390BF2335f0140979a6122B'
  const dummyUserWallet = '0x7c95A677106218A296EcEF1F577c3aE27f0340cd'

  const cid = 'QmcbnrugPPDrRXb5NeYKwPb7HWUj7aN2tXmhgwRfw2pRXo'
  const trackBlockchainId = 1
  const signedDataFromDiscoveryNode = {
    premium_content_id: 1,
    premium_content_type: 'track',
    user_wallet: dummyUserWallet,
    timestamp: Date.now()
  }
  const signedDataFromUser = 'signed-data-from-user'
  const signatureFromUser = 'signature-from-user'

  before(async () => {
    libsMock = getLibsMock()
    const app = await getApp(libsMock)
    server = app.server
  })

  after(async () => {
    await server.close()
  })

  beforeEach(() => {
    premiumContentAccessChecker = new PremiumContentAccessChecker()
    redisMock = new Map()
    redisMock.set(
      'all_registered_dnodes',
      JSON.stringify([
        {
          delegateOwnerWallet: dummyDNDelegateOwnerWallet,
          type: 'discovery-node'
        }
      ])
    )
    loggerMock = loggerFactory()
  })

  describe('premium content', () => {
    beforeEach(async () => {
      redisMock.set(PREMIUM_CONTENT_CID_CACHE_KEY, JSON.stringify({ [cid]: trackBlockchainId }))
    })

    afterEach(async () => {
      redisMock.delete(PREMIUM_CONTENT_CID_CACHE_KEY)
    })

    it('fails when there are missing headers', async () => {
      const signatureFromDiscoveryNode = generateSignature(
        signedDataFromDiscoveryNode,
        badDNPrivateKey
      )
      const accessWithoutHeaders =
        await premiumContentAccessChecker.checkPremiumContentAccess({
          cid,
          premiumContentHeaders: null as unknown as string,
          libs: libsMock,
          logger: loggerMock,
          redis: redisMock
        })
      assert.deepStrictEqual(accessWithoutHeaders, {
        doesUserHaveAccess: false,
        trackId: trackBlockchainId,
        isPremium: true,
        error: PremiumContentAccessError.MISSING_HEADERS
      })

      const missingPremiumContentHeadersObj = {
        signedDataFromDiscoveryNode,
        signatureFromDiscoveryNode,
        signedDataFromUser
      }
      const accessWithMissingHeaders =
        await premiumContentAccessChecker.checkPremiumContentAccess({
          cid,
          premiumContentHeaders: JSON.stringify(
            missingPremiumContentHeadersObj
          ),
          libs: libsMock,
          logger: loggerMock,
          redis: redisMock
        })
      assert.deepStrictEqual(accessWithMissingHeaders, {
        doesUserHaveAccess: false,
        trackId: trackBlockchainId,
        isPremium: true,
        error: PremiumContentAccessError.MISSING_HEADERS
      })
    })

    it('fails when recovered DN wallet is not from registered DN', async () => {
      const signatureFromDiscoveryNode = generateSignature(
        signedDataFromDiscoveryNode,
        badDNPrivateKey
      )
      const premiumContentHeadersObj = {
        signedDataFromDiscoveryNode,
        signatureFromDiscoveryNode,
        signedDataFromUser,
        signatureFromUser
      }
      const access =
        await premiumContentAccessChecker.checkPremiumContentAccess({
          cid,
          premiumContentHeaders: JSON.stringify(premiumContentHeadersObj),
          libs: libsMock,
          logger: loggerMock,
          redis: redisMock
        })
      assert.deepStrictEqual(access, {
        doesUserHaveAccess: false,
        trackId: trackBlockchainId,
        isPremium: true,
        error: PremiumContentAccessError.INVALID_DISCOVERY_NODE
      })
    })

    it('passes when everything matches', async () => {
      const signatureFromDiscoveryNode = generateSignature(
        signedDataFromDiscoveryNode,
        dummyDNPrivateKey
      )
      const premiumContentHeadersObj = {
        signedDataFromDiscoveryNode,
        signatureFromDiscoveryNode,
        signedDataFromUser,
        signatureFromUser
      }
      const access =
        await premiumContentAccessChecker.checkPremiumContentAccess({
          cid,
          premiumContentHeaders: JSON.stringify(premiumContentHeadersObj),
          libs: libsMock,
          logger: loggerMock,
          redis: redisMock
        })
      assert.deepStrictEqual(access, {
        doesUserHaveAccess: true,
        trackId: trackBlockchainId,
        isPremium: true,
        error: null
      })
    })
  })

  it('passes when the content is not premium', async () => {
    const access =
      await premiumContentAccessChecker.checkPremiumContentAccess({
        cid,
        premiumContentHeaders: 'premium-content-headers',
        libs: libsMock,
        logger: loggerMock,
        redis: redisMock
      })
    assert.deepStrictEqual(access, {
      doesUserHaveAccess: true,
      trackId: null,
      isPremium: false,
      error: null
    })
  })
})
