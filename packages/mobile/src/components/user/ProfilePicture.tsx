import type { ID } from '@audius/common'
import { SquareSizes } from '@audius/common'

import { UserImage } from 'app/components/image/UserImage'
import { makeStyles } from 'app/styles'

import type { FastImageProps } from '../image/FastImage'

const useStyles = makeStyles(({ palette }) => ({
  profilePhoto: {
    height: 82,
    width: 82,
    borderRadius: 1000,
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: palette.neutralLight9,
    overflow: 'hidden',
    backgroundColor: palette.neutralLight6
  }
}))

export type ProfilePictureProps = Partial<FastImageProps> &
  (
    | {
        /** @deprecated Use `userId` directly instead */
        profile: { user_id: ID }
      }
    | {
        userId: ID
      }
  )

/**
 * @deprecated
 * Use image/ProfilePicture instead
 */
export const ProfilePicture = (props: ProfilePictureProps) => {
  const { style: styleProp, ...other } = props
  const userId = 'userId' in other ? other.userId : other.profile.user_id
  const styles = useStyles()

  return (
    <UserImage
      userId={userId}
      size={SquareSizes.SIZE_150_BY_150}
      style={[styles.profilePhoto, styleProp]}
      {...other}
    />
  )
}
