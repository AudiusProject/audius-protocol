import React, { useCallback, useState } from 'react'
import { Image } from 'react-native'
import { UserImage as UserImageType, UserMultihash } from '../../models/User'

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
  const cNodes = user.creator_node_endpoint.split(',').filter(Boolean)
  const [didError, setDidError] = useState(cNodes.length === 0 || !getHasImage(user))
  const [source, setSource] = useState(didError ? null : { uri: getUserImageUrl(user, cNodes[0]) })
  const onError = useCallback(() => {
    if (didError) return
    const nodes = user.creator_node_endpoint.split(',').filter(Boolean)
    const numNodes = nodes.length
    const currInd = nodes.findIndex((cn: string) => (source?.uri ?? '').includes(cn)) 
    if (currInd !== -1 && currInd < numNodes - 1) {
      setSource({ uri: getUserImageUrl(user, nodes[currInd+1]) })
    } else {
      setDidError(true)
    }
  }, [cNodes, user, source])
  return { source, didError, onError }
}

const UserImage = ({ user, imageStyle }: { user: UserImageType & UserMultihash, imageStyle?: Object }) => {
  const { source, onError, didError } = useUserImage(user)
  return (
    <Image
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
