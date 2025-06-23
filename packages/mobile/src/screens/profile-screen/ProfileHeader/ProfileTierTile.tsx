import React, { useCallback } from 'react'

import { useProfileUser } from '@audius/common/api'
import { useTierAndVerifiedForUser, modalsActions } from '@audius/common/store'
import type { ViewStyle, StyleProp } from 'react-native'
import { View } from 'react-native'
import { useDispatch } from 'react-redux'

import { Paper } from '@audius/harmony-native'
import { IconAudioBadge, TierText } from 'app/components/audio-rewards'
import { MODAL_NAME } from 'app/components/audio-rewards/TiersExplainerDrawer'
import { Text } from 'app/components/core'
import { makeStyles } from 'app/styles'

const { setVisibility } = modalsActions

const messages = {
  tier: 'tier'
}

const useStyles = makeStyles(({ spacing, typography, palette }) => ({
  tile: { height: 64 },
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
  const { user_id } =
    useProfileUser({
      select: (user) => ({ user_id: user.user_id })
    }).user ?? {}
  const styles = useStyles()

  const { tier, tierNumber } = useTierAndVerifiedForUser(user_id)

  const dispatch = useDispatch()

  const handlePress = useCallback(() => {
    dispatch(setVisibility({ modal: MODAL_NAME, visible: true }))
  }, [dispatch])

  if (tier === 'none') return null

  const content = (
    <>
      <IconAudioBadge tier={tier} size='2xl' style={styles.badge} />
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
      <Paper
        h={64}
        style={[styles.content, styles.tile]}
        border='default'
        shadow='near'
        onPress={handlePress}
      >
        {content}
      </Paper>
    )
  }

  return (
    <View pointerEvents='none' style={[styles.viewContent, style]}>
      {content}
    </View>
  )
}
