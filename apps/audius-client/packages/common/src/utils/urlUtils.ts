const audiusUrlRegex =
  // eslint-disable-next-line no-useless-escape
  /^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?(staging\.)?(audius\.co)(\/.+)?/gim

export const isAudiusUrl = (url: string) => new RegExp(audiusUrlRegex).test(url)
export const getPathFromAudiusUrl = (url: string) =>
  new RegExp(audiusUrlRegex).exec(url)?.[3] ?? null

const playlistUrlRegex =
  // eslint-disable-next-line no-useless-escape
  /^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?(staging\.)?(audius\.co)(\/[\S]+\/playlist\/[\S]+)$/gim

export const isPlaylistUrl = (url: string) =>
  new RegExp(playlistUrlRegex).test(url)
export const getPathFromPlaylistUrl = (url: string) => {
  const results = new RegExp(trackUrlRegex).exec(url)
  if (!results) return null
  return results[3]
}

const trackUrlRegex =
  // eslint-disable-next-line no-useless-escape
  /^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?(staging\.)?(audius\.co)(\/[\S]+\/[\S]+)$/gim

export const isTrackUrl = (url: string) => new RegExp(trackUrlRegex).test(url)
export const getPathFromTrackUrl = (url: string) => {
  const results = new RegExp(trackUrlRegex).exec(url)
  if (!results) return null
  return results[3]
}
