import { Base, Services } from './base'

export class AudiusData extends Base {
  constructor(...args: any[]) {
    super(...args)
    this.getValidPlaylistId = this.getValidPlaylistId.bind(this)
    this.createPlaylist = this.createPlaylist.bind(this)
  }

    /**
   * Calculate an unoccupied playlist ID
   * Maximum value is postgres integer max (2147483647)
   */
    async getValidPlaylistId (): Promise<number> {
        let playlistId: number = 10
        let validIdFound: boolean = false
        while (!validIdFound) {
          const resp = await this.discoveryProvider.getPlaylists(1, 0, [playlistId])
          if (resp.length !== 0) {
            // TODO: Playlist ID Min offset
            playlistId = Math.floor(
              Math.random() * 2147483647
            )
          } else {
            validIdFound = true
          }
        }
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
        isPrivate,
        coverArt,
        logger = console
    }: {
        playlistName: string,
        trackIds: number[],
        description: string,
        isAlbum: boolean,
        isPrivate: boolean,
        coverArt: any,
        logger: any
    }): Promise<{ blockHash: any; blockNumber: any; playlistId: number; }> {
      let respValues = {
        blockHash: null,
        blockNumber: null,
        playlistId: 0
      }
        try {
            const ownerId: number = this.userStateManager.getCurrentUserId()
            const action = 'Create'
            const entityType = 'Playlist'
            const entityId = await this.getValidPlaylistId()
            this.REQUIRES(Services.CREATOR_NODE)
            const updatedPlaylistImage = await this.creatorNode.uploadImage(
              coverArt,
              true // square
            )
            const dirCID = updatedPlaylistImage.dirCID
            const metadata = {
              action,
              entity_type: entityType,
              playlist_id: entityId,
              playlist_contents: trackIds,
              playlist_name: playlistName,
              playlist_image_sizes_multihash: dirCID,
              description,
              is_album : isAlbum,
              is_private: isPrivate
            }
            const { metadataMultihash } = await this.creatorNode.uploadPlaylistMetadata(metadata)
            let resp = await this.manageEntity({
              userId: ownerId,
              entityType,
              entityId,
              action,
              metadataMultihash
            })
            logger.info(`CreatePlaylistData - ${JSON.stringify(resp)}`)
            let txReceipt = resp.txReceipt
            respValues = {
              blockHash: txReceipt.blockHash,
              blockNumber: txReceipt.blockNumber,
              playlistId: entityId
            }
        } catch(e) {
            logger.error(`Data create playlist: err ${e}`)
        }
        return respValues
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
