import { Base, BaseConstructorArgs, Services } from './base'
export class Playlists extends Base {
  constructor(...args: BaseConstructorArgs) {
    super(...args)
    this.getPlaylists = this.getPlaylists.bind(this)
    this.getLibraryPlaylists = this.getLibraryPlaylists.bind(this)
    this.getLibraryAlbums = this.getLibraryAlbums.bind(this)
  }
  /* ------- GETTERS ------- */

  /**
   * get full playlist objects, including tracks, for passed in array of playlistId
   * @param limit max # of items to return
   * @param offset offset into list to return from (for pagination)
   * @param idsArray list of playlist ids
   * @param targetUserId the user whose playlists we're trying to get
   * @param withUsers whether to return users nested within the collection objects
   * @returns array of playlist objects
   * additional metadata fields on playlist objects:
   *  {Integer} repost_count - repost count for given playlist
   *  {Integer} save_count - save count for given playlist
   *  {Boolean} has_current_user_reposted - has current user reposted given playlist
   *  {Array} followee_reposts - followees of current user that have reposted given playlist
   *  {Boolean} has_current_user_reposted - has current user reposted given playlist
   *  {Boolean} has_current_user_saved - has current user saved given playlist
   */
  async getPlaylists(
    limit = 100,
    offset = 0,
    idsArray = null,
    targetUserId = null,
    withUsers = false
  ) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return await this.discoveryProvider.getPlaylists(
      limit,
      offset,
      idsArray,
      targetUserId,
      withUsers
    )
  }

  /**
   * Return saved playlists for current user
   * NOTE in returned JSON, SaveType string one of track, playlist, album
   * @param limit - max # of items to return
   * @param offset - offset into list to return from (for pagination)
   */
  async getLibraryPlaylists(limit = 100, offset = 0, withUsers = false) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return await this.discoveryProvider.getLibraryPlaylists(
      limit,
      offset,
      withUsers
    )
  }

  /**
   * Return saved albums for current user
   * NOTE in returned JSON, SaveType string one of track, playlist, album
   * @param limit - max # of items to return
   * @param offset - offset into list to return from (for pagination)
   */
  async getLibraryAlbums(limit = 100, offset = 0, withUsers = false) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return await this.discoveryProvider.getLibraryAlbums(
      limit,
      offset,
      withUsers
    )
  }
}
