import { View } from 'react-native'

import Text from 'app/components/text'
import { flexRowCentered, makeStyles } from 'app/styles'

const useStyles = makeStyles(({ palette, spacing }) => ({
  root: {
    width: '100%',
    ...flexRowCentered(),
    justifyContent: 'center',
    marginTop: spacing(4),
    paddingHorizontal: spacing(4)
  },

  line: {
    height: 2,
    flexGrow: 1,
    backgroundColor: palette.neutralLight7
  },

  box: {
    borderRadius: 4,
    backgroundColor: palette.neutralLight7,
    ...flexRowCentered(),
    height: 16,
    paddingHorizontal: 6
  },

  text: {
    color: palette.white,
    fontSize: 10,
    letterSpacing: 0.63,
    textTransform: 'uppercase',
    paddingHorizontal: 8
  }
}))

type DelineatorProps = {
  text?: string
}

export const Delineator = ({ text }: DelineatorProps) => {
  const styles = useStyles()

  return (
    <View style={styles.root}>
      <View style={styles.line} />
      {!text ? null : (
        <View style={styles.box}>
          <Text style={styles.text} weight='bold'>
            {text}
          </Text>
        </View>
      )}
      <View style={styles.line} />
    </View>
  )
}
