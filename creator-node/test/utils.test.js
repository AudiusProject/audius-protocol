const sinon = require('sinon')
const assert = require('assert')

const BlacklistManager = require('../src/blacklistManager')
const redis = require('../src/redis')
const { ipfs, ipfsLatest } = require('../src/ipfsClient')

// Module under test
const Utils = require('../src/utils')

// Partially tested test file!!

describe('test src/utils.js', () => {
  afterEach(async () => {
    // Clear redis
    await redis.del(BlacklistManager.getRedisSegmentCIDKey())
    sinon.restore()
  })

  it('will not rehydrate in rehydrateIpfsFromFsIfNecessary if CID is in BlacklistManager', async () => {
    const multihash = 'testCID'
    const storagePath = 'storagePath'
    const logContext = {}

    // Add CID to BlacklistManager
    await BlacklistManager.addToRedis(
      BlacklistManager.getRedisSegmentCIDKey(),
      multihash
    )

    const blacklistManagerSpy = sinon.spy(BlacklistManager, 'CIDIsInBlacklist')
    const ipfsSingleByteCatSpy = sinon.spy(Utils, 'ipfsSingleByteCat')
    const ipfsAddFromFsSpy = sinon.spy(ipfs, 'addFromFs')
    const ipfsAddSpy = sinon.spy(ipfsLatest, 'add')

    await Utils.rehydrateIpfsFromFsIfNecessary(
      multihash,
      storagePath,
      logContext
    )

    // Make sure rehydration does not occur
    assert(blacklistManagerSpy.calledOnce)
    assert(ipfsSingleByteCatSpy.notCalled)
    assert(ipfsAddFromFsSpy.notCalled)
    assert(ipfsAddSpy.notCalled)
  })

  it('will not rehydrate in rehydrateIpfsDirFromFsIfNecessary if CID is in BlacklistManager', async () => {
    const multihash = 'testCID'
    const logContext = { storagePath: 'storagePath' }

    // Add CID to BlacklistManager
    await BlacklistManager.addToRedis(
      BlacklistManager.getRedisSegmentCIDKey(),
      multihash
    )

    const blacklistManagerSpy = sinon.spy(BlacklistManager, 'CIDIsInBlacklist')
    const ipfsSingleByteCatSpy = sinon.spy(Utils, 'ipfsSingleByteCat')
    const ipfsAddSpy = sinon.spy(ipfsLatest, 'add')

    await Utils.rehydrateIpfsDirFromFsIfNecessary(multihash, logContext)

    // Make sure rehydration does not occur
    assert(blacklistManagerSpy.calledOnce)
    assert(ipfsSingleByteCatSpy.notCalled)
    assert(ipfsAddSpy.notCalled)
  })

  it('Current node cannot handle transcode if libs is null', function () {
    assert.strictEqual(
      Utils.canCurrentNodeHandleTranscode({
        transcodingQueueCanAcceptMoreJobs: true,
        libs: null,
        spID: 1
      }),
      false
    )
  })

  it('Current node cannot handle transcode if spID is not initialized', function () {
    const mockLibs = {}
    assert.strictEqual(
      Utils.canCurrentNodeHandleTranscode({
        transcodingQueueCanAcceptMoreJobs: true,
        libs: mockLibs,
        spID: null
      }),
      false
    )
  })

  it('Current node cannot handle transcode if TranscodingQueue cannot accept more jobs', function () {
    const mockLibs = {}
    assert.strictEqual(
      Utils.canCurrentNodeHandleTranscode({
        transcodingQueueCanAcceptMoreJobs: false,
        libs: mockLibs,
        spID: 1
      }),
      false
    )
  })

  it('Current node can handle transcode if all conditions are met', function () {
    const mockLibs = {}
    assert.strictEqual(
      Utils.canCurrentNodeHandleTranscode({
        transcodingQueueCanAcceptMoreJobs: true,
        libs: mockLibs,
        spID: 1
      }),
      true
    )
  })
})
