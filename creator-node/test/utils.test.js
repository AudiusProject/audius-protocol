import { asyncRetry } from '../src/utils/asyncRetry'
const assert = require('assert')
const nock = require('nock')
const axios = require('axios')

const { logger: genericLogger } = require('../src/logging')

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

  it('Handle retrying for requests that return 404 status code', async function () {
    nock('https://content_node.com')
      .get('/404')
      .reply(404, { data: 'i dont exist........' })

    let didRetry = false
    try {
      await asyncRetry({
        logger: genericLogger,
        asyncFn: async () => {
          return axios({ url: 'https://content_node.com/404', method: 'get' })
        },
        options: {
          onRetry: () => {
            didRetry = true
          },
          retries: 1
        },
        logLabel: 'test handleBackwardsCompatibility=false with 404 response'
      })
    } catch (e) {
      assert.strictEqual(didRetry, true)
      return
    }

    assert.fail('Observed fn should have failed')
  })

  it('Handle retrying for requests that return 500 status code', async function () {
    nock('https://content_node.com')
      .get('/500')
      .reply(500, { data: 'bad server' })

    let didRetry = false
    try {
      await asyncRetry({
        logger: genericLogger,
        asyncFn: async () => {
          return axios({
            url: 'https://content_node.com/500',
            method: 'get'
          })
        },
        options: {
          onRetry: () => {
            didRetry = true
          },
          retries: 1
        },
        logLabel: 'test 500 response'
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
      const resp = await asyncRetry({
        logger: genericLogger,
        asyncFn: async () => {
          return axios({
            url: 'https://content_node.com/200',
            method: 'get'
          })
        },
        options: {
          onRetry: () => {
            didRetry = true
          },
          retries: 1
        },
        logLabel: 'test 200 response'
      })

      assert.strictEqual(didRetry, false)
      assert.strictEqual(resp.data.data, 'glad server')
    } catch (e) {
      assert.fail('Observed fn should not have failed')
    }
  })
})
