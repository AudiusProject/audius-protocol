import { decodeHashId } from './hashIds'

// eslint-disable-next-line
import { mockDecode } from '__mocks__/Hashids'

describe('decodeHashId', () => {
  it('can decode a hash id', () => {
    mockDecode.mockReturnValue([11845])

    const hashed = 'eP9k7'
    const decoded = decodeHashId(hashed)
    expect(decoded).toEqual(11845)
    expect(typeof decoded).toEqual('number')
  })

  it('can handle an error', () => {
    mockDecode.mockReturnValue([])

    const hashed = 'eP9k7'
    const decoded = decodeHashId(hashed)
    expect(decoded).toEqual(null)
  })
})
