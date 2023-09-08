import type { ProfilePictureProps } from 'app/components/user'
import { ProfilePicture as ProfilePictureBase } from 'app/components/user'

import { useSelectProfile } from './selectors'

export const ProfilePicture = (props: Partial<ProfilePictureProps>) => {
  const profile = useSelectProfile([
    'user_id',
    'profile_picture',
    'profile_picture_cids',
    'profile_picture_sizes',
    'creator_node_endpoint',
    'updatedProfilePicture'
  ])

  return <ProfilePictureBase profile={profile} {...props} />
}
