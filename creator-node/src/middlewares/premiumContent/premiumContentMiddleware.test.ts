import { premiumContentMiddleware } from './premiumContentMiddleware'
import assert from 'assert'
import { resFactory, loggerFactory } from '../../../test/lib/reqMock'
import { Request, Response } from 'express'
import { generateSignature } from '../../apiSigning'

type PartialHeaders = {
  signedDataFromDiscoveryNode?: string
  signatureFromDiscoveryNode?: string
  signedDataFromUser?: string
  signatureFromUser?: string
}

const headers: PartialHeaders = {
  signedDataFromDiscoveryNode: 'signed-data-from-discovery-node',
  signatureFromDiscoveryNode: 'signature-from-discovery-node',
  signedDataFromUser: 'signed-data-from-user',
  signatureFromUser: 'signature-from-user'
}

const libs: any = {}
libs.ethContracts = {
  ServiceProviderFactoryClient: {
    getServiceProviderList: () => []
  }
}

const redis = new Map()

const app = new Map()
app.set('audiusLibs', libs)
app.set('redisClient', redis)

const mockReq = {
  logger: loggerFactory(),
  headers,
  app
}
let mockRes = resFactory()

const dummyDNPrivateKey =
  '0x3873ed01bfb13621f9301487cc61326580614a5b99f3c33cf39c6f9da3a19cad'
const dummyDNDelegateOwnerWallet = '0x1D9c77BcfBfa66D37390BF2335f0140979a6122B'
const dummyUserPrivateKey =
  '849ec1cebdf0956808a1c5631fa4386d79ac8d7dc76d13e98a7e5cf283ea04df'
const dummyUserWallet = '0x7c95A677106218A296EcEF1F577c3aE27f0340cd'

