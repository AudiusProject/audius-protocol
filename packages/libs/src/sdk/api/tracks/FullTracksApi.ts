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
  PurchaseGateFromJSON,
  instanceOfPurchaseGate
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
      extraAmount = 0,
      walletAdapter
    } = await parseParams('purchase', PurchaseTrackSchema)(params)

    const contentType = 'track'
    const mint = 'USDC'

    const { data: track } = await this.getTrack({
      trackId: params.trackId // use hashed trackId
    })

    if (!track) {
      throw new Error('Could not purchase track: track not found.')
    }
    if (!track.streamConditions && !track.downloadConditions) {
      this.logger.warn('Attempted to purchase free track.')
      return
    }
    const isPurchaseGatedStreamAccess =
      track.streamConditions && instanceOfPurchaseGate(track.streamConditions)
    const isPurchaseGatedDownloadAccess =
      track.downloadConditions &&
      instanceOfPurchaseGate(track.downloadConditions)
    if (!isPurchaseGatedStreamAccess && !isPurchaseGatedDownloadAccess) {
      throw new Error(
        'Could not purchase track: Track is not available for purchase.'
      )
    }

    const accessType = isPurchaseGatedStreamAccess ? 'stream' : 'download'

    const { splits: centSplits, price } = PurchaseGateFromJSON(
      isPurchaseGatedStreamAccess
        ? track.streamConditions
        : track.downloadConditions
    ).usdcPurchase
    const total = USDC(price).value + USDC(extraAmount).value

    // Splits are given in cents. Divide by 100 and convert to USDC
    const splits = Object.entries(centSplits).reduce(
      (prev, [key, value]) => ({
        ...prev,
        [key]: USDC(value / 100.0).value
      }),
      {}
    )

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
