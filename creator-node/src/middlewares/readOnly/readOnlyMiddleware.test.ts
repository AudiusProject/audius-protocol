import type { Request, Response } from 'express'
import {
  readOnlyMiddleware,
  canProceedInReadOnlyMode
} from './readOnlyMiddleware'
import assert from 'assert'
import config from '../../config'
import { resFactory, loggerFactory } from '../../../test/lib/reqMock'

describe('Test read-only middleware', function () {
  beforeEach(function () {
    config.reset('isReadOnlyMode')
    config.reset('spID')
  })

  it('Should allow request if read-only enabled and is GET request', function () {
    const method = 'GET'
    const isReadOnlyMode = true
    const spIDNotDefined = false
    config.set('isReadOnlyMode', isReadOnlyMode)
    config.set('spID', 1)
    const originalUrl = '/random_url'
    let nextCalled = false

    readOnlyMiddleware(
      { method, originalUrl } as Request,
      {} as Response,
      function () {
        nextCalled = true
      }
    )

    assert.deepStrictEqual(
      canProceedInReadOnlyMode(
        isReadOnlyMode,
        spIDNotDefined,
        method,
        originalUrl
      ),
      true
    )
    assert.deepStrictEqual(nextCalled, true)
  })

  it('Should not allow request if read-only enabled and is not GET request', function () {
    const isReadOnlyMode = true
    const spIDNotDefined = false
    const method = 'POST'
    config.set('isReadOnlyMode', isReadOnlyMode)
    config.set('spID', 1)
    const originalUrl = '/random_url'
    let nextCalled = false

    const logger = loggerFactory()
    const req = {
      method,
      originalUrl,
      logger
    } as unknown as Request
    const res = resFactory() as unknown as Response

    readOnlyMiddleware(req, res, function () {
      nextCalled = true
    })

    assert.deepStrictEqual(res.statusCode, 500)
    assert.deepStrictEqual(
      canProceedInReadOnlyMode(
        isReadOnlyMode,
        spIDNotDefined,
        method,
        originalUrl
      ),
      false
    )
    assert.deepStrictEqual(nextCalled, false)
  })

  it('Should allow request if read-only not enabled and is POST request', function () {
    const method = 'POST'
    const isReadOnlyMode = false
    const spIDNotDefined = false
    config.set('isReadOnlyMode', isReadOnlyMode)
    config.set('spID', 1)
    const originalUrl = '/random_url'
    let nextCalled = false

    const logger = loggerFactory()
    const req = {
      method,
      originalUrl,
      logger
    } as unknown as Request
    const res = resFactory() as unknown as Response

    readOnlyMiddleware(req, res, function () {
      nextCalled = true
    })

    assert.deepStrictEqual(
      canProceedInReadOnlyMode(
        isReadOnlyMode,
        spIDNotDefined,
        method,
        originalUrl
      ),
      true
    )
    assert.deepStrictEqual(nextCalled, true)
  })

  it('Should not allow request if spID not defined and is POST request', function () {
    const method = 'POST'
    const isReadOnlyMode = false
    const spIDNotDefined = true
    config.set('isReadOnlyMode', isReadOnlyMode)
    config.set('spID', 0)
    const originalUrl = '/random_url'
    let nextCalled = false

    const logger = loggerFactory()
    const req = {
      method,
      originalUrl,
      logger
    } as unknown as Request
    const res = resFactory() as unknown as Response

    readOnlyMiddleware(req, res, function () {
      nextCalled = true
    })

    assert.deepStrictEqual(
      canProceedInReadOnlyMode(
        isReadOnlyMode,
        spIDNotDefined,
        method,
        originalUrl
      ),
      false
    )
    assert.deepStrictEqual(nextCalled, false)
  })
})
