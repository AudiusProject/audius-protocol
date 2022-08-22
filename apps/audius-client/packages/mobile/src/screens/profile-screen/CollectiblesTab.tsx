import { useCallback, useContext, useRef } from 'react'

import { accountSelectors } from '@audius/common'
import Clipboard from '@react-native-clipboard/clipboard'
import type { FlatList as RNFlatList } from 'react-native'
import { View, Text } from 'react-native'

import IconShare from 'app/assets/images/iconShare.svg'
import { Tile, GradientText, FlatList, Button } from 'app/components/core'
import { ToastContext } from 'app/components/toast/ToastContext'
import UserBadges from 'app/components/user-badges'
import { useScrollToTop } from 'app/hooks/useScrollToTop'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'
import { getCollectiblesRoute } from 'app/utils/routes'

import { CollectiblesCard } from './CollectiblesCard'
import { getProfile } from './selectors'
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
  }
}))

export const CollectiblesTab = () => {
  const styles = useStyles()
  const { profile } = useSelectorWeb(getProfile)
  const accountId = useSelectorWeb(getUserId)
  const isOwner = profile?.user_id === accountId
  const { toast } = useContext(ToastContext)
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
      Clipboard.setString(getCollectiblesRoute(handle))
      toast({ content: messages.copyToast(name), type: 'info' })
    }
  }, [profile, toast])

  if (!profile) return null

  const { collectibleList = [], solanaCollectibleList = [], user_id } = profile

  const collectibles = [...collectibleList, ...solanaCollectibleList]

  return (
    <FlatList
      ref={ref}
      listKey='profile-collectibles'
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
      renderItem={({ item }) => (
        <View style={styles.collectibleListItem}>
          <CollectiblesCard collectible={item} ownerId={user_id} />
        </View>
      )}
    />
  )
}
