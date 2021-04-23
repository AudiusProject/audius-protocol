import React, { useCallback, useState } from 'react'
import { Image } from 'react-native'
import { UserMultihash } from '../../models/User'
import { TrackImage as TrackImageType } from '../../models/Track'

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
  const cNodes = user.creator_node_endpoint.split(',').filter(Boolean)
  const [didError, setDidError] = useState(cNodes.length === 0 || !getHasImage(track))
  const [source, setSource] = useState(didError ? null : { uri: getTrackImageUrl(track, cNodes[0]) })
  const onError = useCallback(() => {
    if (didError) return
    const nodes = user.creator_node_endpoint.split(',').filter(Boolean)
    const numNodes = nodes.length
    const currInd = nodes.findIndex((cn: string) => (source?.uri ?? '').includes(cn)) 
    if (currInd !== 1 && currInd < numNodes - 1) {
      setSource({ uri: getTrackImageUrl(track, nodes[currInd+1]) })
    } else {
      setDidError(true)
    }
  }, [cNodes, track, source])
  return { source, didError, onError }
}

const TrackImage = ({ track, user, imageStyle }: { track: TrackImageType, user: UserMultihash, imageStyle?: Object }) => {
  const { source, onError, didError } = useTrackImage(track, user)
  return (
    <Image
      style={imageStyle}
      source={
        (didError || source === null)
          ? require('../../assets/images/imageBlank2x.png')
          : source
      }
      onError={onError}
    />
  )
}


export default TrackImage
