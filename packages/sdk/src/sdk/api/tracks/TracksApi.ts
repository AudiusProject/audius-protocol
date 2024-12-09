import { USDC } from '@audius/fixed-decimal'
import { TransactionInstruction } from '@solana/web3.js'
import snakecaseKeys from 'snakecase-keys'

import type {
  EntityManagerService,
  ClaimableTokensClient,
  PaymentRouterClient,
  SolanaRelayService
} from '../../services'
import type { DiscoveryNodeSelectorService } from '../../services/DiscoveryNodeSelector'
import {
  Action,
  EntityType,
  AdvancedOptions
} from '../../services/EntityManager/types'
import type { LoggerService } from '../../services/Logger'
import type { SolanaClient } from '../../services/Solana/programs/SolanaClient'
import type { StorageService } from '../../services/Storage'
import { decodeHashId, encodeHashId } from '../../utils/hashId'
import { getLocation } from '../../utils/location'
import { parseParams } from '../../utils/parseParams'
import { prepareSplits } from '../../utils/preparePaymentSplits'
import { retry3 } from '../../utils/retry'
import {
  Configuration,
  StreamTrackRequest,
  TracksApi as GeneratedTracksApi,
  ExtendedPaymentSplit,
  instanceOfExtendedPurchaseGate
} from '../generated/default'
import { BASE_PATH, RequiredError } from '../generated/default/runtime'

import { TrackUploadHelper } from './TrackUploadHelper'
import {
  createUpdateTrackSchema,
  DeleteTrackRequest,
  DeleteTrackSchema,
  RepostTrackRequest,
  RepostTrackSchema,
  FavoriteTrackRequest,
  FavoriteTrackSchema,
  UnrepostTrackRequest,
  UnrepostTrackSchema,
  UnfavoriteTrackRequest,
  UnfavoriteTrackSchema,
  UpdateTrackRequest,
  UploadTrackRequest,
  PurchaseTrackRequest,
  PurchaseTrackSchema,
  GetPurchaseTrackInstructionsRequest,
  GetPurchaseTrackInstructionsSchema,
  RecordTrackDownloadRequest,
  RecordTrackDownloadSchema,
  createUploadTrackFilesSchema,
  UploadTrackFilesRequest,
  createUploadTrackSchema
} from './types'

// Extend that new class
export class TracksApi extends GeneratedTracksApi {
  private readonly trackUploadHelper: TrackUploadHelper

  constructor(
    configuration: Configuration,
    private readonly discoveryNodeSelectorService: DiscoveryNodeSelectorService,
    private readonly storage: StorageService,
    private readonly entityManager: EntityManagerService,
    private readonly logger: LoggerService,
    private readonly claimableTokensClient: ClaimableTokensClient,
    private readonly paymentRouterClient: PaymentRouterClient,
    private readonly solanaRelay: SolanaRelayService,
    private readonly solanaClient: SolanaClient
  ) {
    super(configuration)
    this.trackUploadHelper = new TrackUploadHelper(configuration)
    this.logger = logger.createPrefixedLogger('[tracks-api]')
  }

  /**
   * Get the url of the track's streamable mp3 file
   */
  async getTrackStreamUrl(params: StreamTrackRequest): Promise<string> {
    if (params.trackId === null || params.trackId === undefined) {
      throw new RequiredError(
        'trackId',
        'Required parameter params.trackId was null or undefined when calling getTrack.'
      )
    }

    const path = `/tracks/{track_id}/stream`.replace(
      `{${'track_id'}}`,
      encodeURIComponent(String(params.trackId))
    )
    const host = await this.discoveryNodeSelectorService.getSelectedEndpoint()
    return `${host}${BASE_PATH}${path}`
  }

  /** @hidden
   * Upload track files, does not write to chain
   */
  async uploadTrackFiles(params: UploadTrackFilesRequest) {
    // Parse inputs
    this.logger.info('Parsing inputs')
    const {
      userId,
      trackFile,
      coverArtFile,
      metadata: parsedMetadata,
      onProgress
    } = await parseParams(
      'uploadTrackFiles',
      createUploadTrackFilesSchema()
    )(params)

    // Transform metadata
    this.logger.info('Transforming metadata')
    const metadata = this.trackUploadHelper.transformTrackUploadMetadata(
      parsedMetadata,
      userId
    )

    // Upload track audio and cover art to storage node
    this.logger.info('Uploading track audio and cover art')
    const [coverArtResponse, audioResponse] = await Promise.all([
      coverArtFile
        ? retry3(
            async () =>
              await this.storage.uploadFile({
                file: coverArtFile,
                onProgress,
                template: 'img_square'
              }),
            (e) => {
              this.logger.info('Retrying uploadTrackCoverArt', e)
            }
          )
        : Promise.resolve(undefined),
      retry3(
        async () =>
          await this.storage.uploadFile({
            file: trackFile,
            onProgress,
            template: 'audio',
            options:
              this.trackUploadHelper.extractMediorumUploadOptions(metadata)
          }),
        (e) => {
          this.logger.info('Retrying uploadTrackAudio', e)
        }
      )
    ])

    // Update metadata to include uploaded CIDs
    return this.trackUploadHelper.populateTrackMetadataWithUploadResponse(
      metadata,
      audioResponse,
      coverArtResponse
    )
  }

