import { useCollection, useTrack, useUser } from '@audius/common/api'
import { recentSearchMessages as messages } from '@audius/common/messages'
import { Kind, SquareSizes } from '@audius/common/models'
import type { SearchItem as SearchItemType } from '@audius/common/store'
import { pick } from 'lodash'
import { TouchableOpacity } from 'react-native-gesture-handler'

import type { IconComponent } from '@audius/harmony-native'
import { Flex, Text, spacing, useTheme } from '@audius/harmony-native'
import { ProfilePicture } from 'app/components/core'
import { CollectionImage } from 'app/components/image/CollectionImage'
import { TrackImage } from 'app/components/image/TrackImage'
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
  const { children, onPress } = props

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
  const { data: partialTrack, isPending: isTrackPending } = useTrack(id, {
    select: (track) => pick(track, ['title', 'owner_id'])
  })
  const { spacing } = useTheme()
  const navigation = useNavigation()

  if (isTrackPending) return <SearchItemSkeleton />

  if (!partialTrack) return null
  const { title } = partialTrack

  const handlePress = () => {
    onPress?.()
    navigation.push('Track', { trackId: id })
  }

  return (
    <SearchItemContainer {...props} onPress={handlePress}>
      <TrackImage
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
            userId={partialTrack?.owner_id}
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
  const { data: playlist, isPending } = useCollection(id)
  const navigation = useNavigation()

  if (isPending) return <SearchItemSkeleton />

  if (!playlist) return null
  const { is_album, playlist_name } = playlist

  const handlePress = () => {
    onPress?.()
    navigation.push('Collection', { id })
  }

  return (
    <SearchItemContainer {...props} onPress={handlePress}>
      <CollectionImage
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
            userId={playlist?.playlist_owner_id}
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
  const { data: user, isPending: isUserPending } = useUser(id, {
    select: (user) => pick(user, ['handle', 'user_id'])
  })
  const navigation = useNavigation()

  if (isUserPending) return <SearchItemSkeleton />

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
        <UserLink userId={id} size='s' badgeSize='xs' />
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
