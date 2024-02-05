import type { ID } from '@audius/common/models'
import type { Image } from '@audius/common/store'

import type { CoverPhotoProps } from '@audius/harmony-native'
import { CoverPhoto } from '@audius/harmony-native'

import { useCoverPhoto } from '../image/CoverPhoto'

type UserCoverPhotoProps = {
  userId: ID
} & Pick<CoverPhotoProps, 'style' | 'topCornerRadius' | 'children'>

export const UserCoverPhoto = (props: UserCoverPhotoProps) => {
  const { userId, ...other } = props

  const { source, handleError, shouldBlur } = useCoverPhoto(userId)

  return (
    <CoverPhoto
      coverPhoto={shouldBlur ? undefined : source}
      profilePicture={shouldBlur ? source : undefined}
      onError={handleError}
      {...other}
    />
  )
}
