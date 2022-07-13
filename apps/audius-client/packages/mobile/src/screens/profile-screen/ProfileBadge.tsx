import { useCallback } from 'react'

import { setVisibility } from 'audius-client/src/common/store/ui/modals/slice'
import { View, Text } from 'react-native'

import { IconAudioBadge, TierText } from 'app/components/audio-rewards'
import { MODAL_NAME } from 'app/components/audio-rewards/TiersExplainerDrawer'
import { Tile } from 'app/components/core'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectTierInfo } from 'app/hooks/useSelectTierInfo'
import { makeStyles } from 'app/styles/makeStyles'

import { useSelectProfile } from './selectors'

const messages = {
  tier: 'tier'
}

const useStyles = makeStyles(({ spacing, typography, palette }) => ({
  root: {
    width: 200,
    marginRight: spacing(8)
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing(1)
  },
  badge: {
    marginRight: spacing(3)
  },
  tierNumber: {
    fontSize: 16,
    fontFamily: typography.fontByWeight.bold,
    textTransform: 'uppercase',
    color: palette.neutralLight6
  },
  tierText: {
    fontSize: 22,
    fontFamily: typography.fontByWeight.heavy,
    textTransform: 'uppercase'
  }
}))

export const ProfileBadge = () => {
  const profile = useSelectProfile(['user_id'])
  const styles = useStyles()

  const { tier, tierNumber } = useSelectTierInfo(profile.user_id)

  const dispatchWeb = useDispatchWeb()

  const handlePress = useCallback(() => {
    dispatchWeb(setVisibility({ modal: MODAL_NAME, visible: true }))
  }, [dispatchWeb])

  if (tier === 'none') return null

  return (
    <Tile
      styles={{ root: styles.root, content: styles.content }}
      onPress={handlePress}>
      <IconAudioBadge tier={tier} height={28} width={28} style={styles.badge} />
      <View>
        <Text style={styles.tierNumber}>
          {messages.tier} {tierNumber}
        </Text>
        <TierText style={styles.tierText} tier={tier}>
          {tier}
        </TierText>
      </View>
    </Tile>
  )
}
