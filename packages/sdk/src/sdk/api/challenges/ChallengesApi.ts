import { wAUDIO } from '@audius/fixed-decimal'
import { PACKET_DATA_SIZE, type TransactionInstruction } from '@solana/web3.js'

import type {
  ClaimableTokensClient,
  DiscoveryNodeSelectorService,
  LoggerService
} from '../../services'
import { AntiAbuseOracleService } from '../../services/AntiAbuseOracle/types'
import type { RewardManagerClient } from '../../services/Solana/programs/RewardManagerClient/RewardManagerClient'
import type { SolanaClient } from '../../services/Solana/programs/SolanaClient'
import { AntiAbuseOracleAttestationError } from '../../utils/errors'
import { encodeHashId } from '../../utils/hashId'
import { parseParams } from '../../utils/parseParams'
import {
  ChallengesApi as GeneratedChallengesApi,
  Configuration
} from '../generated/default'
import {
  ChallengesApi as GeneratedChallengesApiFull,
  Configuration as ConfigurationFull
} from '../generated/full'
import type { UsersApi } from '../users/UsersApi'

import {
  ChallengeId,
  ClaimRewardsRequest,
  ClaimRewardsSchema,
  GenerateSpecifierRequest,
  GenerateSpecifierSchema
} from './types'

export class ChallengesApi extends GeneratedChallengesApi {
  constructor(
    config: Configuration,
    private readonly usersApi: UsersApi,
    private readonly discoveryNodeSelector: DiscoveryNodeSelectorService,
    private readonly rewardManager: RewardManagerClient,
    private readonly claimableTokens: ClaimableTokensClient,
    private readonly antiAbuseOracle: AntiAbuseOracleService,
    private readonly logger: LoggerService,
    private readonly solanaClient: SolanaClient
  ) {
    super(config)
    this.logger = logger.createPrefixedLogger('[challenges-api]')
  }

  /**
   * Formats the specifier for a claimable instance of a challenge.
   *
   * For most challenges, this is the user ID of the user that's claiming the
   * the challenge reward. For challenges like referrals or $AUDIO matching,
   * this includes more data like the referred user ID or purchased track ID
   * to allow the challenge to be claimed multiple times, but only once per
   * completed instance.
   *
   * @hidden subject to change
   */
  public async generateSpecifier(request: GenerateSpecifierRequest) {
    const args = await parseParams(
      'generateSpecifier',
      GenerateSpecifierSchema
    )(request)
    switch (args.challengeId) {
      case ChallengeId.COMPLETE_PROFILE:
      case ChallengeId.CONNECT_VERIFIED_ACCOUNT:
      case ChallengeId.CREATE_FIRST_PLAYLIST:
      case ChallengeId.LISTEN_STREAK:
      case ChallengeId.MOBILE_INSTALL:
      case ChallengeId.SEND_FIRST_TIP:
      case ChallengeId.TRACK_UPLOADS:
        return `${encodeHashId(args.userId)}`
      case ChallengeId.AUDIO_MATCHING_BUYER:
        return `${encodeHashId(args.sellerUserId)}:${encodeHashId(
          args.trackId
        )}`
      case ChallengeId.AUDIO_MATCHING_SELLER:
        return `${encodeHashId(args.buyerUserId)}:${encodeHashId(args.trackId)}`
      case ChallengeId.REFERRALS:
      case ChallengeId.VERIFIED_REFERRALS:
        return `${encodeHashId(args.userId)}:${encodeHashId(
          args.referredUserId
        )}`
      default:
        throw new Error(`Unknown challenge ID: ${args.challengeId}`)
    }
  }

  /**
   * Claims a reward on behalf of a user.
   *
   * @hidden subject to change
   *
   * @see {@link generateSpecifier} to create the specifier argument.
   */
  public async claimReward(request: ClaimRewardsRequest) {
    const args = await parseParams('claimRewards', ClaimRewardsSchema)(request)
    const { challengeId, specifier, amount: inputAmount } = args
    const logger = this.logger.createPrefixedLogger(
      `[${challengeId}:${specifier}]`
    )
    const { userId } = request
    const amount = wAUDIO(inputAmount).value
    const { data } = await this.usersApi.getUser({
      id: userId
    })
    if (!data) {
      throw new Error(`Failed to find user ${args.userId}`)
    }
    const { ercWallet: recipientEthAddress, handle } = data
    const antiAbuseOracleEthAddress =
      await this.antiAbuseOracle.getWalletAddress()
    logger.debug('Creating user bank if necessary...')
    const userBankPromise = this.claimableTokens.getOrCreateUserBank({
      ethWallet: recipientEthAddress,
      mint: 'wAUDIO'
    })

    logger.debug('Getting attestation submission state...')
    const submissions = await this.rewardManager.getSubmittedAttestations({
      challengeId,
      specifier
    })
    logger.debug('Existing attestations:', submissions)

    let instructions: TransactionInstruction[] = []
    const hasSubmittedAntiAbuseOracle = submissions?.messages.find(
      (m) => m.attestation.antiAbuseOracleEthAddress === null
    )?.senderEthAddress
    if (!hasSubmittedAntiAbuseOracle) {
      logger.debug('Adding anti abuse oracle attestation...')
      const ix = await this.submitAntiAbuseOracleAttestation({
        challengeId,
        specifier,
        amount,
        recipientEthAddress,
        handle
      })
      instructions = instructions.concat(ix)
    }

    const existingSenderOwners =
      submissions?.messages
        .filter((m) => !!m.attestation.antiAbuseOracleEthAddress)
        .map((m) => m.operator) ?? []

    const state = await this.rewardManager.getRewardManagerState()
    const outstandingAttestations = state.minVotes - existingSenderOwners.length
    if (outstandingAttestations > 0) {
      logger.debug(
        `Adding ${outstandingAttestations} discovery node attestations...`
      )
      const ix = await this.submitDiscoveryAttestations({
        userId,
        antiAbuseOracleEthAddress,
        challengeId,
        specifier,
        amount,
        recipientEthAddress,
        numberOfNodes: outstandingAttestations,
        excludeOwners: existingSenderOwners,
        instructionOffset: instructions.length,
        logger
      })
      instructions = instructions.concat(ix)
    }

    if (instructions.length > 0) {
      const txSoFar = await this.solanaClient.buildTransaction({
        instructions,
        addressLookupTables: [this.rewardManager.lookupTable],
        priorityFee: null
      })
      // Evaluate instruction adds 145 bytes w/ max disbursement id of 32
      const estimatedEvaluateInstructionSize = 145
      const threshold = PACKET_DATA_SIZE - estimatedEvaluateInstructionSize
      if (txSoFar.serialize().byteLength >= threshold) {
        logger.debug(
          `Transaction size too large (size: ${
            txSoFar.serialize().byteLength
          }), submitting attestations separately...`
        )
        const submissionSignature = await this.rewardManager.sendTransaction(
          txSoFar
        )
        logger.debug('Confirming attestation submissions...')
        await this.solanaClient.confirmAllTransactions([submissionSignature])
        instructions = []
      }
    }
    logger.debug('Creating evaluate instruction...')
    const { userBank: destinationUserBank } = await userBankPromise
    const evaluate =
      await this.rewardManager.createEvaluateAttestationsInstruction({
        challengeId,
        specifier,
        recipientEthAddress,
        destinationUserBank,
        antiAbuseOracleEthAddress,
        amount
      })
    instructions.push(evaluate)
    logger.debug('Disbursing...')
    const tx = await this.solanaClient.buildTransaction({
      instructions,
      addressLookupTables: [this.rewardManager.lookupTable],
      priorityFee: null
    })
    const signature = await this.rewardManager.sendTransaction(tx, {
      skipPreflight: true
    })
    return signature
  }