describe('Test premium content middleware', function () {
  beforeEach(function () {
    mockRes = resFactory()
  })

  it('fails when missing a request header', async () => {
    const getPartialHeaders = (keyToRemove: keyof PartialHeaders) => {
      const partialHeaders = { ...headers }
      delete partialHeaders[keyToRemove]
      return partialHeaders as any
    }

    const assertBadRequest = async (keyToRemove: keyof PartialHeaders) => {
      let nextCalled = false
      await premiumContentMiddleware(
        {
          ...mockReq,
          headers: getPartialHeaders(keyToRemove)
        } as unknown as Request,
        mockRes as unknown as Response,
        () => {
          nextCalled = true
        }
      )
      assert.deepStrictEqual(mockRes.statusCode, 400)
      assert.deepStrictEqual(nextCalled, false)
    }

    await Promise.all(
      (Object.keys(headers) as (keyof PartialHeaders)[]).map(assertBadRequest)
    )
  })

  it('fails when recovered DN wallet is not from registered DN', async () => {
    const { signature: signatureFromDiscoveryNode } = generateSignature(
      headers.signedDataFromDiscoveryNode,
      dummyDNPrivateKey
    )

    const assertForbidden = async () => {
      let nextCalled = false
      await premiumContentMiddleware(
        {
          ...mockReq,
          headers: { ...headers, signatureFromDiscoveryNode }
        } as unknown as Request,
        mockRes as unknown as Response,
        () => {
          nextCalled = true
        }
      )
      assert.deepStrictEqual(mockRes.statusCode, 403)
      assert.deepStrictEqual(nextCalled, false)
    }

    await assertForbidden()
  })

  it('fails when premium content details do not match because signature is too old', async () => {
    const now = Date.now()
    const thirtyDaysAgo = 30 * 24 * 60 * 60 * 1000
    const longAgo = now - thirtyDaysAgo

    const premiumContentId = 1
    const premiumContentType = 'track'
    const signedDataFromDiscoveryNode = JSON.stringify({
      premiumContentId,
      premiumContentType,
      userWallet: dummyUserWallet,
      timestamp: longAgo
    })
    const { signature: signatureFromDiscoveryNode } = generateSignature(
      signedDataFromDiscoveryNode,
      dummyDNPrivateKey
    )

    const { signature: signatureFromUser } = generateSignature(
      headers.signedDataFromUser,
      dummyUserPrivateKey
    )

    const assertForbidden = async () => {
      let nextCalled = false
      const newRedis = new Map()
      newRedis.set(
        'all_registered_dnodes',
        JSON.stringify([{ delegateOwnerWallet: dummyDNDelegateOwnerWallet }])
      )
      const newApp = new Map()
      newApp.set('redisClient', newRedis)
      await premiumContentMiddleware(
        {
          ...mockReq,
          app: newApp,
          headers: {
            ...headers,
            signedDataFromDiscoveryNode,
            signatureFromDiscoveryNode,
            signatureFromUser
          },
          params: { premiumContentId, premiumContentType }
        } as unknown as Request,
        mockRes as unknown as Response,
        () => {
          nextCalled = true
        }
      )
      assert.deepStrictEqual(mockRes.statusCode, 403)
      assert.deepStrictEqual(nextCalled, false)
    }

    await assertForbidden()
  })

  it('fails when premium content details do not match because ids do not match', async () => {
    const premiumContentId = 1
    const premiumContentType = 'track'
    const signedDataFromDiscoveryNode = JSON.stringify({
      premiumContentId: 2,
      premiumContentType,
      userWallet: dummyUserWallet,
      timestamp: Date.now()
    })
    const { signature: signatureFromDiscoveryNode } = generateSignature(
      signedDataFromDiscoveryNode,
      dummyDNPrivateKey
    )

    const { signature: signatureFromUser } = generateSignature(
      headers.signedDataFromUser,
      dummyUserPrivateKey
    )

    const assertForbidden = async () => {
      let nextCalled = false
      const newRedis = new Map()
      newRedis.set(
        'all_registered_dnodes',
        JSON.stringify([{ delegateOwnerWallet: dummyDNDelegateOwnerWallet }])
      )
      const newApp = new Map()
      newApp.set('redisClient', newRedis)
      await premiumContentMiddleware(
        {
          ...mockReq,
          app: newApp,
          headers: {
            ...headers,
            signedDataFromDiscoveryNode,
            signatureFromDiscoveryNode,
            signatureFromUser
          },
          params: { premiumContentId, premiumContentType }
        } as unknown as Request,
        mockRes as unknown as Response,
        () => {
          nextCalled = true
        }
      )
      assert.deepStrictEqual(mockRes.statusCode, 403)
      assert.deepStrictEqual(nextCalled, false)
    }

    await assertForbidden()
  })

  it('fails when premium content details do not match because types do not match', async () => {
    const premiumContentId = 1
    const premiumContentType = 'track'
    const signedDataFromDiscoveryNode = JSON.stringify({
      premiumContentId,
      premiumContentType: 'playlist',
      userWallet: dummyUserWallet,
      timestamp: Date.now()
    })
    const { signature: signatureFromDiscoveryNode } = generateSignature(
      signedDataFromDiscoveryNode,
      dummyDNPrivateKey
    )

    const { signature: signatureFromUser } = generateSignature(
      headers.signedDataFromUser,
      dummyUserPrivateKey
    )

    const assertForbidden = async () => {
      let nextCalled = false
      const newRedis = new Map()
      newRedis.set(
        'all_registered_dnodes',
        JSON.stringify([{ delegateOwnerWallet: dummyDNDelegateOwnerWallet }])
      )
      const newApp = new Map()
      newApp.set('redisClient', newRedis)
      await premiumContentMiddleware(
        {
          ...mockReq,
          app: newApp,
          headers: {
            ...headers,
            signedDataFromDiscoveryNode,
            signatureFromDiscoveryNode,
            signatureFromUser
          },
          params: { premiumContentId, premiumContentType }
        } as unknown as Request,
        mockRes as unknown as Response,
        () => {
          nextCalled = true
        }
      )
      assert.deepStrictEqual(mockRes.statusCode, 403)
      assert.deepStrictEqual(nextCalled, false)
    }

    await assertForbidden()
  })

  it('fails when premium content details do not match because user wallets do not match', async () => {
    const premiumContentId = 1
    const premiumContentType = 'track'
    const signedDataFromDiscoveryNode = JSON.stringify({
      premiumContentId,
      premiumContentType,
      userWallet: dummyUserWallet,
      timestamp: Date.now()
    })
    const { signature: signatureFromDiscoveryNode } = generateSignature(
      signedDataFromDiscoveryNode,
      dummyDNPrivateKey
    )

    const { signature: signatureFromUser } = generateSignature(
      headers.signedDataFromUser,
      dummyDNPrivateKey // to denote that someone other than the user signed it
    )

    const assertForbidden = async () => {
      let nextCalled = false
      const newRedis = new Map()
      newRedis.set(
        'all_registered_dnodes',
        JSON.stringify([{ delegateOwnerWallet: dummyDNDelegateOwnerWallet }])
      )
      const newApp = new Map()
      newApp.set('redisClient', newRedis)
      await premiumContentMiddleware(
        {
          ...mockReq,
          app: newApp,
          headers: {
            ...headers,
            signedDataFromDiscoveryNode,
            signatureFromDiscoveryNode,
            signatureFromUser
          },
          params: { premiumContentId, premiumContentType }
        } as unknown as Request,
        mockRes as unknown as Response,
        () => {
          nextCalled = true
        }
      )
      assert.deepStrictEqual(mockRes.statusCode, 403)
      assert.deepStrictEqual(nextCalled, false)
    }

    await assertForbidden()
  })

  it('passes', async () => {
    const premiumContentId = 1
    const premiumContentType = 'track'
    const signedDataFromDiscoveryNode = JSON.stringify({
      premiumContentId,
      premiumContentType,
      userWallet: dummyUserWallet,
      timestamp: Date.now()
    })
    const { signature: signatureFromDiscoveryNode } = generateSignature(
      signedDataFromDiscoveryNode,
      dummyDNPrivateKey
    )

    const { signature: signatureFromUser } = generateSignature(
      headers.signedDataFromUser,
      dummyUserPrivateKey
    )

    const assertSuccess = async () => {
      let nextCalled = false
      const newRedis = new Map()
      newRedis.set(
        'all_registered_dnodes',
        JSON.stringify([{ delegateOwnerWallet: dummyDNDelegateOwnerWallet }])
      )
      const newApp = new Map()
      newApp.set('redisClient', newRedis)
      await premiumContentMiddleware(
        {
          ...mockReq,
          app: newApp,
          headers: {
            ...headers,
            signedDataFromDiscoveryNode,
            signatureFromDiscoveryNode,
            signatureFromUser
          },
          params: { premiumContentId, premiumContentType }
        } as unknown as Request,
        mockRes as unknown as Response,
        () => {
          nextCalled = true
        }
      )
      assert.deepStrictEqual(nextCalled, true)
    }

    await assertSuccess()
  })
})
