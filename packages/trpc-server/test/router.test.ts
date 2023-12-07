/*
example test from:
https://github.com/trpc/examples-next-prisma-starter/blob/main/src/server/routers/post.test.ts
*/
import { expect, test } from 'vitest'
import { testRouter } from './_test_helpers'

test('version', async () => {
  const caller = await testRouter()
  const ver = await caller.version()
  expect(ver).toMatchObject({ version: '0.0.2' })
})

test('get user', async () => {
  const caller = await testRouter(101)

  const steve = await caller.users.get('101')
  expect(steve.handle).toEqual('steve')
  expect(steve.trackCount).toEqual(2)
  expect(steve.playlistCount).toEqual(1)
  expect(steve.followerCount).toEqual(0)
  expect(steve.followingCount).toEqual(1)

  const dave = await caller.users.get('102')
  expect(dave.handle).toEqual('dave')
  expect(dave.followerCount).toEqual(1)
  expect(dave.followingCount).toEqual(0)

  // steve follows dave
  {
    const rel = await caller.me.userRelationship({ theirId: '102' })
    expect(rel.followed).toEqual(true)
    expect(rel.followsMe).toEqual(false)
  }

  // dave followed by steve
  {
    const caller = await testRouter(102)
    const rel = await caller.me.userRelationship({ theirId: '101' })
    expect(rel.followed).toEqual(false)
    expect(rel.followsMe).toEqual(true)
  }
})

test('get track', async () => {
  const caller = await testRouter(101)
  const t = await caller.tracks.get('201')
  expect(t.title).toEqual('Who let the dogs out')
})

test("dave tries to get steve's private track", async () => {
  // TODO: this should probably 404...
  const daveRouter = await testRouter(201)
  const t = await daveRouter.tracks.get('202')
  expect(t.title).toEqual("Steve's unlisted dogs track")
  expect(t.isUnlisted).toEqual(true)
})
