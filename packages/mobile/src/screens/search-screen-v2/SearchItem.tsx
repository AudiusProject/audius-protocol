import {
  useGetPlaylistById,
  useGetTrackById,
  useGetUserById
} from '@audius/common/api'
import { recentSearchMessages as messages } from '@audius/common/messages'
import { Kind, SquareSizes, Status } from '@audius/common/models'
import type { SearchItem as SearchItemType } from '@audius/common/store'
import { TouchableOpacity } from 'react-native-gesture-handler'

import type { IconComponent } from '@audius/harmony-native'
import {
  Flex,
  IconButton,
  IconCaretRight,
  Text,
  spacing,
  useTheme
} from '@audius/harmony-native'
import { ProfilePicture } from 'app/components/core'
import { CollectionImageV2 } from 'app/components/image/CollectionImageV2'
import { TrackImageV2 } from 'app/components/image/TrackImageV2'
import Skeleton from 'app/components/skeleton'
import { UserLink } from 'app/components/user-link'
import { useNavigation } from 'app/hooks/useNavigation'

type SearchItemProps = {
  icon?: IconComponent
  onPressIcon?: () => void
  onPress?: () => void
  searchItem: SearchItemType
}

type SearchItemContainerProps = {
  children: React.ReactNode
} & SearchItemProps

const SearchItemContainer = (props: SearchItemContainerProps) => {
  const { children, icon: Icon = IconCaretRight, onPressIcon, onPress } = props

  return (
    <TouchableOpacity onPress={onPress}>
      <Flex
        direction='row'
        w='100%'
        justifyContent='space-between'
        alignItems='center'
        pv='s'
        ph='l'
        gap='m'
      >
        {children}
        {onPressIcon ? (
          <IconButton
            icon={Icon}
            color='subdued'
            size='s'
            onPress={onPressIcon}
          />
        ) : (
          <Icon size='s' color='subdued' />
        )}
      </Flex>
    </TouchableOpacity>
  )
}

export const SearchItemSkeleton = () => (
  <Flex direction='row' w='100%' justifyContent='space-between' ph='l' pv='s'>
    <Flex direction='row' w='100%' gap='m'>
      <Skeleton width={40} height={40} />

      <Flex direction='column' gap='s' justifyContent='center'>
        <Skeleton width={120} height={12} />
        <Skeleton width={100} height={12} />
      </Flex>
    </Flex>
  </Flex>
)

export const SearchItemTrack = (props: SearchItemProps) => {
  const { searchItem, onPress } = props
  const { id } = searchItem
  const { data: track, status } = useGetTrackById({ id })
  const { data: user } = useGetUserById({ id: track?.owner_id ?? 0 })
  const { spacing } = useTheme()
  const navigation = useNavigation()

  if (status === Status.LOADING) return <SearchItemSkeleton />

  if (!track) return null
  const { title } = track

  if (!user) return null

  const handlePress = () => {
    onPress?.()
    navigation.push('Track', { id })
  }

  return (
    <SearchItemContainer {...props} onPress={handlePress}>
      <TrackImageV2
        trackId={id}
        size={SquareSizes.SIZE_150_BY_150}
        style={{
          height: spacing.unit10,
          width: spacing.unit10
        }}
      />
      <Flex
        direction='column'
        alignItems='flex-start'
        flex={1}
        pointerEvents='none'
      >
        <Text
          variant='body'
          size='s'
          numberOfLines={1}
          style={{ lineHeight: spacing.unit4 }}
        >
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
    </SearchItemContainer>
  )
}

export const SearchItemCollection = (props: SearchItemProps) => {
  const { searchItem, onPress } = props
  const { id } = searchItem
  const { data: playlist, status } = useGetPlaylistById({
    playlistId: id
  })
  const navigation = useNavigation()

  const { data: user } = useGetUserById({
    id: playlist?.playlist_owner_id ?? 0
  })

  if (status === Status.LOADING) return <SearchItemSkeleton />

  if (!playlist) return null
  const { is_album, playlist_name } = playlist

  if (!user) return null

  const handlePress = () => {
    onPress?.()
    navigation.push('Collection', { id })
  }

  return (
    <SearchItemContainer {...props} onPress={handlePress}>
      <CollectionImageV2
        collectionId={id}
        size={SquareSizes.SIZE_150_BY_150}
        style={{ height: spacing.unit10, width: spacing.unit10 }}
      />
      <Flex direction='column' alignItems='flex-start' flex={1}>
        <Text
          variant='body'
          size='s'
          numberOfLines={1}
          style={{ lineHeight: spacing.unit4 }}
        >
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
    </SearchItemContainer>
  )
}

const SearchItemUser = (props: SearchItemProps) => {
  const { searchItem, onPress } = props
  const { id } = searchItem
  const { data: user, status } = useGetUserById({ id })
  const navigation = useNavigation()

  if (status === Status.LOADING) return <SearchItemSkeleton />

  if (!user) return null
  const { handle } = user

  const handlePress = () => {
    onPress?.()
    navigation.push('Profile', { handle })
  }

  return (
    <SearchItemContainer {...props} onPress={handlePress}>
      <ProfilePicture userId={id} w={40} />
      <Flex
        direction='column'
        alignItems='flex-start'
        flex={1}
        pointerEvents='none'
      >
        <UserLink userId={user.user_id} size='s' badgeSize='xs' />
        <Text variant='body' size='xs' color='subdued'>
          Profile
        </Text>
      </Flex>
    </SearchItemContainer>
  )
}

const itemComponentByKind = {
  [Kind.TRACKS]: SearchItemTrack,
  [Kind.USERS]: SearchItemUser,
  [Kind.COLLECTIONS]: SearchItemCollection
}

export const SearchItem = (props: SearchItemProps) => {
  const SearchItemComponent = itemComponentByKind[props.searchItem.kind]

  return <SearchItemComponent {...props} />
}
