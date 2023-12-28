import { expect, test } from 'vitest'
import { testRouter } from './_test_helpers'

test('search user', async () => {
  const caller = await testRouter(101)
  {
    const userIds = await caller.search.users({ q: 'steve' })
    expect(userIds).toEqual(['101'])
  }

  {
    const userIds = await caller.search.users({ q: 'dave' })
    expect(userIds).length(2)
    expect(userIds).toContain('102')
    expect(userIds).toContain('103')
  }

  {
    const userIds = await caller.search.users({ q: 'dave', onlyFollowed: true })
    expect(userIds).toEqual(['102'])
  }
})

test('search tracks', async () => {
  const caller = await testRouter(102)

  {
    const trackIds = await caller.search.tracks({ q: 'dogs' })
    expect(trackIds).length(2)
    expect(trackIds).toContain('201')
    expect(trackIds).toContain('203')
  }

  {
    const trackIds = await caller.search.tracks({ q: 'dogs', onlySaved: true })
    expect(trackIds).toEqual(['201'])
  }
})

test('you can query for playlists that contain a track id', async () => {
  const caller = await testRouter()

  const playlistIds = await caller.playlists.containTrackId({ trackId: 101 })
  expect(playlistIds).toEqual(['301'])
})
