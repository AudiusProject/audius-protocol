import type { GetTypedDataMessage, Hash } from 'viem'

import type { wormholeClientTypes } from './constants'

export type WormholeClientTypedData = typeof wormholeClientTypes

export type TransferTokensParams = GetTypedDataMessage<
  WormholeClientTypedData,
  'TransferTokens'
>['message'] & { signature: Hash }