  private async submitAntiAbuseOracleAttestation({
    challengeId,
    specifier,
    amount,
    recipientEthAddress,
    handle
  }: {
    challengeId: ChallengeId
    specifier: string
    amount: bigint
    recipientEthAddress: string
    handle: string
  }) {
    const antiAbuseOracleAttestation =
      await this.antiAbuseOracle.getChallengeAttestation({
        handle,
        challengeId,
        specifier,
        amount: Number(wAUDIO(amount).toString())
      })
    const antiAbuseOracleEthAddress =
      await this.antiAbuseOracle.getWalletAddress()
    if (!antiAbuseOracleAttestation.result) {
      const errorMessage = 'Failed to get AAO attestation'
      if (antiAbuseOracleAttestation.errorCode !== undefined) {
        throw new AntiAbuseOracleAttestationError(
          antiAbuseOracleAttestation.errorCode,
          errorMessage
        )
      }
      throw new Error(errorMessage)
    }
    const instructions = []
    const aaoSubmitSecpInstruction =
      await this.rewardManager.createSubmitAttestationSecpInstruction({
        challengeId,
        specifier,
        amount,
        recipientEthAddress,
        senderEthAddress: antiAbuseOracleEthAddress,
        senderSignature: antiAbuseOracleAttestation.result,
        instructionIndex: instructions.length
      })
    const aaoSubmitInstruction =
      await this.rewardManager.createSubmitAttestationInstruction({
        challengeId,
        specifier,
        senderEthAddress: antiAbuseOracleEthAddress
      })
    instructions.push(aaoSubmitSecpInstruction)
    instructions.push(aaoSubmitInstruction)
    return instructions
  }

  private async submitDiscoveryAttestations({
    userId,
    antiAbuseOracleEthAddress,
    challengeId,
    specifier,
    amount,
    recipientEthAddress,
    numberOfNodes,
    instructionOffset = 0,
    excludeOwners = [],
    logger = this.logger
  }: {
    userId: string
    antiAbuseOracleEthAddress: string
    challengeId: ChallengeId
    specifier: string
    amount: bigint
    recipientEthAddress: string
    numberOfNodes: number
    instructionOffset: number
    excludeOwners: string[]
    logger?: LoggerService
  }) {
    const discoveryNodes =
      await this.discoveryNodeSelector.getUniquelyOwnedEndpoints(
        numberOfNodes,
        excludeOwners
      )
    logger.debug('Got unique Discovery Nodes', {
      discoveryNodes,
      excludeOwners
    })
    const discoveryAttestations = await Promise.all(
      discoveryNodes.map((endpoint) =>
        new GeneratedChallengesApiFull(
          new ConfigurationFull({ basePath: `${endpoint}/v1/full` })
        ).getChallengeAttestation({
          userId,
          challengeId,
          specifier,
          oracle: antiAbuseOracleEthAddress
        })
      )
    )
    logger.debug('Got Discovery Node attestations', discoveryAttestations)
    const instructions = []
    for (const attestation of discoveryAttestations) {
      const senderEthAddress = attestation.data!.ownerWallet
      const senderSignature = attestation.data!.attestation
      const secpInstruction =
        await this.rewardManager.createSubmitAttestationSecpInstruction({
          challengeId,
          specifier,
          recipientEthAddress,
          senderEthAddress,
          antiAbuseOracleEthAddress,
          amount,
          senderSignature,
          instructionIndex: instructions.length + instructionOffset
        })
      const submitInstruction =
        await this.rewardManager.createSubmitAttestationInstruction({
          challengeId,
          specifier,
          senderEthAddress
        })
      instructions.push(secpInstruction)
      instructions.push(submitInstruction)
    }
    return instructions
  }
}
