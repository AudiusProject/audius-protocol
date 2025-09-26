import { TokenInfo } from '~/store/ui/buy-sell/types'

import { SwapOrchestrator } from './orchestrator'
import { SwapDependencies, SwapTokensParams, SwapTokensResult } from './types'

export const executeDirectSwap = async (
  params: SwapTokensParams,
  dependencies: SwapDependencies,
  tokens: Record<string, TokenInfo>
): Promise<SwapTokensResult> => {
  const orchestrator = new SwapOrchestrator()
  return orchestrator.executeSwap(params, dependencies, tokens)
}
