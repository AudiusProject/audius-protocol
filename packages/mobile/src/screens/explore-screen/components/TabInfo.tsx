import { View } from 'react-native'

import { Text } from 'app/components/core'
import { makeStyles, shadow } from 'app/styles'

type TabInfoProps = {
  header: string
  text?: string
}

const useStyles = makeStyles(({ palette, spacing }) => ({
  root: {
    backgroundColor: palette.white,
    padding: spacing(4),
    paddingHorizontal: spacing(7),
    marginBottom: spacing(3),
    ...shadow()
  },
  header: {
    letterSpacing: 0.25
  },
  text: {
    marginTop: 6
  }
}))

export const TabInfo = ({ header, text }: TabInfoProps) => {
  const styles = useStyles()

  return (
    <View style={styles.root}>
      <Text fontSize='xl' weight='bold' color='secondary' style={styles.header}>
        {header}
      </Text>
      {text ? <Text style={styles.text}>{text}</Text> : null}
    </View>
  )
}
