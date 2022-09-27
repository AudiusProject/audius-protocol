import { premiumContentMiddleware } from './premiumContentMiddleware'
import assert from 'assert'
import { resFactory, loggerFactory } from '../../../test/lib/reqMock'
import { Request, Response } from 'express'
import Logger from 'bunyan'
import { Redis } from 'ioredis'
import { PremiumContentAccessError } from '../../premiumContent/types'
import { StubPremiumContentAccessChecker } from '../../premiumContent/stubPremiumContentAccessChecker'

describe('Test premium content middleware', function () {
  let app: any
  let serviceRegistry: any
  let libs: any
  let logger: Logger
  let redis: Redis
  let headers: any
  let mockReq: any
  let mockRes: any
  let premiumContentAccessChecker: StubPremiumContentAccessChecker

  beforeEach(function () {
    libs = {
      ethContracts: {
        ServiceProviderFactoryClient: {
          getServiceProviderList: () => []
        }
      }
    }
    logger = loggerFactory() as unknown as Logger
    redis = new Map() as unknown as Redis
    headers = {}
    premiumContentAccessChecker = new StubPremiumContentAccessChecker()
    serviceRegistry = {
      premiumContentAccessChecker,
      libs,
      redis
    }
    app = new Map()
    app.set('serviceRegistry', serviceRegistry)
    mockReq = {
      logger,
      headers,
      app,
      params: { CID: 'some-cid' }
    }
    mockRes = resFactory()
  })

  it('returns bad request when missing the CID param', async () => {
    let nextCalled = false
    await premiumContentMiddleware(
      { ...mockReq, params: { CID: null } } as unknown as Request,
      mockRes as unknown as Response,
      () => {
        nextCalled = true
      }
    )
    assert.deepStrictEqual(mockRes.statusCode, 400)
    assert.deepStrictEqual(nextCalled, false)
  })

  it('returns unauthorized when it fails because of missing headers', async () => {
    premiumContentAccessChecker.accessCheckReturnsWith = {
      doesUserHaveAccess: false,
      trackId: 1,
      isPremium: true,
      error: PremiumContentAccessError.MISSING_HEADERS
    }
    let nextCalled = false
    await premiumContentMiddleware(
      mockReq as unknown as Request,
      mockRes as unknown as Response,
      () => {
        nextCalled = true
      }
    )
    assert.deepStrictEqual(mockRes.statusCode, 401)
    assert.deepStrictEqual(nextCalled, false)
  })

  it('returns forbidden when it fails because of invalid discovery node', async () => {
    premiumContentAccessChecker.accessCheckReturnsWith = {
      doesUserHaveAccess: false,
      trackId: 1,
      isPremium: true,
      error: PremiumContentAccessError.INVALID_DISCOVERY_NODE
    }
    let nextCalled = false
    await premiumContentMiddleware(
      mockReq as unknown as Request,
      mockRes as unknown as Response,
      () => {
        nextCalled = true
      }
    )
    assert.deepStrictEqual(mockRes.statusCode, 403)
    assert.deepStrictEqual(nextCalled, false)
  })

  it('returns forbidden when it fails because of failed verification match', async () => {
    premiumContentAccessChecker.accessCheckReturnsWith = {
      doesUserHaveAccess: false,
      trackId: 1,
      isPremium: true,
      error: PremiumContentAccessError.FAILED_MATCH
    }
    let nextCalled = false
    await premiumContentMiddleware(
      mockReq as unknown as Request,
      mockRes as unknown as Response,
      () => {
        nextCalled = true
      }
    )
    assert.deepStrictEqual(mockRes.statusCode, 403)
    assert.deepStrictEqual(nextCalled, false)
  })

  it('passes and moves to the next middleware when all checks are fine and content is NOT premium', async () => {
    premiumContentAccessChecker.accessCheckReturnsWith = {
      doesUserHaveAccess: true,
      trackId: null,
      isPremium: false,
      error: null
    }
    let nextCalled = false
    await premiumContentMiddleware(
      mockReq as unknown as Request,
      mockRes as unknown as Response,
      () => {
        nextCalled = true
      }
    )
    assert.deepStrictEqual(nextCalled, true)
  })

  it('passes and moves to the next middleware when all checks are fine and content IS premium', async () => {
    premiumContentAccessChecker.accessCheckReturnsWith = {
      doesUserHaveAccess: true,
      trackId: 1,
      isPremium: true,
      error: null
    }
    let nextCalled = false
    await premiumContentMiddleware(
      mockReq as unknown as Request,
      mockRes as unknown as Response,
      () => {
        nextCalled = true
      }
    )
    assert.deepStrictEqual(nextCalled, true)
  })
})
