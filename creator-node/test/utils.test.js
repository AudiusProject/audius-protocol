const assert = require('assert')
const nock = require('nock')
const axios = require('axios')

// Module under test
const Utils = require('../src/utils')

// Partially tested test file!!

describe('test src/utils.js', () => {
  it('Current node should handle transcode if TranscodingQueue has room', function () {
    assert.strictEqual(
      Utils.currentNodeShouldHandleTranscode({
        transcodingQueueCanAcceptMoreJobs: true,
        spID: 1
      }),
      true
    )
  })

  it('Current node should handle transcode if spID is not initialized', function () {
    assert.strictEqual(
      Utils.currentNodeShouldHandleTranscode({
        transcodingQueueCanAcceptMoreJobs: true,
        spID: null
      }),
      true
    )
  })

  it('Current node should not handle transcode if there is no room in TranscodingQueue and spID is initialized', function () {
    assert.strictEqual(
      Utils.currentNodeShouldHandleTranscode({
        transcodingQueueCanAcceptMoreJobs: false,
        spID: 1
      }),
      false
    )
  })

  it('Do not retry if request responds with 404 and handleBackwardsCompatibility flag is enabled', async function () {
    nock('https://content_node.com')
      .get('/404')
      .reply(404, { data: 'i dont exist........' })

    let didRetry = false
    try {
      await Utils.asyncRetry({
        asyncFn: axios,
        asyncFnParams: [
          {
            url: 'https://content_node.com/404',
            method: 'get'
          }
        ],
        asyncFnTaskLabel:
          'test handleBackwardsCompatibility=true with 404 response',
        options: {
          onRetry: () => {
            didRetry = true
          },
          retries: 1
        },
        handleBackwardsCompatibility: true
      })
    } catch (e) {
      assert.strictEqual(didRetry, false)
      assert.strictEqual(e.message, 'Route not supported')
      return
    }

    assert.fail('Observed fn should have failed')
  })

  it('Retry if request responds with 404 and handleBackwardsCompatibiilty flag is not enabled', async function () {
    nock('https://content_node.com')
      .get('/404')
      .reply(404, { data: 'i dont exist........' })

    let didRetry = false
    try {
      await Utils.asyncRetry({
        asyncFn: axios,
        asyncFnParams: [
          {
            url: 'https://content_node.com/404',
            method: 'get'
          }
        ],
        options: {
          onRetry: () => {
            didRetry = true
          },
          retries: 1
        },
        asyncFnTaskLabel:
          'test handleBackwardsCompatibility=false with 404 response'
      })
    } catch (e) {
      assert.strictEqual(didRetry, true)
      return
    }

    assert.fail('Observed fn should have failed')
  })

  it('Handle retrying failing requests', async function () {
    nock('https://content_node.com')
      .get('/500')
      .reply(500, { data: 'bad server' })

    let didRetry = false
    try {
      await Utils.asyncRetry({
        asyncFn: axios,
        asyncFnParams: [
          {
            url: 'https://content_node.com/500',
            method: 'get'
          }
        ],
        options: {
          onRetry: () => {
            didRetry = true
          },
          retries: 1
        },
        asyncFnTaskLabel: 'test 500 response'
      })
    } catch (e) {
      assert.strictEqual(didRetry, true)
      return
    }

    assert.fail('Observed fn should have failed')
  })

  it('Do not retry successful requests', async function () {
    nock('https://content_node.com')
      .get('/200')
      .reply(200, { data: 'glad server' })

    let didRetry = false
    try {
      const resp = await Utils.asyncRetry({
        asyncFn: axios,
        asyncFnParams: [
          {
            url: 'https://content_node.com/200',
            method: 'get'
          }
        ],
        options: {
          onRetry: () => {
            didRetry = true
          },
          retries: 1
        },
        asyncFnTaskLabel: 'test 200 response'
      })

      assert.strictEqual(didRetry, false)
      assert.strictEqual(resp.data.data, 'glad server')
    } catch (e) {
      assert.fail('Observed fn should not have failed')
    }
  })

  it('Works as expected with no params', async function () {
    try {
      const resp = await Utils.asyncRetry({
        asyncFn: async () => {
          return 'nice'
        },
        asyncFnTaskLabel: 'test function with no params'
      })

      assert.strictEqual(resp, 'nice')
    } catch (e) {
      assert.fail('Observed fn should not have failed')
    }
  })

  it('Works as expected with params', async function () {
    try {
      const asyncFn = (a, b, c) => {
        return c * (a + b)
      }
      const resp = await Utils.asyncRetry({
        asyncFn,
        asyncFnParams: [1, 2, 8],
        asyncFnTaskLabel: 'test function with params'
      })

      assert.strictEqual(resp, 24)
    } catch (e) {
      assert.fail('Observed fn should not have failed')
    }
  })
})
