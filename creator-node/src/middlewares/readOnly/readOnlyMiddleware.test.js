const { readOnlyMiddleware, readOnlyMiddlewareHelper } = require('./readOnlyMiddleware')
const assert = require('assert')
const config = require('../../config')
const { resFactory, loggerFactory } = require('../../../test/lib/reqMock')

describe('Test read-only middleware', function () {
  beforeEach(function() {
    config.reset('isReadOnlyMode')
  })

  it('Should pass if read-only enabled and is GET request', function () {
    const method = 'GET'
    const isReadOnlyMode = true
    config.set('isReadOnlyMode', isReadOnlyMode)
    let nextCalled = false


    readOnlyMiddleware({ method }, {}, function() {
      nextCalled = true
    })

    assert.deepStrictEqual(readOnlyMiddlewareHelper(isReadOnlyMode, method), true)
    assert.deepStrictEqual(nextCalled, true)
  })

  it('Should fail if read-only enabled and is not GET request', function () {
    const isReadOnlyMode = true
    const method = 'POST'
    config.set('isReadOnlyMode', isReadOnlyMode)
    let nextCalled = false

    const logger = loggerFactory()
    const req = {
      method,
      logger
    }
    const res = resFactory()

    readOnlyMiddleware(req, res, function() {
      nextCalled = true
    })

    assert.deepStrictEqual(res.statusCode, 500)
    assert.deepStrictEqual(readOnlyMiddlewareHelper(isReadOnlyMode, method), false)
    assert.deepStrictEqual(nextCalled, false)
  })

  it('Should pass if read-only not enabled and is POST request', function () {
    const method = 'POST'
    const isReadOnlyMode = false
    config.set('isReadOnlyMode', isReadOnlyMode)
    let nextCalled = false

    readOnlyMiddleware({ method }, {}, function() {
      nextCalled = true
    })

    assert.deepStrictEqual(readOnlyMiddlewareHelper(isReadOnlyMode, method), true)
    assert.deepStrictEqual(nextCalled, true)
  })
})
