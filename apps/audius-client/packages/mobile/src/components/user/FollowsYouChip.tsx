import { View } from 'react-native'

import { Text } from 'app/components/core'
import { makeStyles } from 'app/styles'

const messages = {
  followsYou: 'Follows You'
}

const useStyles = makeStyles(({ palette, spacing }) => ({
  followsYou: {
    borderRadius: 4,
    borderColor: palette.neutralLight4,
    borderWidth: 1,
    paddingVertical: spacing(1),
    paddingHorizontal: spacing(2)
  },
  followsYouText: {
    textTransform: 'uppercase'
  }
}))

export const FollowsYouChip = () => {
  const styles = useStyles()
  return (
    <View style={styles.followsYou}>
      <Text
        variant='label'
        color='neutralLight4'
        weight='heavy'
        style={styles.followsYouText}>
        {messages.followsYou}
      </Text>
    </View>
  )
}
