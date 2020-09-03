const assert = require('assert')
const { getRequestRange, formatContentRange } = require('./requestRange')

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

describe('Test formatContentRange', () => {
  it('Should format correctly', () => {
    const header = formatContentRange(1024, 2048, 4096)
    assert.strictEqual(header, 'bytes 1024-2048/4096')
  })

  it('Should use size when end is unset', () => {
    const header = formatContentRange(1024, undefined, 4096)
    assert.strictEqual(header, 'bytes 1024-4095/4096')
  })
})
