import { parseTrackRoute } from './trackRouteParser'
// eslint-disable-next-line
import { mockDecode } from '__mocks__/Hashids'

describe('parseTrackRoute', () => {
  it('can decode a track id route', () => {
    const route = '/tartine/morning-buns-25'
    const { trackTitle, trackId, handle } = parseTrackRoute(route)
    expect(trackTitle).toEqual('morning-buns')
    expect(trackId).toEqual(25)
    expect(handle).toEqual('tartine')
  })

  it('can decode a hashed track id route', () => {
    mockDecode.mockReturnValue([11845])

    const route = '/tracks/eP9k7'
    const { trackTitle, trackId, handle } = parseTrackRoute(route)
    expect(trackTitle).toEqual(null)
    expect(trackId).toEqual(11845)
    expect(handle).toEqual(null)
  })

  it('returns null for invalid track id in track id route', () => {
    const route = '/blah/track-asdf'
    const params = parseTrackRoute(route)
    expect(params).toEqual(null)
  })

  it('returns null for invalid track id in hashed track id route', () => {
    mockDecode.mockReturnValue([NaN])

    const route = '/tracks/asdf'
    const params = parseTrackRoute(route)
    expect(params).toEqual(null)
  })
})
