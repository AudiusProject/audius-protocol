import { useQuery } from '@tanstack/react-query'
import { create, windowScheduler } from '@yornaath/batshit'
import { audiusSdk } from 'services/Audius/sdk'
import { DashboardWalletUser } from '@audius/sdk'

const dashboardWalletUsersBatcher = create({
  fetcher: async (wallets: string[]): Promise<DashboardWalletUser[]> => {
    const sdk = await audiusSdk()
    const res = await sdk.dashboardWalletUsers.bulkGetDashboardWalletUsers({
      wallets: [...wallets]
    })
    return res.data
  },
  resolver: (data, query) => {
    return data.find(d => d.wallet.toLowerCase() === query.toLowerCase())
  },
  scheduler: windowScheduler(10)
})

export const useDashboardWalletUser = (wallet: string) => {
  return useQuery({
    queryKey: ['dashboardWalletUsers', wallet],
    queryFn: async () => {
      const res = await dashboardWalletUsersBatcher.fetch(wallet)
      return res
    }
  })
}
