import { View } from 'react-native'

import IconAnnouncement from 'app/assets/images/iconAnnouncement.svg'
import { Text } from 'app/components/core'
import { makeStyles } from 'app/styles'

const messages = {
  empty: 'There’s Nothing Here Yet!'
}

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    marginTop: 40,
    alignItems: 'center'
  },
  text: {
    marginTop: spacing(5)
  }
}))

export const EmptyNotifications = () => {
  const styles = useStyles()
  return (
    <View style={styles.root}>
      <IconAnnouncement width={60} height={60} />
      <Text variant='h2' style={styles.text}>
        {messages.empty}
      </Text>
    </View>
  )
}
