import { View } from 'react-native'

import { IconQuestionCircle } from '@audius/harmony-native'
import { Text } from 'app/components/core'
import { NativeDrawer } from 'app/components/drawer'
import { flexRowCentered, makeStyles } from 'app/styles'
import { useColor } from 'app/utils/theme'

const messages = {
  title: 'WHAT IS THIS?',
  subtitle: 'Anyone who has sent you a tip on Audius is considered a Supporter.'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  drawer: {
    marginVertical: spacing(8),
    marginHorizontal: spacing(4)
  },
  titleContainer: {
    ...flexRowCentered(),
    justifyContent: 'center',
    width: '100%',
    marginBottom: spacing(6)
  },
  titleText: {
    marginLeft: spacing(3),
    fontFamily: typography.fontByWeight.heavy,
    fontSize: typography.fontSize.medium,
    color: palette.neutralLight2
  },
  subtitle: {
    fontFamily: typography.fontByWeight.medium,
    fontSize: typography.fontSize.large
  }
}))

export const SupportersInfoDrawer = () => {
  const styles = useStyles()
  const neutralLight2 = useColor('neutralLight2')

  return (
    <NativeDrawer drawerName='SupportersInfo'>
      <View style={styles.drawer}>
        <View style={styles.titleContainer}>
          <IconQuestionCircle fill={neutralLight2} width={24} height={24} />
          <Text style={styles.titleText} weight='heavy' color='neutral'>
            {messages.title}
          </Text>
        </View>
        <Text style={styles.subtitle}>{messages.subtitle}</Text>
      </View>
    </NativeDrawer>
  )
}
