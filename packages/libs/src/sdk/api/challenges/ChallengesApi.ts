import { wAUDIO } from '@audius/fixed-decimal'
import type { PublicKey } from '@solana/web3.js'
import { toChecksumAddress } from 'ethereumjs-util'

import type {
  ClaimableTokensClient,
  DiscoveryNodeSelectorService,
  LoggerService
} from '../../services'
import { AntiAbuseOracleService } from '../../services/AntiAbuseOracle/types'
import type { RewardManagerClient } from '../../services/Solana/programs/RewardManagerClient/RewardManagerClient'
import { parseParams } from '../../utils/parseParams'
import { BaseAPI, Configuration } from '../generated/default'
import {
  ChallengesApi as GeneratedChallengesApi,
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

export class ChallengesApi extends BaseAPI {
  private readonly logger: LoggerService
  constructor(
    config: Configuration,
    private readonly usersApi: UsersApi,
    private readonly discoveryNodeSelector: DiscoveryNodeSelectorService,
    private readonly rewardManager: RewardManagerClient,
    private readonly claimableTokens: ClaimableTokensClient,
    private readonly antiAbuseOracle: AntiAbuseOracleService,
    logger: LoggerService
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
    const args = await parseParams('claimRewards', ClaimRewardsSchema)(request)
    const { challengeId, specifier, amount: inputAmount } = args
    const { userId } = request
    const amount = wAUDIO(inputAmount).value
    const { data } = await this.usersApi.getUser({
      id: userId
    })
    if (!data) {
      throw new Error(`Failed to find user ${args.userId}`)
    }
    const { ercWallet: recipientEthAddress, handle } = data
    const attestationTransactionSignatures: string[] = []

    this.logger.debug('Creating user bank if necessary...')
    const { userBank: destinationUserBank } =
      await this.claimableTokens.getOrCreateUserBank({
        ethWallet: recipientEthAddress,
        mint: 'wAUDIO'
      })

    this.logger.debug('Getting attestation submission state...')
    const submissions = await this.rewardManager.getSubmittedAttestations({
      challengeId,
      specifier
    })
    this.logger.debug('Submission state:', submissions)

    let antiAbuseOracleEthAddress = submissions?.messages.find(
      (m) => m.attestation.antiAbuseOracleEthAddress === null
    )?.senderEthAddress
    if (!antiAbuseOracleEthAddress) {
      this.logger.debug('Submitting anti abuse oracle attestation...')
      const response = await this.submitAntiAbuseOracleAttestation({
        challengeId,
        specifier,
        amount,
        recipientEthAddress,
        handle
      })
      antiAbuseOracleEthAddress = response.antiAbuseOracleEthAddress
      attestationTransactionSignatures.push(response.transactionSignature)
    } else {
      // Need to convert to checksum address as the attestation is lowercased
      antiAbuseOracleEthAddress = toChecksumAddress(antiAbuseOracleEthAddress)
    }

    const existingSenderOwners =
      submissions?.messages
        .filter((m) => !!m.attestation.antiAbuseOracleEthAddress)
        .map((m) => m.operator) ?? []

    const state = await this.rewardManager.getRewardManagerState()
    if (existingSenderOwners.length < state.minVotes) {
      this.logger.debug('Submitting discovery node attestations...')
      const signatures = await this.submitDiscoveryAttestations({
        userId,
        antiAbuseOracleEthAddress,
        challengeId,
        specifier,
        amount,
        recipientEthAddress,
        numberOfNodes: state.minVotes - existingSenderOwners.length,
        excludeOwners: existingSenderOwners
      })
      attestationTransactionSignatures.push(...signatures)
    }

    this.logger.debug('Confirming all attestation submissions...')
    await this.rewardManager.confirmAllTransactions(
      attestationTransactionSignatures,
      'finalized' // for some reason, only works when finalized...
    )

    this.logger.debug('Disbursing claim...')
    const disbursement = await this.evaluateAttestations({
      challengeId,
      specifier,
      recipientEthAddress,
      destinationUserBank,
      antiAbuseOracleEthAddress,
      amount
    })

    return disbursement
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
      throw new Error('Failed to get AAO attestation')
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
    const submitAAOTransaction = await this.rewardManager.buildTransaction({
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
    excludeOwners = []
  }: {
    userId: string
    antiAbuseOracleEthAddress: string
    challengeId: ChallengeId
    specifier: string
    amount: bigint
    recipientEthAddress: string
    numberOfNodes: number
    excludeOwners: string[]
  }) {
    const discoveryNodes =
      await this.discoveryNodeSelector.getUniquelyOwnedEndpoints(
        numberOfNodes,
        excludeOwners
      )
    const discoveryAttestations = await Promise.all(
      discoveryNodes.map((endpoint) =>
        new GeneratedChallengesApi(
          new ConfigurationFull({ basePath: `${endpoint}/v1/full` })
        ).getChallengeAttestation({
          userId,
          challengeId,
          specifier,
          oracle: antiAbuseOracleEthAddress
        })
      )
    )
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
      const submitTransaction = await this.rewardManager.buildTransaction({
        instructions: [secpInstruction, submitInstruction]
      })
      transactions.push(submitTransaction)
    }
    return await Promise.all(
      transactions.map((t) => this.rewardManager.sendTransaction(t))
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
    const transaction = await this.rewardManager.buildTransaction({
      instructions: [instruction]
    })
    return await this.rewardManager.sendTransaction(transaction)
  }
}
