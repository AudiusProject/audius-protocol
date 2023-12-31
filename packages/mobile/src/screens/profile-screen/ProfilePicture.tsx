import { css } from '@emotion/native'

import { Box, useTheme } from '@audius/harmony-native'
import type { ProfilePictureProps } from 'app/components/user'
import { ProfilePicture as ProfilePictureBase } from 'app/components/user'

import { useSelectProfile } from './selectors'

export const ProfilePicture = (props: Partial<ProfilePictureProps>) => {
  const { spacing } = useTheme()
  const profile = useSelectProfile([
    'user_id',
    'profile_picture',
    'profile_picture_cids',
    'profile_picture_sizes',
    'creator_node_endpoint',
    'updatedProfilePicture'
  ])

  return (
    <Box
      style={css({
        position: 'absolute',
        top: spacing.unit13,
        left: spacing.unit3,
        zIndex: 100
      })}
      pointerEvents='none'
    >
      <ProfilePictureBase profile={profile} {...props} />
    </Box>
  )
}
