import { ID, ProfilePictureSizes } from '@audius/common/models'
import { Nullable } from '@audius/common/utils'
import { IconArtistBadge as BadgeArtist, Box, Flex } from '@audius/harmony'
import cn from 'classnames'

import ProfilePicture from 'components/profile-picture/ProfilePicture'
import FollowsYouBadge from 'components/user-badges/FollowsYouBadge'
import { EditableName } from 'pages/profile-page/components/EditableName'

import { ProfileLeftNav } from './ProfileLeftNav'
import styles from './ProfilePage.module.css'

type ProfileWrappingProps = {
  userId: Nullable<ID>
  isDeactivated: boolean
  allowAiAttribution: boolean
  loading: boolean
  verified: boolean
  profilePictureSizes: Nullable<ProfilePictureSizes>
  updatedProfilePicture: { error: boolean; url: string }
  hasProfilePicture: boolean
  isOwner: boolean
  isArtist: boolean
  editMode: boolean
  name: string
  handle: string
  bio: string
  location: string
  twitterHandle: string
  instagramHandle: string
  tikTokHandle: string
  twitterVerified: boolean
  instagramVerified: boolean
  tikTokVerified: boolean
  website: string
  donation: string
  created: string
  onUpdateName: (name: string) => void
  onUpdateProfilePicture: (
    selectedFiles: any,
    source: 'original' | 'unsplash' | 'url'
  ) => Promise<void>
  onUpdateBio: (bio: string) => void
  onUpdateLocation: (location: string) => void
  onUpdateTwitterHandle: (handle: string) => void
  onUpdateInstagramHandle: (handle: string) => void
  onUpdateTikTokHandle: (handle: string) => void
  onUpdateWebsite: (website: string) => void
  onUpdateDonation: (donation: string) => void
}

const ProfileWrapping = (props: ProfileWrappingProps) => {
  const {
    userId,
    isDeactivated,
    allowAiAttribution,
    loading,
    verified,
    profilePictureSizes,
    updatedProfilePicture,
    hasProfilePicture,
    isOwner,
    isArtist,
    editMode,
    name,
    handle,
    bio,
    location,
    twitterHandle,
    instagramHandle,
    tikTokHandle,
    twitterVerified,
    instagramVerified,
    tikTokVerified,
    website,
    donation,
    created,
    onUpdateName,
    onUpdateProfilePicture,
    onUpdateBio,
    onUpdateLocation,
    onUpdateTwitterHandle,
    onUpdateInstagramHandle,
    onUpdateTikTokHandle,
    onUpdateWebsite,
    onUpdateDonation
  } = props

  return (
    <Box
      w='100%'
      css={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 264,
        maxWidth: 1080,
        margin: '0 auto',
        /* Put the profilewrapping over the tab accent */
        zIndex: 10
      }}
    ></Box>
  )
}

export default ProfileWrapping
