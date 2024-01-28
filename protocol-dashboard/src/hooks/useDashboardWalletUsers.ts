import { useQuery } from '@tanstack/react-query'
import { create, windowScheduler } from '@yornaath/batshit'
import { audiusSdk } from 'services/Audius/sdk'
import { DashboardWalletUser } from '@audius/sdk'
import { useSelector } from 'react-redux'
import {
  getAccountWallet,
  getIsAudiusProfileRefetchDisabled
} from 'store/account/hooks'

const dashboardWalletUsersBatcher = create({
  fetcher: async (wallets: string[]): Promise<DashboardWalletUser[]> => {
    const res = await audiusSdk.dashboardWalletUsers.bulkGetDashboardWalletUsers(
      {
        wallets
      }
    )
    return res.data
  },
  resolver: (data, query) => {
    return data.find(d => d.wallet.toLowerCase() === query.toLowerCase())
  },
  scheduler: windowScheduler(10)
})

export const getDashboardWalletUserQueryKey = (
  wallet: string | undefined | null
) => {
  return ['dashboardWalletUsers', wallet?.toLowerCase()]
}

export const useDashboardWalletUser = (wallet: string) => {
  const isAudiusProfileRefetchDisabled = useSelector(
    getIsAudiusProfileRefetchDisabled
  )
  const currentUserWallet = useSelector(getAccountWallet)
  return useQuery({
    queryKey: getDashboardWalletUserQueryKey(wallet),
    queryFn: async () => {
      const res = await dashboardWalletUsersBatcher.fetch(wallet)
      return res ?? null
    },
    enabled:
      !!wallet &&
      !(
        isAudiusProfileRefetchDisabled &&
        wallet?.toLowerCase() === currentUserWallet?.toLowerCase()
      )
  })
}
