const assert = require('assert')
const nock = require('nock')

const { timeRequestsAndSortByVersion } = require('./network')

const setupRequest = (url, delay, version, status = 200) => {
  const req = { url }
  nock(req.url)
    .get('/')
    .delay(delay)
    .reply(status, { data: {
      version
    } })
  return req
}

describe('timeRequestsAndSortByVersion', () => {
  it('can sort by conditions', async () => {
    const reqs = [
      setupRequest('https://fast1.audius.co', 50, '1.2.3'),
      setupRequest('https://fast2.audius.co', 100, '1.2.3'),
      setupRequest('https://behind.audius.co', 100, '1.2.2'),
      setupRequest('https://slow.audius.co', 500, '1.2.3'),
      setupRequest('https://error.audius.co', 500, '1.2.3', 404)
    ]

    const res = await timeRequestsAndSortByVersion(
      reqs
    )

    assert.strictEqual(res[0].request.url, 'https://fast1.audius.co')
    assert.strictEqual(res[1].request.url, 'https://fast2.audius.co')
    assert.strictEqual(res[2].request.url, 'https://slow.audius.co')
    assert.strictEqual(res[3].request.url, 'https://behind.audius.co')
    assert.strictEqual(res[4].request.url, 'https://error.audius.co')
  })

  it('respects an equivalency delta', async () => {
    let allResults = []
    for (let i = 0; i < 20; ++i) {
      const reqs = [
        setupRequest('https://cohort1a.audius.co', 1, '1.2.3'),
        setupRequest('https://cohort1b.audius.co', 1, '1.2.3'),
        setupRequest('https://cohort1c.audius.co', 1, '1.2.3'),

        setupRequest('https://cohort2a.audius.co', 100, '1.2.3'),
        setupRequest('https://cohort2b.audius.co', 101, '1.2.3'),
        setupRequest('https://cohort2c.audius.co', 102, '1.2.3'),

        setupRequest('https://cohort3a.audius.co', 200, '1.2.3'),
        setupRequest('https://cohort3b.audius.co', 220, '1.2.3'),
        setupRequest('https://cohort3c.audius.co', 205, '1.2.3')
      ]
      const res = await timeRequestsAndSortByVersion(
        reqs,
        /* timeout */ null,
        50 // requests w/in 50ms should be randomly selected
      )
      allResults.push(res.map(r => r.request.url).join(''))

      // Ensure that each round of testing separates by cohors
      assert(res[0].request.url.startsWith('https://cohort1'))
      assert(res[1].request.url.startsWith('https://cohort1'))
      assert(res[2].request.url.startsWith('https://cohort1'))

      assert(res[3].request.url.startsWith('https://cohort2'))
      assert(res[4].request.url.startsWith('https://cohort2'))
      assert(res[5].request.url.startsWith('https://cohort2'))

      assert(res[6].request.url.startsWith('https://cohort3'))
      assert(res[7].request.url.startsWith('https://cohort3'))
      assert(res[8].request.url.startsWith('https://cohort3'))
    }

    // Make sure there is some variance
    assert(!allResults.every(val => val === allResults[0]))
  }).timeout(10000)
})
