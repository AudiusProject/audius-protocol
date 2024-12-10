import { useEffect } from 'react'

import { useSelector } from 'react-redux'

import { useAppContext } from '~/context'
import { AnalyticsEvent } from '~/models/Analytics'
import {
  AudiusBackend,
  createUserBankIfNeeded
} from '~/services/audius-backend'
import { solanaSelectors } from '~/store/solana'
const { getFeePayer } = solanaSelectors

export const useCreateUserbankIfNeeded = ({
  recordAnalytics,
  audiusBackendInstance,
  mint
}: {
  recordAnalytics: (event: AnalyticsEvent) => void
  audiusBackendInstance: AudiusBackend
  mint: 'USDC' | 'wAUDIO'
}) => {
  const feePayerOverride = useSelector(getFeePayer)
  const { audiusSdk: sdk } = useAppContext()

  useEffect(() => {
    if (!feePayerOverride || !sdk) return
    createUserBankIfNeeded(sdk, audiusBackendInstance, {
      recordAnalytics,
      mint,
      feePayerOverride
    })
  }, [feePayerOverride, audiusBackendInstance, mint, recordAnalytics, sdk])
}
