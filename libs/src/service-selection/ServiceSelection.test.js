const ServiceSelection = require('./ServiceSelection')
const nock = require('nock')
const assert = require('assert')
const Utils = require('../utils')

describe('ServiceSelection', () => {
  it('prefers a healthy service', async () => {
    const good = 'https://good.audius.co'
    nock(good)
      .get('/health_check')
      .reply(200)

    const bad = 'https://bad.audius.co'
    nock(bad)
      .get('/health_check')
      .reply(400)

    const s = new ServiceSelection({
      getServices: () => [good, bad]
    })
    const service = await s.select()
    assert.strictEqual(service, good)
  })

  it('prefers a faster service', async () => {
    const fast = 'https://fast.audius.co'
    nock(fast)
      .get('/health_check')
      .reply(200)

    const slow = 'https://slow.audius.co'
    nock(slow)
      .get('/health_check')
      .delay(200)
      .reply(400)

    const s = new ServiceSelection({
      getServices: () => [fast, slow]
    })
    const service = await s.select()
    assert.strictEqual(service, fast)
  })

  it('prefers a slower healthy service', async () => {
    const fast = 'https://fast.audius.co'
    nock(fast)
      .get('/health_check')
      .reply(400)

    const slow = 'https://slow.audius.co'
    nock(slow)
      .get('/health_check')
      .delay(200)
      .reply(200)

    const s = new ServiceSelection({
      getServices: () => [fast, slow]
    })
    const service = await s.select()
    assert.strictEqual(service, slow)
    assert.deepStrictEqual(s.unhealthy, new Set([fast]))
  })

  it('should find the needle in the haystack', async () => {
    // Single good service
    const needle = 'https://needle.audius.co'
    nock(needle)
      .get('/health_check')
      .reply(200)
    // Many bad services
    const haystack = Array.from({ length: 20 }, (v, i) => `https://${i}.audius.co`)
    haystack.forEach(hay => {
      nock(hay).get('/health_check').reply(400)
    })

    const s = new ServiceSelection({
      getServices: () => [...haystack, needle],
      maxConcurrentRequests: 2,
      requestTimeout: 100
    })
    const service = await s.select()
    assert.strictEqual(service, needle)
  })

  it('should pick null if there is no healthy service', async () => {
    const bad1 = 'https://bad1.audius.co'
    nock(bad1)
      .get('/health_check')
      .reply(400)

    const bad2 = 'https://bad2.audius.co'
    nock(bad2)
      .get('/health_check')
      .reply(400)

    const s = new ServiceSelection({
      getServices: () => [bad1, bad2],
      // Short timeout otherwise, we'll wait for a long time for some request to succeed
      // TODO: consider ammending promiseFight to early exit
      requestTimeout: 100
    })
    const service = await s.select()
    assert.strictEqual(service, null)
  })

  it('respects a whitelist', async () => {
    const fast = 'https://fast.audius.co'
    nock(fast)
      .get('/health_check')
      .reply(200)

    const slow = 'https://slow.audius.co'
    nock(slow)
      .get('/health_check')
      .delay(200)
      .reply(200)

    const s = new ServiceSelection({
      getServices: () => [fast, slow],
      whitelist: new Set([slow])
    })
    const service = await s.select()
    assert.strictEqual(service, slow)
  })

  it('respects a blacklist', async () => {
    const fast = 'https://fast.audius.co'
    nock(fast)
      .get('/health_check')
      .reply(200)

    const slow = 'https://slow.audius.co'
    nock(slow)
      .get('/health_check')
      .delay(200)
      .reply(200)

    const s = new ServiceSelection({
      getServices: () => [fast, slow],
      blacklist: new Set([fast])
    })
    const service = await s.select()
    assert.strictEqual(service, slow)
  })

  it('will recheck unhealthy ones', async () => {
    const atFirstHealthy = 'https://atFirstHealthy.audius.co'
    nock(atFirstHealthy)
      .get('/health_check')
      .reply(200)
    nock(atFirstHealthy)
      .get('/health_check')
      .reply(400)

    const atFirstUnhealthy = 'https://atFirstUnhealthy.audius.co'
    nock(atFirstUnhealthy)
      .get('/health_check')
      .reply(400)
    nock(atFirstUnhealthy)
      .get('/health_check')
      .reply(200)

    const s = new ServiceSelection({
      getServices: () => [atFirstHealthy, atFirstUnhealthy],
      unhealthyTTL: 0
    })
    const firstService = await s.select()
    assert.strictEqual(firstService, atFirstHealthy)

    // Push the event loop just to let the unhealthy list get cleared
    await Utils.wait(0)
    const secondService = await s.select()
    assert.strictEqual(secondService, atFirstUnhealthy)
  })
})

