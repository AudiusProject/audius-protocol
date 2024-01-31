import React, { useMemo, useState } from 'react'

import { accountSelectors } from '@audius/common/store'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSelector } from 'react-redux'

import { createAudiusTrpcClient, trpc } from 'app/services/trpc-client-mobile'

export const AudiusTrpcProvider = ({
  children
}: {
  children: React.ReactNode
}) => {
  const currentUserId = useSelector(accountSelectors.getUserId)
  const [queryClient] = useState(() => new QueryClient())
  const trpcClient = useMemo(
    () => createAudiusTrpcClient(currentUserId),
    [currentUserId]
  )
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}
