import { wAUDIO } from '@audius/fixed-decimal'
import type {
  ClaimableTokensClient,
  DiscoveryNodeSelectorService,
  LoggerService
} from '../../services'
import type {
  AntiAbuseOracle,
  AntiAbuseOracleSelectorService
} from '../../services/AntiAbuseOracleSelector/types'
import type { RewardManagerClient } from '../../services/Solana/programs/RewardManagerClient/RewardManagerClient'
import { parseParams } from '../../utils/parseParams'
import { BaseAPI, Configuration } from '../generated/default'
import {
  ChallengesApi as GeneratedChallengesApi,
  Configuration as ConfigurationFull
} from '../generated/full'
import type { UsersApi } from '../users/UsersApi'
import {
  ChallengeRewardID,
  ClaimRewardsRequest,
  ClaimRewardsSchema,
  GenerateSpecifierRequest,
  GenerateSpecifierSchema
} from './types'
import type { PublicKey } from '@solana/web3.js'
import { AntiAbuseOracleApi } from '../antiAbuseOracle/AntiAbuseOracleApi'
import { toChecksumAddress } from 'ethereumjs-util'

export class ChallengesApi extends BaseAPI {
  private readonly logger: LoggerService
  constructor(
    config: Configuration,
    private readonly usersApi: UsersApi,
    private readonly discoveryNodeSelector: DiscoveryNodeSelectorService,
    private readonly rewardManager: RewardManagerClient,
    private readonly claimableTokens: ClaimableTokensClient,
    private readonly antiAbuseOracleSelector: AntiAbuseOracleSelectorService,
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
   */
  public async generateSpecifier(request: GenerateSpecifierRequest) {
    const args = await parseParams(
      'generateSpecifier',
      GenerateSpecifierSchema
    )(request)
    switch (args.challengeId) {
      case ChallengeRewardID.COMPLETE_PROFILE:
      case ChallengeRewardID.CONNECT_VERIFIED_ACCOUNT:
      case ChallengeRewardID.CREATE_FIRST_PLAYLIST:
      case ChallengeRewardID.LISTEN_STREAK:
      case ChallengeRewardID.MOBILE_INSTALL:
      case ChallengeRewardID.SEND_FIRST_TIP:
      case ChallengeRewardID.TRACK_UPLOADS:
        return `${args.userId}`
      case ChallengeRewardID.AUDIO_MATCHING_BUYER:
        return `${args.sellerUserId}=>${args.trackId}`
      case ChallengeRewardID.AUDIO_MATCHING_SELLER:
        return `${args.buyerUserId}=>${args.trackId}`
      case ChallengeRewardID.REFERRALS:
      case ChallengeRewardID.VERIFIED_REFERRALS:
        return `${args.userId}=>${args.userId}`
      default:
        throw new Error(`Unknown challenge ID: ${args.challengeId}`)
    }
  }

  /**
   * Claims a reward on behalf of a user.
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
    let attestationTransactionSignatures: string[] = []

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
      this.logger.debug('Selecting anti abuse oracle for attestation...')
      const antiAbuseOracle =
        await this.antiAbuseOracleSelector.getSelectedService()
      if (!antiAbuseOracle) {
        throw new Error('Could not find a healthy anti abuse oracle.')
      }
      antiAbuseOracleEthAddress = antiAbuseOracle.wallet

      this.logger.debug('Submitting anti abuse oracle attestation...')
      const signature = await this.submitAntiAbuseOracleAttestation({
        antiAbuseOracle,
        challengeId,
        specifier,
        amount,
        recipientEthAddress,
        handle
      })
      attestationTransactionSignatures.push(signature)
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
    antiAbuseOracle,
    challengeId,
    specifier,
    amount,
    recipientEthAddress,
    handle
  }: {
    antiAbuseOracle: AntiAbuseOracle
    challengeId: ChallengeRewardID
    specifier: string
    amount: bigint
    recipientEthAddress: string
    handle: string
  }) {
    const antiAbuseOracleAttestation = await new AntiAbuseOracleApi(
      new Configuration({ basePath: antiAbuseOracle.endpoint })
    ).getChallengeAttestation({
      handle,
      challengeId,
      specifier,
      amount: Number(wAUDIO(amount).toString())
    })
    if (!antiAbuseOracleAttestation.signature) {
      throw new Error('Failed to get AAO attestation')
    }
    const aaoSubmitSecpInstruction =
      await this.rewardManager.createSubmitAttestationSecpInstruction({
        challengeId,
        specifier,
        amount,
        recipientEthAddress,
        senderEthAddress: antiAbuseOracle.wallet,
        senderSignature: antiAbuseOracleAttestation.signature
      })
    const aaoSubmitInstruction =
      await this.rewardManager.createSubmitAttestationInstruction({
        challengeId,
        specifier,
        senderEthAddress: antiAbuseOracle.wallet
      })
    const submitAAOTransaction = await this.rewardManager.buildTransaction({
      instructions: [aaoSubmitSecpInstruction, aaoSubmitInstruction]
    })
    return await this.rewardManager.sendTransaction(submitAAOTransaction)
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
    challengeId: ChallengeRewardID
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
    challengeId: ChallengeRewardID
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
