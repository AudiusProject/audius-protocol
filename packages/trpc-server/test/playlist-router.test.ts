import { expect, test } from 'vitest'
import { testRouter } from './_test_helpers'

test('you can get playlists that contain a track id', async () => {
  const caller = await testRouter()

  const playlistIds = await caller.playlists.containTrackId({
    trackId: '101',
  })
  expect(playlistIds).toEqual(['301'])

  const albumIds = await caller.playlists.containTrackId({
    trackId: '101',
    isAlbum: true,
  })
  expect(albumIds).toEqual(['303'])
})
