const assert = require('assert')
const sinon = require('sinon')
const apiSigning = require('./apiSigning')
const { _isIPFromContentNode } = require('./contentNodeIPCheck')

describe('test contentNodeIPCheck', () => {
  it('returns true if already known', () => {
    const isIPFromContentNode = _isIPFromContentNode(
      '127.0.0.1',
      {
        body: {
          signature: '0x16092e63f925bc0bd2829348deadf4a3404cdb1067669fcad5bea391e54059285c292a8bad5360aca82abb9b72d0f513ccba48c99b6f99f4c4559cff7b0032251c',
          timestamp: '2021-03-16T07:25:10.351Z'
        }
      },
      new Set([]),
      new Set(['127.0.0.1'])
    )
    assert.strictEqual(isIPFromContentNode, true)
  })

  it('returns false if missing signature', () => {
    const isIPFromContentNode = _isIPFromContentNode(
      '127.0.0.1',
      {
        body: {
          timestamp: '2021-03-16T07:25:10.351Z'
        }
      },
      new Set([]),
      new Set([])
    )
    assert.strictEqual(isIPFromContentNode, false)
  })

  it('returns false if signature is expired', () => {
    const isIPFromContentNode = _isIPFromContentNode(
      '127.0.0.1',
      {
        body: {
          signature: '0x16092e63f925bc0bd2829348deadf4a3404cdb1067669fcad5bea391e54059285c292a8bad5360aca82abb9b72d0f513ccba48c99b6f99f4c4559cff7b0032251c',
          timestamp: '2021-03-01T07:25:10.351Z'
        }
      },
      new Set([]),
      new Set([])
    )
    assert.strictEqual(isIPFromContentNode, false)
  })

  it('returns true if signature produces a valid known wallet', () => {
    // 0xabc is a valid known content node
    sinon.stub(apiSigning, 'recoverWallet').returns('0xabc')

    const isIPFromContentNode = _isIPFromContentNode(
      '127.0.0.1',
      {
        body: {
          signature: '0x16092e63f925bc0bd2829348deadf4a3404cdb1067669fcad5bea391e54059285c292a8bad5360aca82abb9b72d0f513ccba48c99b6f99f4c4559cff7b0032251c',
          timestamp: new Date(Date.now()).toISOString()
        },
        logger: { info: () => {} }
      },
      new Set(['0xabc']),
      new Set([])
    )
    assert.strictEqual(isIPFromContentNode, false)
  })
})
