import * as anchor from '@coral-xyz/anchor'
import { CONTRACTS } from "@certusone/wormhole-sdk"

const { PublicKey } = anchor.web3

// https://explorer.solana.com/address/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
export const SOL_USDC_DECIMALS = 6
export const SOL_USDC_TOKEN_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
// https://explorer.solana.com/address/9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM
export const SOL_AUDIO_DECIMALS = 8
export const SOL_AUDIO_TOKEN_ADDRESS = '9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM'
// https://etherscan.io/token/0x18aAA7115705e8be94bfFEBDE57Af9BFc265B998
export const ETH_AUDIO_TOKEN_ADDRESS = '0x18aAA7115705e8be94bfFEBDE57Af9BFc265B998'
// https://book.wormhole.com/reference/contracts.html
export const CODE_BRIDGE_ID = CONTRACTS.MAINNET.solana.core
export const bridgeId = new PublicKey(CODE_BRIDGE_ID)
export const TOKEN_BRIDGE_ID = CONTRACTS.MAINNET.solana.token_bridge
export const tokenBridgeId = new PublicKey(TOKEN_BRIDGE_ID)
// https://docs.raydium.io/raydium/protocol/developers/addresses
export const ammProgram = new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8')
// https://github.com/project-serum/serum-dex/blob/master/README.md#program-deployments
export const serumDexProgram = new PublicKey('9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin')
// USDC -> AUDIO Raydium market
export const serumMarketPublicKey = new PublicKey('FxquLRmVMPXiS84FFSp8q5fbVExhLkX85yiXucyu7xSC')
