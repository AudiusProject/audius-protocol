import { createTRPCReact } from '@trpc/react-query'

import type { AppRouter } from '../../../discovery-provider/plugins/pedalboard/apps/trpc-server/src/server'

export const trpc = createTRPCReact<AppRouter>()
