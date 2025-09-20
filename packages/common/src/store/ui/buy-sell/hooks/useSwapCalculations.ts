/**
 * Simplified hook for managing bidirectional swap calculations
 * Orchestrates smaller, focused hooks for better maintainability
 */

import { useCallback, useEffect } from 'react'

import type { SwapCalculationsHookResult } from '../types/swap.types'
import { isValidNumericInput } from '../utils/tokenCalculations'

import { useBidirectionalCalculator } from './useBidirectionalCalculator'
import { useCalculationStateMachine } from './useCalculationStateMachine'
import { useTokenChangeHandler } from './useTokenChangeHandler'

export type UseSwapCalculationsProps = {
  exchangeRate: number | null
  onInputValueChange?: (value: string) => void
  inputTokenAddress?: string
  outputTokenAddress?: string
  inputTokenDecimals: number
  outputTokenDecimals: number
}

/**
 * Main hook that orchestrates bidirectional swap calculations
 * Now simplified by using focused sub-hooks
 */
export const useSwapCalculations = ({
  exchangeRate,
  onInputValueChange,
  inputTokenAddress,
  outputTokenAddress,
  inputTokenDecimals,
  outputTokenDecimals
}: UseSwapCalculationsProps): SwapCalculationsHookResult => {
  // Validate that decimals are provided
  if (inputTokenDecimals == null || outputTokenDecimals == null) {
    throw new Error('Token decimals must be provided for accurate calculations')
  }
  // State machine for tracking calculation source
  const stateMachine = useCalculationStateMachine()

  // Calculator for handling bidirectional calculations
  const calculator = useBidirectionalCalculator({
    exchangeRate,
    source: stateMachine.source,
    isUpdateInProgress: stateMachine.isUpdateInProgress,
    inputDecimals: inputTokenDecimals,
    outputDecimals: outputTokenDecimals
  })

  // Token change handler for managing token switches
  const tokenHandler = useTokenChangeHandler({
    inputTokenAddress,
    outputTokenAddress,
    currentInputAmount: calculator.numericInputAmount,
    currentOutputAmount: calculator.numericOutputAmount,
    currentSource: stateMachine.source
  })

  // Handle token changes with recalculation
  useEffect(() => {
    tokenHandler.onTokensChanged(() => {
      const { preservedValues } = tokenHandler

      if (
        preservedValues.source === 'input' &&
        preservedValues.inputAmount > 0
      ) {
        // Recalculate output based on preserved input
        stateMachine.setSource('input')
        calculator.setInputAmount(preservedValues.inputAmount.toString())
      } else if (
        preservedValues.source === 'output' &&
        preservedValues.outputAmount > 0
      ) {
        // Recalculate input based on preserved output
        stateMachine.setSource('output')
        calculator.setOutputAmount(preservedValues.outputAmount.toString())
        // Don't call onInputValueChange here since we're focused on output field
      }

      // Clear output for visual feedback on token change
      if (preservedValues.source === 'input') {
        calculator.setOutputAmount('')
      }
    })
  }, [tokenHandler, stateMachine, calculator, onInputValueChange])

  // Clear output when exchange rate becomes unavailable
  useEffect(() => {
    if (!exchangeRate || exchangeRate <= 0) {
      if (stateMachine.source !== 'output') {
        calculator.setOutputAmount('')
      }
    }
  }, [exchangeRate, stateMachine.source, calculator])

  // Handle input changes from user
  const handleInputChange = useCallback(
    (value: string) => {
      if (!isValidNumericInput(value)) {
        return
      }

      stateMachine.beginUpdate()
      stateMachine.setSource('input')
      stateMachine.endUpdate()
      calculator.setInputAmount(value)
      onInputValueChange?.(value)
    },
    [stateMachine, calculator, onInputValueChange]
  )

  // Handle output changes from user
  const handleOutputChange = useCallback(
    (value: string) => {
      if (!isValidNumericInput(value)) {
        return
      }

      stateMachine.beginUpdate()
      stateMachine.setSource('output')
      stateMachine.endUpdate()
      calculator.setOutputAmount(value)
    },
    [stateMachine, calculator]
  )

  // Reset calculations
  const resetCalculations = useCallback(() => {
    stateMachine.reset()
    calculator.clearAmounts()
  }, [stateMachine, calculator])

  return {
    // Form values
    inputAmount: calculator.inputAmount,
    outputAmount: calculator.outputAmount,
    numericInputAmount: calculator.numericInputAmount,
    numericOutputAmount: calculator.numericOutputAmount,

    // State
    calculationSource: stateMachine.source,
    isCalculating: calculator.isCalculating,

    // Handlers
    handleInputChange,
    handleOutputChange,
    resetCalculations
  }
}
