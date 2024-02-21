import type { AppRouter } from '@audius/trpc-server'
import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'

import { env } from 'services/env'

export const trpc = createTRPCReact<AppRouter>()

export function createAudiusTrpcClient(
  selectedEndpoint: string | null,
  currentUserId: number | null
) {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: selectedEndpoint || getTrpcEndpoint(),
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

// this hardcodes some dedicated nodes for dev/stage/prod
// since tRPC server is deployed manually atm.
// in the future some tRPC middleware can set host to currently selected DN per request
function getTrpcEndpoint() {
  return env.TRPC_ENDPOINT
}
