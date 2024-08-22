import { wAUDIO } from '@audius/fixed-decimal'
import type { PublicKey } from '@solana/web3.js'

import type {
  ClaimableTokensClient,
  DiscoveryNodeSelectorService,
  LoggerService
} from '../../services'
import { AntiAbuseOracleService } from '../../services/AntiAbuseOracle/types'
import type { RewardManagerClient } from '../../services/Solana/programs/RewardManagerClient/RewardManagerClient'
import type { SolanaClient } from '../../services/Solana/programs/SolanaClient'
import { AntiAbuseOracleAttestationError } from '../../utils/errors'
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
  AAOErrorResponse,
  AttestationTransactionSignature,
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
        return `${args.userId}`
      case ChallengeId.AUDIO_MATCHING_BUYER:
        return `${args.sellerUserId}=>${args.trackId}`
      case ChallengeId.AUDIO_MATCHING_SELLER:
        return `${args.buyerUserId}=>${args.trackId}`
      case ChallengeId.REFERRALS:
      case ChallengeId.VERIFIED_REFERRALS:
        return `${args.userId}=>${args.referredUserId}`
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
    for (let i = 0; i < 5; i++) {
      try {
        return await this.claimRewardAttempt(request)
      } catch (e) {
        console.error(`Failed to claim reward attempt ${i}: ${e}`)
        if (i === 4) {
          throw e
        }
      }
    }
    throw new Error('Failed to claim reward.')
  }

  private async claimRewardAttempt(request: ClaimRewardsRequest) {
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

    const attestationPromises = []
    const hasSubmittedAntiAbuseOracle = submissions?.messages.find(
      (m) => m.attestation.antiAbuseOracleEthAddress === null
    )?.senderEthAddress
    if (!hasSubmittedAntiAbuseOracle) {
      logger.debug('Submitting anti abuse oracle attestation...')
      attestationPromises.push(
        this.submitAntiAbuseOracleAttestation({
          challengeId,
          specifier,
          amount,
          recipientEthAddress,
          handle
        })
      )
    }

    const existingSenderOwners =
      submissions?.messages
        .filter((m) => !!m.attestation.antiAbuseOracleEthAddress)
        .map((m) => m.operator) ?? []

    const state = await this.rewardManager.getRewardManagerState()
    const outstandingAttestations = state.minVotes - existingSenderOwners.length
    if (outstandingAttestations > 0) {
      logger.debug(
        `Submitting ${outstandingAttestations} discovery node attestations...`
      )
      attestationPromises.push(
        this.submitDiscoveryAttestations({
          userId,
          antiAbuseOracleEthAddress,
          challengeId,
          specifier,
          amount,
          recipientEthAddress,
          numberOfNodes: outstandingAttestations,
          excludeOwners: existingSenderOwners,
          logger
        })
      )
    }

    const attestationResults = await Promise.all(attestationPromises)

    const aaoError = attestationResults.find(
      (result): result is AAOErrorResponse => 'aaoErrorCode' in result
    )
    if (aaoError) {
      return aaoError
    }

    const attestationTransactionSignatures = attestationResults
      .filter(
        (result): result is AttestationTransactionSignature =>
          'transactionSignature' in result
      )
      .map((attestationResult) => {
        return attestationResult.transactionSignature
      })

    logger.debug('Confirming all attestation submissions...')
    await this.solanaClient.confirmAllTransactions(
      attestationTransactionSignatures
    )

    logger.debug('Disbursing claim...')
    const { userBank: destinationUserBank } = await userBankPromise
    const transactionSignature = await this.evaluateAttestations({
      challengeId,
      specifier,
      recipientEthAddress,
      destinationUserBank,
      antiAbuseOracleEthAddress,
      amount
    })

    return transactionSignature
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
  }): Promise<AttestationTransactionSignature | AAOErrorResponse> {
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
    const aaoSubmitSecpInstruction =
      await this.rewardManager.createSubmitAttestationSecpInstruction({
        challengeId,
        specifier,
        amount,
        recipientEthAddress,
        senderEthAddress: antiAbuseOracleEthAddress,
        senderSignature: antiAbuseOracleAttestation.result
      })
    const aaoSubmitInstruction =
      await this.rewardManager.createSubmitAttestationInstruction({
        challengeId,
        specifier,
        senderEthAddress: antiAbuseOracleEthAddress
      })
    const submitAAOTransaction = await this.solanaClient.buildTransaction({
      instructions: [aaoSubmitSecpInstruction, aaoSubmitInstruction]
    })
    return {
      transactionSignature: await this.rewardManager.sendTransaction(
        submitAAOTransaction
      ),
      antiAbuseOracleEthAddress
    }
  }

  private async submitDiscoveryAttestations({
    userId,
    antiAbuseOracleEthAddress,
    challengeId,
    specifier,
    amount,
    recipientEthAddress,
    numberOfNodes,
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
    const transactions = []
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
          senderSignature
        })
      const submitInstruction =
        await this.rewardManager.createSubmitAttestationInstruction({
          challengeId,
          specifier,
          senderEthAddress
        })
      const submitTransaction = await this.solanaClient.buildTransaction({
        instructions: [secpInstruction, submitInstruction]
      })
      transactions.push(submitTransaction)
    }
    return await Promise.all(
      transactions.map(async (t) => {
        return {
          transactionSignature: await this.rewardManager.sendTransaction(t)
        }
      })
    )
  }

  private async evaluateAttestations({
    challengeId,
    specifier,
    recipientEthAddress,
    destinationUserBank,
    antiAbuseOracleEthAddress,
    amount
  }: {
    challengeId: ChallengeId
    specifier: string
    recipientEthAddress: string
    destinationUserBank: PublicKey
    antiAbuseOracleEthAddress: string
    amount: bigint
  }) {
    const instruction =
      await this.rewardManager.createEvaluateAttestationsInstruction({
        challengeId,
        specifier,
        recipientEthAddress,
        destinationUserBank,
        antiAbuseOracleEthAddress,
        amount
      })
    const transaction = await this.solanaClient.buildTransaction({
      instructions: [instruction]
    })
    // Skip preflight since we likely just submitted the attestations and
    // the chosen RPC's state might not yet reflect that
    return await this.rewardManager.sendTransaction(transaction, {
      skipPreflight: true
    })
  }
}
