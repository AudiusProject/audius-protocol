import { QueryClient } from '@tanstack/react-query'

import { env } from './env'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 50000, // 50000 minutes
      staleTime: 1000 * 60 * 50000, // 50000 minutes
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
      throwOnError: env.ENVIRONMENT === 'development', // feature-tan-query TODO: remove before going to main?,
      experimental_prefetchInRender: true
    }
  }
})
