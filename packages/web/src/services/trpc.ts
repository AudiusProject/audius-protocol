import { createTRPCReact } from '@trpc/react-query'

import type { AppRouter } from '@audius/trpc-server'

export const trpc = createTRPCReact<AppRouter>()
