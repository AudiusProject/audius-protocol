import { ReactNode, useEffect, useMemo, useState } from 'react'

import { accountSelectors } from '@audius/common/store'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSelector } from 'react-redux'

import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'

import { createAudiusTrpcClient, trpc } from '../utils/trpcClientWeb'

type TrpcProviderProps = {
  children: ReactNode
}

export const TrpcProvider = (props: TrpcProviderProps) => {
  const { children } = props
  const currentUserId = useSelector(accountSelectors.getUserId)
  const [selectedNode, setSelectedNode] = useState('')

  useEffect(() => {
    audiusBackendInstance.addDiscoveryProviderSelectionListener((dn) => {
      if (!dn) return
      const trpcEndpoint = new URL('/trpc/trpc', dn).toString()
      setSelectedNode(trpcEndpoint)
    })
    // todo: should be able to return function to unsubscribe our addDiscoveryProviderSelectionListener
  }, [])

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 1000 * 20
          }
        }
      })
  )

  const trpcClient = useMemo(() => {
    return createAudiusTrpcClient(selectedNode, currentUserId)
  }, [selectedNode, currentUserId])

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}
