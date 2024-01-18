import { RewardManagerProgram } from '@audius/spl'
import type { RewardManagerStateData } from '@audius/spl/dist/types/reward-manager/types'
import { Secp256k1Program, type PublicKey } from '@solana/web3.js'

import { mergeConfigWithDefaults } from '../../../../utils/mergeConfigs'
import { parseParams } from '../../../../utils/parseParams'
import { BaseSolanaProgram } from '../BaseSolanaProgram'

import { defaultRewardManagerClentConfig } from './constants'
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

/**
 * Connected client to the Solana RewardManager program.
 *
 * The RewardManager program is in charge of disbursing the community awards
 * based on attestations from N uniquely owned discovery nodes and an anti abuse
 * oracle node.
 */
export class RewardManagerClient extends BaseSolanaProgram {
  private readonly programId: PublicKey
  private readonly rewardManagerStateAccount: PublicKey
  private readonly authority: PublicKey
  private rewardManagerState: RewardManagerStateData | null = null

  constructor(config: RewardManagerClientConfig) {
    const configWithDefaults = mergeConfigWithDefaults(
      config,
      defaultRewardManagerClentConfig
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
}
