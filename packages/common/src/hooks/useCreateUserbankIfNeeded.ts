import { useEffect } from 'react'

import { useWalletAddresses } from '~/api'
import { useQueryContext } from '~/api/tan-query/utils'
import { AnalyticsEvent } from '~/models/Analytics'
import { createUserBankIfNeeded } from '~/services/audius-backend'

export const useCreateUserbankIfNeeded = ({
  recordAnalytics,
  mint
}: {
  recordAnalytics: (event: AnalyticsEvent) => void
  mint: 'USDC' | 'wAUDIO'
}) => {
  const { data: walletAddresses } = useWalletAddresses()
  const { currentUser } = walletAddresses ?? {}
  const { audiusSdk } = useQueryContext()

  useEffect(() => {
    const initUserBank = async () => {
      const sdk = await audiusSdk()
      if (!currentUser) return
      createUserBankIfNeeded(sdk, {
        recordAnalytics,
        mint,
        ethAddress: currentUser
      })
    }
    initUserBank()
  }, [currentUser, mint, recordAnalytics, audiusSdk])
}
