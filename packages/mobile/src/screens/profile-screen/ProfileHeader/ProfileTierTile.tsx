import { useCallback } from 'react'

import { useSelectTierInfo } from '@audius/common/hooks'
import { modalsActions } from '@audius/common/store'
import type { ViewStyle, StyleProp } from 'react-native'
import { View } from 'react-native'
import { useDispatch } from 'react-redux'

import { IconAudioBadge, TierText } from 'app/components/audio-rewards'
import { MODAL_NAME } from 'app/components/audio-rewards/TiersExplainerDrawer'
import { Tile, Text } from 'app/components/core'
import { makeStyles } from 'app/styles'

import { useSelectProfile } from '../selectors'
const { setVisibility } = modalsActions

const messages = {
  tier: 'tier'
}

const useStyles = makeStyles(({ spacing, typography, palette }) => ({
  root: { marginRight: spacing(3) },
  tile: { height: 50 },
  content: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 0,
    paddingHorizontal: spacing(6)
  },
  viewContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  badge: {
    marginRight: spacing(2)
  },
  tierNumber: {
    textTransform: 'uppercase',
    color: palette.neutralLight6
  },
  tierText: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontByWeight.heavy,
    textTransform: 'uppercase'
  }
}))

type ProfileTierTileProps = {
  interactive?: boolean
  style?: StyleProp<ViewStyle>
}

export const ProfileTierTile = (props: ProfileTierTileProps) => {
  const { interactive = true, style } = props
  const profile = useSelectProfile(['user_id'])
  const styles = useStyles()

  const { tier, tierNumber } = useSelectTierInfo(profile.user_id)

  const dispatch = useDispatch()

  const handlePress = useCallback(() => {
    dispatch(setVisibility({ modal: MODAL_NAME, visible: true }))
  }, [dispatch])

  if (tier === 'none') return null

  const content = (
    <>
      <IconAudioBadge tier={tier} height={32} width={32} style={styles.badge} />
      <View>
        <Text variant='h3' noGutter style={styles.tierNumber}>
          {messages.tier} {tierNumber}
        </Text>
        <TierText style={styles.tierText} tier={tier}>
          {tier}
        </TierText>
      </View>
    </>
  )

  if (interactive) {
    return (
      <Tile
        styles={{
          root: [styles.root, style],
          tile: styles.tile,
          content: styles.content
        }}
        onPress={handlePress}
      >
        {content}
      </Tile>
    )
  }

  return (
    <View pointerEvents='none' style={[styles.root, styles.viewContent, style]}>
      {content}
    </View>
  )
}
