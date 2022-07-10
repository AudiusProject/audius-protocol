const assert = require('assert')

const redis = require('../src/redis')
const { WalletWriteLock } = redis
const utils = require('../src/utils')

describe('test Redis client', function () {
  /** Reset redis state */
  beforeEach(async function () {
    await redis.flushall()
  })

  it('Confirms redis client connection, and tests GET & SET', async function () {
    assert.equal(await redis.ping(), 'PONG')

    assert.equal(await redis.get('key'), null)

    assert.equal(await redis.set('key', 'value'), 'OK')

    assert.equal(await redis.get('key'), 'value')
  })

  it('Confirms user write locking works', async function() {
    const wallet = 'wallet'
    const key = WalletWriteLock.getKey(wallet)
    const defaultExpirationSec = WalletWriteLock.WALLET_WRITE_LOCK_EXPIRATION_SEC
    
    assert.equal(await WalletWriteLock.isHeld(wallet), false)

    assert.doesNotReject(WalletWriteLock.acquire(wallet))

    assert.equal(await redis.ttl(key), defaultExpirationSec)

    assert.equal(await WalletWriteLock.isHeld(wallet), true)

    assert.rejects(WalletWriteLock.acquire(wallet), {
      name: 'Error',
      message: `[acquireWriteLockForWallet][Wallet: ${wallet}] Error: Failed to acquire lock - already held.`
    })

    assert.doesNotReject(WalletWriteLock.release(wallet))

    assert.equal(await WalletWriteLock.isHeld(wallet), false)

    /** Test custom expiration + lock expires without manual release */

    const expirationSec = 3

    assert.doesNotReject(WalletWriteLock.acquire(wallet, expirationSec))

    assert.equal(await redis.ttl(key), expirationSec)

    assert.equal(await WalletWriteLock.isHeld(wallet), true)
    
    await utils.timeout(expirationSec * 1000)

    assert.equal(await WalletWriteLock.isHeld(wallet), false)
  })
})