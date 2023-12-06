/*
example test from:
https://github.com/trpc/examples-next-prisma-starter/blob/main/src/server/routers/post.test.ts
*/
import { createContext } from '../src/trpc'
import { AppRouter, appRouter } from '../src/index'
import { inferProcedureInput } from '@trpc/server'
import { expect, test } from 'vitest'

test('version', async () => {
  const caller = await appRouterForUser()
  const ver = await caller.version()
  expect(ver).toMatchObject({ version: '0.0.2' })
})

test('get user', async () => {
  const caller = await appRouterForUser(11)
  const u = await caller.users.get('11')
  expect(u.handle).toEqual('steve')

  // steve follows dave
  {
    const rel = await caller.me.userRelationship({ theirId: '12' })
    expect(rel.followed).toBe(true)
    expect(rel.followsMe).toBe(false)
  }

  // dave followed by steve
  {
    const caller = await appRouterForUser(12)
    const rel = await caller.me.userRelationship({ theirId: '11' })
    expect(rel.followed).toBe(false)
    expect(rel.followsMe).toBe(true)
  }
})

test('get track', async () => {
  const caller = await appRouterForUser(11)
  const t = await caller.tracks.get('11')
  expect(t.title).toBe('Who let the dogs out')
})

async function appRouterForUser(userId?: number) {
  const ctx = await createContext({
    req: {
      headers: {
        'x-current-user-id': userId
      },
      query: {}
    }
  })

  return appRouter.createCaller(ctx)
}
