const getTracks = (limit = 100, offset = 0, idsArray = null, targetUserId = null, sort = null, minBlockNumber = null, filterDeleted = null, withUsers = false) => {
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

const getTracksIncludingUnlisted = (identifiers, withUsers = false) => {
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

const getStemsForTrack = (trackId) => {
  const req = {
    endpoint: `stems/${trackId}`,
    queryParams: {
      with_users: true
    }
  }
  return req
}

const getRemixesOfTrack = (trackId, limit = null, offset = null) => {
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

const getRemixTrackParents = (trackId, limit = null, offset = null) => {
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

module.exports = {
  getTracks,
  getTracksIncludingUnlisted,
  getStemsForTrack,
  getRemixesOfTrack,
  getRemixTrackParents
}
