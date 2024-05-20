import { ID, Kind, SquareSizes, UserTrackMetadata } from '@audius/common/models'
import { SearchItem, searchSelectors } from '@audius/common/store'
import {
  Artwork,
  Button,
  Flex,
  IconButton,
  IconClose,
  Paper,
  Text,
  useTheme
} from '@audius/harmony'
import { full as FullSdk } from '@audius/sdk'
import { useSelector } from 'react-redux'

import { UserNameAndBadges } from 'components/user-name-and-badges/UserNameAndBadges'
import { useGetRecentSearches } from '@audius/common/api'
import { useTrackCoverArt2 } from 'hooks/useTrackCoverArt'
import { decodeHashId } from 'utils/hashIds'
import { useCallback } from 'react'
import { useHistoryContext } from 'app/HistoryProvider'
const { getSearchHistory } = searchSelectors

const messages = {
  title: 'Recent searches',
  clear: 'Clear Recent Searches'
}

// type RecentSearchProps = {
//   searchItem: SearchItem
//   onClick: () => void
// }

type RecentSearchTrackProps = {
  track: UserTrackMetadata
}

const RecentSearchTrack = (props: RecentSearchTrackProps) => {
  const { track, onClick } = props
  const { track_id, user, title } = track
  const { history } = useHistoryContext()
  console.log('track', track)
  // Maybe useTrackCoverArt because these images aren't in the cache (pulled via audius query search api)
  const image = useTrackCoverArt2(track_id, SquareSizes.SIZE_150_BY_150)

  //   console.log('image', image, id, decodeHashId(id)!)
  const handleClick = useCallback(() => {
    history.push(`/search/${title}`)
  }, [])

  return (
    <Flex
      w='100%'
      css={{ justifyContent: 'space-between', cursor: 'pointer' }}
      onClick={handleClick}
      role='button'
      aria-label={`Go to search result for ${title}`}
    >
      <Flex gap='m'>
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
      </Flex>
      <IconButton
        aria-label='Remove recent search'
        icon={IconClose}
        color='subdued'
        size='s'
        // onClick={}
      />
    </Flex>
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
      <Flex>
        {(recentSearches || []).map((recentSearch) => {
          if (recentSearch.kind === Kind.TRACKS) {
            return (
              <RecentSearchTrack
                track={recentSearch.item as UserTrackMetadata}
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
