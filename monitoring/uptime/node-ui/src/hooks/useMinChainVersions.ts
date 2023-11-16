import { useQuery } from '@tanstack/react-query'
import { useAudiusLibs } from '../providers/AudiusLibsProvider'

const useMinChainVersions = () => {
  const { audiusLibs } = useAudiusLibs()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: ['minChainVersions'],
    queryFn: async () => {
      if (!audiusLibs) {
        throw new Error('audiusLibs is not available')
      }
      const data = await audiusLibs.ethContracts?.getExpectedServiceVersions()
      return data
    },
    enabled: !!audiusLibs, // Only fetch if audiusLibs is available
    staleTime: Infinity // Never refetch
  })
}

export default useMinChainVersions
