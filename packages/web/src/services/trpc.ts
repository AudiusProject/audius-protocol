import type { AppRouter } from '@audius/trpc-server'
import { createTRPCReact } from '@trpc/react-query'

export const trpc = createTRPCReact<AppRouter>()

// this hardcodes some dedicated nodes for dev/stage/prod
// since tRPC server is deployed manually atm.
// in the future some tRPC middleware can set host to currently selected DN per request
export function getTrpcEndpoint() {
  // force local server:
  // return 'http://localhost:2022/trpc'

  switch (process.env.REACT_APP_ENVIRONMENT) {
    case 'production':
      return 'https://discoveryprovider3.audius.co/trpc/trpc'
    case 'staging':
      return 'https://discoveryprovider3.staging.audius.co/trpc/trpc'
  }
  return 'http://localhost:2022/trpc'
}
