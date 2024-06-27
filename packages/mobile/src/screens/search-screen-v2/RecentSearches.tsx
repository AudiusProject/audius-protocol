import { useCallback } from 'react'

import {
  useGetPlaylistById,
  useGetTrackById,
  useGetUserById
} from '@audius/common/api'
import { recentSearchMessages as messages } from '@audius/common/messages'
import { Kind, SquareSizes, Status } from '@audius/common/models'
import { searchActions, searchSelectors } from '@audius/common/store'
import type { SearchItem } from '@audius/common/store'
import { profilePage } from '@audius/web/src/utils/route'
import { Link } from '@react-navigation/native'
import type { To } from '@react-navigation/native/lib/typescript/src/useLinkTo'
import { useDispatch, useSelector } from 'react-redux'

import {
  Button,
  Flex,
  IconButton,
  IconClose,
  Text,
  spacing,
  useTheme
} from '@audius/harmony-native'
import { FlatList, ProfilePicture } from 'app/components/core'
import { CollectionImageV2 } from 'app/components/image/CollectionImageV2'
import { TrackImageV2 } from 'app/components/image/TrackImageV2'
import Skeleton from 'app/components/skeleton'
import { UserLink } from 'app/components/user-link'

import type { AppTabScreenParamList } from '../app-screen'

const { getV2SearchHistory } = searchSelectors
const { removeItem, clearHistory } = searchActions

type RecentSearchProps = {
  children: React.ReactNode
  to: To<AppTabScreenParamList>
  searchItem: SearchItem
}

const RecentSearch = (props: RecentSearchProps) => {
  const { children, to, searchItem } = props
  const dispatch = useDispatch()

  const handleClickRemove = useCallback(() => {
    dispatch(removeItem({ searchItem }))
  }, [dispatch, searchItem])

  return (
    <Link to={to}>
      <Flex
        direction='row'
        w='100%'
        justifyContent='space-between'
        alignItems='center'
        pv='s'
      >
        <Flex direction='row' gap='m'>
          {children}
        </Flex>
        <IconButton
          aria-label={messages.remove}
          icon={IconClose}
          color='subdued'
          size='s'
          onPress={handleClickRemove}
        />
      </Flex>
    </Link>
  )
}

const RecentSearchSkeleton = () => (
  <Flex direction='row' w='100%' pv='s' justifyContent='space-between'>
    <Flex direction='row' w='100%' gap='m'>
      <Skeleton width={40} height={40} />

      <Flex direction='column' gap='s'>
        <Skeleton width={120} height={12} />
        <Skeleton width={100} height={12} />
      </Flex>
    </Flex>
  </Flex>
)

const RecentSearchTrack = (props: { searchItem: SearchItem }) => {
  const { searchItem } = props
  const { id } = searchItem
  const { data: track, status } = useGetTrackById({ id })
  const { data: user } = useGetUserById({ id: track?.owner_id ?? 0 })
  const { spacing } = useTheme()

  if (status === Status.LOADING) return <RecentSearchSkeleton />

  if (!track) return null
  const { permalink, title } = track

  if (!user) return null

  return (
    <RecentSearch to={permalink} searchItem={searchItem}>
      <TrackImageV2
        trackId={id}
        size={SquareSizes.SIZE_150_BY_150}
        style={{
          height: spacing.unit10,
          width: spacing.unit10
        }}
      />
      <Flex direction='column' alignItems='flex-start'>
        <Text variant='body' size='s'>
          {title}
        </Text>
        <Flex direction='row' alignItems='baseline'>
          <Text variant='body' size='xs' color='subdued'>
            {messages.track}
            {' | '}
          </Text>
          <UserLink
            size='xs'
            userId={user.user_id}
            variant='subdued'
            badgeSize='2xs'
          />
        </Flex>
      </Flex>
    </RecentSearch>
  )
}

const RecentSearchCollection = (props: { searchItem: SearchItem }) => {
  const { searchItem } = props
  const { id } = searchItem
  const { data: playlist, status } = useGetPlaylistById({
    playlistId: id
  })

  const { data: user } = useGetUserById({
    id: playlist?.playlist_owner_id ?? 0
  })

  if (status === Status.LOADING) return <RecentSearchSkeleton />

  if (!playlist) return null
  const { is_album, playlist_name, permalink } = playlist

  if (!user) return null

  return (
    <RecentSearch searchItem={searchItem} to={permalink}>
      <CollectionImageV2
        collectionId={id}
        size={SquareSizes.SIZE_150_BY_150}
        style={{ height: spacing.unit10, width: spacing.unit10 }}
      />
      <Flex direction='column' alignItems='flex-start'>
        <Text variant='body' size='s'>
          {playlist_name}
        </Text>
        <Flex direction='row' alignItems='baseline'>
          <Text variant='body' size='xs' color='subdued'>
            {is_album ? messages.album : messages.playlist}
            {' | '}
          </Text>
          <UserLink
            userId={user.user_id}
            size='xs'
            variant='subdued'
            badgeSize='2xs'
          />
        </Flex>
      </Flex>
    </RecentSearch>
  )
}

const RecentSearchUser = (props: { searchItem: SearchItem }) => {
  const { searchItem } = props
  const { id } = searchItem
  const { data: user, status } = useGetUserById({ id })

  if (status === Status.LOADING) return <RecentSearchSkeleton />

  if (!user) return null
  const { handle } = user

  return (
    <RecentSearch searchItem={searchItem} to={profilePage(handle)}>
      <ProfilePicture userId={id} w={40} />
      <Flex direction='column' alignItems='flex-start'>
        <UserLink userId={user.user_id} size='s' badgeSize='xs' />
        <Text variant='body' size='xs' color='subdued'>
          Profile
        </Text>
      </Flex>
    </RecentSearch>
  )
}

const itemComponentByKind = {
  [Kind.TRACKS]: RecentSearchTrack,
  [Kind.USERS]: RecentSearchUser,
  [Kind.COLLECTIONS]: RecentSearchCollection
}

export const RecentSearches = () => {
  const history = useSelector(getV2SearchHistory)
  const dispatch = useDispatch()

  const handleClearSearchHistory = useCallback(() => {
    dispatch(clearHistory())
  }, [dispatch])

  if (history.length === 0) return null

  return (
    <FlatList
      ListHeaderComponent={<Text variant='title'>{messages.title}</Text>}
      data={history}
      renderItem={({ item }) => {
        const { kind, id } = item
        const RecentSearchItemComponent = itemComponentByKind[kind]
        return <RecentSearchItemComponent key={id} searchItem={item} />
      }}
      ListFooterComponent={
        <Flex pt='l'>
          <Button
            variant='secondary'
            size='small'
            style={{ alignSelf: 'center' }}
            onPress={handleClearSearchHistory}
          >
            {messages.clear}
          </Button>
        </Flex>
      }
    />
  )
}
