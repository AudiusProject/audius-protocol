import { QueryClient } from '@tanstack/react-query'

import { env } from 'app/services/env'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tan-query auto retries on errors like 404s. This doesnt fit with our backend design so we've disabled retries by default. They can be re-enabled at the query level if needed.
      retry: false,
      gcTime: 1000 * 60 * 5, // 5 minutes
      staleTime: 1000 * 60 * 5, // 5 minutes
      // All the refetches are enabled by default - they should only run every 5 minutes with our intended stale time
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
      throwOnError: env.ENVIRONMENT === 'development',
      experimental_prefetchInRender: true
    }
  }
})
