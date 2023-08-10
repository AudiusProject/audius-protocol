import { call, select } from 'typed-redux-saga'

import { createUserBankIfNeeded } from 'services/audius-backend/solana'
import { getContext } from 'store/effects'
import { getFeePayer } from 'store/solana/selectors'

/**
 * Derives a USDC user bank for a given eth address, creating it if necessary.
 * Defaults to the wallet of the current user.
 */
export function* getUSDCUserBank(ethAddress?: string) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const { track } = yield* getContext('analytics')
  const feePayerOverride = yield* select(getFeePayer)
  if (!feePayerOverride) {
    throw new Error('getUSDCUserBank: unexpectedly no fee payer override')
  }
  return yield* call(createUserBankIfNeeded, audiusBackendInstance, {
    ethAddress,
    feePayerOverride,
    mint: 'usdc',
    recordAnalytics: track
  })
}
