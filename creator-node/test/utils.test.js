const assert = require('assert')
const nock = require('nock')
const proxyquire = require('proxyquire')
const axios = require('axios')

const { logger: genericLogger } = require('../src/logging')

// Module under test
const Utils = require('../src/utils')
const asyncRetry = require('../src/utils/asyncRetry')

const DUMMY_NON_EMPTY_CID_1 = 'QmQMHXPMuey2AT6fPTKnzKQCrRjPS7AbaQdDTM8VXbHC8W'
const DUMMY_NON_EMPTY_CID_2 = 'QmQMHXPMuey2AT6fPTKnzKQCrRjPS7AbaQdDTM8VXbHC8V'

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

  it("If cid is empty but shouldn't be, return false", async function () {
    const UtilsWithMockFs = proxyquire('../src/utils/cidUtils', {
      'fs-extra': {
        // Mock fs.stat() to return size of 0
        stat: async () => {
          return { size: 0 }
        }
      }
    })

    assert.deepStrictEqual(
      await UtilsWithMockFs.verifyCIDMatchesExpected({
        cid: DUMMY_NON_EMPTY_CID_1,
        path: '/some/path',
        logger: genericLogger
      }),
      false
    )
  })

  it('If cid is not what is expected to be, return false', async function () {
    const UtilsWithMockFsAndMockLibs = proxyquire('../src/utils/cidUtils', {
      'fs-extra': {
        // Mock fs.stat() to return size of 1 (non-empty)
        stat: async () => {
          return { size: 1 }
        }
      },
      '@audius/sdk': {
        libs: {
          Utils: {
            fileHasher: {
              // Mock libs fn to return a different cid
              generateNonImageCid: async () => {
                return DUMMY_NON_EMPTY_CID_2
              }
            }
          }
        }
      }
    })

    assert.deepStrictEqual(
      await UtilsWithMockFsAndMockLibs.verifyCIDMatchesExpected({
        cid: DUMMY_NON_EMPTY_CID_1,
        path: '/some/path',
        logger: genericLogger
      }),
      false
    )
  })

  it('If cid is what is expected to be, return true', async function () {
    const UtilsWithMockFsAndMockLibs = proxyquire('../src/utils/cidUtils', {
      'fs-extra': {
        // Mock fs.stat() to return size of 1 (non-empty)
        stat: async () => {
          return { size: 1 }
        }
      },
      '@audius/sdk': {
        libs: {
          Utils: {
            fileHasher: {
              // Mock libs fn to return the same cid
              generateNonImageCid: async () => {
                return DUMMY_NON_EMPTY_CID_1
              }
            }
          }
        }
      }
    })

    assert.deepStrictEqual(
      await UtilsWithMockFsAndMockLibs.verifyCIDMatchesExpected({
        cid: DUMMY_NON_EMPTY_CID_1,
        path: '/some/path',
        logger: genericLogger
      }),
      true
    )
  })
})
