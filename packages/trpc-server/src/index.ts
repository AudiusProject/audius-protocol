import { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { meRouter } from './routers/me-router'
import { playlistRouter } from './routers/playlist-router'
import { searchRouter } from './routers/search-router'
import { trackRouter } from './routers/track-router'
import { userRouter } from './routers/user-router'
import { publicProcedure, router } from './trpc'

// AppRouter
export const appRouter = router({
  me: meRouter,
  users: userRouter,
  tracks: trackRouter,
  playlists: playlistRouter,
  search: searchRouter,

  version: publicProcedure.query(() => ({
    version: '0.0.2',
  })),
})

export type AppRouter = typeof appRouter

export type RouterInput = inferRouterInputs<AppRouter>
export type RouterOutput = inferRouterOutputs<AppRouter>

export * from './types'
