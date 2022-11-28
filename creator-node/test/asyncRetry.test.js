const assert = require('assert')
const { asyncRetry } = require('../src/utils/asyncRetry')

describe('test asyncRetry', function () {
  it('will retry the default number of times', async function () {
    const defaultNumberOfRetries = 5

    let attempts = 0
    try {
      await asyncRetry({
        asyncFn: async (bail, num) => {
          attempts++
          throw new Error(`Test ${num}`)
        },
        options: {
          minTimeout: 0,
          maxTimeout: 100
        }
      })

      assert.fail('Should have thrown')
    } catch (e) {
      // First attempt = 1 + Default retries = 5 => 6 total attempts
      assert.deepStrictEqual(attempts, defaultNumberOfRetries + 1)
    }
  })

  it('does not retry on bails', async function () {
    try {
      await asyncRetry({
        asyncFn: async (bail, num) => {
          if (num === 3) {
            bail(new Error('Will not retry after 3 retries'))
            return
          }

          throw new Error(`Test ${num}`)
        },
        options: {
          minTimeout: 0,
          maxTimeout: 100
        }
      })
      assert.fail('Should have thrown')
    } catch (e) {
      assert.deepStrictEqual(e.message, 'Will not retry after 3 retries')
    }
  })

  it('on certain retry, do something', async function () {
    try {
      let name = ''
      await asyncRetry({
        asyncFn: async (bail, num) => {
          if (num === 3) {
            name = 'vicky'
            return
          }

          name = 'not vicky'
          throw new Error(`Test ${num}`)
        },
        options: {
          minTimeout: 0,
          maxTimeout: 100
        }
      })

      assert.deepStrictEqual(name, 'vicky')
    } catch (e) {
      assert.fail('Should not have thrown')
    }
  })

  it('final error message should be what is specified in num retry check', async function () {
    try {
      const retries = 3
      await asyncRetry({
        asyncFn: async (bail, num) => {
          console.log('Test num', num)
          if (num === retries + 1) {
            throw new Error('vicky')
          }

          throw new Error(`Test ${num}`)
        },
        options: {
          minTimeout: 0,
          maxTimeout: 100,
          retries
        }
      })

      assert.fail('Should have thrown')
    } catch (e) {
      assert.deepStrictEqual(e.message, 'vicky')
    }
  })

  it('retry should not exceed input desired time', async function () {
    let attempts = 0
    try {
      await asyncRetry({
        asyncFn: async () => {
          attempts++

          await new Promise((resolve) => {
            setTimeout(() => {
              resolve()
            }, 200)
          })

          throw new Error('force retry')
        },
        options: {
          minTimeout: 0,
          maxTimeout: 100,
          maxRetryTime: 300
        }
      })

      assert.fail('Should have thrown')
    } catch (e) {
      // Should have been 2 attempts because maxRetryTime=401ms and each async fn call = 200ms
      // So, a total of at most 2 attempts could have run, even though the default number of retries > 2
      assert.deepStrictEqual(attempts, 2)
    }
  })
})
