import { useRef } from 'react'

import { View, Pressable, Text, FlatList as RNFlatList } from 'react-native'

import IconShare from 'app/assets/images/iconShare.svg'
import { Tile, GradientText } from 'app/components/core'
import { FlatList } from 'app/components/core/FlatList'
import { useScrollToTop } from 'app/hooks/useScrollToTop'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { CollectiblesCard } from './CollectiblesCard'
import { getProfile } from './selectors'

const messages = {
  title: 'Collectibles',
  subtitle: (userName: string) =>
    `A collection of NFT collectibles owned and created by ${userName}`
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
    paddingHorizontal: spacing(6),
    marginBottom: spacing(4)
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
  shareButtonRoot: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: palette.neutralLight6,
    borderWidth: 1,
    borderRadius: 4,
    height: spacing(8),
    backgroundColor: palette.white
  },
  shareButtonText: {
    ...typography.h2,
    color: palette.neutralLight4,
    textTransform: 'uppercase',
    marginBottom: 0
  },
  shareButtonIcon: {
    marginRight: spacing(4)
  },
  collectibleListItem: {
    marginHorizontal: spacing(4),
    paddingVertical: spacing(2)
  }
}))

export const CollectiblesTab = () => {
  const styles = useStyles()
  const { neutralLight4 } = useThemeColors()
  const { profile } = useSelectorWeb(getProfile)

  const ref = useRef<RNFlatList>(null)
  useScrollToTop(() => {
    ref.current?.scrollToOffset({
      offset: 0,
      animated: true
    })
  }, true)

  if (!profile) return null

  const { collectibleList = [], solanaCollectibleList = [] } = profile

  const collectibles = [...collectibleList, ...solanaCollectibleList]

  return (
    <View style={styles.root}>
      <Tile styles={{ tile: styles.tile, content: styles.tileContent }}>
        <FlatList
          ref={ref}
          listKey='profile-collectibles'
          ListHeaderComponent={
            <View style={styles.header}>
              <GradientText accessibilityRole='header' style={styles.title}>
                {messages.title}
              </GradientText>
              <Text style={styles.subtitle}>{messages.subtitle('you')}</Text>
              <Pressable style={styles.shareButtonRoot}>
                <IconShare
                  fill={neutralLight4}
                  style={styles.shareButtonIcon}
                />
                <Text style={styles.shareButtonText}>Share</Text>
              </Pressable>
            </View>
          }
          data={collectibles}
          renderItem={({ item }) => (
            <View style={styles.collectibleListItem}>
              <CollectiblesCard collectible={item} />
            </View>
          )}
        />
      </Tile>
    </View>
  )
}
