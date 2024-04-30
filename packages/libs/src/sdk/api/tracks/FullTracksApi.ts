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

import {
  PurchaseStreamAccessRequest,
  PurchaseStreamAccessSchema
} from './types'

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
   * Purchases stream access to a track using the authed wallet's userbank
   */
  public async purchaseStreamAccess(params: PurchaseStreamAccessRequest) {
    const { userId, trackId } = await parseParams(
      'purchaseStreamAccess',
      PurchaseStreamAccessSchema
    )(params)

    const contentType = 'track'
    const mint = 'USDC'
    const accessType = 'stream'

    const { data: track } = await this.getTrack({
      trackId: params.trackId // use hashed trackId
    })

    if (!track) {
      throw new Error('Could not purchase track: track not found.')
    }
    if (!track.streamConditions) {
      this.logger.warn('Attempted to purchase free track.')
      return
    }
    if (!instanceOfPurchaseGate(track.streamConditions)) {
      throw new Error(
        'Could not purchase track: Track is not available for purchase.'
      )
    }

    const { splits: centSplits, price: total } = PurchaseGateFromJSON(
      track.streamConditions
    ).usdcPurchase

    // Splits are given in cents. Divide by 100 and convert to USDC
    const splits = Object.entries(centSplits).reduce(
      (prev, [key, value]) => ({
        ...prev,
        [key]: USDC(value / 100.0).value
      }),
      {}
    )

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

  /**
   * Purchases stream access to a track using the connected wallet
   */
  public async purchaseStreamAccess2(params: PurchaseStreamAccessRequest) {
    const { userId, trackId } = await parseParams(
      'purchaseStreamAccess',
      PurchaseStreamAccessSchema
    )(params)

    const contentType = 'track'
    const mint = 'USDC'
    const accessType = 'stream'

    const { data: track } = await this.getTrack({
      trackId: params.trackId // use hashed trackId
    })

    if (!track) {
      throw new Error('Could not purchase track: track not found.')
    }
    if (!track.streamConditions) {
      this.logger.warn('Attempted to purchase free track.')
      return
    }
    if (!instanceOfPurchaseGate(track.streamConditions)) {
      throw new Error(
        'Could not purchase track: Track is not available for purchase.'
      )
    }

    const { splits: centSplits, price: total } = PurchaseGateFromJSON(
      track.streamConditions
    ).usdcPurchase

    // Splits are given in cents. Divide by 100 and convert to USDC
    const splits = Object.entries(centSplits).reduce(
      (prev, [key, value]) => ({
        ...prev,
        [key]: USDC(value / 100.0).value
      }),
      {}
    )

    const transferInstruction =
      await this.paymentRouterClient.createTransferInstruction({
        mint,
        amount: total
      })
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
    const transaction = await this.paymentRouterClient.buildTransaction({
      instructions: [transferInstruction, routeInstruction, memoInstruction]
    })
    return await this.paymentRouterClient.sendTransaction(transaction)
  }
}
