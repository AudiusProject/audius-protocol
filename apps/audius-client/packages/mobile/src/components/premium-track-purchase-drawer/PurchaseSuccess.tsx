import { View } from 'react-native'

import IconVerified from 'app/assets/images/iconVerified.svg'
import { Text } from 'app/components/core'
import { flexRowCentered, makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'

import { TwitterButton } from '../twitter-button'

const messages = {
  success: 'Your purchase was successful!'
}

const useStyles = makeStyles(({ spacing, typography, palette }) => ({
  root: {
    paddingTop: spacing(2),
    gap: spacing(9),
    alignSelf: 'center'
  },
  successContainer: {
    ...flexRowCentered(),
    alignSelf: 'center',
    gap: spacing(2)
  }
}))

export const PurchaseSuccess = () => {
  const styles = useStyles()
  const { specialLightGreen1, staticWhite } = useThemeColors()

  return (
    <View style={styles.root}>
      <View style={styles.successContainer}>
        <IconVerified
          height={spacing(4)}
          width={spacing(4)}
          fill={specialLightGreen1}
          fillSecondary={staticWhite}
        />
        <Text weight='bold'>{messages.success}</Text>
      </View>
      <TwitterButton
        fullWidth
        size='large'
        type='static'
        shareText={messages.success}
      />
    </View>
  )
}
