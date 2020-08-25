const assert = require('assert')
const { getRequestRange } = require('./requestRange')

describe('Test getRequestRange', () => {
  it('Should calculate start and end', () => {
    const req = {
      header: () => 'bytes=1024-2048'
    }
    const { start, end } = getRequestRange(req)
    assert.strictEqual(start, 1024)
    assert.strictEqual(end, 2048)
  })

  it('Should calculate start with no end', () => {
    const req = {
      header: () => 'bytes=1024-'
    }
    const { start, end } = getRequestRange(req)
    assert.strictEqual(start, 1024)
    assert.strictEqual(end, undefined)
  })

  it('Should error at malformatted range', () => {
    const req = {
      header: () => ''
    }
    const range = getRequestRange(req)
    assert.strictEqual(range, null)
  })

  it('Should error at non integer ranges', () => {
    const req = {
      header: () => 'bytes=abc-def'
    }
    const range = getRequestRange(req)
    assert.strictEqual(range, null)
  })
})
