const getTrackListens = (timeFrame = null, idsArray = null, startTime = null, endTime = null, limit = null, offset = null) => {
  let queryUrl = 'tracks/listens/'

  if (timeFrame != null) {
    switch (timeFrame) {
      case 'day':
      case 'week':
      case 'month':
      case 'year':
      case 'millennium':
        break
      default:
        throw new Error('Invalid timeFrame value provided')
    }
    queryUrl += timeFrame
  }

  let queryParams = {}
  if (idsArray !== null) {
    queryParams['id'] = idsArray
  }

  if (limit !== null) {
    queryParams['limit'] = limit
  }

  if (offset !== null) {
    queryParams['offset'] = offset
  }

  if (startTime != null) {
    queryParams['start'] = startTime
  }

  if (endTime != null) {
    queryParams['end'] = endTime
  }

  const req = {
    url: queryUrl,
    endpoint: queryUrl,
    method: 'get',
    params: queryParams,
    queryParams: queryParams
  }
  return req
}

module.exports = {
  getTrackListens
}
