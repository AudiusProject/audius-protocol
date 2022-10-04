import type { ProfilePictureProps } from 'app/components/user'
import { ProfilePicture as ProfilePictureBase } from 'app/components/user'

import { useSelectProfile } from './selectors'

export const ProfilePicture = (props: Partial<ProfilePictureProps>) => {
  const profile = useSelectProfile([
    'user_id',
    '_profile_picture_sizes',
    'handle'
  ])
  return <ProfilePictureBase profile={profile} {...props} />
}
