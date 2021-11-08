const assert = require('assert')
const { Lock, redisClient } = require('../src/redis')

describe('test txRelay: selectWallet()', async () => {
  beforeEach(async () => {
    await Lock.clearAllLocks('*')
  })

  afterEach(async () => {
    await Lock.clearAllLocks('*')
  })

  it('should correctly return false for `getLock` on a nonexisting lock', async () => {
    const resp = await Lock.getLock('doesnotexist')
    assert.deepStrictEqual(resp, false)
  })

  it('should correctly `setLock` and return true for `getLock` on an existing lock', async () => {
    await Lock.setLock('existinglock')
    const resp = redisClient.get('existinglock')
    assert.deepStrictEqual(resp, true)
  })

  it('should correctly `clearLock`', async () => {
    await Lock.setLock('existinglock')
    const respBefore = Lock.getLock('existinglock')
    assert.deepStrictEqual(respBefore, true)

    await Lock.clearLock('existinglock')
    const respAfter = Lock.getLock('existinglock')
    assert.deepStrictEqual(respAfter, false)
  })

  it('should correctly `clearAllLocks`', async () => {
    const keys = ['existinglock1', 'existinglock2', 'existinglock3']
    const keyPattern = 'existinglock*'

    // locks shouldn't exist before
    for (let key of keys) {
      assert.deepStrictEqual(key, false)
    }

    for (let key of keys) {
      await Lock.setLock(key)
    }

    // locks should exist after
    for (let key of keys) {
      assert.deepStrictEqual(key, true)
    }

    await Lock.clearAllLocks(keyPattern)

    // locks should not exist after clearing
    for (let key of keys) {
      assert.deepStrictEqual(key, true)
    }
  })
})
