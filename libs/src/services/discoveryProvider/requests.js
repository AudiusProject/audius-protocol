module.exports.getUsers = (limit = 100, offset = 0, idsArray = null, walletAddress = null, handle = null, isCreator = null, minBlockNumber = null) => {
  let req = {
    endpoint: 'users',
    queryParams: { limit: limit, offset: offset }
  }
  if (isCreator !== null) {
    req.queryParams.is_creator = isCreator
  }
  if (handle) {
    req.queryParams.handle = handle
  }
  if (walletAddress) {
    req.queryParams.wallet = walletAddress
  }
  if (minBlockNumber) {
    req.queryParams.min_block_number = minBlockNumber
  }
  if (idsArray != null) {
    if (!Array.isArray(idsArray)) {
      throw new Error('Expected integer array of user ids')
    }
    req.queryParams.id = idsArray
  }
  return req
}

module.exports.getTracks = (limit = 100, offset = 0, idsArray = null, targetUserId = null, sort = null, minBlockNumber = null, filterDeleted = null, withUsers = false) => {
  let req = { endpoint: 'tracks', queryParams: { limit: limit, offset: offset } }
  if (idsArray) {
    if (!Array.isArray(idsArray)) {
      throw new Error('Expected array of track ids')
    }
    req.queryParams.id = idsArray
  }
  if (minBlockNumber) {
    req.queryParams.min_block_number = minBlockNumber
  }
  if (targetUserId) {
    req.queryParams.user_id = targetUserId
  }
  if (sort) {
    req.queryParams.sort = sort
  }
  if (typeof filterDeleted === 'boolean') {
    req.queryParams.filter_deleted = filterDeleted
  }
  if (withUsers) {
    req.queryParams.with_users = true
  }
  return req
}

module.exports.getTracksByHandleAndSlug = (handle, slug) => {
  return {
    endpoint: 'tracks',
    method: 'get',
    queryParams: { handle, slug }
  }
}

module.exports.getTracksIncludingUnlisted = (identifiers, withUsers = false) => {
  let req = {
    endpoint: 'tracks_including_unlisted',
    method: 'post',
    data: {
      tracks: identifiers
    },
    queryParams: {}
  }
  if (withUsers) {
    req.queryParams.with_users = true
  }
  return req
}

module.exports.getRandomTracks = (genre, limit, exclusionList, time) => {
  let req = {
    endpoint: 'tracks/random',
    queryParams: {
      genre,
      limit,
      exclusionList,
      time
    }
  }
  return req
}

module.exports.getStemsForTrack = (trackId) => {
  const req = {
    endpoint: `stems/${trackId}`,
    queryParams: {
      with_users: true
    }
  }
  return req
}

module.exports.getRemixesOfTrack = (trackId, limit = null, offset = null) => {
  const req = {
    endpoint: `remixes/${trackId}/children`,
    queryParams: {
      with_users: true,
      limit,
      offset
    }
  }
  return req
}

module.exports.getRemixTrackParents = (trackId, limit = null, offset = null) => {
  const req = {
    endpoint: `remixes/${trackId}/parents`,
    queryParams: {
      with_users: true,
      limit,
      offset
    }
  }
  return req
}

module.exports.getTrendingTracks = (genre = null, timeFrame = null, idsArray = null, limit = null, offset = null, withUsers = false) => {
  let endpoint = '/trending/'

  if (timeFrame != null) {
    switch (timeFrame) {
      case 'day':
      case 'week':
      case 'month':
      case 'year':
        break
      default:
        throw new Error('Invalid timeFrame value provided')
    }
    endpoint += timeFrame
  }

  const req = {
    endpoint,
    method: 'get',
    queryParams: {
      ...(idsArray !== null ? { id: idsArray } : {}),
      ...(limit !== null ? { limit } : {}),
      ...(offset !== null ? { offset } : {}),
      ...(genre !== null ? { genre } : {}),
      ...(withUsers ? { with_users: withUsers } : {})
    }
  }
  return req
}

module.exports.getPlaylists = (limit = 100, offset = 0, idsArray = null, targetUserId = null, withUsers = false) => {
  if (idsArray != null) {
    if (!Array.isArray(idsArray)) {
      throw new Error('Expected integer array of user ids')
    }
  }
  return {
    endpoint: 'playlists',
    queryParams: {
      limit,
      offset,
      ...(idsArray != null ? { playlist_id: idsArray } : {}),
      ...(targetUserId ? { user_id: targetUserId } : {}),
      ...(withUsers ? { with_users: true } : {})
    }
  }
}

module.exports.getSocialFeed = (filter, limit = 100, offset = 0, withUsers = false, tracksOnly = false) => {
  return {
    endpoint: 'feed',
    queryParams: {
      filter,
      limit,
      offset,
      with_users: withUsers,
      tracks_only: tracksOnly
    }
  }
}

module.exports.getUserRepostFeed = (userId, limit = 100, offset = 0, withUsers = false) => {
  return {
    endpoint: 'feed',
    urlParams: '/reposts/' + userId,
    queryParams: { limit, offset, with_users: withUsers }
  }
}

module.exports.getFollowIntersectionUsers = (limit = 100, offset = 0, followeeUserId, followerUserId) => {
  return {
    endpoint: 'users',
    urlParams: '/intersection/follow/' + followeeUserId + '/' + followerUserId,
    queryParams: { limit, offset }
  }
}

module.exports.getTrackRepostIntersectionUsers = (limit = 100, offset = 0, repostTrackId, followerUserId) => {
  return {
    endpoint: 'users',
    urlParams: '/intersection/repost/track/' + repostTrackId + '/' + followerUserId,
    queryParams: { limit: limit, offset: offset }
  }
}

