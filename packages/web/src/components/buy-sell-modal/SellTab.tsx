import { SwapTab } from './SwapTab'
import { useTokenBalanceManager } from './hooks/useTokenBalanceManager'
import type { SellTabProps } from './types'

export const SellTab = ({
  tokenPair,
  onTransactionDataChange,
  error,
  errorMessage,
  initialInputValue,
  onInputValueChange,
  availableInputTokens,
  onInputTokenChange
}: SellTabProps) => {
  // Extract the tokens from the pair
  const { baseToken, quoteToken } = tokenPair

  // Use shared token balance manager
  const { inputBalance } = useTokenBalanceManager(baseToken, quoteToken)

  return (
    <SwapTab
      inputToken={baseToken}
      outputToken={quoteToken}
      balance={inputBalance}
      onTransactionDataChange={onTransactionDataChange}
      inputIsDefault={false} // Enable token selection for "You Sell"
      outputIsDefault={true} // Freeze "You Receive" section to USDC
      error={error}
      errorMessage={errorMessage}
      tooltipPlacement='right'
      initialInputValue={initialInputValue}
      onInputValueChange={onInputValueChange}
      availableInputTokens={availableInputTokens}
      onInputTokenChange={onInputTokenChange}
    />
  )
}
