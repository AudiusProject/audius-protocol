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
    expect(userIds).toEqual(['102', '103'])
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
