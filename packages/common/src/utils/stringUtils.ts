/**
 * Converts a provided URL params object to a query string
 */
export const paramsToQueryString = (params: {
  [key: string]: string | string[]
}) => {
  if (!params) return ''
  return Object.entries(params)
    .filter((p) => p[1] !== undefined && p[1] !== null)
    .map((p) => {
      if (Array.isArray(p[1])) {
        // Otherwise, join in the form of
        // ?key=val1&key=val2&key=val3...
        return p[1].map((val) => `${p[0]}=${encodeURIComponent(val)}`).join('&')
      }
      return `${p[0]}=${encodeURIComponent(p[1]!)}`
    })
    .join('&')
}

/**
 * Track permalinks have the following format: '/<handle>/<track-slug>'
 */
export const parseTrackRouteFromPermalink = (permalink: string) => {
  const [, handle, slug] = permalink.split('/')
  return { slug, trackId: null, handle }
}

/**
 * Playlist permalinks have the following format: '/<handle>/playlist/<playlist-slug-with-id-at-the-end>'
 *
 * @param permalink
 * @returns playlist id
 */
export const parsePlaylistIdFromPermalink = (permalink: string) => {
  const playlistNameWithId = permalink?.split('/').slice(-1)[0] ?? ''
  return parseInt(playlistNameWithId.split('-').slice(-1)[0])
}

/** Takes a list of comma-separated strings, splits and parses them into numbers */
export const parseIntList = (str: string) => {
  return str.split(',').map((s) => Number.parseInt(s))
}
