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
    const defaultExpirationSec = WalletWriteLock.WALLET_WRITE_LOCK_EXPIRATION_SEC
    const validAcquirers = WalletWriteLock.VALID_ACQUIRERS

    // Confirm expected initial state
    
    assert.equal(await WalletWriteLock.isHeld(wallet), false)

    assert.equal(await WalletWriteLock.getCurrentHolder(wallet), null)

    // Acquire lock + confirm expected state

    assert.doesNotReject(WalletWriteLock.acquire(wallet, validAcquirers.PrimarySyncFromSecondary))

    assert.equal(await WalletWriteLock.ttl(wallet), defaultExpirationSec)

    assert.equal(await WalletWriteLock.isHeld(wallet), true)

    assert.equal(await WalletWriteLock.getCurrentHolder(wallet), validAcquirers.PrimarySyncFromSecondary)

    assert.equal(await WalletWriteLock.syncIsInProgress(wallet), true)

    // Confirm acquisition fails when already held

    assert.rejects(WalletWriteLock.acquire(wallet, validAcquirers.PrimarySyncFromSecondary), {
      name: 'Error',
      message: `[acquireWriteLockForWallet][Wallet: ${wallet}] Error: Failed to acquire lock - already held.`
    })

    // Release lock + confirm expected state

    assert.doesNotReject(WalletWriteLock.release(wallet))

    assert.equal(await WalletWriteLock.isHeld(wallet), false)

    assert.equal(await WalletWriteLock.getCurrentHolder(wallet), null)

    assert.equal(await WalletWriteLock.syncIsInProgress(wallet), false)

    // Acquire lock with custom expiration + confirm expected state

    const expirationSec = 1

    assert.doesNotReject(WalletWriteLock.acquire(wallet, validAcquirers.SecondarySyncFromPrimary, expirationSec))

    assert.equal(await WalletWriteLock.ttl(wallet), expirationSec)

    assert.equal(await WalletWriteLock.isHeld(wallet), true)

    assert.equal(await WalletWriteLock.getCurrentHolder(wallet), validAcquirers.SecondarySyncFromPrimary)

    assert.equal(await WalletWriteLock.syncIsInProgress(wallet), true)

    // Confirm lock auto-expired after expected expiration time
    
    await utils.timeout(expirationSec * 2 * 1000)

    assert.equal(await WalletWriteLock.isHeld(wallet), false)
  })
})