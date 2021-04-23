import React, { useCallback, useState } from 'react'
import { Image } from 'react-native'
import { UserMultihash } from '../../models/User'
import { CollectionImage } from '../../models/Collection'

const getPlaylistImageUrl = (playlist: CollectionImage, cNode: string) => {
  if (playlist.cover_art_sizes) {
    return `${cNode}/ipfs/${playlist.cover_art_sizes}/150x150.jpg`
  }
  if (playlist.cover_art) {
    return `${cNode}/ipfs/${playlist.cover_art}`
  }
  return null
}

const getHasImage = (playlist: CollectionImage) => {
  return !!(playlist.cover_art_sizes || playlist.cover_art)
}

const usePlaylistImage = (playlist: CollectionImage, user: UserMultihash) => {
  const cNodes = user.creator_node_endpoint.split(',').filter(Boolean)
  const [didError, setDidError] = useState(cNodes.length === 0 || !getHasImage(playlist))
  const [source, setSource] = useState(didError ? null : { uri: getPlaylistImageUrl(playlist, cNodes[0]) })
  const onError = useCallback(() => {
    if (didError) return
    const nodes = user.creator_node_endpoint.split(',').filter(Boolean)
    const numNodes = nodes.length
    const currInd = nodes.findIndex((cn: string) => (source?.uri ?? '').includes(cn)) 
    if (currInd !== -1 && currInd < numNodes - 1) {
      setSource({ uri: getPlaylistImageUrl(playlist, nodes[currInd+1]) })
    } else {
      setDidError(true)
    }
  }, [cNodes, playlist, source])

  return { source, didError, onError }
}

const PlaylistImage = ({ playlist, user, imageStyle }: { playlist: CollectionImage, user: UserMultihash, imageStyle?: Object }) => {
  const { source, onError, didError } = usePlaylistImage(playlist, user)
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


export default PlaylistImage
