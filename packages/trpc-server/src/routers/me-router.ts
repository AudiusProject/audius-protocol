import { publicProcedure, router } from '../trpc'
import { z } from 'zod'
import {
  selectTracksCamel,
  selectPlaylistsCamel,
  selectUsersCamel,
  sql
} from '../db'
import { prepareLoaders } from '../loaders'

export const meRouter = router({
  userRelationship: publicProcedure
    .input(z.object({ myId: z.string(), theirId: z.string() }))
    .output(z.object({ followed: z.boolean(), followsMe: z.boolean() }))
    .query(async ({ ctx, input }) => {
      // normally we'd prefer to use the ctx.loaders
      // which is setup for current user based on header
      //   return ctx.loaders.userRelationLoader.load(input.id)

      // but atm trpc client is simple and doesn't set any headers based on current user
      // instead it explicitly passes myId as input arg
      const loaders = prepareLoaders(parseInt(input.myId))
      return loaders.userRelationLoader.load(parseInt(input.theirId))
    })
})
