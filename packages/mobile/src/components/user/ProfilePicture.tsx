import { SquareSizes } from '@audius/common'

import type { UserImageProps } from 'app/components/image/UserImage'
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

export type ProfilePictureProps = Partial<FastImageProps> & {
  profile: UserImageProps['user']
}

export const ProfilePicture = (props: ProfilePictureProps) => {
  const { profile, style: styleProp, ...other } = props
  const styles = useStyles()

  return (
    <UserImage
      user={profile}
      size={SquareSizes.SIZE_150_BY_150}
      style={[styles.profilePhoto, styleProp]}
      {...other}
    />
  )
}
