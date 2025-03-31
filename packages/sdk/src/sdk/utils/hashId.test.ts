import { describe, it, expect } from 'vitest'

import { decodeHashId, encodeHashId } from './hashId'

describe('decodeHashId', () => {
  it('can decode a hash id', async () => {
    const hashed = 'eP9k7'
    const decoded = decodeHashId(hashed)
    expect(decoded).toEqual(11845)
    expect(typeof decoded).toEqual('number')
  })

  it('can handle an error when decoding a hash id', async () => {
    const hashed = 'j1p3iojpgoij3'
    const decoded = decodeHashId(hashed)
    expect(decoded).toEqual(null)
  })

  it('can encode a hash id', async () => {
    const decoded = 11845
    const hashed = encodeHashId(decoded)
    expect(hashed).toEqual('eP9k7')
  })

  it('can handle an error when encoding a hash id', async () => {
    const decoded = null
    const hashed = encodeHashId(decoded)
    expect(hashed).toEqual(null)
  })
})
