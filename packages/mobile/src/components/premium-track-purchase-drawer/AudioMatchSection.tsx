import { View } from 'react-native'

import { makeStyles } from 'app/styles'

import { Text } from '../core/Text'

const useStyles = makeStyles(({ palette, spacing }) => ({
  root: {
    backgroundColor: palette.secondary,
    border: palette.secondaryDark2,
    paddingHorizontal: spacing(8),
    paddingVertical: spacing(2),
    marginTop: spacing(2)
  },
  text: {
    textAlign: 'center'
  }
}))

const messages = {
  earn: (amount: number) => `Earn ${amount} $AUDIO when you buy this track!`
}

type AudioMatchSectionProps = {
  amount: number
}

export const AudioMatchSection = ({ amount }: AudioMatchSectionProps) => {
  const styles = useStyles()
  return (
    <View style={styles.root}>
      <Text
        style={styles.text}
        variant='label'
        textTransform='uppercase'
        fontSize='xs'
        color='staticWhite'
      >
        {messages.earn(amount)}
      </Text>
    </View>
  )
}
