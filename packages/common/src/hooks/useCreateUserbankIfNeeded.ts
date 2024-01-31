import { useEffect } from 'react'

import { useSelector } from 'react-redux'

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
  mint: 'usdc' | 'audio'
}) => {
  const feePayerOverride = useSelector(getFeePayer)

  useEffect(() => {
    if (!feePayerOverride) return
    createUserBankIfNeeded(audiusBackendInstance, {
      recordAnalytics,
      mint,
      feePayerOverride
    })
  }, [feePayerOverride, audiusBackendInstance, mint, recordAnalytics])
}
