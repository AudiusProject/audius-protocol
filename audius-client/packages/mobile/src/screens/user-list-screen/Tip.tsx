import { StringWei } from 'audius-client/src/common/models/Wallet'
import { View } from 'react-native'

import IconTip from 'app/assets/images/iconTip.svg'
import { AudioText, Text } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

const useStyles = makeStyles(() => ({
  root: {
    flexDirection: 'row',
    alignItems: 'center'
  }
}))

type TipProps = {
  amount: StringWei
}

export const Tip = (props: TipProps) => {
  const { amount } = props
  const styles = useStyles()
  const { neutralLight4 } = useThemeColors()

  return (
    <View style={styles.root}>
      <IconTip fill={neutralLight4} height={14} width={14} />
      <Text color='neutralLight4' weight='bold'>
        {' '}
        {amount}{' '}
      </Text>
      <AudioText color='neutralLight4' />
    </View>
  )
}
