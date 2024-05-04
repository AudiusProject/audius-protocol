import { USDC } from '@audius/fixed-decimal'

import {
  AuthService,
  ClaimableTokensClient,
  LoggerService,
  PaymentRouterClient
} from '../../services'
import { parseParams } from '../../utils/parseParams'
import {
  Configuration,
  TracksApi as GeneratedTracksApi,
  UsdcGate
} from '../generated/full'

import { PurchaseTrackRequest, PurchaseTrackSchema } from './types'

export class FullTracksApi extends GeneratedTracksApi {
  constructor(
    config: Configuration,
    private claimableTokensClient: ClaimableTokensClient,
    private paymentRouterClient: PaymentRouterClient,
    private auth: AuthService,
    private logger: LoggerService
  ) {
    super(config)
    this.logger = logger.createPrefixedLogger('[full-tracks-api]')
  }

  /**
   * Purchases stream or download access to a track
   */
  public async purchase(params: PurchaseTrackRequest) {
    const {
      userId,
      trackId,
      extraAmount: extraAmountNumber = 0,
      walletAdapter
    } = await parseParams('purchase', PurchaseTrackSchema)(params)

    const contentType = 'track'
    const mint = 'USDC'

    // Fetch track
    const { data: track } = await this.getTrack({
      trackId: params.trackId, // use hashed trackId
      userId: params.userId // use hashed userId
    })

    // Validate purchase attempt
    if (!track) {
      throw new Error('Track not found.')
    }

    if (!track.isStreamGated && !track.isDownloadGated) {
      throw new Error('Attempted to purchase free track.')
    }

    if (track.user.id === params.userId) {
      throw new Error('Attempted to purchase own track.')
    }

    let numberSplits: UsdcGate['splits'] = {}
    let centPrice: number
    let accessType: 'stream' | 'download' = 'stream'

    // Get conditions
    if (track.streamConditions && 'usdcPurchase' in track.streamConditions) {
      centPrice = track.streamConditions.usdcPurchase.price
      numberSplits = track.streamConditions.usdcPurchase.splits
    } else if (
      track.downloadConditions &&
      'usdcPurchase' in track.downloadConditions
    ) {
      centPrice = track.downloadConditions.usdcPurchase.price
      numberSplits = track.downloadConditions.usdcPurchase.splits
      accessType = 'download'
    } else {
      throw new Error('Track is not available for purchase.')
    }

    // Check if already purchased
    if (
      (accessType === 'download' && track.access?.download) ||
      (accessType === 'stream' && track.access?.stream)
    ) {
      throw new Error('Track already purchased')
    }

    let extraAmount = USDC(extraAmountNumber).value
    const total = USDC(centPrice / 100.0).value + extraAmount
    this.logger.debug('Purchase total:', total)

    // Convert splits to big int and spread extra amount to every split
    const splits = Object.entries(numberSplits).reduce(
      (prev, [key, value], index, arr) => {
        const amountToAdd = extraAmount / BigInt(arr.length - index)
        extraAmount = USDC(extraAmount - amountToAdd).value
        return {
          ...prev,
          [key]: BigInt(value) + amountToAdd
        }
      },
      {}
    )
    this.logger.debug('Calculated splits after extra amount:', splits)

    // Create user bank for recipient if not exists
    this.logger.debug('Checking for recipient user bank...')
    const { userBank: recipientUserBank, didExist } =
      await this.claimableTokensClient.getOrCreateUserBank({
        ethWallet: track.user.wallet,
        mint: 'USDC'
      })
    if (!didExist) {
      this.logger.debug('Created user bank', { recipientUserBank })
    } else {
      this.logger.debug('User bank exists', { recipientUserBank })
    }

    const routeInstruction =
      await this.paymentRouterClient.createRouteInstruction({
        splits,
        total,
        mint
      })
    const memoInstruction =
      await this.paymentRouterClient.createMemoInstruction({
        contentId: trackId,
        contentType,
        blockNumber: track.blocknumber,
        buyerUserId: userId,
        accessType
      })

    if (walletAdapter) {
      this.logger.debug(
        `Using walletAdapter ${walletAdapter.name} to purchase...`
      )
      // Use the specified Solana wallet
      const transferInstruction =
        await this.paymentRouterClient.createTransferInstruction({
          amount: total,
          mint
        })
      const transaction = await this.paymentRouterClient.buildTransaction({
        instructions: [transferInstruction, routeInstruction, memoInstruction]
      })
      return await walletAdapter.sendTransaction(
        transaction,
        this.paymentRouterClient.connection
      )
    } else {
      // Use the authed wallet's userbank and relay
      const ethWallet = await this.auth.getAddress()
      this.logger.debug(
        `Using userBank ${await this.claimableTokensClient.deriveUserBank({
          ethWallet,
          mint: 'USDC'
        })} to purchase...`
      )
      const paymentRouterTokenAccount =
        await this.paymentRouterClient.getOrCreateProgramTokenAccount({
          mint
        })

      const transferSecpInstruction =
        await this.claimableTokensClient.createTransferSecpInstruction({
          ethWallet,
          destination: paymentRouterTokenAccount.address,
          mint,
          amount: total,
          auth: this.auth
        })
      const transferInstruction =
        await this.claimableTokensClient.createTransferInstruction({
          ethWallet,
          destination: paymentRouterTokenAccount.address,
          mint
        })
      const transaction = await this.paymentRouterClient.buildTransaction({
        instructions: [
          transferSecpInstruction,
          transferInstruction,
          routeInstruction,
          memoInstruction
        ]
      })
      return await this.paymentRouterClient.sendTransaction(transaction)
    }
  }
}
