import {
  RewardManagerInstruction,
  RewardManagerErrorCode,
  RewardManagerProgram
} from '@audius/spl'
import type { RewardManagerStateData } from '@audius/spl/dist/types/reward-manager/types'
import { SendTransactionOptions } from '@solana/wallet-adapter-base'
import {
  Secp256k1Program,
  SendTransactionError,
  Transaction,
  VersionedTransaction,
  type PublicKey
} from '@solana/web3.js'

import { productionConfig } from '../../../../config/production'
import { mergeConfigWithDefaults } from '../../../../utils/mergeConfigs'
import { parseParams } from '../../../../utils/parseParams'
import { BaseSolanaProgramClient } from '../BaseSolanaProgramClient'

import { getDefaultRewardManagerClentConfig } from './getDefaultConfig'
import {
  CreateEvaluateAttestationsInstructionRequest,
  CreateEvaluateAttestationsInstructionSchema,
  CreateSubmitAttestationInstructionSchema,
  type CreateSubmitAttestationRequest,
  type RewardManagerClientConfig,
  CreateSenderInstructionRequest,
  CreateSenderInstructionSchema,
  CreateSubmitAttestationSecpInstructionRequest,
  CreateSubmitAttestationSecpInstructionSchema,
  GetSubmittedAttestationsRequest,
  GetSubmittedAttestationsSchema
} from './types'

type CustomInstructionErrorMessage = {
  InstructionError: [number, { Custom: number }]
}

/**
 * Mapping of custom instruction error codes to error messages
 * @see {@link https://github.com/AudiusProject/audius-protocol/blob/2a37bcff1bb1a82efdf187d1723b3457dc0dcb9b/solana-programs/reward-manager/program/src/error.rs solana-programs/reward-manager/program/src/errors.rs}
 */
const codeMessageMap: Record<RewardManagerErrorCode, string> = {
  [RewardManagerErrorCode.IncorrectOwner]:
    'Input account owner is not the program address',
  [RewardManagerErrorCode.SignCollision]:
    'Signature with an already met principal',
  [RewardManagerErrorCode.WrongSigner]: 'Unexpected signer met',
  [RewardManagerErrorCode.NotEnoughSigners]: "Isn't enough signers keys",
  [RewardManagerErrorCode.Secp256InstructionMissing]:
    'Secp256 instruction missing',
  [RewardManagerErrorCode.InstructionLoadError]: 'Instruction load error',
  [RewardManagerErrorCode.RepeatedSenders]: 'Repeated sender',
  [RewardManagerErrorCode.SignatureVerificationFailed]:
    'Signature verification failed',
  [RewardManagerErrorCode.OperatorCollision]:
    'Some signers have same operators',
  [RewardManagerErrorCode.AlreadySent]: 'Funds already sent',
  [RewardManagerErrorCode.IncorrectMessages]: 'Incorrect messages',
  [RewardManagerErrorCode.MessagesOverflow]: 'Messages overflow',
  [RewardManagerErrorCode.MathOverflow]: 'Math overflow',
  [RewardManagerErrorCode.InvalidRecipient]: 'Invalid Recipient'
}

export class RewardManagerError extends Error {
  override name = 'RewardManagerError'
  public code: number
  public instructionName: string
  public customErrorName?: string
  constructor({
    code,
    instructionName,
    cause
  }: {
    code: number
    instructionName: string
    cause?: Error
  }) {
    super(
      codeMessageMap[code as RewardManagerErrorCode] ??
        `Unknown error: ${code}`,
      { cause }
    )
    this.code = code
    this.instructionName = instructionName
    this.customErrorName = RewardManagerErrorCode[code]
  }
}

/**
 * Connected client to the Solana RewardManager program.
 *
 * The RewardManager program is in charge of disbursing the community awards
 * based on attestations from N uniquely owned discovery nodes and an anti abuse
 * oracle node.
 */
export class RewardManagerClient extends BaseSolanaProgramClient {
  private readonly programId: PublicKey
  private readonly rewardManagerStateAccount: PublicKey
  private readonly authority: PublicKey
  private rewardManagerState: RewardManagerStateData | null = null

