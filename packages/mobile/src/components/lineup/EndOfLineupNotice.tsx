import { View } from 'react-native'

import { IconAudius } from '@audius/harmony-native'
import { Text } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

const messages = {
  title: 'End of the line',
  description: "Looks like you've reached the end of this list..."
}

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    alignItems: 'center',
    marginVertical: spacing(6),
    marginHorizontal: spacing(6)
  },
  icon: {
    marginBottom: spacing(2)
  },
  title: {
    letterSpacing: 2
  },
  description: {
    textAlign: 'center'
  }
}))

type EndOfLineupNoticeProps = {
  title?: string
  description?: string
}

export const EndOfLineupNotice = (props: EndOfLineupNoticeProps) => {
  const { title = messages.title, description = messages.description } = props
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
        {title}
      </Text>
      <Text fontSize='small' color='neutralLight4' style={styles.description}>
        {description}
      </Text>
    </View>
  )
}
