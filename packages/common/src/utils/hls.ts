import { TrackSegment } from '../models'

const FORMAT = `#EXTM3U`
const VERSION = `#EXT-X-VERSION:3`
const TARGET_DURATION = `#EXT-X-TARGETDURATION:`
const MEDIA_SEQUENCE = `#EXT-X-MEDIA-SEQUENCE:0`
const SEGMENT_HEADER = `#EXTINF:`
const STREAM_VARIANT_65K = `#EXT-X-STREAM-INF:TYPE=AUDIO,BANDWIDTH=65000,CODECS="mp4a.40.2"`
const ENDLIST = `#EXT-X-ENDLIST`

type GenerateM3U8Config = {
  segments: TrackSegment[]
  // optional segments that have local blob-URLs for faster fetching.
  prefetchedSegments?: string[]
  // ipfs gateway override to join CIDs against.
  gatewayOverride?: string
  // target duration for the segmenting (6s is standard).
  targetDuration?: number
}

/**
 * Generates an M3U8 manifest file
 */
export const generateM3U8 = (config: GenerateM3U8Config) => {
  const {
    segments,
    prefetchedSegments = [],
    gatewayOverride = '',
    targetDuration = 6
  } = config
  const duration =
    // Special case tracks that were segmented incorrectly and only have one segment
    // by setting the HLS target duration to that segment's duration (fixes Safari HLS issues).
    segments.length === 1
      ? Math.round(parseFloat(segments[0].duration))
      : targetDuration

  let lines = [FORMAT, VERSION, `${TARGET_DURATION}${duration}`, MEDIA_SEQUENCE]

  lines = lines.concat(
    segments.map((segment, i) => {
      const link =
        prefetchedSegments[i] ??
        // Write a CID directly to the manifest file so that the fragment
        // loader can customizably fetch the CID.
        `${gatewayOverride}${segment.multihash}`

      return [`${SEGMENT_HEADER}${segment.duration}`, link].join('\n')
    })
  )

  lines.push(ENDLIST)

  return lines.join('\n')
}

type GenerateM3U8VariantsConfig = {
  segments: TrackSegment[]
  // optional segments that have local blob-URLs for faster fetching.
  prefetchedSegments?: string[]
  // ipfs gateways to join CIDs against.
  gateways: string[]
}

/**
 * Generates a master m3u8 file containing m3u8 variants for native HLs playback
 */
export const generateM3U8Variants = (config: GenerateM3U8VariantsConfig) => {
  const { segments, prefetchedSegments, gateways } = config
  const variants = gateways.map((gatewayOverride) => {
    const variant = generateM3U8({
      segments,
      prefetchedSegments,
      gatewayOverride
    })
    return encodeURI(
      `data:application/vnd.apple.mpegURL;base64,${window.btoa(variant)}`
    )
  })

  const lines = [FORMAT, VERSION]

  variants.forEach((variant) => {
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
