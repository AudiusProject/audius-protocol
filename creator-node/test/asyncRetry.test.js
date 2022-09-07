const assert = require('assert')
const asyncRetry = require('../src/utils/asyncRetry')

describe('test asyncRetry', function () {
  it('does not retry on bails', async function () {
    try {
      await asyncRetry({
        asyncFn: async (bail, num) => {
          if (num === 3) {
            bail(new Error('Will not retry after 3 retries'))
            return
          }

          throw new Error(`Test ${num}`)
        }
      })
    } catch (e) {
      assert.deepStrictEqual(e.message, 'Will not retry after 3 retries')
    }
  })
})