  constructor(config: RewardManagerClientConfig) {
    const configWithDefaults = mergeConfigWithDefaults(
      config,
      getDefaultRewardManagerClentConfig(productionConfig)
    )
    super(configWithDefaults, config.solanaWalletAdapter)
    this.programId = configWithDefaults.programId
    this.rewardManagerStateAccount = configWithDefaults.rewardManagerState
    this.authority = RewardManagerProgram.deriveAuthority({
      programId: configWithDefaults.programId,
      rewardManagerState: configWithDefaults.rewardManagerState
    })
  }

  public async createSenderInstruction(params: CreateSenderInstructionRequest) {
    const args = await parseParams(
      'createSenderInstruction',
      CreateSenderInstructionSchema
    )(params)
    const {
      manager,
      sender: senderEthAddress,
      operator: operatorEthAddress,
      feePayer: feePayerOverride
    } = args
    const feePayer = feePayerOverride ?? (await this.getFeePayer())
    const sender = RewardManagerProgram.deriveSender({
      ethAddress: senderEthAddress,
      programId: this.programId,
      authority: this.authority
    })

    return RewardManagerProgram.createSenderInstruction({
      operatorEthAddress,
      senderEthAddress,
      rewardManagerState: this.rewardManagerStateAccount,
      manager,
      authority: this.authority,
      payer: feePayer,
      sender,
      rewardManagerProgramId: this.programId
    })
  }

  public async createSubmitAttestationInstruction(
    params: CreateSubmitAttestationRequest
  ) {
    const args = await parseParams(
      'createSubmitAttestationInstruction',
      CreateSubmitAttestationInstructionSchema
    )(params)
    const {
      challengeId,
      specifier,
      senderEthAddress,
      feePayer: feePayerOverride
    } = args
    const disbursementId = this.makeDisbursementId(challengeId, specifier)
    const feePayer = feePayerOverride ?? (await this.getFeePayer())
    const sender = RewardManagerProgram.deriveSender({
      ethAddress: senderEthAddress,
      programId: this.programId,
      authority: this.authority
    })
    const attestations = RewardManagerProgram.deriveAttestations({
      disbursementId,
      programId: this.programId,
      authority: this.authority
    })
    return RewardManagerProgram.createSubmitAttestationInstruction({
      disbursementId,
      attestations,
      rewardManagerState: this.rewardManagerStateAccount,
      authority: this.authority,
      payer: feePayer,
      sender,
      rewardManagerProgramId: this.programId
    })
  }

  public async createSubmitAttestationSecpInstruction(
    params: CreateSubmitAttestationSecpInstructionRequest
  ) {
    const args = await parseParams(
      'createSubmitAttestationSecpInstruction',
      CreateSubmitAttestationSecpInstructionSchema
    )(params)
    const {
      recipientEthAddress,
      challengeId,
      specifier,
      amount,
      senderEthAddress,
      senderSignature,
      instructionIndex,
      antiAbuseOracleEthAddress
    } = args

    const disbursementId = this.makeDisbursementId(challengeId, specifier)
    const { signature, recoveryId } =
      RewardManagerProgram.encodeSignature(senderSignature)

    const data = RewardManagerProgram.encodeAttestation({
      disbursementId,
      recipientEthAddress,
      amount,
      antiAbuseOracleEthAddress
    })

    return Secp256k1Program.createInstructionWithEthAddress({
      ethAddress: senderEthAddress,
      message: data,
      signature,
      recoveryId,
      instructionIndex
    })
  }

