import { OptionalHashId } from '@audius/sdk'
import { describe, it, expect, vitest } from 'vitest'

import { parseTrackRoute } from './trackRouteParser'

describe('parseTrackRoute', () => {
  it('can parse a handle/slug route', () => {
    const route = '/tartine/morning-buns-25'
    const { slug, trackId, handle } = parseTrackRoute(route)
    expect(slug).toEqual('morning-buns-25')
    expect(trackId).toEqual(undefined)
    expect(handle).toEqual('tartine')
  })

  it('can decode a hashed track id route', () => {
    vitest.fn(OptionalHashId.parse).mockReturnValue(11845)

    const route = '/tracks/eP9k7'
    const { slug, trackId, handle } = parseTrackRoute(route)
    expect(slug).toEqual(undefined)
    expect(trackId).toEqual(11845)
    expect(handle).toEqual(undefined)
  })
})
