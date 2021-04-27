import React, { useCallback, useState } from 'react'
import { UserImage as UserImageType, UserMultihash } from '../../models/User'
import ImageLoader from './ImageLoader'
import { gateways, publicGateways } from './utils'

const getUserImageUrl = (user: UserImageType & UserMultihash, cNode: string) => {
  if (user.profile_picture_sizes) {
    return `${cNode}/ipfs/${user.profile_picture_sizes}/150x150.jpg`
  }
  if (user.profile_picture) {
    return `${cNode}/ipfs/${user.profile_picture}`
  }
  return null
}

const getHasImage = (user: UserImageType & UserMultihash) => {
  return !!(user.profile_picture_sizes || user.profile_picture)
}

const useUserImage = (user: UserImageType & UserMultihash) => {
  const cNodes = user.creator_node_endpoint !== null ? user.creator_node_endpoint.split(',').filter(Boolean) : gateways
  const [didError, setDidError] = useState(cNodes.length === 0 || !getHasImage(user))
  const [source, setSource] = useState(didError ? null : { uri: getUserImageUrl(user, cNodes[0]) })

  const onError = useCallback(async () => {
    if (didError) return
    const nodes = user.creator_node_endpoint !== null ? user.creator_node_endpoint.split(',').filter(Boolean) : gateways
    const numNodes = nodes.length
    const currInd = nodes.findIndex((cn: string) => (source?.uri ?? '') === getUserImageUrl(user, cn))
    if (currInd !== -1 && currInd < numNodes - 1) {
      setSource({ uri: getUserImageUrl(user, nodes[currInd+1]) })
    } else {
      // contain "legacy" image formats (no dir cid)
      const legacyUrls = (user.creator_node_endpoint ?? '')
        .split(',').filter(Boolean)
        .concat(gateways)
        .concat(publicGateways)
        .map(gateway => `${gateway}/ipfs/${user.profile_picture_sizes}`)
      const legacyIdx = legacyUrls.findIndex((route: string) => (source?.uri ?? '') === route)
      if (user.profile_picture_sizes && source?.uri?.endsWith('.jpg') && legacyUrls.length > 0) {
        setSource({ uri: legacyUrls[0] })
      } else if (legacyIdx !== -1 && legacyIdx < legacyUrls.length - 1) {
        setSource({ uri: legacyUrls[legacyIdx+1] })
      } else {
        setDidError(true)
      }
    }
  }, [cNodes, user, source])
  return { source, didError, onError }
}

const UserImage = ({ user, imageStyle }: { user: UserImageType & UserMultihash, imageStyle?: Object }) => {
  const { source, onError, didError } = useUserImage(user)
  return (
    <ImageLoader
      style={imageStyle}
      source={
        (didError || source === null)
          ? require('../../assets/images/imageProfilePicEmpty2X.png')
          : source
      }
      onError={onError}
    />
  )
}


export default UserImage
