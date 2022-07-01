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
        coverArt,
        logger = console
    }: {
        playlistName: string,
        trackIds: number[],
        description: string,
        isAlbum: boolean,
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
              isAlbum
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
  /*
CreatePlaylistData - {"txReceipt":{"transactionHash":"0x1dd301853668949e86ae658d9f610d2ff89c5112f95f7cfdc1e12ab4c3b74f88","transactionIndex":0,"blockHash":"0xde69399a9aa538a22f8dcf8914b006420b362418b67b386bdaf4389da309361f","blockNumber":1160,"from":"0xbe718f98a5b5a473186eb6e30888f26e72be0b66","to":"0xaf5c4c6c7920b4883bc6252e9d9b8fe27187cf68","gasUsed":62800,"cumulativeGasUsed":62800,"contractAddress":null,"logs":[{"logIndex":0,"transactionIndex":0,"transactionHash":"0x1dd301853668949e86ae658d9f610d2ff89c5112f95f7cfdc1e12ab4c3b74f88","blockHash":"0xde69399a9aa538a22f8dcf8914b006420b362418b67b386bdaf4389da309361f","blockNumber":1160,"address":"0xaf5C4C6C7920B4883bC6252e9d9B8fE27187Cf68","data":"0x0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000356b69c97a589947f8aa4fda6a774007d76aff2500000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000004b079460000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001600000000000000000000000000000000000000000000000000000000000000008506c61796c697374000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002e516d5743766274784a43753550787358433334626f65573965324341543542657a7472413252487667356164563600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000064372656174650000000000000000000000000000000000000000000000000000","topics":["0x772d62d21cc8467a14127f11ab2c094d32e5b521433cefba5a7312fc464d88b4"],"type":"mined","id":"log_9b1b81dc"}],"status":true,"logsBloom":"0x00000000000000000000000000000000000000000000000000000000000000001000000000000000000000000200000000000000000000000008000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000","events":{"ManageEntity":{"returnValues":{"_userId":"1","_signer":"0x356b69c97a589947f8aa4fda6a774007d76aff25","_entityType":"Playlist","_entityId":"1258787936","_metadata":"QmWCvbtxJCu5PxsXC34boeW9e2CAT5BeztrA2RHvg5adV6","_action":"Create"}}}},"error":""}
  */

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
