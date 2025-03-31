import { WidthSizes, type ID } from '@audius/common/models'

import type { CoverPhotoProps } from '@audius/harmony-native'
import { CoverPhoto } from '@audius/harmony-native'

import { useCoverPhoto } from '../image/CoverPhoto'

type UserCoverPhotoProps = {
  userId: ID
} & Pick<CoverPhotoProps, 'style' | 'topCornerRadius' | 'children'>

export const UserCoverPhoto = (props: UserCoverPhotoProps) => {
  const { userId, ...other } = props

  const { source, shouldBlur } = useCoverPhoto({
    userId,
    size: WidthSizes.SIZE_640
  })

  return (
    <CoverPhoto
      coverPhoto={shouldBlur ? undefined : source}
      profilePicture={shouldBlur ? source : undefined}
      {...other}
    />
  )
}
