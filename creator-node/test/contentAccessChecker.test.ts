import { generateSignature } from '../src/apiSigning'
import { getLibsMock } from './lib/libsMock'
import { loggerFactory } from './lib/reqMock'
import assert from 'assert'
import { getApp } from './lib/app'
import { checkContentAccess } from '../src/contentAccess/contentAccessChecker'

describe('Test content access', function () {
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

  const cid = 'QmcbnrugPPDrRXb5NeYKwPb7HWUj7aN2tXmhgwRfw2pRXo'
  const signedDataFromDiscoveryNode = {
    cid: cid,
    cache: true,
    timestamp: Date.now()
  }

  before(async () => {
    libsMock = getLibsMock()
    const app = await getApp(libsMock)
    server = app.server
  })

  after(async () => {
    await server.close()
  })

  beforeEach(() => {
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

  describe('content access', () => {
    it('fails when there are missing headers', async () => {
      const accessWithoutHeaders = await checkContentAccess({
        cid,
        contentAccessHeaders: null as unknown as string,
        libs: libsMock,
        logger: loggerMock,
        redis: redisMock
      })
      assert.deepStrictEqual(accessWithoutHeaders, {
        doesUserHaveAccess: false,
        error: 'MissingHeaders',
        shouldCache: false
      })

      const accessWithMissingHeaders = await checkContentAccess({
        cid,
        contentAccessHeaders: JSON.stringify({}),
        libs: libsMock,
        logger: loggerMock,
        redis: redisMock
      })
      assert.deepStrictEqual(accessWithMissingHeaders, {
        doesUserHaveAccess: false,
        error: 'MissingHeaders',
        shouldCache: false
      })
    })

    it('fails when recovered DN wallet is not from registered DN', async () => {
      const signatureFromDiscoveryNode = generateSignature(
        signedDataFromDiscoveryNode,
        badDNPrivateKey
      )
      const contentAccessHeadersObj = {
        signedDataFromDiscoveryNode,
        signatureFromDiscoveryNode
      }
      const access = await checkContentAccess({
        cid,
        contentAccessHeaders: JSON.stringify(contentAccessHeadersObj),
        libs: libsMock,
        logger: loggerMock,
        redis: redisMock
      })
      assert.deepStrictEqual(access, {
        doesUserHaveAccess: false,
        error: 'InvalidDiscoveryNode',
        shouldCache: false
      })
    })

    it('failed when the cid does not match what is signed', async () => {
      const signatureFromDiscoveryNode = generateSignature(
        signedDataFromDiscoveryNode,
        dummyDNPrivateKey
      )
      const contentAccessHeadersObj = {
        signedDataFromDiscoveryNode,
        signatureFromDiscoveryNode
      }
      const access = await checkContentAccess({
        cid: 'incorrectCID',
        contentAccessHeaders: JSON.stringify(contentAccessHeadersObj),
        libs: libsMock,
        logger: loggerMock,
        redis: redisMock
      })
      assert.deepStrictEqual(access, {
        doesUserHaveAccess: false,
        error: 'IncorrectCID',
        shouldCache: false
      })
    })

    it('failed when the signed timestamp is expired', async () => {
      const tenDays = 1_000 * 60 * 60 * 24 * 10
      const expiredTimestampData = {
        cid: cid,
        cache: true,
        timestamp: Date.now() - tenDays // ten days old
      }
      const signatureFromDiscoveryNode = generateSignature(
        expiredTimestampData,
        dummyDNPrivateKey
      )
      const contentAccessHeadersObj = {
        signedDataFromDiscoveryNode: expiredTimestampData,
        signatureFromDiscoveryNode
      }
      const access = await checkContentAccess({
        cid,
        contentAccessHeaders: JSON.stringify(contentAccessHeadersObj),
        libs: libsMock,
        logger: loggerMock,
        redis: redisMock
      })
      assert.deepStrictEqual(access, {
        doesUserHaveAccess: false,
        error: 'ExpiredTimestamp',
        shouldCache: false
      })
    })

    it('passes when everything matches', async () => {
      const signatureFromDiscoveryNode = generateSignature(
        signedDataFromDiscoveryNode,
        dummyDNPrivateKey
      )
      const contentAccessHeadersObj = {
        signedDataFromDiscoveryNode,
        signatureFromDiscoveryNode
      }
      const access = await checkContentAccess({
        cid,
        contentAccessHeaders: JSON.stringify(contentAccessHeadersObj),
        libs: libsMock,
        logger: loggerMock,
        redis: redisMock
      })
      assert.deepStrictEqual(access, {
        doesUserHaveAccess: true,
        error: null,
        shouldCache: true
      })
    })
  })
})
