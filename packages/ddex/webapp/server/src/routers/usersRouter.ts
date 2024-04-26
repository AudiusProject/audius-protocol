import mongoose from 'mongoose'
import { z } from 'zod'

import { publicProcedure, router } from '../trpc'

import { makeListCollection } from './helpers'

const USERS_COLLECTION = 'users'

const usersRouter = router({
  getUsers: makeListCollection(USERS_COLLECTION),
  createUser: publicProcedure
    .input(
      z.object({
        name: z.string()
      })
    )
    .mutation(async ({ input }) => {
      const { name } = input
      return await mongoose.connection.db
        .collection(USERS_COLLECTION)
        .insertOne({
          name,
          _id: Math.random().toString(36).substring(7) as any,
          email: 'stubbed@test.com',
          handle: 'stubbed',
          decodedUserId: 0
        })
    })
})

export default usersRouter
