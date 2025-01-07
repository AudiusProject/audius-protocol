import { useEffect } from 'react'

import { useSelector } from 'react-redux'

import { useAudiusQueryContext } from '~/audius-query'
import { AnalyticsEvent } from '~/models/Analytics'
import { createUserBankIfNeeded } from '~/services/audius-backend'
import { getWalletAddresses } from '~/store/account/selectors'

export const useCreateUserbankIfNeeded = ({
  recordAnalytics,
  mint
}: {
  recordAnalytics: (event: AnalyticsEvent) => void
  mint: 'USDC' | 'wAUDIO'
}) => {
  const { currentUser } = useSelector(getWalletAddresses)
  const { audiusSdk } = useAudiusQueryContext()

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
