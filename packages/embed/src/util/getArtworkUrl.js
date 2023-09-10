const fallback = 'https://creatornode.audius.co/content'

export const getArtworkUrl = (
  collectionOrTrack,
  useDefaultArtworkIfMissing
) => {
  let artworkUrl
  if (collectionOrTrack?.artwork) {
    artworkUrl = collectionOrTrack?.artwork._480x480
  } else {
    artworkUrl = `${fallback}/${collectionOrTrack?.coverArtSizes}/480x480.jpg`
  }
  if (!artworkUrl) {
    if (useDefaultArtworkIfMissing) {
      return 'https://download.audius.co/static-resources/preview-image.jpg'
    }
    return null
  }
  return artworkUrl
}
