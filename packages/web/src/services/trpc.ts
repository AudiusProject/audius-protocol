import type { AppRouter } from '@audius/trpc-server'
import { createTRPCReact } from '@trpc/react-query'

export const trpc = createTRPCReact<AppRouter>()
