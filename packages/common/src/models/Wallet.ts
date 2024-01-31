import type BN from 'bn.js'

import { Brand } from '~/utils/typeUtils'

export type StringWei = Brand<string, 'stringWEI'>
export type StringAudio = string
export type StringUSDC = Brand<string, 'stringUSDC'>
export type BNWei = Brand<BN, 'BNWei'>
export type BNAudio = Brand<BN, 'BNAudio'>
export type BNUSDC = Brand<BN, 'BNUSDC'>

export type WalletAddress = string
export type SolanaWalletAddress = Brand<string, 'solanaWallet'>
