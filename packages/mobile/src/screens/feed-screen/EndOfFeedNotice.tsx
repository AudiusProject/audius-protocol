import { View } from 'react-native'

import IconAudius from 'app/assets/images/iconAudius.svg'
import { Text } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

const messages = {
  title: 'End of the line',
  description: "Looks like you've reached the end of your feed..."
}

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    alignItems: 'center',
    marginVertical: spacing(6)
  },
  icon: {
    marginBottom: spacing(2)
  },
  title: {
    letterSpacing: 2
  }
}))

export const EndOfFeedNotice = () => {
  const styles = useStyles()
  const { neutralLight4 } = useThemeColors()
  return (
    <View style={styles.root}>
      <IconAudius
        fill={neutralLight4}
        height={50}
        width={50}
        style={styles.icon}
      />
      <Text
        variant='h3'
        textTransform='uppercase'
        color='neutralLight4'
        style={styles.title}
      >
        {messages.title}
      </Text>
      <Text fontSize='small' color='neutralLight4'>
        {messages.description}
      </Text>
    </View>
  )
}
