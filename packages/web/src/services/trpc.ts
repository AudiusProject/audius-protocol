import type { AppRouter } from '@audius/trpc-server'
import { createTRPCReact, httpBatchLink } from '@trpc/react-query'
import { inferRouterInputs, inferRouterOutputs } from "@trpc/server"

export const trpc = createTRPCReact<AppRouter>()

export function createAudiusTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: getTrpcEndpoint(),
        maxURLLength: 2083,
        headers(op) {
          return {
            'x-current-user-id': '' + loadCurrentUserId()
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
  switch (process.env.REACT_APP_ENVIRONMENT) {
    case '_production':
      return 'https://discoveryprovider3.audius.co/trpc/trpc'
    case 'staging':
      return 'https://discoveryprovider3.staging.audius.co/trpc/trpc'
  }
  return 'http://localhost:2022/trpc'
}

// current user placeholder stuff in local storage
// todo: get real current user value

export function storeCurrentUserId(val: string) {
  localStorage.setItem('current_user_id', val)
}

export function loadCurrentUserId() {
  const val = localStorage.getItem('current_user_id')
  return val || ''
}

export type RouterInput = inferRouterInputs<AppRouter>
export type RouterOutput = inferRouterOutputs<AppRouter>

export type GetUserOutput = NonNullable<RouterOutput["users"]["get"]>
