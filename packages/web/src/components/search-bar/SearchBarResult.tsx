import { imageBlank, imageProfilePicEmpty } from '@audius/common/assets'
import {
  User,
  UserTrackMetadata,
  UserCollectionMetadata
} from '@audius/common/models'
import { route } from '@audius/common/utils'
import { Text, Flex, Avatar, Artwork } from '@audius/harmony'
import { Link } from 'react-router-dom'

import UserBadges from 'components/user-badges/UserBadges'

import styles from './DesktopSearchBar.module.css'

const { profilePage, collectionPage } = route

const ResultWrapper = ({
  children,
  to
}: {
  children: React.ReactNode
  to: string
}) => (
  <Flex
    as={Link}
    // @ts-expect-error
    to={to}
    alignItems='center'
    gap='s'
    p='s'
    css={{ minWidth: 0 }}
  >
    {children}
  </Flex>
)

type ResultTextProps = {
  primary: string
  secondary: string
  badges?: React.ReactNode
}

const ResultText = ({ primary, secondary, badges }: ResultTextProps) => (
  <Flex direction='column' flex={1} css={{ minWidth: 0 }}>
    <Flex alignItems='center' gap='2xs' css={{ minWidth: 0 }}>
      <Text
        variant='body'
        size='s'
        color='default'
        css={{ minWidth: 0 }}
        ellipses
        className={styles.primary}
      >
        {primary}
      </Text>
      {badges}
    </Flex>
    <Text
      variant='body'
      size='xs'
      color='subdued'
      css={{ minWidth: 0 }}
      ellipses
      className={styles.secondary}
    >
      {secondary}
    </Text>
  </Flex>
)

type UserResultProps = {
  user: User
}

export const UserResult = ({ user }: UserResultProps) => (
  <ResultWrapper to={profilePage(user.handle)}>
    <Avatar
      h={30}
      w={30}
      src={user.profile_picture?.['150x150'] || imageProfilePicEmpty}
      borderWidth='thin'
      css={{ flexShrink: 0 }}
    />
    <ResultText
      primary={user.name}
      secondary={`@${user.handle}`}
      badges={<UserBadges userId={user.user_id} size='s' inline />}
    />
  </ResultWrapper>
)

type TrackResultProps = {
  track: UserTrackMetadata
}

export const TrackResult = ({ track }: TrackResultProps) => (
  <ResultWrapper to={track.permalink}>
    <Artwork
      h={30}
      w={30}
      src={track.artwork?.['150x150'] || imageBlank}
      css={{ flexShrink: 0 }}
    />
    <ResultText primary={track.title} secondary={track.user.name} />
  </ResultWrapper>
)

type CollectionResultProps = {
  collection: UserCollectionMetadata
}

export const CollectionResult = ({ collection }: CollectionResultProps) => (
  <ResultWrapper
    to={collectionPage(
      collection.user.handle,
      collection.playlist_name,
      collection.playlist_id,
      collection.permalink,
      collection.is_album
    )}
  >
    <Artwork
      h={30}
      w={30}
      src={collection.artwork?.['150x150'] || imageBlank}
      css={{ flexShrink: 0 }}
    />
    <ResultText
      primary={collection.playlist_name}
      secondary={collection.user.name}
    />
  </ResultWrapper>
)
