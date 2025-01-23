import { OptionalHashId } from '@audius/sdk'
import { describe, it, expect, vitest } from 'vitest'

import { parseCollectionRoute } from './collectionRouteParser'

describe('parseCollectionRoute', () => {
  it('can parse a playlist permalink route', () => {
    const route = '/arizmendi/playlist/croissants-11'
    const { collectionType, permalink } = parseCollectionRoute(route)!
    expect(permalink).toEqual(route)
    expect(collectionType).toEqual('playlist')
  })

  it('can parse an album permalink route', () => {
    const route = '/arizmendi/album/scones-20'
    const { permalink, collectionType } = parseCollectionRoute(route)!
    expect(permalink).toEqual(route)
    expect(collectionType).toEqual('album')
  })

  it('can decode a hashed collection id route', async () => {
    vitest.fn(OptionalHashId.parse).mockReturnValue(11845)

    const route = '/playlists/eP9k7'
    const { title, collectionId, handle, collectionType } =
      parseCollectionRoute(route)!
    expect(title).toEqual(null)
    expect(collectionId).toEqual(11845)
    expect(handle).toEqual(null)
    expect(collectionType).toEqual(null)
  })

  it('returns null for invalid id in hashed collection id route', () => {
    vitest.fn(OptionalHashId.parse).mockReturnValue(undefined)

    const route = '/playlists/asdf'
    const params = parseCollectionRoute(route)
    expect(params).toEqual(null)
  })
})
