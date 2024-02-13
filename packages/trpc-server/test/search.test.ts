import { expect, test } from 'vitest'
import { testRouter } from './_test_helpers'
import { esc } from '../src/routers/search-router'

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

test('indexer sets dominan_genre', async () => {
  const steve = (await esc.get({
    index: 'users',
    id: '101',
  })) as any
  expect(steve._source.dominant_genre).toEqual('rap')

  const topRapArtists = await esc.search({
    index: 'users',
    query: {
      term: {
        dominant_genre: 'rap',
      },
    },
    sort: {
      follower_count: 'desc',
    },
  })
  const topRapArtist = topRapArtists.hits.hits[0]._source as any
  expect(topRapArtist.handle).toEqual('steve')
})
