import { cacheUsersSelectors } from '@audius/common'
import type { Nullable } from '@audius/common'
import type { SquareSizes, ID } from '@audius/common/models'
import { useSelector } from 'react-redux'

import profilePicEmpty from 'app/assets/images/imageProfilePicEmpty2X.png'
import type { ContentNodeImageSource } from 'app/hooks/useContentNodeImage'
import { useContentNodeImage } from 'app/hooks/useContentNodeImage'

import type { FastImageProps } from './FastImage'
import { FastImage } from './FastImage'

const { getUser } = cacheUsersSelectors

type UseUserImageOptions = {
  userId: Nullable<ID>
  size: SquareSizes
}

export const useProfilePicture = (
  userId: Nullable<number>,
  size: SquareSizes
): ContentNodeImageSource => {
  const cid = useSelector((state) => {
    const user = getUser(state, { id: userId })
    if (!user) return null
    const { profile_picture_sizes, profile_picture } = user
    return profile_picture_sizes || profile_picture
  })

  const cidMap = useSelector(
    (state) => getUser(state, { id: userId })?.profile_picture_cids
  )

  const updatedSource = useSelector((state) => {
    const user = getUser(state, { id: userId })
    if (!user) return null
    const { updatedProfilePicture } = user
    if (!updatedProfilePicture) return null
    return {
      source: { uri: updatedProfilePicture.url },
      handleError: () => {},
      isFallbackImage: false
    }
  })

  const imageSource = useContentNodeImage({
    cid,
    size,
    fallbackImageSource: profilePicEmpty,
    cidMap
  })

  return updatedSource ?? imageSource
}

export type UserImageProps = UseUserImageOptions & Partial<FastImageProps>

export const UserImage = (props: UserImageProps) => {
  const { userId, size, ...imageProps } = props
  const { source, handleError } = useProfilePicture(userId, size)

  return <FastImage {...imageProps} source={source} onError={handleError} />
}
