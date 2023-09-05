import { useCallback } from 'react'

import IconFollowing from 'app/assets/images/iconFollowing.svg'
import { Text, Tile } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { useSelectProfile } from '../selectors'

const messages = {
  mutuals: 'Mutuals'
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

export const ProfileMutualsButton = () => {
  const styles = useStyles()
  const { neutral } = useThemeColors()
  const profile = useSelectProfile([
    'user_id',
    'current_user_followee_follow_count'
  ])
  const { user_id, current_user_followee_follow_count } = profile
  const navigation = useNavigation()

  const handlePress = useCallback(() => {
    navigation.navigate('Mutuals', { userId: user_id })
  }, [navigation, user_id])

  return (
    <Tile
      styles={{ root: styles.root, tile: styles.tile, content: styles.content }}
      onPress={handlePress}
    >
      <IconFollowing
        height={20}
        width={20}
        fill={neutral}
        style={styles.icon}
      />
      <Text variant='h3' noGutter>
        {current_user_followee_follow_count} {messages.mutuals}
      </Text>
    </Tile>
  )
}
