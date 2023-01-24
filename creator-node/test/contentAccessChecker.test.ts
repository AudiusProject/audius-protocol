import { generateSignature } from '../src/apiSigning'
import { getLibsMock } from './lib/libsMock'
import { loggerFactory } from './lib/reqMock'
import assert from 'assert'
import { getApp } from './lib/app'
import { checkCIDAccess } from '../src/contentAccess/contentAccessChecker'

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
  const trackId = 12345
  const data = {
    cid,
    shouldCache: true,
    timestamp: Date.now(),
    trackId
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
    it('fails when recovered DN wallet is not from registered DN', async () => {
      const signature = generateSignature(data, badDNPrivateKey)

      const access = await checkCIDAccess({
        cid,
        data,
        signature,
        libs: libsMock,
        logger: loggerMock,
        redis: redisMock
      })
      assert.deepStrictEqual(access, {
        isValidRequest: false,
        error: 'InvalidDiscoveryNode',
        shouldCache: false
      })
    })

    it('failed when the cid does not match what is signed', async () => {
      const signature = generateSignature(data, dummyDNPrivateKey)
      const access = await checkCIDAccess({
        cid: 'incorrectCID',
        data,
        signature,
        libs: libsMock,
        logger: loggerMock,
        redis: redisMock
      })
      assert.deepStrictEqual(access, {
        isValidRequest: false,
        error: 'IncorrectCID',
        shouldCache: false
      })
    })

    it('failed when the signed timestamp is expired', async () => {
      const tenDays = 1_000 * 60 * 60 * 24 * 10
      const expiredTimestampData = {
        cid: cid,
        trackId,
        shouldCache: true,
        timestamp: Date.now() - tenDays // ten days old
      }
      const signature = generateSignature(
        expiredTimestampData,
        dummyDNPrivateKey
      )

      const access = await checkCIDAccess({
        cid,
        signature,
        data: expiredTimestampData,
        libs: libsMock,
        logger: loggerMock,
        redis: redisMock
      })
      assert.deepStrictEqual(access, {
        isValidRequest: false,
        error: 'ExpiredTimestamp',
        shouldCache: false
      })
    })

    it('passes when everything matches', async () => {
      const signature = generateSignature(data, dummyDNPrivateKey)
      const access = await checkCIDAccess({
        cid,
        signature,
        data,
        libs: libsMock,
        logger: loggerMock,
        redis: redisMock
      })
      assert.deepStrictEqual(access, {
        isValidRequest: true,
        error: null,
        trackId,
        shouldCache: true
      })
    })
  })
})
