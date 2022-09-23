const assert = require('assert')
const sinon = require('sinon')

const BlacklistManager = require('../src/blacklistManager')
const redis = require('../src/redis')

const { getApp } = require('./lib/app')
const { getLibsMock } = require('./lib/libsMock')
const { restartBlacklistManager } = require('./lib/blacklistManager')

const DUMMY_CID = 'QmYkZMB1cdo8k1Lizco4YyiAMfUwCn9yUQaJn7T274uc5z'

describe('test blacklistManager', () => {
  let server, libsMock

  beforeEach(async () => {
    libsMock = getLibsMock()

    const appInfo = await getApp(
      libsMock,
      BlacklistManager,
      null,
      1 /* userId */
    )
    await BlacklistManager.init()

    server = appInfo.server
  })

  afterEach(async () => {
    await restartBlacklistManager(redis)
    sinon.restore()
    await server.close()
  })

  it('should delete all blacklist redis keys on init', async () => {
    let resp = await BlacklistManager.getAllCIDs()
    assert.deepStrictEqual(resp.length, 0)

    resp = await BlacklistManager.getAllUserIds()
    assert.deepStrictEqual(resp.length, 0)

    resp = await BlacklistManager.getAllTrackIds()
    assert.deepStrictEqual(resp.length, 0)

    resp = await BlacklistManager.getAllInvalidTrackIds()
    assert.deepStrictEqual(resp.length, 0)
  })

  it('[isServable] if cid is not in blacklist, serve', async () => {
    assert.deepStrictEqual(
      await BlacklistManager.isServable(DUMMY_CID, 1),
      true
    )
  })

  it('[isServable] if cid is in blacklist and trackId is invalid, do not serve', async () => {
    await BlacklistManager._addToRedis(
      'BM.SET.BLACKLIST.SEGMENTCID' /* REDIS_SET_BLACKLIST_SEGMENTCID_KEY */,
      [DUMMY_CID]
    )

    assert.deepStrictEqual(await BlacklistManager.isServable(DUMMY_CID), false)
    assert.deepStrictEqual(
      await BlacklistManager.isServable(DUMMY_CID, null),
      false
    )
    assert.deepStrictEqual(
      await BlacklistManager.isServable(DUMMY_CID, 'abc'),
      false
    )
    assert.deepStrictEqual(
      await BlacklistManager.isServable(DUMMY_CID, -1),
      false
    )
    assert.deepStrictEqual(
      await BlacklistManager.isServable(DUMMY_CID, 0.48),
      false
    )
    assert.deepStrictEqual(
      await BlacklistManager.isServable(DUMMY_CID, 1.48),
      false
    )
    assert.deepStrictEqual(
      await BlacklistManager.isServable(DUMMY_CID, []),
      false
    )
    assert.deepStrictEqual(
      await BlacklistManager.isServable(DUMMY_CID, [1]),
      false
    )
  })

  it('[isServable] cid belongs to track from input trackId, and the input trackId is valid + blacklisted, do not serve', async () => {
    await BlacklistManager._addToRedis('BM.SET.BLACKLIST.SEGMENTCID', [
      DUMMY_CID
    ])
    await BlacklistManager._addToRedis('BM.SET.BLACKLIST.TRACKID', [1])
    await BlacklistManager._addToRedis('BM.MAP.BLACKLIST.SEGMENTCID.TRACKID', {
      1: [DUMMY_CID]
    })
    await BlacklistManager._addToRedis('BM.MAP.TRACKID.SEGMENTCIDS', {
      1: [DUMMY_CID]
    })

    assert.deepStrictEqual(
      await BlacklistManager.isServable(DUMMY_CID, 1),
      false
    )
  })

  it('[isServable] cid is in blacklist, cid belongs to track from input trackId with redis check, and the input trackId is valid + not blacklisted, allow serve', async () => {
    await BlacklistManager._addToRedis('BM.SET.BLACKLIST.SEGMENTCID', [
      DUMMY_CID
    ])
    await BlacklistManager._addToRedis('BM.MAP.TRACKID.SEGMENTCIDS', {
      1: [DUMMY_CID]
    })

    assert.deepStrictEqual(
      await BlacklistManager.isServable(DUMMY_CID, 1),
      true
    )
  })

  it('[isServable] cid is in blacklist, cid does not belong to track from input trackId with redis check, and input track is invalid, do not serve', async () => {
    await BlacklistManager._addToRedis('BM.SET.BLACKLIST.SEGMENTCID', [
      DUMMY_CID
    ])
    await BlacklistManager._addToRedis('BM.SET.INVALID.TRACKIDS', [1234])

    assert.deepStrictEqual(
      await BlacklistManager.isServable(DUMMY_CID, 1234),
      false
    )
  })

  it('[isServable] cid is in blacklist, cid does not belong to track from input trackId with redis check, and input track is invalid with db check, do not serve', async () => {
    await BlacklistManager._addToRedis('BM.SET.BLACKLIST.SEGMENTCID', [
      DUMMY_CID
    ])

    // Mock DB call to return nothing
    sinon
      .stub(BlacklistManager, '_getAllCIDsFromTrackIdsInDb')
      .callsFake(async () => {
        return []
      })

    assert.deepStrictEqual(
      await BlacklistManager.isServable(DUMMY_CID, 1234),
      false
    )
    assert.deepStrictEqual(await BlacklistManager.trackIdIsInvalid(1234), 1)
  })

  it('[isServable] cid is in blacklist, cid does not belong to track from input trackId with redis check, and input track is valid with db check, and cid is in track, allow serve', async () => {
    await BlacklistManager._addToRedis('BM.SET.BLACKLIST.SEGMENTCID', [
      DUMMY_CID
    ])

    // Mock DB call to return proper segment
    sinon
      .stub(BlacklistManager, '_getAllCIDsFromTrackIdsInDb')
      .callsFake(async () => {
        return [
          {
            metadataJSON: {
              track_segments: [{ duration: 6, multihash: DUMMY_CID }]
            }
          }
        ]
      })

    assert.deepStrictEqual(
      await BlacklistManager.isServable(DUMMY_CID, 1),
      true
    )
    assert.deepStrictEqual(
      await BlacklistManager._getAllCIDsFromTrackIdInRedis(1),
      [DUMMY_CID]
    )
  }).timeout(0)

  it('[isServable] cid is in blacklist, cid does not belong to track from input trackId with redis check, and input track is valid with db check, and cid is not in track, do not serve', async () => {
    await BlacklistManager._addToRedis('BM.SET.BLACKLIST.SEGMENTCID', [
      DUMMY_CID
    ])

    // Mock DB call to return proper segment that is not the same as `CID`
    sinon
      .stub(BlacklistManager, '_getAllCIDsFromTrackIdsInDb')
      .callsFake(async () => {
        return [
          {
            metadataJSON: {
              track_segments: [
                { duration: 6, multihash: 'QmABC_tinashe_and_rei_ami' }
              ]
            }
          }
        ]
      })

    assert.deepStrictEqual(
      await BlacklistManager.isServable(DUMMY_CID, 1),
      false
    )
    assert.deepStrictEqual(
      await BlacklistManager._getAllCIDsFromTrackIdInRedis(1),
      ['QmABC_tinashe_and_rei_ami']
    )
  })
})
