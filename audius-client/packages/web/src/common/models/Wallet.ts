import BN from 'bn.js'

import { Brand } from 'common/utils/typeUtils'

export type StringWei = Brand<string, 'stringWEI'>
export type StringAudio = Brand<string, 'stringAudio'>
export type BNWei = Brand<BN, 'BNWei'>
export type BNAudio = Brand<BN, 'BNAudio'>

export type WalletAddress = string
