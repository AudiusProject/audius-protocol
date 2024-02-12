import { ReactNode, useEffect, useMemo, useState } from 'react'

import { accountSelectors } from '@audius/common/store'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSelector } from 'react-redux'

import { discoveryNodeSelectorService } from 'services/audius-sdk/discoveryNodeSelector'

import { createAudiusTrpcClient, trpc } from '../utils/trpcClientWeb'

type TrpcProviderProps = {
  children: ReactNode
}

export const TrpcProvider = (props: TrpcProviderProps) => {
  const { children } = props
  const currentUserId = useSelector(accountSelectors.getUserId)
  const [selectedNode, setSelectedNode] = useState('')

  function updateSelectedNode(dn: string | null) {
    if (!dn) return
    const trpcEndpoint = new URL('/trpc/trpc', dn).toString()
    setSelectedNode(trpcEndpoint)
  }

  useEffect(() => {
    discoveryNodeSelectorService.getInstance().then((dns) => {
      dns.addEventListener('change', updateSelectedNode)
      dns.getSelectedEndpoint().then(updateSelectedNode)
      return () => {
        dns.removeEventListener('change', updateSelectedNode)
      }
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

  const trpcClient = useMemo(() => {
    return createAudiusTrpcClient(selectedNode, currentUserId)
  }, [selectedNode, currentUserId])

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}
