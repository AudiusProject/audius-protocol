const sinon = require('sinon')
const assert = require('assert')

const utils = require('../src/utils')
const BlacklistManager = require('../src/blacklistManager')
const { ipfs, ipfsLatest } = require('../src/ipfsClient')
const redis = require('../src/redis')

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
    await BlacklistManager.addToRedis(BlacklistManager.getRedisSegmentCIDKey(), multihash)

    const blacklistManagerSpy = sinon.spy(BlacklistManager, 'CIDIsInBlacklist')
    const ipfsSingleByteCatSpy = sinon.spy(utils, 'ipfsSingleByteCat')
    const ipfsAddFromFsSpy = sinon.spy(ipfs, 'addFromFs')
    const ipfsAddSpy = sinon.spy(ipfsLatest, 'add')

    await utils.rehydrateIpfsFromFsIfNecessary(multihash, storagePath, logContext)

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
    await BlacklistManager.addToRedis(BlacklistManager.getRedisSegmentCIDKey(), multihash)

    const blacklistManagerSpy = sinon.spy(BlacklistManager, 'CIDIsInBlacklist')
    const ipfsSingleByteCatSpy = sinon.spy(utils, 'ipfsSingleByteCat')
    const ipfsAddSpy = sinon.spy(ipfsLatest, 'add')

    await utils.rehydrateIpfsDirFromFsIfNecessary(multihash, logContext)

    // Make sure rehydration does not occur
    assert(blacklistManagerSpy.calledOnce)
    assert(ipfsSingleByteCatSpy.notCalled)
    assert(ipfsAddSpy.notCalled)
  })
})
