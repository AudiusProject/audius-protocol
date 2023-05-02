import { useCallback } from 'react'

import IconRobot from 'app/assets/images/iconRobot.svg'
import { Text, Tile } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { useSelectProfile } from '../selectors'

const messages = {
  aiGeneratedTracks: 'AI Generated Tracks'
}

const useStyles = makeStyles(({ spacing }) => ({
  root: { flexGrow: 1 },
  tile: { height: 50 },
  content: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  icon: {
    marginRight: spacing(2)
  }
}))

export const AiGeneratedTracksButton = () => {
  const styles = useStyles()
  const { neutral } = useThemeColors()
  const profile = useSelectProfile(['user_id'])
  const { user_id } = profile
  const navigation = useNavigation()

  const handlePress = useCallback(() => {
    navigation.navigate('AiGeneratedTracks', { userId: user_id })
  }, [navigation, user_id])

  return (
    <Tile
      styles={{ root: styles.root, tile: styles.tile, content: styles.content }}
      onPress={handlePress}
    >
      <IconRobot height={20} width={20} fill={neutral} style={styles.icon} />
      <Text variant='h3' noGutter>
        {messages.aiGeneratedTracks}
      </Text>
    </Tile>
  )
}
