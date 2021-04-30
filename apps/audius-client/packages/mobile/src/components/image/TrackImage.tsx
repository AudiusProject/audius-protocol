import React, { useCallback, useState } from 'react'
import { UserMultihash } from '../../models/User'
import { TrackImage as TrackImageType } from '../../models/Track'
import ImageLoader from './ImageLoader'
import { gateways, publicGateways } from './utils'

const getTrackImageUrl = (track: TrackImageType, cNode: string) => {
  if (track.cover_art_sizes) {
    return `${cNode}/ipfs/${track.cover_art_sizes}/150x150.jpg`
  }
  if (track.cover_art) {
    return `${cNode}/ipfs/${track.cover_art}`
  }
  return null
}

const getHasImage = (track: TrackImageType) => {
  return !!(track.cover_art_sizes || track.cover_art)
}

const useTrackImage = (track: TrackImageType, user: UserMultihash) => {
  const cNodes =
    user.creator_node_endpoint !== null
      ? user.creator_node_endpoint.split(',').filter(Boolean)
      : gateways
  const [didError, setDidError] = useState(
    cNodes.length === 0 || !getHasImage(track)
  )
  const [source, setSource] = useState(
    didError ? null : { uri: getTrackImageUrl(track, cNodes[0]) }
  )
  const onError = useCallback(() => {
    if (didError) return
    const nodes =
      user.creator_node_endpoint !== null
        ? user.creator_node_endpoint.split(',').filter(Boolean)
        : gateways
    const numNodes = nodes.length
    const currInd = nodes.findIndex(
      (cn: string) => (source?.uri ?? '') === getTrackImageUrl(track, cn)
    )
    if (currInd !== 1 && currInd < numNodes - 1) {
      setSource({ uri: getTrackImageUrl(track, nodes[currInd + 1]) })
    } else {
      // Legacy fallback for image formats (no dir cid)
      const legacyUrls = (user.creator_node_endpoint ?? '')
        .split(',')
        .filter(Boolean)
        .concat(gateways)
        .concat(publicGateways)
        .map(gateway => `${gateway}/ipfs/${track.cover_art_sizes}`)
      const legacyIdx = legacyUrls.findIndex(
        (route: string) => (source?.uri ?? '') === route
      )
      if (
        track.cover_art_sizes &&
        source?.uri?.endsWith('.jpg') &&
        legacyUrls.length > 0
      ) {
        setSource({ uri: legacyUrls[0] })
      } else if (legacyIdx !== -1 && legacyIdx < legacyUrls.length - 1) {
        setSource({ uri: legacyUrls[legacyIdx + 1] })
      } else {
        setDidError(true)
      }
    }
  }, [user, track, source, didError])
  return { source, didError, onError }
}

const TrackImage = ({
  track,
  user,
  imageStyle
}: {
  track: TrackImageType
  user: UserMultihash
  imageStyle?: Record<string, any>
}) => {
  const { source, onError, didError } = useTrackImage(track, user)
  return (
    <ImageLoader
      style={imageStyle}
      source={
        didError || source === null
          ? require('../../assets/images/imageBlank2x.png')
          : source
      }
      onError={onError}
    />
  )
}

export default TrackImage
