import type { AppRouter } from '@audius/trpc-server'
import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'

export const trpc = createTRPCReact<AppRouter>()

export const createAudiusTrpcClient = (
  currentUserId: number | null,
  selectedEndpoint: string
) => {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: selectedEndpoint,
        maxURLLength: 2083,
        headers() {
          if (!currentUserId) return {}
          return {
            'x-current-user-id': '' + currentUserId
          }
        }
      })
    ]
  })
}
