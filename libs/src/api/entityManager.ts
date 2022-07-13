import { Base, BaseConstructorArgs, Services } from './base'

export enum Action {
  CREATE = 'Create',
  UPDATE = 'Update',
  DELETE = 'Delete'
}

export enum EntityType {
  PLAYLIST = 'Playlist'
}

/*
  API surface for updated data contract interactions.
  Provides simplified entity management in a generic fashion
  Handles metadata + file upload etc. for entities such as Playlist/Track/User
*/
export class EntityManager extends Base {
  constructor(...args: BaseConstructorArgs) {
    super(...args)
    this.getValidPlaylistId = this.getValidPlaylistId.bind(this)
    this.createPlaylist = this.createPlaylist.bind(this)
    this.deletePlaylist = this.deletePlaylist.bind(this)
  }

  /**
   * Calculate an unoccupied playlist ID
   * Maximum value is postgres integer max (2147483647)
   * Minimum value is artificially set to 400000
   */
  async getValidPlaylistId(): Promise<number> {
    let playlistId: number = 10
    let validIdFound: boolean = false
    while (!validIdFound) {
      const resp = await this.discoveryProvider.getPlaylists(1, 0, [playlistId])
      if (resp.length !== 0) {
        // TODO: Playlist ID Min offset
        playlistId = Math.floor(Math.random() * 2147483647)
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
    playlistName: string
    trackIds: number[]
    description: string
    isAlbum: boolean
    isPrivate: boolean
    coverArt: string
    logger: Console
  }): Promise<{ blockHash: string; blockNumber: number; playlistId: number }> {
    try {
      const ownerId: number = parseInt(this.userStateManager.getCurrentUserId())
      const createAction = Action.CREATE
      const entityType = EntityType.PLAYLIST
      const entityId = await this.getValidPlaylistId()
      this.REQUIRES(Services.CREATOR_NODE)
      const updatedPlaylistImage = await this.creatorNode.uploadImage(
        coverArt,
        true // square
      )
      const dirCID = updatedPlaylistImage.dirCID
      const metadata = {
        createAction,
        entity_type: entityType,
        playlist_id: entityId,
        playlist_contents: trackIds,
        playlist_name: playlistName,
        playlist_image_sizes_multihash: dirCID,
        description,
        is_album: isAlbum,
        is_private: isPrivate
      }
      const { metadataMultihash } =
        await this.creatorNode.uploadPlaylistMetadata(metadata)
      const resp = await this.manageEntity({
        userId: ownerId,
        entityType,
        entityId,
        action: createAction,
        metadataMultihash
      })
      logger.info(`CreatePlaylistData - ${JSON.stringify(resp)}`)
      const txReceipt = resp.txReceipt
      return {
        blockHash: txReceipt.blockHash,
        blockNumber: txReceipt.blockNumber,
        playlistId: entityId
      }
    } catch (e) {
      logger.error(`Data create playlist: err ${e}`)
      throw e
    }
  }

  /**
   * Delete a playlist using updated data contracts flow
   */
  async deletePlaylist({
    playlistId,
    userId,
    logger = console
  }: {
    playlistId: number
    userId: number
    logger: any
  }): Promise<{ blockHash: any; blockNumber: any }> {
    try {
      const resp = await this.manageEntity({
        userId,
        entityType: 'Playlist',
        entityId: playlistId,
        action: 'Delete',
        metadataMultihash: ''
      })
      logger.info(`DeletePlaylistData - ${JSON.stringify(resp)}`)
      const txReceipt = resp.txReceipt
      return {
        blockHash: txReceipt.blockHash,
        blockNumber: txReceipt.blockNumber
      }
    } catch (e) {
      logger.error(`Data delete playlist: err ${e}`)
      throw e
    }
  }
  /**
   * Update a playlist using updated data contracts flow
   **/
  async updatePlaylist({
    playlistId,
    playlistName,
    trackIds,
    description,
    isAlbum,
    isPrivate,
    coverArt,
    logger = console
  }: {
    playlistId: number
    playlistName: string
    trackIds: number[]
    description: string
    isAlbum: boolean
    isPrivate: boolean
    coverArt: string
    logger: Console
  }): Promise<{ blockHash: string; blockNumber: number; playlistId: number }> {
    try {
      const userId: number = parseInt(this.userStateManager.getCurrentUserId())
      const updateAction = Action.UPDATE
      const entityType = 'Playlist'
      this.REQUIRES(Services.CREATOR_NODE)
      let dirCID;
      if (coverArt) {
        const updatedPlaylistImage = await this.creatorNode.uploadImage(
          coverArt,
          true // square
        )
        dirCID = updatedPlaylistImage.dirCID
      }

      const playlist = (await this.discoveryProvider.getPlaylists(1, 0, [playlistId]))[0]

      const metadata = {
        action: updateAction, // why include action here?
        entityType,
        playlist_id: playlistId,
        playlist_contents: trackIds || playlist.playlist_contents,
        playlist_name: playlistName || playlist.playlist_name,
        playlist_image_sizes_multihash: dirCID || playlist.playlist_image_sizes_multihash,
        description: description || playlist.description,
        is_album: isAlbum || playlist.is_album,
        is_private: isPrivate || playlist.is_private
      }
      const { metadataMultihash } = await this.creatorNode.uploadPlaylistMetadata(metadata)

      const resp = await this.manageEntity({
        userId,
        entityType,
        entityId: playlistId,
        action: updateAction,
        metadataMultihash
      })
      const txReceipt = resp.txReceipt
      return {
        blockHash: txReceipt.blockHash,
        blockNumber: txReceipt.blockNumber,
        playlistId
      }
    } catch (e) {
      logger.error(`Data update playlist: err ${e}`)
      throw e
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
    userId: number
    entityType: EntityType
    entityId: number
    action: Action
    metadataMultihash: string
  }): Promise<{ txReceipt: {blockHash: string, blockNumber: number}; error: any }> {
    let error: string = ''
    let resp: any
    try {
      resp = await this.contracts.EntityManagerClient.manageEntity(
        userId,
        entityType,
        entityId,
        action,
        metadataMultihash
      )
    } catch (e) {
      error = (e as Error).message
      console.log(error)
    }
    return { txReceipt: resp.txReceipt, error }
  }
}
