import { useQuery } from '@tanstack/react-query'
import { useAudiusLibs } from '../providers/AudiusLibsProvider'

const useNodes = (nodeType: string) => {
  const { audiusLibs } = useAudiusLibs()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: ['listNodes'],
    queryFn: async () => {
      if (!audiusLibs) {
        throw new Error('audiusLibs is not available')
      }
      let data
      if (nodeType === 'discovery') {
        data = await audiusLibs.ServiceProvider?.listDiscoveryProviders()
      } else if (nodeType === 'content') {
        data = await audiusLibs.ServiceProvider?.listCreatorNodes()
      }
      return data
    },
    enabled: !!audiusLibs, // Only fetch if audiusLibs is available
    staleTime: Infinity // Never refetch
  })
}

export default useNodes
