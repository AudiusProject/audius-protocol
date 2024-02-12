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
    audiusBackendInstance.getAudiusLibs().then(async (libs) => {
      const selected =
        await libs.discoveryProvider?.discoveryNodeSelector?.getSelectedEndpoint()
      const trpcEndpoint = new URL('/trpc/trpc', selected).toString()
      setSelectedNode(trpcEndpoint)
    })
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

  const trpcClient = useMemo(
    () => createAudiusTrpcClient(selectedNode, currentUserId),
    [selectedNode, currentUserId]
  )
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}