  public async createEvaluateAttestationsInstruction(
    params: CreateEvaluateAttestationsInstructionRequest
  ) {
    const args = await parseParams(
      'createEvaluateAttestationsInstruction',
      CreateEvaluateAttestationsInstructionSchema
    )(params)
    const {
      challengeId,
      specifier,
      recipientEthAddress,
      destinationUserBank,
      antiAbuseOracleEthAddress,
      amount,
      feePayer: feePayerOverride
    } = args
    const disbursementId = this.makeDisbursementId(challengeId, specifier)
    const feePayer = feePayerOverride ?? (await this.getFeePayer())
    const state = await this.getRewardManagerState()
    const disbursementAccount = RewardManagerProgram.deriveDisbursement({
      disbursementId,
      programId: this.programId,
      authority: this.authority
    })
    const attestations = RewardManagerProgram.deriveAttestations({
      disbursementId,
      programId: this.programId,
      authority: this.authority
    })
    const antiAbuseOracle = RewardManagerProgram.deriveSender({
      ethAddress: antiAbuseOracleEthAddress,
      programId: this.programId,
      authority: this.authority
    })
    return RewardManagerProgram.createEvaluateAttestationsInstruction({
      disbursementId,
      recipientEthAddress,
      amount,
      attestations,
      rewardManagerState: this.rewardManagerStateAccount,
      authority: this.authority,
      rewardManagerTokenSource: state.tokenAccount,
      destinationUserBank,
      disbursementAccount,
      antiAbuseOracle,
      payer: feePayer,
      rewardManagerProgramId: this.programId
    })
  }

  public async getSubmittedAttestations(
    params: GetSubmittedAttestationsRequest
  ) {
    const args = await parseParams(
      'getSubmittedAttestations',
      GetSubmittedAttestationsSchema
    )(params)
    const { challengeId, specifier } = args
    const disbursementId = this.makeDisbursementId(challengeId, specifier)
    const attestationsAccount = RewardManagerProgram.deriveAttestations({
      disbursementId,
      programId: this.programId,
      authority: this.authority
    })
    const accountInfo = await this.connection.getAccountInfo(
      attestationsAccount
    )
    if (!accountInfo) {
      return null
    }
    return RewardManagerProgram.decodeAttestationsAccountData(accountInfo.data)
  }

  private makeDisbursementId(challengeId: string, specifier: string) {
    return `${challengeId}:${specifier}`
  }

  public async getRewardManagerState() {
    if (!this.rewardManagerState) {
      const state = await this.connection.getAccountInfo(
        this.rewardManagerStateAccount
      )
      if (state) {
        this.rewardManagerState = RewardManagerProgram.decodeRewardManagerState(
          state.data
        )
      } else {
        throw new Error('Failed to get reward manager account state.')
      }
    }
    return this.rewardManagerState
  }

  /**
   * Override the sendTransaction method to provide some more friendly errors
   * back to the consumer for RewardManager instructions
   */
  public override async sendTransaction(
    transaction: Transaction | VersionedTransaction,
    sendOptions?: SendTransactionOptions | undefined
  ): Promise<string> {
    try {
      return await super.sendTransaction(transaction, sendOptions)
    } catch (e) {
      if (e instanceof SendTransactionError) {
        try {
          const error = JSON.parse(
            e.transactionError.message
          ) as CustomInstructionErrorMessage
          if (error && error.InstructionError) {
            const instructionIndex = error.InstructionError[0]
            const code = error.InstructionError[1]?.Custom

            // Parse the different transaction types differently
            if ('instructions' in transaction) {
              // Legacy Transaction
              const instruction = transaction.instructions[instructionIndex]
              // Check error instruction is from RewardManagerProgram
              if (instruction && instruction.programId.equals(this.programId)) {
                const decodedInstruction =
                  RewardManagerProgram.decodeInstruction(instruction)
                throw new RewardManagerError({
                  code,
                  instructionName:
                    RewardManagerInstruction[
                      decodedInstruction.data.instruction
                    ] ?? 'Unknown',
                  cause: e
                })
              }
            } else {
              // VersionedTransaction
              const instruction =
                transaction.message.compiledInstructions[instructionIndex]
              // Check error instruction is from RewardManagerProgram
              if (
                instruction &&
                transaction.message.staticAccountKeys[
                  instruction.programIdIndex
                ]?.equals(this.programId)
              ) {
                throw new RewardManagerError({
                  code,
                  instructionName:
                    RewardManagerInstruction[instruction!.data[0] as number] ??
                    'Unknown',
                  cause: e
                })
              }
            }
          }
        } catch (e) {
          if (e instanceof RewardManagerError) {
            throw e
          }
          // If failed to provide user friendly error, surface original error
          console.warn('Failed to parse RewardManagerError error', e)
        }
      }
      throw e
    }
  }
}
