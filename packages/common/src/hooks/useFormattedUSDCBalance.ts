import { useMemo } from 'react'

import { USDC } from '@audius/fixed-decimal'
import BN from 'bn.js'

import { useUSDCBalance } from '../api/tan-query/wallets/useUSDCBalance'
import { BNUSDC, Status } from '../models'

type UseFormattedUSDCBalanceReturn = {
  balance: BNUSDC | null
  balanceFormatted: string | null
  balanceCents: number
  usdcValue: ReturnType<typeof USDC>
  isLoading: boolean
  status: Status
}

export const useFormattedUSDCBalance = (): UseFormattedUSDCBalanceReturn => {
  const { data: balance, status: balanceStatus } = useUSDCBalance({
    isPolling: true
  })
  const usdcValue = USDC(balance ?? new BN(0)).floor(2)
  const balanceCents = Number(usdcValue.floor(2).toString()) * 100
  const balanceFormatted = useMemo(() => {
    const balance =
      balanceStatus === Status.LOADING ? null : usdcValue.toShorthand()
    return balance ? `$${balance}` : null
  }, [usdcValue, balanceStatus])

  const isLoading = balanceStatus === Status.LOADING

  return {
    balance,
    balanceFormatted,
    balanceCents,
    usdcValue,
    isLoading,
    status: balanceStatus
  }
}