describe('ServiceSelection withBackupCriteria', () => {
  class ServiceSelectionWithBackupCriteria extends ServiceSelection {
    isHealthy (response, urlMap) {
      if (response.status === 200) {
        if (response.data.behind) {
          this.addBackup(urlMap[response.config.url], response.data)
          return false
        }
        return true
      }
      return false
    }
  }

  // Crude example of how backups can be used
  it('adds backups', async () => {
    const behind1 = 'https://behind1.audius.co'
    nock(behind1)
      .get('/health_check')
      .reply(200, {
        behind: true
      })

    const behind2 = 'https://behind2.audius.co'
    nock(behind2)
      .get('/health_check')
      .reply(200, {
        behind: true
      })

    const ok = 'https://ok.audius.co'
    nock(ok)
      .get('/health_check')
      .delay(100)
      .reply(200, {
        behind: false
      })

    const s = new ServiceSelectionWithBackupCriteria({
      getServices: () => [behind1, behind2, ok]
    })
    const service = await s.select()
    assert.strictEqual(service, ok)
    assert.deepStrictEqual(s.backups, {
      [behind1]: { behind: true },
      [behind2]: { behind: true }
    })
  })

  it('should use a backup if there is no better option', async () => {
    // Single service that's behind
    const needle = 'https://needle.audius.co'
    nock(needle)
      .get('/health_check')
      .reply(200, {
        behind: true
      })
    // Many bad services
    const haystack = Array.from({ length: 20 }, (v, i) => `https://${i}.audius.co`)
    haystack.forEach(hay => {
      nock(hay).get('/health_check').reply(400)
    })

    const s = new ServiceSelectionWithBackupCriteria({
      getServices: () => [...haystack, needle],
      maxConcurrentRequests: 2,
      requestTimeout: 100
    })
    const service = await s.select()
    assert.strictEqual(service, needle)
    // It should have tried everything before falling back to the "needle"
    assert.strictEqual(s.getTotalAttempts(), 21)
  })

  it('should skip over a backup if a better service can be found', async () => {
    // Single good service
    const needle = 'https://needle.audius.co'
    nock(needle)
      .get('/health_check')
      .reply(200)
    // Single service that's behind
    const behind = 'https://behind.audius.co'
    nock(behind)
      .get('/health_check')
      .reply(200, {
        behind: true
      })
    // Many bad services
    const haystack = Array.from({ length: 20 }, (v, i) => `https://${i}.audius.co`)
    haystack.forEach(hay => {
      nock(hay).get('/health_check').reply(400)
    })

    const s = new ServiceSelectionWithBackupCriteria({
      getServices: () => [behind, ...haystack, needle],
      maxConcurrentRequests: 2,
      requestTimeout: 100
    })
    const service = await s.select()
    assert.strictEqual(service, needle)
  })
})

describe('ServiceSelection withShortCircuit', () => {
  const shortcircuit = 'https://shortcircuit.audius.co'
  class ServiceSelectionWithShortCircuit extends ServiceSelection {
    shortcircuit () {
      return shortcircuit
    }
  }

  it('uses a short circuit', async () => {
    const other = 'https://other.audius.co'
    nock(other)
      .get('/health_check')
      .reply(200, {
        behind: true
      })

    const s = new ServiceSelectionWithShortCircuit({
      getServices: () => [other]
    })
    const service = await s.select()
    assert.strictEqual(service, shortcircuit)
  })

  it('does not use a short circuit when a blacklist is present', async () => {
    const other = 'https://other.audius.co'
    nock(other)
      .get('/health_check')
      .reply(200, {
        behind: true
      })

    const s = new ServiceSelectionWithShortCircuit({
      getServices: () => [other],
      blacklist: new Set([shortcircuit])
    })
    const service = await s.select()
    assert.strictEqual(service, other)
  })
})

describe('ServiceSelection findAll', () => {
  it('can find all the healthy services', async () => {
    const a = 'https://a.audius.co'
    nock(a)
      .get('/health_check')
      .reply(200)

    const b = 'https://b.audius.co'
    nock(b)
      .get('/health_check')
      .reply(200)

    const c = 'https://c.audius.co'
    nock(c)
      .get('/health_check')
      .reply(400)

    const s = new ServiceSelection({
      getServices: () => [a, b, c]
    })
    const all = await s.findAll()
    assert.deepStrictEqual(all, [a, b])
  })

  it('will drop slow services', async () => {
    const a = 'https://a.audius.co'
    nock(a)
      .get('/health_check')
      .delay(200)
      .reply(200)

    const b = 'https://b.audius.co'
    nock(b)
      .get('/health_check')
      .reply(200)

    const c = 'https://c.audius.co'
    nock(c)
      .get('/health_check')
      .reply(200)

    const s = new ServiceSelection({
      getServices: () => [a, b, c],
      requestTimeout: 100
    })
    const all = await s.findAll()
    assert.deepStrictEqual(all, [b, c])
  })
})
