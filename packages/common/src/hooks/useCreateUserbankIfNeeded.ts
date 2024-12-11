import { useEffect } from 'react'

import { useSelector } from 'react-redux'

import { useAudiusQueryContext } from '~/audius-query'
import { AnalyticsEvent } from '~/models/Analytics'
import { createUserBankIfNeeded } from '~/services/audius-backend'
import { getWalletAddresses } from '~/store/account/selectors'
import { solanaSelectors } from '~/store/solana'
const { getFeePayer } = solanaSelectors

export const useCreateUserbankIfNeeded = ({
  recordAnalytics,
  mint
}: {
  recordAnalytics: (event: AnalyticsEvent) => void
  mint: 'USDC' | 'wAUDIO'
}) => {
  const feePayerOverride = useSelector(getFeePayer)
  const { currentUser } = useSelector(getWalletAddresses)
  const { audiusSdk } = useAudiusQueryContext()

  useEffect(() => {
    const initUserBank = async () => {
      const sdk = await audiusSdk()
      if (!feePayerOverride || !currentUser) return
      createUserBankIfNeeded(sdk, {
        recordAnalytics,
        mint,
        ethAddress: currentUser
      })
    }
    initUserBank()
  }, [currentUser, feePayerOverride, mint, recordAnalytics, audiusSdk])
}
