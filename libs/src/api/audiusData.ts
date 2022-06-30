import { Base, Services } from './base'

export class AudiusData extends Base {
  constructor(...args: any[]) {
    super(...args)
    // this.submitReaction = this.submitReaction.bind(this)
  }

    /**
   * Calculate an unoccupied playlist ID
   * Maximum value is UINT MAX
   */
    async getValidPlaylistId (): Promise<number> {
        let playlistId: number = 10
        let validIdFound: boolean = false
        while (!validIdFound) {
          const resp = await this.discoveryProvider.getPlaylists(1, 0, [playlistId])
          if (resp.length !== 0) {
            playlistId = Math.floor(
              Math.random() * 9007199254740991
            )
          } else {
            validIdFound = true
          }
        }
        console.log(`Playlist2 | Returning playlistID=${playlistId}`)
        return playlistId
    }

  /**
   * Create a playlist using updated data contracts flow
   */
    async createPlaylist({
        playlistName,
        trackIds,
        description,
        isAlbum,
        coverArt,
        logger = console
    }: {
        playlistName: string,
        trackIds: number[],
        description: string,
        isAlbum: boolean,
        coverArt: any,
        logger: any
    }): Promise<void> {
        try {
            const ownerId: number = this.userStateManager.getCurrentUserId()
            const action = 'Create'
            const entityType = 'Playlist'
            const entityId = await this.getValidPlaylistId()
            logger.info(`CreatePlaylistData: user=${ownerId}, ${action}, ${entityType} ${playlistName}, album=${isAlbum}, ids=${trackIds}, description=${description} playlistId=${entityId}, coverArt=${coverArt}`)
            this.REQUIRES(Services.CREATOR_NODE)
            const updatedPlaylistImage = await this.creatorNode.uploadImage(
              coverArt,
              true // square
            )
            const dirCID = updatedPlaylistImage.dirCID
            logger.info(`CreatePlaylistData - ${dirCID}`)
            const metadata = {
              action,
              entity_type: entityType,
              playlist_id: entityId,
              playlist_contents: trackIds,
              playlist_name: playlistName,
              playlist_image_sizes_multihash: dirCID,
              description,
              isAlbum
            }
            const { metadataMultihash, metadataFileUUID } = await this.creatorNode.uploadPlaylistMetadata(metadata)
            logger.info(`CreatePlaylistData - metadata: ${metadataMultihash} - ${metadataFileUUID}`)
            let resp = await this.manageEntity({
              userId: ownerId,
              entityType,
              entityId,
              action,
              metadataMultihash
            })
            logger.info(`CreatePlaylistData - ${JSON.stringify(resp)}`)
        } catch(e) {
            logger.error(`Data create playlist: err ${e}`)
        }
    }

  /**
   * Manage an entity with the updated data contract flow
   * Leveraged to manipulate User/Track/Playlist/+ other entities
   */
    async manageEntity({
      userId,
      entityType,
      entityId,
      action,
      metadataMultihash
    }: {
      userId: number,
      entityType: string,
      entityId: number,
      action: string,
      metadataMultihash: string
    }): Promise<{ txReceipt: {}, error: any}> {
      let error:string = ""
      let resp
      try {
        resp = await this.contracts.AudiusDataClient.manageEntity(
          userId,
          entityType,
          entityId,
          action,
          metadataMultihash
        )
      } catch(e) {
        error = (e as Error).message
      }
      return { txReceipt: resp.txReceipt, error}
    }
}
