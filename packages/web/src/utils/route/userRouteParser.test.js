import { OptionalHashId } from '@audius/sdk'
import { describe, it, expect, vitest } from 'vitest'

import { parseUserRoute } from './userRouteParser'

describe('parseUserRoute', () => {
  it('can decode a user handle route', () => {
    const route = '/vivelatarte'
    const { userId, handle } = parseUserRoute(route)
    expect(handle).toEqual('vivelatarte')
    expect(userId).toEqual(null)
  })

  it('can decode a hashed user id route', () => {
    vitest.fn(OptionalHashId.parse).mockReturnValue(11845)

    const route = '/users/eP9k7'
    const { userId, handle } = parseUserRoute(route)
    expect(userId).toEqual(11845)
    expect(handle).toEqual(null)
  })

  it('returns null for a static route', () => {
    const route = '/404'
    const params = parseUserRoute(route)
    expect(params).toEqual(null)
  })

  it('returns null for an invalid hash id', () => {
    vitest.fn(OptionalHashId.parse).mockReturnValue(null)

    const route = '/users/asdf'
    const params = parseUserRoute(route)
    expect(params).toEqual(null)
  })
})
