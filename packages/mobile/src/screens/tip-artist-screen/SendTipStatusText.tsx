import { tippingSelectors } from '@audius/common/store'

import { Platform, View } from 'react-native'
import { useSelector } from 'react-redux'

import { DescriptionText } from './DescriptionText'
const { getSendStatus } = tippingSelectors

const messages = {
  disclaimer: 'Are you sure? This tip cannot be reversed.',
  // NOTE: Send tip -> Send $AUDIO change
  disclaimerAlt: 'Are you sure? This action cannot be reversed.', // iOS only
  maintenance: 'We’re performing some necessary one-time maintenance.',
  severalMinutes: 'This may take several minutes.',
  holdOn: 'Don’t close this screen or restart the app.',
  somethingWrong: 'Something’s gone wrong. Wait a little while and try again.'
}

export const SendTipStatusText = () => {
  const sendStatus = useSelector(getSendStatus)

  if (sendStatus === 'CONFIRM')
    return (
      <DescriptionText>
        {Platform.OS === 'ios' ? messages.disclaimerAlt : messages.disclaimer}
      </DescriptionText>
    )
  if (sendStatus === 'SENDING') return null
  if (sendStatus === 'CONVERTING')
    return (
      <View>
        <DescriptionText>{messages.maintenance}</DescriptionText>
        <DescriptionText allowNewline>
          {messages.severalMinutes} {'\n'}
          {messages.holdOn}
        </DescriptionText>
      </View>
    )
  if (sendStatus === 'ERROR')
    return (
      <DescriptionText color='error'>{messages.somethingWrong}</DescriptionText>
    )

  return null
}