  /** @hidden
   * Write track upload to chain
   */
  async writeTrackToChain(
    userId: string,
    metadata: ReturnType<
      typeof this.trackUploadHelper.populateTrackMetadataWithUploadResponse
    >,
    advancedOptions?: AdvancedOptions
  ) {
    // Write metadata to chain
    this.logger.info('Writing metadata to chain')

    const entityId =
      metadata.trackId || (await this.trackUploadHelper.generateId('track'))

    const decodedUserId = decodeHashId(userId) ?? undefined

    if (!decodedUserId) {
      throw new Error('writeTrackToChain: userId could not be decoded')
    }

    const response = await this.entityManager.manageEntity({
      userId: decodedUserId,
      entityType: EntityType.TRACK,
      entityId,
      action: Action.CREATE,
      metadata: JSON.stringify({
        cid: '',
        data: {
          ...snakecaseKeys(metadata),
          download_conditions:
            metadata.downloadConditions &&
            snakecaseKeys(metadata.downloadConditions),
          stream_conditions:
            metadata.streamConditions &&
            snakecaseKeys(metadata.streamConditions),
          stem_of: metadata.stemOf && snakecaseKeys(metadata.stemOf)
        }
      }),
      ...advancedOptions
    })

    this.logger.info('Successfully uploaded track')
    return {
      ...response,
      trackId: encodeHashId(entityId)!
    }
  }

  /** @hidden
   * Upload a track
   */
  async uploadTrack(
    params: UploadTrackRequest,
    advancedOptions?: AdvancedOptions
  ) {
    // Validate inputs
    await parseParams('uploadTrack', createUploadTrackSchema())(params)

    // Upload track files
    const metadata = await this.uploadTrackFiles(
      params as UploadTrackFilesRequest
    )

    // Write track metadata to chain
    return this.writeTrackToChain(params.userId, metadata, advancedOptions)
  }

