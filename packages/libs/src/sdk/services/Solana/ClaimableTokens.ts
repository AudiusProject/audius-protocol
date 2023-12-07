import { wAUDIO } from '@audius/fixed-decimal'
import { ClaimableTokensProgram } from '@audius/spl'
import {
  TransactionMessage,
  VersionedTransaction,
  Secp256k1Program,
  PublicKey,
  Connection
} from '@solana/web3.js'
import { parseParams } from '../../utils/parseParams'
import {
  type GetOrCreateUserBankRequest,
  GetOrCreateUserBankSchema,
  type DeriveUserBankRequest,
  type CreateTransferRequest,
  CreateTransferSchema,
  type CreateSecpRequest,
  CreateSecpSchema,
  Mint,
  SolanaConfigInternal
} from './types'

import * as runtime from '../../api/generated/default/runtime'
import type { Solana } from './Solana'

export class ClaimableTokens {
  public readonly connection: Connection
  public readonly config: SolanaConfigInternal
  private claimableTokensAuthorities: Record<Mint, PublicKey>
  constructor(private solanaApi: Solana) {
    this.config = this.solanaApi.config
    this.connection = this.solanaApi.connection
    this.claimableTokensAuthorities = {
      wAUDIO: ClaimableTokensProgram.deriveAuthority({
        programId: this.solanaApi.config.programIds.claimableTokens,
        mint: this.solanaApi.config.mints.wAUDIO
      }),
      USDC: ClaimableTokensProgram.deriveAuthority({
        programId: this.solanaApi.config.programIds.claimableTokens,
        mint: this.solanaApi.config.mints.wAUDIO
      })
    }
  }
  async getOrCreateUserBank(params: GetOrCreateUserBankRequest) {
    const args = await parseParams(
      'getOrCreateUserBank',
      GetOrCreateUserBankSchema
    )(params)
    const { ethWallet, mint, feePayer: feePayerOverride } = args
    const feePayer = feePayerOverride ?? (await this.solanaApi.getFeePayer())
    if (!feePayer) {
      throw new runtime.RequiredError(
        'feePayer',
        'Required parameter params.feePayer was null or undefined when calling getOrCreateUserBank.'
      )
    }
    const userBank = await this.deriveUserBank(args)
    const userBankAccount = await this.connection.getAccountInfo(userBank)
    if (!userBankAccount) {
      const createUserBankInstruction =
        ClaimableTokensProgram.createAccountInstruction({
          ethAddress: ethWallet,
          payer: feePayer,
          mint: this.config.mints[mint],
          authority: this.claimableTokensAuthorities[mint],
          userBank,
          programId: this.config.programIds.claimableTokens
        })
      const { blockhash, lastValidBlockHeight } =
        await this.connection.getLatestBlockhash()
      const message = new TransactionMessage({
        payerKey: feePayer,
        recentBlockhash: blockhash,
        instructions: [createUserBankInstruction]
      }).compileToLegacyMessage()
      const transaction = new VersionedTransaction(message)
      await this.solanaApi.relay({
        transaction,
        confirmationOptions: {
          confirmationStrategy: {
            blockhash,
            lastValidBlockHeight
          }
        }
      })
      return { userBank, didExist: false }
    }
    return { userBank, didExist: true }
  }

  async deriveUserBank(params: DeriveUserBankRequest) {
    const { ethWallet, mint } = await parseParams(
      'deriveUserBank',
      GetOrCreateUserBankSchema
    )(params)
    return ClaimableTokensProgram.deriveUserBank({
      ethAddress: ethWallet,
      claimableTokensPDA: this.claimableTokensAuthorities[mint]
    })
  }

  async createTransferInstruction(params: CreateTransferRequest) {
    const {
      feePayer: feePayerOverride,
      ethWallet,
      mint,
      destination
    } = await parseParams(
      'createTransferInstruction',
      CreateTransferSchema
    )(params)
    const feePayer = feePayerOverride ?? (await this.solanaApi.getFeePayer())
    const source = await this.deriveUserBank({ ethWallet, mint })
    const nonceKey = ClaimableTokensProgram.deriveNonce({
      ethAddress: ethWallet,
      authority: this.claimableTokensAuthorities[mint],
      programId: this.config.programIds.claimableTokens
    })
    return ClaimableTokensProgram.createTransferInstruction({
      payer: feePayer,
      sourceEthAddress: ethWallet,
      sourceUserBank: source,
      destination,
      nonceAccount: nonceKey,
      authority: this.claimableTokensAuthorities[mint],
      programId: this.config.programIds.claimableTokens
    })
  }

  async createTransferSecpInstruction(params: CreateSecpRequest) {
    const { ethWallet, destination, amount, mint, instructionIndex, auth } =
      await parseParams('createSecpInstruction', CreateSecpSchema)(params)

    let nonce = BigInt(0)
    const nonceKey = ClaimableTokensProgram.deriveNonce({
      ethAddress: ethWallet,
      authority: this.claimableTokensAuthorities[mint],
      programId: this.config.programIds.claimableTokens
    })
    const nonceAccount = await this.connection.getAccountInfo(nonceKey)
    const encodedNonceData = nonceAccount?.data
    if (encodedNonceData) {
      const nonceData =
        ClaimableTokensProgram.layouts.nonceAccountData.decode(encodedNonceData)
      nonce = nonceData.nonce
    }
    const data = ClaimableTokensProgram.createSignedTransferInstructionData({
      destination,
      amount: wAUDIO(amount).value,
      nonce
    })
    const [signature, recoveryId] = await auth.sign(data)
    return Secp256k1Program.createInstructionWithEthAddress({
      ethAddress: ethWallet,
      message: data,
      signature,
      recoveryId,
      instructionIndex
    })
  }
}
