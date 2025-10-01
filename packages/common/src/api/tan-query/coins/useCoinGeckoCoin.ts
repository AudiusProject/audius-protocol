import { queryOptions, useQuery } from '@tanstack/react-query'

type UseCoinGeckoCoinParams = {
  coinId: string
}

const useCoinGeckoCoinQueryOptions = (params: UseCoinGeckoCoinParams) =>
  queryOptions({
    queryKey: ['coinGeckoPrice', params.coinId],
    queryFn: async () => {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/${params.coinId}`
      )
      if (!res.ok) {
        throw new Error('Failed to fetch coinGecko price')
      }
      return await res.json()
    }
  })

export const useCoinGeckoCoin = (
  params: UseCoinGeckoCoinParams,
  options?: Partial<ReturnType<typeof useCoinGeckoCoinQueryOptions>>
) => {
  return useQuery({
    ...options,
    ...useCoinGeckoCoinQueryOptions(params)
  })
}
