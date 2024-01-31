import { useCallback, useMemo, useRef } from 'react'

import type { Collectible } from '@audius/common'
import { accountSelectors, useProxySelector } from '@audius/common'
import Clipboard from '@react-native-clipboard/clipboard'
import type { FlatList as RNFlatList } from 'react-native'
import { View, Text } from 'react-native'
import { useSelector } from 'react-redux'

import { IconShare } from '@audius/harmony-native'
import { Tile, GradientText, FlatList, Button } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import UserBadges from 'app/components/user-badges'
import { useScrollToTop } from 'app/hooks/useScrollToTop'
import { useToast } from 'app/hooks/useToast'
import { makeStyles } from 'app/styles'
import { getCollectiblesRoute } from 'app/utils/routes'

import { CollectiblesCard } from '../CollectiblesCard'
import { getProfile, useSelectProfile } from '../selectors'
const getUserId = accountSelectors.getUserId

const messages = {
  title: 'Collectibles',
  you: 'you',
  share: 'Share',
  subtitle: 'A collection of NFT collectibles owned and created by',
  copyToast: (userName: string) => `Copied link to ${userName}'s collectibles`
}

const useStyles = makeStyles(({ typography, palette, spacing }) => ({
  root: {
    paddingVertical: spacing(4),
    paddingHorizontal: spacing(3)
  },
  tile: {
    backgroundColor: palette.neutralLight10
  },
  tileContent: {
    paddingVertical: spacing(6)
  },
  header: {
    paddingHorizontal: spacing(4),
    marginTop: spacing(4),
    marginBottom: spacing(2)
  },
  headerContent: {
    padding: spacing(4)
  },
  title: {
    fontFamily: typography.fontByWeight.heavy,
    fontSize: 24,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: spacing(4)
  },
  subtitle: {
    ...typography.h2,
    color: palette.neutral,
    textAlign: 'center',
    marginBottom: spacing(4)
  },
  shareButtonIcon: {
    marginRight: spacing(2)
  },
  collectibleListItem: {
    marginHorizontal: spacing(4),
    paddingVertical: spacing(2)
  },
  loadingSpinner: {
    marginTop: spacing(4),
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  }
}))

export const CollectiblesTab = () => {
  const styles = useStyles()
  const { handle } = useSelectProfile(['handle'])
  const { profile } = useProxySelector(
    (state) => getProfile(state, handle),
    [handle]
  )
  const accountId = useSelector(getUserId)
  const isOwner = profile?.user_id === accountId
  const { toast } = useToast()
  const ref = useRef<RNFlatList>(null)

  useScrollToTop(() => {
    ref.current?.scrollToOffset({
      offset: 0,
      animated: true
    })
  }, true)

  const handlePressShare = useCallback(() => {
    if (profile) {
      const { handle, name } = profile
      Clipboard.setString(getCollectiblesRoute(handle, undefined, true))
      toast({ content: messages.copyToast(name), type: 'info' })
    }
  }, [profile, toast])

  const collectibles = useMemo(() => {
    if (!profile) return []

    const { collectibleList = [], solanaCollectibleList = [] } = profile
    const allCollectibles = [...collectibleList, ...solanaCollectibleList]

    if (!profile?.collectibles?.order) {
      return allCollectibles
    }

    const collectibleMap: {
      [key: string]: Collectible
    } = allCollectibles.reduce((acc, curr) => ({ ...acc, [curr.id]: curr }), {})

    const collectibleKeySet = new Set(Object.keys(collectibleMap))

    const visible = profile.collectibles.order
      .filter((id) => collectibleKeySet.has(id))
      .map((id) => collectibleMap[id])

    return visible || []
  }, [profile])

  if (!profile) return null

  return (
    <FlatList
      ref={ref}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <Tile styles={{ root: styles.header, content: styles.headerContent }}>
          <GradientText accessibilityRole='header' style={styles.title}>
            {messages.title}
          </GradientText>
          <Text style={styles.subtitle}>
            {messages.subtitle} {isOwner ? messages.you : profile.name}
            <UserBadges user={profile} hideName />
          </Text>
          <Button
            fullWidth
            variant='commonAlt'
            size='small'
            title={messages.share}
            icon={IconShare}
            iconPosition='left'
            IconProps={{ height: 15, width: 15 }}
            styles={{ icon: styles.shareButtonIcon }}
            onPress={handlePressShare}
          />
        </Tile>
      }
      data={collectibles}
      ListEmptyComponent={
        <View style={styles.loadingSpinner}>
          <LoadingSpinner />
        </View>
      }
      renderItem={({ item }) => (
        <CollectiblesCard
          collectible={item}
          ownerId={profile.user_id}
          style={styles.collectibleListItem}
        />
      )}
    />
  )
}
