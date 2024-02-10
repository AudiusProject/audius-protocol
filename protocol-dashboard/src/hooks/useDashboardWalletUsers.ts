import { useQuery } from '@tanstack/react-query'
import { create, windowScheduler } from '@yornaath/batshit'
import { audiusSdk } from 'services/Audius/sdk'
import { DashboardWalletUser } from '@audius/sdk'
import { useSelector } from 'react-redux'
import {
  getAccountWallet,
  getIsAudiusProfileRefetchDisabled
} from 'store/account/hooks'
import { aud } from 'store/index'
import { useEffect, useState } from 'react'
import { safeService } from 'services/Safe'

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
  const [hasInitted, setHasInitted] = useState(false)
  useEffect(() => {
    const awaitInit = async () => {
      await aud.awaitSetup()
      setHasInitted(true)
    }
    awaitInit()
  })

  const isAudiusProfileRefetchDisabled = useSelector(
    getIsAudiusProfileRefetchDisabled
  )
  const currentUserWallet = useSelector(getAccountWallet)
  return useQuery({
    queryKey: getDashboardWalletUserQueryKey(wallet),
    queryFn: async () => {
      const isEoa = await aud.isEoa(wallet)
      if (isEoa) {
        const res = await dashboardWalletUsersBatcher.fetch(wallet)
        return res ?? null
      } else {
        try {
          // Try to get Safe address info and if nothing is found, return null
          const { owners } = await safeService.getSafeInfo(wallet)
          for (const owner of owners) {
            const res = await dashboardWalletUsersBatcher.fetch(owner)
            if (res) {
              return res
            }
          }
        } catch (e) {
          return null
        }
      }
    },
    enabled:
      hasInitted &&
      !!wallet &&
      !(
        isAudiusProfileRefetchDisabled &&
        wallet?.toLowerCase() === currentUserWallet?.toLowerCase()
      )
  })
}
