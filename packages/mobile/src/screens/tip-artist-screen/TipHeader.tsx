import { tippingSelectors } from '@audius/common/store'
import { formatNumberCommas } from '@audius/common/utils'
import { View } from 'react-native'
import { useSelector } from 'react-redux'

import { IconCheck, IconSend } from '@audius/harmony-native'
import { Text, AudioText } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'
const { getSendAmount } = tippingSelectors

const messages = {
  sending: 'Sending',
  sent: 'Sent Successfully'
}

const useStyles = makeStyles(({ spacing }) => ({
  header: {
    alignSelf: 'center',
    alignItems: 'center',
    marginBottom: spacing(6)
  },
  sending: {
    textTransform: 'uppercase',
    marginBottom: 0
  }
}))

type TipHeaderProps = {
  status: 'confirm' | 'sent'
}

export const TipHeader = (props: TipHeaderProps) => {
  const { status } = props
  const sendAmount = useSelector(getSendAmount)
  const styles = useStyles()
  const { neutralLight4 } = useThemeColors()
  const Icon = status === 'confirm' ? IconSend : IconCheck
  const title = status === 'confirm' ? messages.sending : messages.sent

  return (
    <View style={styles.header}>
      <Text>
        <Icon fill={neutralLight4} height={14} width={14} />{' '}
        <Text variant='h3' color='neutralLight4' style={styles.sending}>
          {title}
        </Text>
      </Text>
      <Text fontSize='xxxxl' weight='heavy'>
        {formatNumberCommas(sendAmount)}{' '}
        <AudioText fontSize='xxxxl' color='neutralLight4' weight='heavy' />
      </Text>
    </View>
  )
}
