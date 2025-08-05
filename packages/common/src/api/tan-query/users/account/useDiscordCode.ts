import { useQuery } from '@tanstack/react-query'

import { useQueryContext } from '~/api/tan-query/utils'
import { createTokenListingMap } from '~/store'

import { QUERY_KEYS } from '../../queryKeys'
import { QueryKey, SelectableQueryOptions } from '../../types'

const getSignableData = () => {
  const vals = 'abcdefghijklmnopqrstuvwxyz123456789'
  return vals.charAt(Math.floor(Math.random() * vals.length))
}

export const getDiscordCodeQueryKey = (assetName: string) =>
  [QUERY_KEYS.discordCode, assetName] as unknown as QueryKey<string>

export const useDiscordCode = <TResult = string>(
  assetName: string,
  options?: SelectableQueryOptions<string, TResult>
) => {
  const { audiusBackend, audiusSdk, env } = useQueryContext()

  return useQuery({
    queryKey: getDiscordCodeQueryKey(assetName),
    queryFn: async (): Promise<string> => {
      const sdk = await audiusSdk()
      const data = getSignableData()
      const { signature } = await audiusBackend.getSignature({
        data,
        sdk
      })
      const assetMint = createTokenListingMap(env)[assetName].address
      const envString = env.ENVIRONMENT === 'staging' ? ':staging' : ''
      const appended = `${signature}:${data}:${assetMint}${envString}`
      return appended
    },
    ...options
  })
}
