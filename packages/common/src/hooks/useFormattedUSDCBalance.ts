import { useMemo } from 'react'

import { USDC } from '@audius/fixed-decimal'
import BN from 'bn.js'

import { BNUSDC, Status } from '../models'

import { useUSDCBalance } from './useUSDCBalance'

type UseFormattedUSDCBalanceReturn = {
  balance: BNUSDC | null
  balanceFormatted: string
  balanceCents: number
  usdcValue: ReturnType<typeof USDC>
  isLoading: boolean
  status: Status
}

export const useFormattedUSDCBalance = (): UseFormattedUSDCBalanceReturn => {
  const { data: balance, status: balanceStatus } = useUSDCBalance()
  const usdcValue = USDC(balance ?? new BN(0)).floor(2)
  const balanceCents = Number(usdcValue.floor(2).toString()) * 100
  const balanceFormatted = useMemo(() => {
    return balanceStatus === Status.LOADING
      ? '0.00'
      : usdcValue.toFixed(2).replace('$', '')
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
