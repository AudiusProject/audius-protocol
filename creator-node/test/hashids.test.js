const hashids = require('../src/hashids')
const assert = require('assert')

const constants = {
  decoded: [1],
  encoded: ['7eP5n'],
  badEncoded: 'abcdefg'
}

describe('Test HashIds', async function () {
  it('Should encode IDs properly', async function () {
    const encoded = hashids.encode(constants.decoded[0])
    assert.strictEqual(constants.encoded[0], encoded)
  })
  it('Should decode IDs properly', async function () {
    const decoded = hashids.decode(constants.encoded[0])
    assert.strictEqual(constants.decoded[0], decoded)
  })
  it('Should return null if it can not decode', async function () {
    const impossible = hashids.decode(constants.badEncoded)
    assert.strictEqual(impossible, null)
  })
})
