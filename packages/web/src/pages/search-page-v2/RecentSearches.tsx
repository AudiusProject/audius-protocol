import {
  Kind,
  SquareSizes,
  UserMetadata,
  UserTrackMetadata
} from '@audius/common/models'
import { searchSelectors } from '@audius/common/store'
import {
  Artwork,
  Avatar,
  Button,
  Flex,
  IconButton,
  IconClose,
  Paper,
  Text,
  useTheme
} from '@audius/harmony'
import { useSelector } from 'react-redux'

import { UserNameAndBadges } from 'components/user-name-and-badges/UserNameAndBadges'
import { useGetRecentSearches } from '@audius/common/api'
import { useTrackCoverArt2 } from 'hooks/useTrackCoverArt'
import { useCallback } from 'react'
import { useHistoryContext } from 'app/HistoryProvider'
import { useProfilePicture } from 'hooks/useUserProfilePicture'
const { getSearchHistory } = searchSelectors

const messages = {
  title: 'Recent searches',
  clear: 'Clear Recent Searches'
}

type RecentSearchProps = {
  children: React.ReactNode
  title: string
}

const RecentSearch = (props: RecentSearchProps) => {
  const { children, title } = props
  const { history } = useHistoryContext()

  const handleClick = useCallback(() => {
    history.push(`/search/${title}`)
  }, [])

  return (
    <Flex
      w='100%'
      pv='xs'
      css={{ justifyContent: 'space-between', cursor: 'pointer' }}
      onClick={handleClick}
      role='button'
      aria-label={`Go to search result for ${title}`}
    >
      <Flex gap='m'>{children}</Flex>
      <IconButton
        aria-label='Remove recent search'
        icon={IconClose}
        color='subdued'
        size='s'
      />
    </Flex>
  )
}

type RecentSearchTrackProps = {
  track: UserTrackMetadata
}

const RecentSearchTrack = (props: RecentSearchTrackProps) => {
  const { track } = props
  const { track_id, user, title } = track
  const image = useTrackCoverArt2(track_id, SquareSizes.SIZE_150_BY_150)

  return (
    <RecentSearch title={title}>
      <Artwork src={image} w='40px' borderRadius='xs' />
      <Flex direction='column' css={{ alignItems: 'flex-start' }}>
        <Text variant='body' size='s'>
          {title}
        </Text>
        {user ? (
          <UserNameAndBadges
            renderName={(name) => (
              <Text variant='body' size='xs' color='subdued'>
                {name}
              </Text>
            )}
            userId={user.user_id}
          />
        ) : null}
      </Flex>
    </RecentSearch>
  )
}

type RecentSearchUserProps = {
  user: UserMetadata
}

const RecentSearchUser = (props: RecentSearchUserProps) => {
  const { user } = props
  const { user_id, name } = user
  const image = useProfilePicture(user_id, SquareSizes.SIZE_150_BY_150)

  return (
    <RecentSearch title={name}>
      <Avatar src={image} w='40px' borderWidth='thin' />
      <Flex direction='column' css={{ alignItems: 'flex-start' }}>
        <UserNameAndBadges
          renderName={(name) => (
            <Text variant='body' size='s'>
              {name}
            </Text>
          )}
          userId={user.user_id}
        />
        <Text variant='body' size='xs' color='subdued'>
          Profile
        </Text>
      </Flex>
    </RecentSearch>
  )
}

export const RecentSearches = () => {
  const searchItems = useSelector(getSearchHistory)
  console.log('searchItems', searchItems)
  const recentSearches = useGetRecentSearches({ searchItems })
  console.log('recentSearches', recentSearches)

  return (
    <Paper
      p='xl'
      w='100%'
      css={{ maxWidth: '688px' }}
      direction='column'
      gap='l'
    >
      <Text variant='heading' size='s' css={{ alignSelf: 'flex-start' }}>
        {messages.title}
      </Text>
      <Flex direction='column' gap='s'>
        {(recentSearches || []).map((recentSearch) => {
          if (recentSearch.kind === Kind.TRACKS) {
            return (
              <RecentSearchTrack
                track={recentSearch.item as UserTrackMetadata}
                key={recentSearch.id}
              />
            )
          }
          if (recentSearch.kind === Kind.USERS) {
            return (
              <RecentSearchUser
                user={recentSearch.item}
                key={recentSearch.id}
              />
            )
          }
        })}
      </Flex>
      <Button
        variant='secondary'
        size='small'
        fullWidth={false}
        css={{ alignSelf: 'center' }}
      >
        {messages.clear}
      </Button>
    </Paper>
  )
}
