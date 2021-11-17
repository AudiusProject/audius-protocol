/**
 * Gets range request headers off of a request object
 * Drop in replacement for `req.range()` which does not
 * support ranges without a specified `end`.
 *
 * This is a widely supported pattern, e.g.
 * https://musicpartners.sonos.com/node/465
 * or
 * https://github.com/tumtumtum/StreamingKit/blob/eb9268e83ea0c0cea6a1c7af16559de455d4326e/StreamingKit/StreamingKit/STKHTTPDataSource.m#L605
 *
 * @param {Request} req express request object
 *
 * @returns
 *  { start, end } where start and end are integer byte values
 *  or
 *  null if the request could not be parsed
 */
const getRequestRange = (req) => {
  const header = req.header('range')
  if (!header) return null

  // Format: bytes=start-end
  // e.g. bytes=1024-2048
  const matches = header.match(/(.*)=(\d*)-(\d*)/)
  // Only `start` is required
  if (!matches || !matches[2]) return null

  try {
    const start = parseInt(matches[2], 10)
    const end = matches[3]
      ? parseInt(matches[3], 10)
      : undefined

    return { start, end }
  } catch (e) {
    return null
  }
}

/**
 * Formats a Content-Range header response
 * @returns {string} Content-Range header value
 */
const formatContentRange = (start, end, size) => {
  return `bytes ${start}-${end || (size - 1)}/${size}`
}

module.exports = {
  getRequestRange,
  formatContentRange
}