module.exports.getPlaylistRepostIntersectionUsers = (limit = 100, offset = 0, repostPlaylistId, followerUserId) => {
  return {
    endpoint: 'users',
    urlParams: '/intersection/repost/playlist/' + repostPlaylistId + '/' + followerUserId,
    queryParams: { limit: limit, offset: offset }
  }
}

module.exports.getFollowersForUser = (limit = 100, offset = 0, followeeUserId) => {
  return {
    endpoint: 'users',
    urlParams: '/followers/' + followeeUserId,
    queryParams: { limit: limit, offset: offset }
  }
}

module.exports.getFolloweesForUser = (limit = 100, offset = 0, followerUserId) => {
  return {
    endpoint: 'users',
    urlParams: '/followees/' + followerUserId,
    queryParams: { limit: limit, offset: offset }
  }
}

module.exports.getRepostersForTrack = (limit = 100, offset = 0, repostTrackId) => {
  return {
    endpoint: 'users',
    urlParams: '/reposts/track/' + repostTrackId,
    queryParams: { limit: limit, offset: offset }
  }
}

module.exports.getRepostersForPlaylist = (limit = 100, offset = 0, repostPlaylistId) => {
  return {
    endpoint: 'users',
    urlParams: '/reposts/playlist/' + repostPlaylistId,
    queryParams: { limit: limit, offset: offset }
  }
}

module.exports.getSaversForTrack = (limit = 100, offset = 0, saveTrackId) => {
  return {
    endpoint: 'users',
    urlParams: '/saves/track/' + saveTrackId,
    queryParams: { limit: limit, offset: offset }
  }
}

module.exports.getSaversForPlaylist = (limit = 100, offset = 0, savePlaylistId) => {
  return {
    endpoint: 'users',
    urlParams: '/saves/playlist/' + savePlaylistId,
    queryParams: { limit: limit, offset: offset }
  }
}

module.exports.searchFull = (text, kind, limit = 100, offset = 0) => {
  return {
    endpoint: 'search/full',
    queryParams: { query: text, kind, limit, offset }
  }
}

module.exports.searchAutocomplete = (text, limit = 100, offset = 0) => {
  return {
    endpoint: 'search/autocomplete',
    queryParams: { query: text, limit: limit, offset: offset }
  }
}

module.exports.searchTags = (text, user_tag_count = 2, kind = 'all', limit = 100, offset = 0) => {
  return {
    endpoint: 'search/tags',
    queryParams: { query: text, user_tag_count, kind, limit, offset }
  }
}

module.exports.getSavedPlaylists = (limit = 100, offset = 0, withUsers = false) => {
  return {
    endpoint: 'saves/playlists',
    queryParams: { limit: limit, offset: offset, with_users: withUsers }
  }
}

module.exports.getSavedAlbums = (limit = 100, offset = 0, withUsers = false) => {
  return {
    endpoint: 'saves/albums',
    queryParams: { limit: limit, offset: offset, with_users: withUsers }
  }
}

module.exports.getSavedTracks = (limit = 100, offset = 0, withUsers = false) => {
  return {
    endpoint: 'saves/tracks',
    queryParams: { limit: limit, offset: offset, with_users: withUsers }
  }
}

/**
 * Return user collections (saved & uploaded) along w/ users for those collections
 */
module.exports.getUserAccount = (wallet) => {
  if (wallet === undefined) {
    throw new Error('Expected wallet to get user account')
  }
  return {
    endpoint: 'users/account',
    queryParams: { wallet }
  }
}

module.exports.getTopPlaylists = (type, limit, mood, filter, withUsers = false) => {
  return {
    endpoint: `/top/${type}`,
    queryParams: {
      limit,
      mood,
      filter,
      with_users: withUsers
    }
  }
}

module.exports.getTopFolloweeWindowed = (type, window, limit, withUsers = false) => {
  return {
    endpoint: `/top_followee_windowed/${type}/${window}`,
    queryParams: {
      limit,
      with_users: withUsers
    }
  }
}

module.exports.getTopFolloweeSaves = (type, limit, withUsers = false) => {
  return {
    endpoint: `/top_followee_saves/${type}`,
    queryParams: {
      limit,
      with_users: withUsers
    }
  }
}

module.exports.getLatest = (type) => {
  return {
    endpoint: `/latest/${type}`
  }
}

module.exports.getTopCreatorsByGenres = (genres, limit = 30, offset = 0, withUsers = false) => {
  return {
    endpoint: 'users/genre/top',
    queryParams: { genre: genres, limit, offset, with_users: withUsers }
  }
}

module.exports.getURSMContentNodes = (ownerWallet) => {
  return {
    endpoint: 'ursm_content_nodes',
    queryParams: {
      owner_wallet: ownerWallet
    }
  }
}

module.exports.getNotifications = (minBlockNumber, trackIds, timeout) => {
  return {
    endpoint: 'notifications',
    queryParams: {
      min_block_number: minBlockNumber,
      track_id: trackIds
    },
    timeout
  }
}

module.exports.getSolanaNotifications = (minSlotNumber, timeout) => {
  return {
    endpoint: 'solana_notifications',
    queryParams: {
      min_slot_number: minSlotNumber,
    },
    timeout
  }
}

module.exports.getTrackListenMilestones = (timout) => {
  return {
    endpoint: 'track_listen_milestones',
    timout
  }
}

module.exports.getChallengeAttestation = (challengeId, encodedUserId, specifier, oracleAddress) => {
  return {
    endpoint: `/v1/challenges/${challengeId}/attest`,
    queryParams: {
      user_id: encodedUserId,
      specifier,
      oracle: oracleAddress
    }
  }
}
