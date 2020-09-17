const createPlaylist = async (
  libs,
  userId,
  playlistName,
  isPrivate,
  isAlbum,
  trackIds
) => {
  const createPlaylistTxReceipt = await libs.createPlaylist(
    userId,
    playlistName,
    isPrivate,
    isAlbum,
    trackIds
  )
  return createPlaylistTxReceipt
}

const updatePlaylistCoverPhoto = async (
  libs,
  playlistId,
  updatedPlaylistImageMultihashDigest
) => {
  const updatePlaylistCoverPhotoTxReceipt = await libs.updatePlaylistCoverPhoto(
    playlistId,
    updatedPlaylistImageMultihashDigest
  )
  return updatePlaylistCoverPhotoTxReceipt
}

const getPlaylists = async (
  libs,
  limit = 100,
  offset = 0,
  idsArray = null,
  targetUserId = null,
  withUsers = false
) => {
  return libs.getPlaylists(limit, offset, idsArray, targetUserId, withUsers)
}

module.exports = {
  createPlaylist,
  updatePlaylistCoverPhoto,
  getPlaylists
}