  /** @hidden
   * Update a track
   */
  async updateTrack(
    params: UpdateTrackRequest,
    advancedOptions?: AdvancedOptions
  ) {
    // Parse inputs
    const {
      userId,
      trackId,
      coverArtFile,
      metadata: parsedMetadata,
      onProgress,
      transcodePreview
    } = await parseParams('updateTrack', createUpdateTrackSchema())(params)

    // Transform metadata
    const metadata = this.trackUploadHelper.transformTrackUploadMetadata(
      parsedMetadata,
      userId
    )

    // Upload track cover art to storage node
    const coverArtResp =
      coverArtFile &&
      (await retry3(
        async () =>
          await this.storage.uploadFile({
            file: coverArtFile,
            onProgress,
            template: 'img_square'
          }),
        (e) => {
          this.logger.info('Retrying uploadTrackCoverArt', e)
        }
      ))

    // Update metadata to include uploaded CIDs
    const updatedMetadata = {
      ...metadata,
      ...(coverArtResp ? { coverArtSizes: coverArtResp.id } : {})
    }

    if (transcodePreview) {
      if (updatedMetadata.previewStartSeconds === undefined) {
        throw new Error('No track preview start time specified')
      }
      if (!updatedMetadata.audioUploadId) {
        throw new Error('Missing required audio_upload_id')
      }

      // Transocde track preview
      const editFileData = {
        previewStartSeconds: updatedMetadata.previewStartSeconds!.toString()
      }
      const updatePreviewResp = await retry3(
        async () =>
          await this.storage.editFile({
            uploadId: updatedMetadata.audioUploadId!,
            data: editFileData
          }),
        (e) => {
          this.logger.info('Retrying editFileV2', e)
        }
      )

      // Update metadata to include updated preview CID
      const previewKey = `320_preview|${updatedMetadata.previewStartSeconds}`
      updatedMetadata.previewCid = updatePreviewResp.results[previewKey]
    }

    // Write metadata to chain
    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.TRACK,
      entityId: trackId,
      action: Action.UPDATE,
      metadata: JSON.stringify({
        cid: '',
        data: {
          ...snakecaseKeys(updatedMetadata),
          download_conditions:
            updatedMetadata.downloadConditions &&
            snakecaseKeys(updatedMetadata.downloadConditions),
          stream_conditions:
            updatedMetadata.streamConditions &&
            snakecaseKeys(updatedMetadata.streamConditions),
          stem_of: metadata.stemOf && snakecaseKeys(metadata.stemOf)
        }
      }),
      ...advancedOptions
    })
  }

  /** @hidden
   * Delete a track
   */
  async deleteTrack(
    params: DeleteTrackRequest,
    advancedOptions?: AdvancedOptions
  ) {
    // Parse inputs
    const { userId, trackId } = await parseParams(
      'deleteTrack',
      DeleteTrackSchema
    )(params)

    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.TRACK,
      entityId: trackId,
      action: Action.DELETE,
      ...advancedOptions
    })
  }

  /** @hidden
   * Favorite a track
   */
  async favoriteTrack(
    params: FavoriteTrackRequest,
    advancedOptions?: AdvancedOptions
  ) {
    // Parse inputs
    const { userId, trackId, metadata } = await parseParams(
      'favoriteTrack',
      FavoriteTrackSchema
    )(params)

    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.TRACK,
      entityId: trackId,
      action: Action.SAVE,
      metadata: metadata && JSON.stringify(snakecaseKeys(metadata)),
      ...advancedOptions
    })
  }

  /** @hidden
   * Unfavorite a track
   */
  async unfavoriteTrack(
    params: UnfavoriteTrackRequest,
    advancedOptions?: AdvancedOptions
  ) {
    // Parse inputs
    const { userId, trackId } = await parseParams(
      'unfavoriteTrack',
      UnfavoriteTrackSchema
    )(params)

    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.TRACK,
      entityId: trackId,
      action: Action.UNSAVE,
      ...advancedOptions
    })
  }

  /** @hidden
   * Repost a track
   */
  async repostTrack(
    params: RepostTrackRequest,
    advancedOptions?: AdvancedOptions
  ) {
    // Parse inputs
    const { userId, trackId, metadata } = await parseParams(
      'respostTrack',
      RepostTrackSchema
    )(params)

    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.TRACK,
      entityId: trackId,
      action: Action.REPOST,
      metadata: metadata && JSON.stringify(snakecaseKeys(metadata)),
      ...advancedOptions
    })
  }

  /** @hidden
   * Unrepost a track
   */
  async unrepostTrack(
    params: UnrepostTrackRequest,
    advancedOptions?: AdvancedOptions
  ) {
    // Parse inputs
    const { userId, trackId } = await parseParams(
      'unrepostTrack',
      UnrepostTrackSchema
    )(params)

    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.TRACK,
      entityId: trackId,
      action: Action.UNREPOST,
      ...advancedOptions
    })
  }

  /**
   * @hidden
   *
   * Records that a track was downloaded.
   */
  public async recordTrackDownload(
    params: RecordTrackDownloadRequest,
    advancedOptions?: AdvancedOptions
  ) {
    const { userId, trackId } = await parseParams(
      'downloadTrack',
      RecordTrackDownloadSchema
    )(params)
    const location = await getLocation({ logger: this.logger })
    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.TRACK,
      entityId: trackId,
      action: Action.DOWNLOAD,
      metadata: location
        ? JSON.stringify({
            cid: '',
            data: {
              city: location.city,
              region: location.region,
              country: location.country
            }
          })
        : undefined,
      ...advancedOptions
    })
  }

  /**
   * Gets the Solana instructions that purchase the track
   *
   * @hidden
   */
  public async getPurchaseTrackInstructions(
    params: GetPurchaseTrackInstructionsRequest
  ) {
    const {
      userId,
      trackId,
      price: priceNumber,
      extraAmount: extraAmountNumber = 0
    } = await parseParams(
      'getPurchaseTrackInstructions',
      GetPurchaseTrackInstructionsSchema
    )(params)

    const contentType = 'track'
    const mint = 'USDC'

    // Fetch track
    this.logger.debug('Fetching track purchase info...', { trackId })
    const { data: track } = await this.getTrackAccessInfo({
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

    if (track.userId === params.userId) {
      throw new Error('Attempted to purchase own track.')
    }

    let numberSplits: ExtendedPaymentSplit[] = []
    let centPrice: number
    let accessType: 'stream' | 'download' = 'stream'

    // Get conditions
    if (
      track.streamConditions &&
      instanceOfExtendedPurchaseGate(track.streamConditions)
    ) {
      centPrice = track.streamConditions.usdcPurchase.price
      numberSplits = track.streamConditions.usdcPurchase.splits
    } else if (
      track.downloadConditions &&
      instanceOfExtendedPurchaseGate(track.downloadConditions)
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

    // Check if price changed
    if (USDC(priceNumber).value < USDC(centPrice / 100).value) {
      throw new Error('Track price increased.')
    }

    const extraAmount = USDC(extraAmountNumber).value
    const total = USDC(centPrice / 100.0).value + extraAmount
    this.logger.debug('Purchase total:', total)

    const splits = await prepareSplits({
      splits: numberSplits,
      extraAmount,
      claimableTokensClient: this.claimableTokensClient,
      logger: this.logger
    })
    this.logger.debug('Calculated splits:', splits)

    const routeInstruction =
      await this.paymentRouterClient.createRouteInstruction({
        splits,
        total,
        mint
      })
    const memoInstruction =
      await this.paymentRouterClient.createPurchaseMemoInstruction({
        contentId: trackId,
        contentType,
        blockNumber: track.blocknumber,
        buyerUserId: userId,
        accessType
      })

    let locationMemoInstruction
    try {
      locationMemoInstruction = await this.solanaRelay.getLocationInstruction()
    } catch (e) {
      this.logger.warn('Unable to compute location memo instruction')
    }

    return {
      instructions: {
        routeInstruction,
        memoInstruction,
        locationMemoInstruction
      },
      total
    }
  }

  /**
   * Purchases stream or download access to a track
   *
   * @hidden
   */
  public async purchaseTrack(params: PurchaseTrackRequest) {
    const { wallet } = await parseParams(
      'purchaseTrack',
      PurchaseTrackSchema
    )(params)

    const {
      // only send the base params to getPurchaseInstructions
      wallet: ignoredWallet,
      walletAdapter: ignoredWalletAdapter,
      ...baseParams
    } = params
    const {
      instructions: {
        routeInstruction,
        memoInstruction,
        locationMemoInstruction
      },
      total
    } = await this.getPurchaseTrackInstructions(baseParams)

    let transaction
    const mint = 'USDC'

    if (wallet) {
      this.logger.debug('Using provided wallet to purchase...', {
        wallet: wallet.toBase58()
      })
      // Use the specified Solana wallet
      const transferInstruction =
        await this.paymentRouterClient.createTransferInstruction({
          sourceWallet: wallet,
          total,
          mint
        })
      transaction = await this.solanaClient.buildTransaction({
        feePayer: wallet,
        instructions: [
          transferInstruction,
          routeInstruction,
          memoInstruction,
          locationMemoInstruction
        ].filter(Boolean) as TransactionInstruction[]
      })
    } else {
      // Use the authed wallet's userbank and relay
      this.logger.debug(
        `Using userBank ${await this.claimableTokensClient.deriveUserBank({
          mint: 'USDC'
        })} to purchase...`
      )
      const paymentRouterTokenAccount =
        await this.paymentRouterClient.getOrCreateProgramTokenAccount({
          mint
        })

      const transferSecpInstruction =
        await this.claimableTokensClient.createTransferSecpInstruction({
          destination: paymentRouterTokenAccount.address,
          mint,
          amount: total
        })
      const transferInstruction =
        await this.claimableTokensClient.createTransferInstruction({
          destination: paymentRouterTokenAccount.address,
          mint
        })

      transaction = await this.solanaClient.buildTransaction({
        feePayer: wallet,
        instructions: [
          transferSecpInstruction,
          transferInstruction,
          routeInstruction,
          memoInstruction,
          locationMemoInstruction
        ].filter(Boolean) as TransactionInstruction[]
      })
    }

    if (params.walletAdapter) {
      if (!params.walletAdapter.publicKey) {
        throw new Error(
          'Param walletAdapter was specified, but no wallet selected'
        )
      }
      return await params.walletAdapter.sendTransaction(
        transaction,
        this.solanaClient.connection
      )
    }
    return this.solanaClient.sendTransaction(transaction)
  }

  /**
   * Generates a new track ID
   *
   * @hidden
   */
  async generateTrackId() {
    return this.trackUploadHelper.generateId('track')
  }
}
