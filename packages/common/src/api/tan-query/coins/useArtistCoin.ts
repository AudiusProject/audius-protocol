import { encodeHashId } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { ID } from '~/models'

import { QUERY_KEYS } from '../queryKeys'

export type ArtistCoin = {
  mint: string
  owner_id: string
}

export type UseArtistCoinParams = {
  mint?: string[]
  owner_id?: ID[]
}

// TODO: Replace this with sdk call
export const useArtistCoin = (params: UseArtistCoinParams = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.coins, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params.mint) {
        params.mint.forEach((m) => searchParams.append('mint', m))
      }
      if (params.owner_id) {
        params.owner_id.forEach((id) => {
          const encodedId = encodeHashId(id)
          if (encodedId) {
            searchParams.append('owner_id', encodedId)
          }
        })
      }
      const res = await fetch(`https://api.audius.co/v1/coins?${searchParams}`)
      if (!res.ok) throw new Error('Failed to fetch coins')
      const data = await res.json()
      return data.coins as ArtistCoin[]
    }
  })
}
