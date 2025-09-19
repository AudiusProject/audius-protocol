/**
 * Hook for handling token changes and value preservation
 * Manages state transitions when users switch between different token pairs
 */

import { useCallback, useEffect, useRef } from 'react'

import type { CalculationSource } from '../types/swap.types'

export type TokenChangeHandlerResult = {
  needsRecalculation: boolean
  preservedValues: {
    inputAmount: number
    outputAmount: number
    source: CalculationSource
  }
  updatePreservedValues: (values: {
    inputAmount: number
    outputAmount: number
    source: CalculationSource
  }) => void
  markForRecalculation: () => void
  clearRecalculationFlag: () => void
  onTokensChanged: (callback: () => void) => void
}

/**
 * Hook that manages token change detection and value preservation
 */
export const useTokenChangeHandler = ({
  inputTokenAddress,
  outputTokenAddress,
  currentInputAmount,
  currentOutputAmount,
  currentSource
}: {
  inputTokenAddress?: string
  outputTokenAddress?: string
  currentInputAmount: number
  currentOutputAmount: number
  currentSource: CalculationSource
}): TokenChangeHandlerResult => {
  const tokenKeyRef = useRef(`${inputTokenAddress}-${outputTokenAddress}`)
  const needsRecalculation = useRef(false)
  const preservedValuesRef = useRef({
    inputAmount: 0,
    outputAmount: 0,
    source: null as CalculationSource
  })

  // Update preserved values when current values change
  useEffect(() => {
    preservedValuesRef.current = {
      inputAmount: currentInputAmount,
      outputAmount: currentOutputAmount,
      source: currentSource
    }
  }, [currentInputAmount, currentOutputAmount, currentSource])

  // Detect token changes and prepare for recalculation
  useEffect(() => {
    if (!inputTokenAddress || !outputTokenAddress) return

    const currentTokenKey = `${inputTokenAddress}-${outputTokenAddress}`
    const tokensChanged = tokenKeyRef.current !== currentTokenKey

    if (tokensChanged) {
      tokenKeyRef.current = currentTokenKey
      needsRecalculation.current = true
    }
  }, [inputTokenAddress, outputTokenAddress])

  const updatePreservedValues = useCallback((values: {
    inputAmount: number
    outputAmount: number
    source: CalculationSource
  }) => {
    preservedValuesRef.current = values
  }, [])

  const markForRecalculation = useCallback(() => {
    needsRecalculation.current = true
  }, [])

  const clearRecalculationFlag = useCallback(() => {
    needsRecalculation.current = false
  }, [])

  const onTokensChanged = useCallback((callback: () => void) => {
    if (needsRecalculation.current) {
      needsRecalculation.current = false
      callback()
    }
  }, [])

  return {
    needsRecalculation: needsRecalculation.current,
    preservedValues: preservedValuesRef.current,
    updatePreservedValues,
    markForRecalculation,
    clearRecalculationFlag,
    onTokensChanged
  }
}
