import { appRouter } from '../src'
import { createContext } from '../src/trpc'

export async function testRouter(userId?: number) {
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
