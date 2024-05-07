import { useCallback } from 'react'

import type { ID } from '@audius/common/models'
import {
  DogEarType,
  SquareSizes,
  isContentUSDCPurchaseGated
} from '@audius/common/models'
import {
  accountSelectors,
  cacheCollectionsSelectors
} from '@audius/common/store'
import { formatCount } from '@audius/common/utils'
import { useSelector } from 'react-redux'

import {
  Divider,
  Flex,
  IconHeart,
  IconRepost,
  Paper,
  Text
} from '@audius/harmony-native'
import { UserLink } from 'app/components/user-link'
import { useNavigation } from 'app/hooks/useNavigation'

import { DogEar, LockedStatusBadge } from '../core'
import { CollectionImage } from '../image/CollectionImage2'
import { GestureResponderEvent } from 'react-native'

const { getCollection } = cacheCollectionsSelectors
const { getUserId } = accountSelectors

const messages = {
  repost: 'Reposts',
  favorites: 'Favorites',
  hidden: 'Hidden'
}

type CollectionCardProps = {
  id: ID
  onPress?: (e: GestureResponderEvent) => void
}

export const CollectionCard = (props: CollectionCardProps) => {
  const { id, onPress } = props

  const collection = useSelector((state) => getCollection(state, { id }))
  const accountId = useSelector(getUserId)

  const navigation = useNavigation()

  const handlePress = useCallback(
    (e: GestureResponderEvent) => {
      onPress?.(e)
      navigation.navigate('Collection', { id })
    },
    [onPress, navigation, id]
  )

  if (!collection) {
    return null
  }

  const {
    playlist_id,
    playlist_name,
    playlist_owner_id,
    repost_count,
    save_count,
    is_private,
    access,
    stream_conditions
  } = collection

  const isOwner = accountId === playlist_owner_id
  const isPurchase = isContentUSDCPurchaseGated(stream_conditions)

  const dogEarType = is_private
    ? DogEarType.HIDDEN
    : isPurchase && (!access.stream || isOwner)
    ? DogEarType.USDC_PURCHASE
    : null

  return (
    <Paper border='default' onPress={handlePress}>
      {dogEarType ? <DogEar type={dogEarType} /> : null}
      <Flex p='s' gap='s'>
        <CollectionImage
          collectionId={playlist_id}
          size={SquareSizes.SIZE_480_BY_480}
        />
        <Text variant='title' textAlign='center' numberOfLines={1}>
          {playlist_name}
        </Text>
        <UserLink
          userId={playlist_owner_id}
          textVariant='body'
          textAlign='center'
        />
      </Flex>
      <Divider orientation='horizontal' />
      <Flex
        direction='row'
        gap='l'
        pv='s'
        justifyContent='center'
        backgroundColor='surface1'
        borderBottomLeftRadius='m'
        borderBottomRightRadius='m'
      >
        {is_private ? (
          <Text
            variant='body'
            size='s'
            strength='strong'
            color='subdued'
            // TODO: See if this is required
            style={{ lineHeight: 0 }}
          >
            {messages.hidden}
          </Text>
        ) : (
          <>
            <Flex direction='row' gap='xs' alignItems='center'>
              <IconRepost size='s' color='subdued' />
              <Text variant='label' color='subdued'>
                {formatCount(repost_count)}
              </Text>
            </Flex>
            <Flex direction='row' gap='xs' alignItems='center'>
              <IconHeart size='s' color='subdued' />
              <Text variant='label' color='subdued' style={{ lineHeight: 0 }}>
                {formatCount(save_count)}
              </Text>
            </Flex>
            {isPurchase && !isOwner ? (
              <LockedStatusBadge variant='purchase' locked={!access.stream} />
            ) : null}
          </>
        )}
      </Flex>
    </Paper>
  )
}
