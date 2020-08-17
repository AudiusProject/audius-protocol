/** Utils for manipulating hls data */

const FORMAT = `#EXTM3U`
const VERSION = `#EXT-X-VERSION:3`
const TARGET_DURATION = `#EXT-X-TARGETDURATION:`
const MEDIA_SEQUENCE = `#EXT-X-MEDIA-SEQUENCE:0`
const SEGMENT_HEADER = `#EXTINF:`
const STREAM_VARIANT_65K = `#EXT-X-STREAM-INF:TYPE=AUDIO,BANDWIDTH=65000,CODECS="mp4a.40.2"`
const ENDLIST = `#EXT-X-ENDLIST`

/**
 * Generates an M3U8 manifest file
 * @param {array} segments
 * @param {array?} prefetchedSegments optional segments that have local blob-URLs for faster fetching.
 * @param {string?} gatewayOverride ipfs gateway override to join CIDs against.
 * @param {number?} targetDuration target duration for the segmenting (6s is standard).
 */
export const generateM3U8 = (
  segments,
  prefetchedSegments = [],
  gatewayOverride = '',
  targetDuration = 6
) => {
  // Special case tracks that were segmented incorrectly and only have one segment
  // by setting the HLS target duration to that segment's duration (fixes Safari HLS issues).
  if (segments.length === 1) {
    targetDuration = Math.round(parseFloat(segments[0].duration))
  }

  let lines = [
    FORMAT,
    VERSION,
    `${TARGET_DURATION}${targetDuration}`,
    MEDIA_SEQUENCE
  ]

  lines = lines.concat(
    segments.map((segment, i) => {
      const link = prefetchedSegments[i]
        ? prefetchedSegments[i]
        : // Write a CID directly to the manifest file so that the fragment
          // loader can customizably fetch the CID.
          `${gatewayOverride}${segment.multihash}`
      return [`${SEGMENT_HEADER}${segment.duration}`, link].join('\n')
    })
  )

  lines.push(ENDLIST)

  return lines.join('\n')
}

/**
 * Generates a master m3u8 file containing m3u8 variants for native HLs playback
 * @param {array} segments
 * @param {array?} prefetchedSegments optional segments that have local blob-URLs for faster fetching.
 * @param {array<string>} gateways list of ipfs gateways, e.g. https://ipfs.io/ipfs/
 */
export const generateM3U8Variants = (
  segments,
  prefetchedSegments = [],
  gateways
) => {
  const variants = gateways.map(gateway => {
    const variant = generateM3U8(
      segments,
      [],
      // prefetchedSegments,
      gateway
    )
    return encodeURI(
      `data:application/vnd.apple.mpegURL;base64,${window.btoa(variant)}`
    )
  })

  const lines = [FORMAT, VERSION]

  variants.forEach(variant => {
    lines.push(STREAM_VARIANT_65K)
    lines.push(variant)
  })
  const m3u8 = lines.join('\n')

  // If there is native support for HLS (OSX Safari and iOS Safari), pass a data URI.
  // NOTE: Safari requires a resource URL to have an extension, so passing a createObjectURL for a blob
  // will not work.
  return encodeURI(
    `data:application/vnd.apple.mpegURL;base64,${window.btoa(m3u8)}`
  )
}
