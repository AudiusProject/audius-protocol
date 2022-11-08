const {
  readOnlyMiddleware,
  readOnlyMiddlewareHelper
} = require('./readOnlyMiddleware')
const assert = require('assert')
const config = require('../../config')
const { resFactory, loggerFactory } = require('../../../test/lib/reqMock')

describe('Test read-only middleware', function () {
  beforeEach(function () {
    config.reset('isReadOnlyMode')
    config.reset('spID')
  })

  it('Should pass if read-only enabled and is GET request', function () {
    const method = 'GET'
    const isReadOnlyMode = true
    const spIDNotDefined = false
    config.set('isReadOnlyMode', isReadOnlyMode)
    config.set('spID', 1)
    let nextCalled = false

    readOnlyMiddleware({ method }, {}, function () {
      nextCalled = true
    })

    assert.deepStrictEqual(
      readOnlyMiddlewareHelper(isReadOnlyMode, spIDNotDefined, method),
      true
    )
    assert.deepStrictEqual(nextCalled, true)
  })

  it('Should fail if read-only enabled and is not GET request', function () {
    const isReadOnlyMode = true
    const spIDNotDefined = false
    const method = 'POST'
    config.set('isReadOnlyMode', isReadOnlyMode)
    config.set('spID', 1)
    let nextCalled = false

    const logger = loggerFactory()
    const req = {
      method,
      logger
    }
    const res = resFactory()

    readOnlyMiddleware(req, res, function () {
      nextCalled = true
    })

    assert.deepStrictEqual(res.statusCode, 500)
    assert.deepStrictEqual(
      readOnlyMiddlewareHelper(isReadOnlyMode, spIDNotDefined, method),
      false
    )
    assert.deepStrictEqual(nextCalled, false)
  })

  it('Should pass if read-only not enabled and is POST request', function () {
    const method = 'POST'
    const isReadOnlyMode = false
    const spIDNotDefined = false
    config.set('isReadOnlyMode', isReadOnlyMode)
    config.set('spID', 1)
    let nextCalled = false

    const logger = loggerFactory()
    const req = {
      method,
      logger
    }
    const res = resFactory()

    readOnlyMiddleware(req, res, function () {
      nextCalled = true
    })

    assert.deepStrictEqual(
      readOnlyMiddlewareHelper(isReadOnlyMode, spIDNotDefined, method),
      true
    )
    assert.deepStrictEqual(nextCalled, true)
  })

  it('Should fail if spID not defined and is POST request', function () {
    const method = 'POST'
    const isReadOnlyMode = false
    const spIDNotDefined = true
    config.set('isReadOnlyMode', isReadOnlyMode)
    config.set('spID', 0)
    let nextCalled = false

    const logger = loggerFactory()
    const req = {
      method,
      logger
    }
    const res = resFactory()

    readOnlyMiddleware(req, res, function () {
      nextCalled = true
    })

    assert.deepStrictEqual(
      readOnlyMiddlewareHelper(isReadOnlyMode, spIDNotDefined, method),
      false
    )
    assert.deepStrictEqual(nextCalled, false)
  })
})
